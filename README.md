# 🌸 PETAL - Personalized Execution & Task Agent Layer

**Multi-agent AI workspace powered by Google ADK, Gemini 2.0 Flash, and Supabase**

[![Deploy on Cloud Run](https://deploy.cloud.run/button.svg)](#)

---

## What is PETAL?

PETAL is a production-grade multi-agent AI system that manages your tasks, calendar, and knowledge base through a coordinated team of specialized AI agents.

```
User → Orchestrator → TaskAgent  → Tasks (Supabase)
                   → CalAgent   → Calendar Events (Supabase)
                   → InfoAgent  → Notes (Supabase)
                   → Gemini 2.0 Flash (LLM)
```

---

## Features

- **Multi-agent orchestration** - Orchestrator routes requests to specialized agents
- **Gemini 2.0 Flash** as the LLM backbone
- **Task management** with Kanban board, priorities, due dates
- **Calendar management** with event scheduling
- **Knowledge base** with semantic search (via Gemini embeddings)
- **Chat interface** with conversation history and agent visualization
- **Brutalist UI** with animated ticker, agent status indicators
- **REST API** for all CRUD operations

---

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.12+ and pip
- Supabase account (or local PostgreSQL)

### Backend Setup

```bash
cd backend
cp ../.env.example .env  # Configure your environment
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8080
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Open http://localhost:5173

---

## Environment Variables

Create a `.env` file in the project root:

```env
# Database (Supabase)
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/db
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_JWT_SECRET=your-jwt-secret
SUPABASE_ANON_KEY=your-anon-key

# Google / Gemini
GEMINI_API_KEY=your-gemini-api-key
GOOGLE_CLOUD_PROJECT=your-gcp-project

# MCP Servers (optional)
GMAIL_MCP_URL=
GCAL_MCP_URL=

# Security
JWT_SECRET=your-jwt-secret
ALLOWED_ORIGINS=http://localhost:5173

# Frontend
VITE_API_URL=http://localhost:8080/api/v1
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|-----------|-------------|
| POST | `/api/v1/chat` | Chat with agents |
| GET | `/api/v1/tasks` | List tasks |
| POST | `/api/v1/tasks` | Create task |
| PATCH | `/api/v1/tasks/{id}` | Update task |
| DELETE | `/api/v1/tasks/{id}` | Delete task |
| GET | `/api/v1/notes` | List notes |
| POST | `/api/v1/notes` | Create note |
| GET | `/api/v1/notes/search` | Semantic search |
| GET | `/api/v1/calendar/events` | List events |
| POST | `/api/v1/calendar/events` | Create event |
| GET | `/api/v1/agents/status` | Agent status |

---

## Project Structure

```
petal/
├── backend/                  # Python FastAPI + agents
│   ├── agents/               # Agent implementations
│   │   ├── orchestrator.py   # Main orchestrator
│   │   ├── routing.py        # Agent routing
│   │   ├── task_agent.py     # Task management agent
│   │   ├── cal_agent.py      # Calendar agent
│   │   └── info_agent.py     # Info/notes agent
│   ├── api/
│   │   ├── routes/           # API endpoints
│   │   └── middleware.py     # Auth & CORS
│   ├── db/                   # Database models
│   ├── tools/                # Tool functions
│   ├── config.py             # Configuration
│   └── main.py               # App entry point
├── frontend/                 # React 18 + Vite
│   ├── src/
│   │   ├── pages/            # UI pages
│   │   ├── hooks/            # React hooks
│   │   ├── components/       # UI components
│   │   ├── store/            # Zustand state
│   │   └── utils/            # API client
│   └── styles/               # CSS
├── infrastructure/          # Terraform + migrations
├── docs/                    # Documentation
└── .env                     # Environment config
```

---

## Stack

| Category | Technology |
|----------|------------|
| Agent Framework | Google ADK (Agent Development Kit) |
| LLM | Gemini 2.0 Flash |
| Backend | Python 3.12 + FastAPI |
| Frontend | React 18 + Vite + Zustand |
| Database | PostgreSQL + Supabase |
| Auth | JWT + Supabase Auth |

---

## Development

```bash
# Run backend
cd backend && python -m uvicorn main:app --reload

# Run frontend
cd frontend && npm run dev

# Run both with Docker
docker-compose up --build
```

---

## License

MIT © 2026 PETAL Project