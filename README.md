```
╔═══════════════════════════════════════════════════╗
║   ██████╗  ██████╗  ██████╗ ████████╗████████╗   ║
║   ██╔══██╗██╔═══██╗██╔══██╗╚══██╔══╝╚══██╔══╝   ║
║   ██████╔╝██║   ██║██████╔╝   ██║      ██║      ║
║   ██╔══██╗██║   ██║██╔══██╗   ██║      ██║      ║
║   ██████╔╝╚██████╔╝██║  ██║   ██║      ██║      ║
║   ╚═════╝  ╚═════╝ ╚═╝  ╚═╝   ╚═╝      ╚═╝      ║
╚═══════════════════════════════════════════════════╝
```

**PETAL** — Personalized Execution & Task Agent Layer

_Multi-agent AI workspace powered by Gemini 2.0 Flash & Supabase_

[![Python](https://img.shields.io/badge/Python-3.12+-blue?logo=python)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-cyan?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-cyan?logo=react)](https://react.dev)
[![Supabase](https://img.shields.io/badge/Supabase-2-green?logo=supabase)](https://supabase.com)

---

## What is PETAL?

PETAL is a production-grade multi-agent AI system that manages your tasks, calendar, and knowledge base through a coordinated team of specialized AI agents. Each agent handles a specific domain — tasks, calendar, or notes — while an orchestrator routes requests intelligently.

```
     ┌──────┐
     │ USER │
     └──┬───┘
        │
        ▼
  ┌────────────┐
  │ ORCHESTRATOR│───────┐
  └─────┬──────┘       │
        │              │
   ┌────▼────┐   ┌────▼────┐
   │  TASK   │   │  CAL    │
   │  AGENT │   │  AGENT  │
   └────┬────┘   └────┬────┘
        │              │
        ▼              ▼
   ┌─────────┐   ┌─────────┐
   │ TASKS   │   │CALENDAR │
   │    ↕   │   │   ↕    │
   └─────────┘   └─────────┘
        │              │
        └──────┬──────┘
               │
               ▼
        ┌──────────────────┐
        │     SUPABASE       │
        │  (PostgreSQL DB)  │
        └──────────────────┘
```

---

## Features

- **Multi-agent orchestration** — Intelligent request routing to specialized agents
- **Gemini 2.0 Flash** — Fast, capable LLM backbone
- **Task management** — Kanban board, priorities, due dates
- **Calendar management** — Event scheduling via CalAgent
- **Knowledge base** — Semantic search via Gemini embeddings
- **Chat interface** — Conversation history with agent visualization
- **Brutalist UI** — Animated ticker, agent status indicators
- **REST API** — Full CRUD for tasks, notes, calendar
- **WebSocket** — Real-time updates
- **JWT Auth** — Secure authentication

---

## Quick Start

```bash
# Clone & enter
git clone https://github.com/Shikhyy/Petal.git
cd Petal

# Backend
cp .env.example .env  # Configure your keys
pip install -r requirements.txt
cd backend && python -m uvicorn main:app --reload --port 8080

# Frontend (new terminal)
cd frontend && npm install && npm run dev

# Open http://localhost:5173
```

### Or with Docker

```bash
docker-compose up --build
```

---

## Environment

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Gemini
GEMINI_API_KEY=your-gemini-api-key

# Security
JWT_SECRET=your-jwt-secret
ALLOWED_ORIGINS=http://localhost:5173
```

---

## Stack

| Layer | Technology |
|-------|------------|
| LLM | Gemini 2.0 Flash |
| Backend | Python 3.12 + FastAPI |
| Frontend | React 18 + Vite + Zustand |
| Database | PostgreSQL + Supabase |
| Auth | JWT |

---

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/chat` | Chat with agents |
| GET/POST | `/api/v1/tasks` | List/create tasks |
| GET/POST | `/api/v1/notes` | List/create notes |
| GET/POST | `/api/v1/calendar/events` | List/create events |
| GET | `/api/v1/agents/status` | Agent status |

---

## Structure

```
petal/
├── backend/           # FastAPI + agents
│   ├── agents/      # Orchestrator, TaskAgent, CalAgent, InfoAgent
│   ├── api/         # Routes, middleware
│   ├── db/          # Models, Supabase client
│   └── tools/       # Tool functions
├── frontend/         # React + Vite
│   ├── src/
│   │   ├── pages/   # Dashboard, Tasks, Calendar, etc.
│   │   ├── hooks/   # useTasks, useNotes, useAgents
│   │   └── store/   # Zustand state
├── infrastructure/  # Terraform, migrations
└── docs/            # Specification documents
```

---

MIT © 2026 PETAL Project