# Battlefield Medical AI

Comprehensive repository for an AI-powered battlefield medical assistant. This README documents how to run the backend and frontend locally, available APIs, example requests (Postman / curl), environment variables, and common troubleshooting steps.

---

## Table of contents

- Project overview
- Repo structure
- Prerequisites
- Backend
  - Setup
  - Environment variables
  - Run
  - Key endpoints & examples
- Frontend
  - Setup
  - Environment variables
  - Run
  - Usage notes
- Postman & curl examples
- Troubleshooting
- Next steps

---

## Project overview

This project provides a prototype Battlefield Medical Assistant with:

- Backend (Node.js / Express) providing authentication, symptom analysis, injury detection (image), and records sync endpoints. It supports offline/edge operation and integrates optional ML models.
- Frontend (React + Vite) single-page application with a chat-style emergency assistant UI, text/voice/image inputs, offline sync, local storage, and encryption for records.

The repository is split into `backend/` and `frontend/` folders.

## Repo structure (important folders)

- `backend/` - Express server, routes, models, middleware, ML services

  - `routes/` - `auth.js`, `diagnosis.js`, `injury.js`, `records.js`
  - `models/` - Mongoose models (MedicalRecord, etc.)
  - `services/` - AI-related helpers (SymptomAnalyzer, InjuryDetector)
  - `config/` - database and security configuration

- `frontend/` - React app (Vite)
  - `src/components` - UI components including `EmergencyChatbot`
  - `src/services` - API client & services
  - `src/hooks` - custom hooks (offline sync, speech, auth)
  - `src/utils` - utilities (encryption, logger, offline DB)

---

## Prerequisites

- Node.js (LTS recommended, v18+)
- npm (or yarn)
- Optional: MongoDB if you want persistent backend storage

On Windows PowerShell use semicolon (`;`) to join commands on a single line when needed.

---

## Backend

### Setup

1. Open a terminal and go to the backend folder:

```powershell
cd "c:\Users\Rahul Kumar\OneDrive\Desktop\R1\pro\batleFieldgaurd\battlefield-medical-ai\backend"
npm install
```

2. Create a `.env` file in `backend/` (see environment variables below).

### Environment variables

Create a `.env` file with the following values (example):

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/battlefield-medical
JWT_SECRET=change_me_to_a_secure_value
TF_MODEL_PATH=./ml/models/wound-detection
```

Notes:

- If MongoDB is not available in your environment the server will log the failure and (in some configurations) fall back to offline behavior. Check `backend/config/database.js` for fallback behavior.

### Run

Start the server in development mode (nodemon recommended):

```powershell
npm run dev
```

Or run directly:

```powershell
npm start
```

The API should be available at `http://localhost:5000` by default.

### Key backend endpoints

1. Authentication

POST /api/auth/login

Body (JSON):

```json
{
  "soldierId": "soldier-001",
  "password": "password"
}
```

Response contains a JWT token to use in `Authorization: Bearer <token>` for protected endpoints.

2. Symptom analysis

POST /api/diagnosis/analyze

Headers: `Authorization: Bearer <token>` (or `x-emergency-mode: true` for emergency mode)

Body (JSON):

```json
{
	"symptoms": "severe bleeding from gunshot wound",
	"vitalSigns": { "pulse": 110 },
	"location": { "coordinates": [longitude, latitude], "accuracy": 10 }
}
```

3. Injury detection (image upload)

POST /api/injury/detect

Form-data fields:

- `image` - image file
- `mechanism` - optional (e.g. "gunshot")

4. Records sync (server-side sync endpoints)

POST /api/records/sync

Used by the client `useOfflineSync` hook to push queued records. Requires authentication (or will accept emergency anonymous records if client marks them as such).

---

## Frontend

### Setup

1. Open a terminal at the frontend folder and install dependencies:

```powershell
cd "c:\Users\Rahul Kumar\OneDrive\Desktop\R1\pro\batleFieldgaurd\battlefield-medical-ai\frontend"
npm install
```

2. Create a `.env` file in `frontend/` (Vite uses `VITE_` prefixed variables). Example:

```
VITE_API_URL=http://localhost:5000/api
VITE_ENCRYPTION_KEY=change_this_for_production
VITE_ENV=development
```

### Run

Start the Vite development server:

```powershell
npm run dev
```

If port 3000 is occupied Vite will try the next available port; check the terminal for the actual URL (e.g. http://localhost:3001 or 3002).

### Usage notes

- The UI includes the `EmergencyChatbot` component – supports text, voice, and image inputs.
- In non-authenticated mode enable Emergency Mode to allow submitting records anonymously; they will be marked `emergencyMode` and stored locally until a sync occurs.
- The frontend encrypts sensitive patient data before saving to local IndexedDB. The encryption key is taken from `VITE_ENCRYPTION_KEY` (keep this secure in production).

---

## Postman / curl examples

Authentication (login):

curl example:

```bash
curl -X POST http://localhost:5000/api/auth/login \
	-H "Content-Type: application/json" \
	-d '{"soldierId":"soldier-001","password":"password"}'
```

Diagnosis analyze (with token):

```bash
curl -X POST http://localhost:5000/api/diagnosis/analyze \
	-H "Content-Type: application/json" \
	-H "Authorization: Bearer <token>" \
	-d '{"symptoms":"severe bleeding from gunshot wound"}'
```

Injury detect (image upload):

```bash
curl -X POST http://localhost:5000/api/injury/detect \
	-H "Authorization: Bearer <token>" \
	-F "image=@/path/to/photo.jpg"
```

Use these examples to build a Postman collection. Create a collection named _Battlefield Medical AI_ and add the three requests above. Use environment variables in Postman for `baseUrl` and `token`.

---

## Troubleshooting

- 500 Internal Server Error from backend:

  - Check backend console/logs for stack traces. Look into `backend/routes/*` to see where the error originated.
  - Verify required environment variables and MongoDB connectivity.
  - If a TensorFlow model is required, ensure the model files are present and the node environment has native bindings available.

- Frontend HMR / WebSocket errors:

  - If Vite reports WebSocket failures, ensure the `server.hmr` settings in `frontend/vite.config.js` are correct for your network. Also verify the running port (Vite auto-switches if port is busy).

- `process is not defined` or `import.meta.env` issues:

  - Vite uses `import.meta.env` for environment variables. Do not use `process.env` in client code.

- npm install errors / peer dependency conflicts:
  - Try `npm install --legacy-peer-deps` or `npm install --force` if you must bypass peer dependency resolution. Prefer resolving to compatible versions in `package.json`.

---

## Next steps & suggestions

- Add end-to-end tests for the main flows (auth, analyze, upload, sync).
- Add CI (GitHub Actions) to run lint, tests and a smoke test for the backend API.
- Harden security for production: rotate encryption keys, secure storage for JWT secrets, validate uploads, and rate-limit critical endpoints.

---

If you want, I can:

- Write `backend/README.md` and `frontend/README.md` with more detail
- Create a Postman collection file (.json export) and add it to the repo
- Start both servers here, run a quick smoke test, and fix any remaining integration problems

Tell me which of the above you'd like next and I'll proceed.
