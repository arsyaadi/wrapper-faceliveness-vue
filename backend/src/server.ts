import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { RekognitionClient, CreateFaceLivenessSessionCommand, GetFaceLivenessSessionResultsCommand, CompareFacesCommand } from "@aws-sdk/client-rekognition";
import db from './db';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const clientConfig: any = {
  region: process.env.AWS_REGION || 'us-east-1',
};
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  clientConfig.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  };
}
const rekognition = new RekognitionClient(clientConfig);

const LIVENESS_THRESHOLD = 90;
const COMPARE_THRESHOLD = 90;

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/liveness/create-session', async (req, res) => {
  try {
    const command = new CreateFaceLivenessSessionCommand({});
    const response = await rekognition.send(command);
    res.json({ sessionId: response.SessionId });
  } catch (error: any) {
    console.error("Create session error:", error);
    res.status(500).json({ error: error.message || "Failed to create liveness session" });
  }
});

app.get('/api/liveness/result/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const command = new GetFaceLivenessSessionResultsCommand({
      SessionId: sessionId
    });
    const response = await rekognition.send(command);
    res.json({
      isLive: response.Confidence !== undefined && response.Confidence >= LIVENESS_THRESHOLD,
      confidence: response.Confidence,
      status: response.Status
    });
  } catch (error: any) {
    console.error("Get session results error:", error);
    res.status(500).json({ error: error.message || "Failed to get session results" });
  }
});

app.post('/api/face/create-master', async (req, res) => {
  try {
    const { name, sessionId } = req.body;

    if (!name || !sessionId) {
      res.status(400).json({ error: 'name and sessionId are required' });
      return;
    }

    const command = new GetFaceLivenessSessionResultsCommand({ SessionId: sessionId });
    const response = await rekognition.send(command);

    if (!response.Confidence || response.Confidence < LIVENESS_THRESHOLD) {
      res.status(400).json({ error: 'Liveness check failed', confidence: response.Confidence });
      return;
    }

    const referenceImage = response.ReferenceImage;
    if (!referenceImage || !referenceImage.Bytes) {
      res.status(500).json({ error: 'No reference image returned from liveness session. Please retry.' });
      return;
    }

    const photoBase64 = Buffer.from(referenceImage.Bytes).toString('base64');

    const existing = await db('face_master').where({ name }).first();
    if (existing) {
      res.status(409).json({ error: 'Name already exists' });
      return;
    }

    const [id] = await db('face_master').insert({
      name,
      photo: photoBase64,
      confidence: response.Confidence,
    });

    res.json({ id, name, confidence: response.Confidence });
  } catch (error: any) {
    console.error("Create master error:", error);
    res.status(500).json({ error: error.message || "Failed to create master" });
  }
});

app.get('/api/face/check-name/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const row = await db('face_master').where({ name }).first();
    res.json({ exists: !!row });
  } catch (error: any) {
    console.error("Check name error:", error);
    res.status(500).json({ error: error.message || "Failed to check name" });
  }
});

app.post('/api/face/compare', async (req, res) => {
  try {
    const { name, sessionId } = req.body;

    if (!name || !sessionId) {
      res.status(400).json({ error: 'name and sessionId are required' });
      return;
    }

    const command = new GetFaceLivenessSessionResultsCommand({ SessionId: sessionId });
    const response = await rekognition.send(command);

    if (!response.Confidence || response.Confidence < LIVENESS_THRESHOLD) {
      res.status(400).json({ error: 'Liveness check failed', confidence: response.Confidence });
      return;
    }

    const referenceImage = response.ReferenceImage;
    if (!referenceImage || !referenceImage.Bytes) {
      res.status(500).json({ error: 'No reference image returned from liveness session. Please retry.' });
      return;
    }

    const master = await db('face_master').where({ name }).first();
    if (!master) {
      res.status(404).json({ error: 'Master record not found for name: ' + name });
      return;
    }

    const masterBytes = Buffer.from(master.photo, 'base64');
    const targetBytes = Buffer.from(referenceImage.Bytes);

    const compareCommand = new CompareFacesCommand({
      SourceImage: { Bytes: masterBytes },
      TargetImage: { Bytes: targetBytes },
      SimilarityThreshold: COMPARE_THRESHOLD,
    });

    const compareResponse = await rekognition.send(compareCommand);

    const faceMatches = compareResponse.FaceMatches || [];
    const bestMatch = faceMatches.length > 0 ? faceMatches[0] : null;
    const similarity = bestMatch && bestMatch.Similarity !== undefined ? bestMatch.Similarity : 0;

    res.json({
      match: similarity >= COMPARE_THRESHOLD,
      similarity,
      confidence: response.Confidence,
    });
  } catch (error: any) {
    console.error("Compare error:", error);
    res.status(500).json({ error: error.message || "Failed to compare faces" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
