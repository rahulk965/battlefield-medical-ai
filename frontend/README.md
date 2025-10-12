# Battlefield Medical AI — Frontend

This folder contains the React + Vite frontend for the Battlefield Medical AI application. It includes components for triage, emergency chat, image input, offline sync, and PWA support.

Prerequisites

- Node.js (>=18 recommended)
- npm or yarn

Installation

1. Install dependencies:

   npm install

2. Optional: create a `.env` file in the frontend directory for overrides.

Common environment variables

- VITE_API_BASE_URL=http://localhost:5000/api (or your backend URL)
- VITE_ENABLE_PWA=true|false

Development

- Start dev server (hot reload):

  npm run dev

- Open the app at the URL printed by Vite (commonly http://localhost:5173)

Build and preview

- Build production assets:

  npm run build

- Preview the production build locally:

  npm run preview

Available scripts (from `package.json`)

- start / dev — start Vite dev server
- build — build production bundle
- preview — preview the production build
- lint — run ESLint across the project

Offline, PWA & Service Worker

- The project includes `vite-plugin-pwa` and a `public/sw.js` service worker. Enable PWA behavior by setting `VITE_ENABLE_PWA=true` in your environment and building a production bundle.
- The frontend uses IndexedDB (via `idb`) for offline storage and has sync helpers in `services/offlineDB.js` and `hooks/useOfflineSync.js`.

Integration notes

- Set `VITE_API_BASE_URL` to point to the backend's `/api` base. Make sure the backend sets `FRONTEND_URL` to your frontend origin to allow CORS.
- TensorFlow.js is used client-side for some features; ensure the browser environment supports WebGL or WASM backends when required.

Troubleshooting

- If assets or fonts are missing after build, check `public/` and `index.html` paths.
- ESLint can be run with `npm run lint` to catch style and runtime issues.

Further reading

- See `src/` for components and hooks. Key locations:
  - `src/components/Chatbot` — chat UI and inputs
  - `src/hooks/useOfflineSync.js` — sync behavior
  - `src/services/api.js` — API layer and auth

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
