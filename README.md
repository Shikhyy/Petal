<p align="center">
  <img src="docs/assets/petal-logo.svg" alt="PETAL logo" width="100%">
</p>

<p align="center">
  <strong>PETAL</strong> is a multi-agent AI workspace for tasks, calendar, notes, and chat.
  <br>
  Built with FastAPI, React, Vite, Supabase, and Gemini.
</p>

<p align="center">
  <a href="https://petal-frontend-ycmhorzhoa-uc.a.run.app">Live app</a> ·
  <a href="https://petal-api-ycmhorzhoa-uc.a.run.app/health">API health</a> ·
  <a href="#local-setup">Local setup</a> ·
  <a href="#deployment">Deployment</a>
</p>

<p align="center">
  <img src="docs/assets/petal-showcase.svg" alt="PETAL product showcase" width="100%">
</p>

## What PETAL Does

PETAL routes natural language requests through a small team of specialized agents:

- Orchestrator for routing and context management
- Task Agent for todo workflows
- Calendar Agent for event scheduling
- Info Agent for notes and knowledge capture

The frontend is a brutalist, high-contrast interface designed to feel like one coherent workspace instead of separate apps.

## Stack

- Backend: FastAPI, SQLAlchemy, asyncpg, JWT auth
- Frontend: React 18, Vite, TypeScript
- Data: Supabase PostgreSQL
- AI: Gemini 2.0 Flash
- Runtime: Docker, Cloud Run, Cloud Build

## Screens

The design system and product flow are documented visually in the assets below.

- [Logo](docs/assets/petal-logo.svg)
- [Product showcase](docs/assets/petal-showcase.svg)

## Local Setup

```bash
cp .env.example .env
pip install -r requirements.txt
cd frontend && npm install
```

Backend:

```bash
cd backend
python -m uvicorn main:app --reload --port 8080
```

Frontend:

```bash
cd frontend
npm run dev
```

## Environment

Use `.env.example` as the source of truth. Do not commit real keys or secrets.

Required variables:

```env
DATABASE_URL=
SUPABASE_URL=
SUPABASE_JWT_SECRET=
SUPABASE_ANON_KEY=
GEMINI_API_KEY=
JWT_SECRET=
ALLOWED_ORIGINS=
VITE_API_URL=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Deployment

Backend deployment on Cloud Run:

```bash
./scripts/deploy-cloud-run.sh
```

Frontend build and deploy:

```bash
./scripts/deploy-frontend.sh
```

Production URLs currently used by the project:

- Frontend: https://petal-frontend-ycmhorzhoa-uc.a.run.app
- Backend: https://petal-api-ycmhorzhoa-uc.a.run.app

## Security

Secrets are intentionally excluded from source control.

Ignored by default:

- `.env`, `.env.local`, `.env.production`
- `frontend/.env`, `frontend/.env.local`, `frontend/.env.production`
- `config/keys/*.json`
- `infrastructure/terraform/*.tfvars`
- Terraform state files
- Common private key formats

## Repository Layout

```text
backend/              FastAPI app, agents, routes, database
frontend/             React app, components, pages, styles
docs/                 Architecture and product documentation
infrastructure/       Terraform and migrations
scripts/              Deployment helpers
```

## Notes

- The app is designed to run with bearer-token auth and Cloud Run-friendly CORS.
- Build-time frontend env vars are required for the deployed Supabase client.
- If you change deployment URLs, update the frontend build args and the backend CORS origin list together.
