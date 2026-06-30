# AWS Rekognition Face Liveness & Face Compare - Vue 3 & React Wrapper

This repository implements face liveness verification and face comparison using AWS Rekognition, wrapped in a React-in-Vue bridge pattern. The React-based AWS Rekognition Face Liveness component (`@aws-amplify/ui-react-liveness`) is used inside a Vue 3 (Vite + TypeScript) application, with a MariaDB backend for storing master face photos.

## Features

*   **Create Master Photo** — User enters a name, passes a liveness check, and the reference image from AWS is saved to the database as base64.
*   **Compare Face** — User enters a name, passes a liveness check, and the captured reference image is compared against the stored master photo using AWS Rekognition `CompareFaces`.

## Directory Structure

*   **`backend/`**: Express + TypeScript server connecting to AWS Rekognition and MariaDB (via Knex) to create liveness sessions, retrieve results, store master photos, and compare faces.
*   **`frontend/`**: Vue 3 + Vite + TypeScript application hosting the React-in-Vue bridge, mode selection UI, and styling.
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

# MariaDB configuration (used by the Express backend)
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_db_password
DB_NAME=face_liveness
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

## Database & Migrations

The backend uses [Knex.js](https://knexjs.org/) as a SQL query builder and migration tool with the `mysql2` driver for MariaDB.

### Database Schema

The `face_master` table stores master face photos:

| Column       | Type             | Description                                  |
| ------------ | ---------------- | -------------------------------------------- |
| `id`         | INT AUTO_INCREMENT | Primary key                                |
| `name`       | VARCHAR(255)     | Unique user name                             |
| `photo`      | LONGTEXT         | Base64-encoded reference image from AWS      |
| `confidence` | DECIMAL(5,2)     | Liveness confidence score at creation time   |
| `created_at` | TIMESTAMP        | Default `CURRENT_TIMESTAMP`                  |

### Running Migrations

Before starting the backend, create the database and run migrations:

```bash
# Create the database in MariaDB
mysql -u root -p -e "CREATE DATABASE face_liveness;"

# Run migrations from the backend directory
cd backend
npm run migrate
```

Available migration scripts:

| Script                  | Description                          |
| ----------------------- | ------------------------------------ |
| `npm run migrate`       | Run all pending migrations           |
| `npm run migrate:rollback` | Rollback the last migration batch |
| `npm run migrate:make`  | Create a new migration file          |

Migration files are located in `backend/src/migrations/` and the Knex configuration is in `backend/knexfile.ts`.

---

## API Endpoints

### Liveness (existing)

| Method | Route                                  | Description                          |
| ------ | -------------------------------------- | ------------------------------------ |
| `GET`  | `/api/health`                          | Health check                         |
| `POST` | `/api/liveness/create-session`         | Create a Face Liveness session       |
| `GET`  | `/api/liveness/result/:sessionId`      | Get liveness session results         |

### Face Compare (new)

| Method | Route                           | Body / Param              | Description                                      |
| ------ | ------------------------------- | ------------------------- | ------------------------------------------------ |
| `POST` | `/api/face/create-master`       | `{ name, sessionId }`     | Save reference image as master photo for a name  |
| `GET`  | `/api/face/check-name/:name`    | URL param `name`          | Check if a master photo exists for a name        |
| `POST` | `/api/face/compare`             | `{ name, sessionId }`     | Compare liveness reference image against master  |

**How it works:**

1. **Create Master**: Frontend sends `name` + `sessionId` after liveness check passes. Backend retrieves `ReferenceImage.Bytes` from AWS Rekognition, converts to base64, and saves to `face_master` table.
2. **Compare**: Frontend checks name exists, then sends `name` + `sessionId` after liveness check. Backend fetches master photo from DB, retrieves reference image from AWS, and calls `CompareFaces` with a 90% similarity threshold.

---

## Quick Start

### 1. Installation
Install all dependencies in both the `frontend` and `backend` directories from the root:
```bash
npm run install:all
```

### 2. Database Setup
Create the MariaDB database and run migrations:
```bash
mysql -u root -p -e "CREATE DATABASE face_liveness;"
cd backend && npm run migrate && cd ..
```

### 3. Running in Development
Start both servers concurrently from the root directory:
```bash
npm run dev
```

*   **Backend API**: Running on [http://localhost:5001](http://localhost:5001)
*   **Frontend UI**: Running on [http://localhost:5173](http://localhost:5173)

### 4. Usage
*   Open the frontend UI and select **Create Master Photo** to register a new face.
*   Select **Check Compare Photo** to verify a face against an existing master.

---

## Production Builds

Build both packages for production:
```bash
npm run build
```
