# AWS Rekognition Face Liveness - Vue 3 & React Wrapper

This repository contains a separate experiment to validate a React-in-Vue wrapper pattern, allowing the React-based AWS Rekognition Face Liveness component (`@aws-amplify/ui-react-liveness`) to be used inside a Vue 3 (Vite + TypeScript) application.

## Directory Structure

*   **`backend/`**: Express + TypeScript server connecting to AWS Rekognition to create liveness sessions and retrieve results.
*   **`frontend/`**: Vue 3 + Vite + TypeScript application hosting the React-in-Vue bridge, demo interface, and styling.
*   **`package.json`**: Root orchestration to install and run both frontend and backend concurrently.

---

## Configuration

A single `.env` file is maintained in the root directory. Vite is configured with `envDir: '../'` to read this configuration directly.

Create a `.env` file in the root folder with the following variables:

```env
# AWS SDK credentials (used by the Express backend)
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1
PORT=5001

# Amplify / Vite configuration (used by the Vue frontend)
VITE_COGNITO_IDENTITY_POOL_ID=your_cognito_identity_pool_id
VITE_AWS_REGION=us-east-1
VITE_BACKEND_URL=http://localhost:5001
```

---

## The React-in-Vue Wrapper Pattern

React and Vue reactivities are kept separated. Communication is handled purely via Props (Vue → React) and Callback Events translated into Emits (React → Vue).

### 1. The React Bridge (`frontend/src/liveness/LivenessReactBridge.tsx`)
A clean React component that handles `Amplify.configure()` using the root configuration and renders `<FaceLivenessDetector>` with simple callback hooks. To prevent JSX compiling clashes in a mixed environment, it uses the standard compilation directive:
```typescript
/** @jsxImportSource react */
```

### 2. The Vue Wrapper (`frontend/src/components/LivenessCheck.vue`)
Uses Vue 3's Composition API (`<script setup lang="ts">`).
*   **Mounting**: Uses React's `createRoot().render()` inside `onMounted` to draw the React bridge inside a targeted Vue container `div`.
*   **Props & Emits**: Subscribes to Vue props changes to re-render, and binds React callbacks directly to Vue emits (`complete`, `error`).
*   **Cleanup**: Safely unmounts the React root inside `onUnmounted` with a small `setTimeout` buffer to allow Amplify's async WebSockets and camera streams to close cleanly.

---

## Quick Start

### 1. Installation
Install all dependencies in both the `frontend` and `backend` directories from the root:
```bash
npm run install:all
```

### 2. Running in Development
Start both servers concurrently from the root directory:
```bash
npm run dev
```

*   **Backend API**: Running on [http://localhost:5001](http://localhost:5001)
*   **Frontend UI**: Running on [http://localhost:5173](http://localhost:5173)

---

## Production Builds

Build both packages for production:
```bash
npm run build
```
