# Battlefield Medical AI — Backend

This folder contains the Express-based backend API and ML services for the Battlefield Medical AI project.

Quick overview

- Node + Express server (ES modules)
- MongoDB via Mongoose
- TensorFlow.js models for injury detection
- Security: JWT, AES-GCM encryption utilities, rate limiting, helmet

Prerequisites

- Node.js (>=18 recommended)
- npm or yarn
- MongoDB (local or hosted)

Installation

1. Install dependencies:

   npm install

2. Create a `.env` file at the repository root (or set environment variables) — example below.

Environment variables

- NODE_ENV=development|production
- PORT=5000
- MONGODB_URI=mongodb://username:password@host:port/dbname
- FRONTEND_URL=http://localhost:5173 (or your frontend origin)
- JWT_SECRET=your_jwt_secret_here

Start the server

- Development (with nodemon):

  npm run dev

- Production:

  npm start

Available scripts (from `package.json`)

- start — node server.js
- dev — nodemon server.js
- setup:models — run model setup script (if present)
- test — runs Jest tests

Important endpoints (examples)

- GET /api/status — service health
- GET /api/emergency-status — emergency capabilities/status
- POST /api/auth/login — login
- POST /api/diagnose/analyze — analyze symptoms
- POST /api/injury/detect — upload image for injury detection
- POST /api/records/save — save medical records

Notes & troubleshooting

- The server expects TensorFlow model files to be present under `ml/models/*`. If using the pretrained `wound-detection` model, verify `model.json` and associated shard files exist.
- If MongoDB connection fails, the server currently exits (intentionally) — start MongoDB or set a reachable `MONGODB_URI`.
- For local development, set `FRONTEND_URL` so CORS allows the frontend origin.
- Keep `JWT_SECRET` and encryption keys out of source control. Use a secrets manager or environment variables.

Security

- The app uses `helmet`, `express-rate-limit`, and encryption utilities in `config/security.js`. Follow best-practices for key rotation and secret storage when deploying to production.

Further reading

- See `server.js`, `config/database.js`, and `config/security.js` for runtime details and connection behavior.
