import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { RekognitionClient, CreateFaceLivenessSessionCommand, GetFaceLivenessSessionResultsCommand } from "@aws-sdk/client-rekognition";

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

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
      isLive: response.Confidence !== undefined && response.Confidence >= 90,
      confidence: response.Confidence,
      status: response.Status
    });
  } catch (error: any) {
    console.error("Get session results error:", error);
    res.status(500).json({ error: error.message || "Failed to get session results" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
