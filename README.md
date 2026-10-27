# SentinelAI — Code Intelligence Platform

SentinelAI is a developer-focused platform for analyzing source code, reviewing security findings, and validating proposed fixes.

## Current status

This is the starter scaffold. The first milestone is a working React + TypeScript frontend and FastAPI backend. Scanning, authentication, database persistence, and AI-assisted fixes will be added in later milestones.

## Prerequisites

- Python 3.11+
- Node.js 20+
- npm

Docker is optional for the first milestone.

## Run locally

### Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
uvicorn app.main:app --reload
```

API docs: http://127.0.0.1:8000/docs

### Frontend

Open a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite (usually http://localhost:5173).

## Project structure

- `frontend/` — React, TypeScript, Vite
- `backend/` — FastAPI API and tests
- `docs/` — architecture and development notes
- `.github/workflows/` — CI checks

## Security notes

Do not commit API keys, access tokens, passwords, or private source code. Never execute arbitrary submitted code directly on the API server. Any future dynamic testing feature must use an appropriately isolated sandbox with resource limits and restricted network access.

## Roadmap

1. Working frontend/backend foundation and health check
2. Static analysis integration and normalized findings
3. Scan history and database persistence
4. AI explanations and proposed fixes with human review
5. GitHub pull-request integration
6. CI, evaluation dataset, and deployment
