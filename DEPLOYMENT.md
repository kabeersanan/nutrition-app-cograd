# Deployment Guide

This repo ships a React+Vite frontend and a FastAPI backend. CI runs on GitHub Actions; deploys are handled by Render (backend) and Vercel (frontend) via their native GitHub integrations — push to `main` deploys automatically.

## Architecture

```
GitHub push ──► GitHub Actions CI (lint, build, import-check)
            ├─► Render  (backend/  →  FastAPI on Python 3.11)
            └─► Vercel  (root      →  Vite static build)
```

## What's in this repo

| File | Purpose |
|---|---|
| `.github/workflows/ci.yml` | Lints + builds frontend, installs + import-checks backend on every push/PR |
| `render.yaml` | Render Blueprint — provisions the backend service from `backend/` |
| `vercel.json` | Vercel project config — Vite framework, SPA rewrites |
| `.env.example` | Template of required env vars for both apps |

## One-time setup

### 1. Backend on Render

1. Go to https://dashboard.render.com → **New +** → **Blueprint**.
2. Connect this GitHub repo. Render auto-detects `render.yaml`.
3. When prompted, set the `GEMINI_API_KEY` env var (marked `sync: false` in the blueprint so it must be entered manually).
4. Click **Apply**. First deploy takes 3–5 min.
5. Copy the service URL — looks like `https://nutrition-app-backend.onrender.com`.

After this, every push to `main` redeploys automatically.

### 2. Frontend on Vercel

1. Go to https://vercel.com/new → **Import** this GitHub repo.
2. Framework preset: **Vite** (auto-detected from `vercel.json`).
3. Root directory: leave as repo root.
4. Add env var: `VITE_API_URL` = the Render URL from step 1.5 (no trailing slash).
5. Click **Deploy**.

PR preview URLs are created automatically. Push to `main` → production deploy.

### 3. CORS

`backend/main.py` already allows `https://nutrition-app-cograd.vercel.app`. If your Vercel domain differs (e.g. a custom domain or a different project name), add it to the `allow_origins` list and push.

## Credentials needed from you

Once CI is green, share these so deploys can go live:

- [ ] **`GEMINI_API_KEY`** — Google AI Studio key for Gemini. Set in Render dashboard.
- [ ] **Render account access** OR the deployed backend URL once you've created the service.
- [ ] **Vercel account access** OR confirmation that you've imported the project (no token needed since Vercel deploys via its own GitHub app).
- [ ] **Production frontend domain** if different from `nutrition-app-cograd.vercel.app` (so CORS can be updated).

No GitHub secrets are required for this setup — Render and Vercel each have their own GitHub apps that handle auth without tokens in CI.

## Local development

```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
echo "GEMINI_API_KEY=your-key" > .env
uvicorn main:app --reload

# Frontend (separate terminal)
echo "VITE_API_URL=http://localhost:8000" > .env.local
npm install
npm run dev
```
