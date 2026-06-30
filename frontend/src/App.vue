<script setup lang="ts">
import { ref } from 'vue';
import LivenessCheck from './components/LivenessCheck.vue';

type FlowState = 'IDLE' | 'LOADING' | 'LIVENESS' | 'VERIFYING' | 'SUCCESS' | 'FAILED';

const flowState = ref<FlowState>('IDLE');
const sessionId = ref<string | null>(null);
const errorMsg = ref<string | null>(null);
const confidence = ref<number | null>(null);

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';
const region = import.meta.env.VITE_AWS_REGION || 'us-east-1';

const startLivenessFlow = async () => {
  flowState.value = 'LOADING';
  errorMsg.value = null;
  try {
    const response = await fetch(`${backendUrl}/api/liveness/create-session`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to create liveness session on backend');
    }
    const data = await response.json();
    sessionId.value = data.sessionId;
    flowState.value = 'LIVENESS';
  } catch (err: any) {
    errorMsg.value = err.message || 'Error occurred starting flow';
    flowState.value = 'IDLE';
  }
};

const handleComplete = async (session: string) => {
  flowState.value = 'VERIFYING';
  try {
    const response = await fetch(`${backendUrl}/api/liveness/result/${session}`);
    if (!response.ok) {
      throw new Error('Failed to fetch verification results');
    }
    const data = await response.json();
    confidence.value = data.confidence ?? null;
    if (data.isLive) {
      flowState.value = 'SUCCESS';
    } else {
      flowState.value = 'FAILED';
    }
  } catch (err: any) {
    errorMsg.value = err.message || 'Error occurred during verification';
    flowState.value = 'FAILED';
  }
};

const handleError = (error: Error) => {
  console.error('Liveness check error:', error);
  errorMsg.value = error.message || 'Liveness verification failed';
  flowState.value = 'FAILED';
};

const resetFlow = () => {
  flowState.value = 'IDLE';
  sessionId.value = null;
  confidence.value = null;
  errorMsg.value = null;
};
</script>

<template>
  <div class="app-container">
    <header class="app-header">
      <div class="logo-wrapper">
        <svg class="shield-icon" viewBox="0 0 24 24" width="36" height="36" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        </svg>
        <h1>Face Liveness Vue Wrapper</h1>
      </div>
      <p class="subtitle">React-in-Vue Bridge validation for AWS Rekognition Face Liveness</p>
    </header>

    <main class="main-card">
      <div v-if="flowState === 'IDLE'" class="state-content">
        <svg class="main-icon camera" viewBox="0 0 24 24" width="64" height="64" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
          <circle cx="12" cy="13" r="4"></circle>
        </svg>
        <h2>Verify Identity</h2>
        <p class="instructions">
          Prepare your camera in a well-lit space. You will be asked to align your face inside the oval frame.
        </p>
        <div v-if="errorMsg" class="error-banner">
          {{ errorMsg }}
        </div>
        <button class="btn btn-primary" @click="startLivenessFlow">
          Start Liveness Check
        </button>
      </div>

      <div v-if="flowState === 'LOADING'" class="state-content">
        <svg class="spinner" viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="2.5" fill="none">
          <circle cx="12" cy="12" r="10" stroke-dasharray="40 20" stroke-linecap="round"></circle>
        </svg>
        <p class="loading-text">Requesting secure liveness session...</p>
      </div>

      <div v-if="flowState === 'LIVENESS' && sessionId" class="liveness-wrapper">
        <LivenessCheck
          :session-id="sessionId"
          :region="region"
          @complete="handleComplete"
          @error="handleError"
        />
      </div>

      <div v-if="flowState === 'VERIFYING'" class="state-content">
        <svg class="spinner" viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="2.5" fill="none">
          <circle cx="12" cy="12" r="10" stroke-dasharray="40 20" stroke-linecap="round"></circle>
        </svg>
        <h2>Analyzing Session</h2>
        <p class="instructions">Fetching verification result from backend...</p>
      </div>

      <div v-if="flowState === 'SUCCESS'" class="state-content">
        <svg class="main-icon success-icon" viewBox="0 0 24 24" width="64" height="64" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <h2>Liveness Verified</h2>
        <p class="instructions">Successfully passed biometric check.</p>
        <div v-if="confidence !== null" class="result-metric">
          Confidence: <span class="score">{{ confidence.toFixed(1) }}%</span>
        </div>
        <button class="btn btn-secondary" @click="resetFlow">
          Verify Again
        </button>
      </div>

      <div v-if="flowState === 'FAILED'" class="state-content">
        <svg class="main-icon error-icon" viewBox="0 0 24 24" width="64" height="64" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
        <h2>Verification Failed</h2>
        <p class="instructions">{{ errorMsg || 'Unable to confirm face liveness. Please try again.' }}</p>
        <div v-if="confidence !== null" class="result-metric">
          Confidence: <span class="score failed">{{ confidence.toFixed(1) }}%</span>
        </div>
        <button class="btn btn-primary" @click="resetFlow">
          Retry Check
        </button>
      </div>
    </main>
  </div>
</template>

<style>
:root {
  color-scheme: dark;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: #0f111a;
  color: #f1f3f9;
}

.app-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  box-sizing: border-box;
}

.app-header {
  text-align: center;
  margin-bottom: 2rem;
}

.logo-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  color: #6366f1;
}

.shield-icon {
  filter: drop-shadow(0 0 8px rgba(99, 102, 241, 0.4));
}

h1 {
  font-size: 2.25rem;
  font-weight: 800;
  margin: 0;
  background: linear-gradient(135deg, #a5b4fc, #6366f1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  font-size: 1rem;
  color: #94a3b8;
  margin: 0.5rem 0 0 0;
}

.main-card {
  width: 100%;
  max-width: 550px;
  min-height: 480px;
  background: rgba(30, 41, 59, 0.5);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  padding: 2.5rem;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.state-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.main-icon {
  margin-bottom: 1.5rem;
}

.camera {
  color: #64748b;
}

.success-icon {
  color: #10b981;
  filter: drop-shadow(0 0 12px rgba(16, 185, 129, 0.3));
}

.error-icon {
  color: #ef4444;
  filter: drop-shadow(0 0 12px rgba(239, 68, 68, 0.3));
}

h2 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 0.75rem 0;
}

.instructions {
  color: #94a3b8;
  font-size: 0.95rem;
  line-height: 1.5;
  margin: 0 0 2rem 0;
  max-width: 320px;
}

.error-banner {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fca5a5;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
  width: 100%;
  box-sizing: border-box;
}

.btn {
  font-family: inherit;
  font-weight: 600;
  font-size: 1rem;
  padding: 0.75rem 2rem;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #4f46e5, #6366f1);
  color: white;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
}

.btn-secondary {
  background: #334155;
  color: #f1f3f9;
}

.btn-secondary:hover {
  background: #475569;
  transform: translateY(-2px);
}

.spinner {
  animation: rotate 1s linear infinite;
  color: #6366f1;
  margin-bottom: 1.5rem;
}

.loading-text {
  color: #94a3b8;
  font-weight: 500;
}

.result-metric {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 1rem 2rem;
  margin-bottom: 2rem;
  font-size: 1.1rem;
  color: #cbd5e1;
}

.score {
  font-weight: 700;
  color: #10b981;
}

.score.failed {
  color: #ef4444;
}

.liveness-wrapper {
  width: 100%;
  min-height: 480px;
  border-radius: 16px;
  overflow: hidden;
}

@keyframes rotate {
  100% {
    transform: rotate(360deg);
  }
}
</style>
