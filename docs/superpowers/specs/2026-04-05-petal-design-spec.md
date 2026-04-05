# PETAL — Design Specification v2.0
**Date:** 2026-04-05  
**Status:** Approved for Implementation  
**Replaces:** Original docs/PRD.md, docs/ARCHITECTURE.md, docs/IMPLEMENTATION.md

---

## 1. Overview

PETAL is a multi-agent AI workspace built with **Google ADK**, **Gemini 2.0 Flash**, and **Supabase**. It replaces the original Firestore + Firebase Auth + Cloud SQL stack with a unified Supabase PostgreSQL backend that provides relational data, vector search, authentication, and real-time subscriptions — all runnable locally via Docker Compose.

### Key Changes from Original Docs
1. **Supabase replaces Firestore + Firebase Auth + Cloud SQL** — single service, local dev via Docker, pgvector for embeddings, real-time built in
2. **Local-first development** — Docker Compose runs everything (backend, frontend, Supabase) before any GCP deployment
3. **Real-time UI** — Supabase WebSocket subscriptions push task/note updates live to Kanban board and agent status bar
4. **Google ADK installed fresh** — no dependency on pre-existing setup

---

## 2. Architecture

### 2.1 Stack

| Layer | Technology | Purpose |
|---|---|---|
| Agent Framework | Google ADK | Multi-agent orchestration with auto-routing |
| LLM | Gemini 2.0 Flash (Vertex AI) | All agent intelligence |
| Backend | Python 3.12 + FastAPI | Async API server |
| Database | Supabase (PostgreSQL 15 + pgvector) | Structured data, vector search, auth, realtime |
| Frontend | React 18 + TypeScript + Vite | Web UI |
| State Management | Zustand | Client-side state |
| Real-time | Supabase Realtime (WebSockets) | Live updates to UI |
| Containerization | Docker + Docker Compose | Local development |
| Deployment (future) | GCP Cloud Run | Production hosting |

### 2.2 System Diagram

```
User (Browser)
    │
    ▼
React App (Vite) ←── Supabase Realtime (WebSocket)
    │
    │ HTTPS
    ▼
FastAPI Backend (:8080)
    │
    ├── Google ADK Agent Runtime
    │   ├── Orchestrator (gemini-2.0-flash)
    │   │   ├── TaskAgent → Supabase (tasks table)
    │   │   ├── CalAgent → Google Calendar MCP
    │   │   └── InfoAgent → Supabase (notes + pgvector)
    │   └── Gmail MCP (direct to orchestrator)
    │
    ├── Supabase Client (Python)
    │   ├── Auth (JWT verification)
    │   ├── PostgreSQL (tasks, notes, calendar, sessions)
    │   └── pgvector (semantic note search)
    │
    └── REST API Routes
        ├── /api/v1/chat
        ├── /api/v1/tasks
        ├── /api/v1/calendar
        ├── /api/v1/notes
        └── /api/v1/agents/status
```

### 2.3 Repository Structure

```
petal/
├── backend/
│   ├── main.py                    # FastAPI app entrypoint + lifespan
│   ├── config.py                  # Settings from env vars
│   ├── agents/
│   │   ├── orchestrator.py        # Primary ADK orchestrator agent
│   │   ├── task_agent.py          # TaskAgent definition
│   │   ├── cal_agent.py           # CalAgent definition
│   │   └── info_agent.py          # InfoAgent definition
│   ├── tools/
│   │   ├── task_tools.py          # Supabase-backed task CRUD
│   │   ├── notes_tools.py         # Notes CRUD + pgvector search
│   │   └── calendar_tools.py      # Calendar MCP wrapper
│   ├── api/
│   │   ├── routes/
│   │   │   ├── chat.py            # POST /chat endpoint
│   │   │   ├── tasks.py           # Task CRUD endpoints
│   │   │   ├── calendar.py        # Calendar endpoints
│   │   │   └── notes.py           # Notes endpoints
│   │   └── middleware.py          # Supabase JWT auth, CORS
│   └── db/
│       └── supabase.py            # Supabase client + helpers
├── frontend/
│   ├── src/
│   │   ├── main.tsx               # React entrypoint
│   │   ├── App.tsx                # Router + layout
│   │   ├── components/
│   │   │   ├── AgentStatusBar.tsx # Persistent agent status bar
│   │   │   ├── ActivityTicker.tsx # Animated scrolling ticker
│   │   │   ├── ChatWindow.tsx     # Main chat interface
│   │   │   ├── KanbanBoard.tsx    # Drag-and-drop task board
│   │   │   ├── CalendarView.tsx   # Weekly/monthly calendar
│   │   │   ├── NoteEditor.tsx     # Note creation/editing
│   │   │   └── NoteSearch.tsx     # Semantic search interface
│   │   ├── pages/
│   │   │   ├── ChatPage.tsx
│   │   │   ├── TasksPage.tsx
│   │   │   ├── CalendarPage.tsx
│   │   │   └── KnowledgePage.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.ts         # Supabase auth hook
│   │   │   ├── useTasks.ts        # Task CRUD + realtime
│   │   │   ├── useNotes.ts        # Notes CRUD + realtime
│   │   │   └── useAgents.ts       # Agent status polling
│   │   ├── store/
│   │   │   └── index.ts           # Zustand store
│   │   ├── utils/
│   │   │   ├── api.ts             # Axios API client
│   │   │   └── supabase.ts        # Supabase JS client
│   │   └── styles/
│   │       └── brutalist.css      # Hand-crafted brutalist styles
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── infrastructure/
│   ├── supabase/
│   │   ├── migrations/            # SQL migration files
│   │   │   └── 001_initial_schema.sql
│   │   └── seed.sql               # Optional seed data
│   └── docker-compose.yml         # Local dev: backend, frontend, supabase
├── Dockerfile                     # Backend container
├── requirements.txt
├── .env.example
└── docs/
    ├── PRD.md                     # Original PRD (reference)
    ├── ARCHITECTURE.md            # Original architecture (reference)
    ├── IMPLEMENTATION.md          # Original implementation guide (reference)
    └── SETUP.md                   # Original setup guide (reference)
```

---

## 3. Data Model

### 3.1 Schema

All tables include Row Level Security (RLS) — users can only access their own data.

```sql
-- Users (managed by Supabase Auth, extended profile)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT NOT NULL,
    name TEXT,
    avatar_url TEXT,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks
CREATE TABLE tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    priority TEXT CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
    status TEXT CHECK (status IN ('todo', 'in_progress', 'done')) DEFAULT 'todo',
    tags TEXT[] DEFAULT '{}',
    due_date TIMESTAMPTZ,
    agent_created BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notes (with vector embeddings)
CREATE TABLE notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    title TEXT NOT NULL,
    body TEXT DEFAULT '',
    tags TEXT[] DEFAULT '{}',
    embedding VECTOR(768),  -- Gemini text-embedding-004
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions (conversation history)
CREATE TABLE sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    messages JSONB DEFAULT '[]',
    agents_invoked TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Calendar Events (cached from Google Calendar)
CREATE TABLE calendar_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    title TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    location TEXT,
    meet_link TEXT,
    attendees TEXT[] DEFAULT '{}',
    google_event_id TEXT,
    created_by_agent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2 Indexes

```sql
-- Task queries
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status, created_at DESC);
CREATE INDEX idx_tasks_user_priority ON tasks(user_id, priority, due_date ASC);

-- Note queries + vector search
CREATE INDEX idx_notes_user_updated ON notes(user_id, updated_at DESC);
CREATE INDEX idx_notes_embedding ON notes 
    USING hnsw (embedding vector_cosine_ops) 
    WITH (m = 16, ef_construction = 64);

-- Calendar queries
CREATE INDEX idx_calendar_user_time ON calendar_events(user_id, start_time ASC);
```

### 3.3 Row Level Security

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own profiles"
    ON profiles FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can only access their own tasks"
    ON tasks FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own notes"
    ON notes FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own sessions"
    ON sessions FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own calendar events"
    ON calendar_events FOR ALL USING (auth.uid() = user_id);
```

---

## 4. Agent Design

### 4.1 Agent Hierarchy

```
petal_orchestrator (LlmAgent)
├── model: gemini-2.0-flash
├── orchestration: auto
├── instruction: [See 4.2]
├── sub_agents:
│   ├── task_agent (LlmAgent)
│   │   ├── model: gemini-2.0-flash
│   │   ├── instruction: [See 4.3]
│   │   └── tools: [create_task, list_tasks, update_task, delete_task]
│   ├── cal_agent (LlmAgent)
│   │   ├── model: gemini-2.0-flash
│   │   ├── instruction: [See 4.4]
│   │   └── tools: [MCPToolset(google_calendar)]
│   └── info_agent (LlmAgent)
│       ├── model: gemini-2.0-flash
│       ├── instruction: [See 4.5]
│       └── tools: [save_note, search_notes, summarize_note, generate_embedding]
└── tools: [MCPToolset(gmail)]
```

### 4.2 Orchestrator Agent

**Purpose:** Primary coordinator that receives all user input, analyzes intent, delegates to sub-agents, and synthesizes results.

**Instruction:**
```
You are PETAL's Orchestrator Agent — the primary coordinator in a multi-agent 
productivity workspace powered by Google ADK.

Your sub-agents:
- task_agent: Creates, updates, and manages tasks in the database
- cal_agent: Manages Google Calendar events via MCP
- info_agent: Stores and retrieves notes from the knowledge base

Workflow rules:
1. Analyze the user's request to determine which agents are needed
2. Delegate to sub-agents in the optimal order
3. Synthesize all results into a clear, actionable response
4. Show your orchestration steps (which agents you invoked and why)
5. For multi-step workflows, execute sequentially and handle failures gracefully
6. Always confirm what was accomplished and what the user should do next

Available direct tools: Gmail MCP (read, draft, send emails)
```

### 4.3 TaskAgent

**Purpose:** Manages user tasks with priority, status, due dates, and tags.

**Tools:**
- `create_task(title, priority, due_date, tags, description)` → `{task_id, status}`
- `list_tasks(status?, priority?, tag?, limit?)` → `[{task objects}]`
- `update_task(task_id, **updates)` → `{task_id, status, changes}`
- `delete_task(task_id)` → `{task_id, status}`

**Instruction:**
```
You are PETAL's TaskAgent. You manage the user's task list in the database.

Priority levels: 'high', 'medium', 'low'
Status options: 'todo', 'in_progress', 'done'

Always confirm what action was taken and the task ID for reference.
When listing tasks, format them clearly with priority indicators and due dates.
```

### 4.4 CalAgent

**Purpose:** Smart scheduling via Google Calendar MCP integration.

**Tools:** MCPToolset auto-discovers from Google Calendar MCP server:
- `create_event` — Create a calendar event
- `list_events` — Query events by date range
- `update_event` — Modify existing event
- `delete_event` — Remove event
- `find_free_slots` — Find available time slots
- `create_meeting_link` — Generate Google Meet link

**Instruction:**
```
You are PETAL's CalAgent. You manage the user's Google Calendar via MCP.

When creating events:
- Always suggest a Google Meet link for meetings
- Check for conflicts before scheduling
- Use find_free_slots when the user doesn't specify a time

Always confirm the event details including time, date, and any generated links.
```

### 4.5 InfoAgent

**Purpose:** Knowledge base with semantic search, note management, and AI summarization.

**Tools:**
- `save_note(title, body, tags?)` → `{note_id, status}`
- `search_notes(query, limit?)` → `[{note objects with similarity score}]` (pgvector cosine similarity)
- `summarize_note(note_id)` → `{summary}` (via Gemini)
- `generate_embedding(text)` → `float[768]` (Gemini text-embedding-004)

**Instruction:**
```
You are PETAL's InfoAgent. You manage the user's knowledge base.

When saving notes:
- Auto-generate relevant tags if not provided
- Always create an embedding for semantic search

When searching notes:
- Use semantic search (not just keyword matching)
- Return results ranked by relevance

When summarizing:
- Provide concise, actionable summaries
- Extract key decisions and action items
```

---

## 5. API Specification

### 5.1 Authentication

All endpoints (except `/health`) require a valid Supabase JWT in the `Authorization: Bearer <token>` header. The middleware verifies the token and extracts `user_id` for request scoping.

### 5.2 Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/chat` | Send message to orchestrator |
| `GET` | `/api/v1/tasks` | List all tasks (query params: status, priority, tag, limit) |
| `POST` | `/api/v1/tasks` | Create task |
| `PATCH` | `/api/v1/tasks/{id}` | Update task |
| `DELETE` | `/api/v1/tasks/{id}` | Delete task |
| `GET` | `/api/v1/calendar/events` | List calendar events (query params: start, end) |
| `POST` | `/api/v1/calendar/events` | Create calendar event |
| `GET` | `/api/v1/notes` | List notes |
| `POST` | `/api/v1/notes` | Create note |
| `GET` | `/api/v1/notes/search` | Semantic search (query param: q, limit) |
| `GET` | `/api/v1/agents/status` | Get all agent statuses |
| `GET` | `/health` | Health check (no auth required) |

### 5.3 Chat Endpoint

**Request:**
```json
{
  "message": "Schedule a standup tomorrow at 9am and create prep tasks",
  "session_id": "optional-existing-session-id"
}
```

**Response:**
```json
{
  "reply": "Done! I've coordinated your request across 2 agents...",
  "agents_invoked": ["CalAgent", "TaskAgent"],
  "tool_calls": [
    {"agent": "CalAgent", "tool": "create_event", "result": "event_id_123"},
    {"agent": "TaskAgent", "tool": "create_task", "result": "task_id_456"}
  ],
  "session_id": "usr_abc123",
  "latency_ms": 1842
}
```

### 5.4 Error Responses

All errors follow this format:
```json
{
  "error": {
    "code": "string",
    "message": "Human-readable description",
    "details": {}
  }
}
```

---

## 6. Frontend Design

### 6.1 Pages & Routing

| Route | Page | Description |
|---|---|---|
| `/` | ChatPage | Main conversation interface (default) |
| `/tasks` | TasksPage | Kanban board view |
| `/calendar` | CalendarPage | Weekly/monthly calendar |
| `/knowledge` | KnowledgePage | Notes list + semantic search + editor |
| `/login` | LoginPage | Supabase Auth (Google OAuth + email) |

### 6.2 Layout

```
┌─────────────────────────────────────────────────────────────┐
│ AGENT STATUS BAR (persistent)                               │
│ ● Orchestrator  ● TaskAgent  ○ CalAgent  ● InfoAgent       │
├─────────────────────────────────────────────────────────────┤
│ ACTIVITY TICKER (animated, scrolling)                       │
│ → TaskAgent created "Review PR"  → CalAgent found 2 slots  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  PAGE CONTENT (changes per route)                           │
│                                                             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ NAVIGATION (bottom bar)                                     │
│ [Chat] [Tasks] [Calendar] [Knowledge]                       │
└─────────────────────────────────────────────────────────────┘
```

### 6.3 Brutalist Design System

**Colors:**
- Background: `#f5f5f0` (off-white paper)
- Text: `#1a1a1a` (near-black)
- Borders: `#1a1a1a` (3px solid)
- Accent — Orchestrator: `#ff3b30` (red)
- Accent — TaskAgent: `#007aff` (blue)
- Accent — CalAgent: `#34c759` (green)
- Accent — InfoAgent: `#ff9500` (orange)
- Priority — High: `#ff3b30`
- Priority — Medium: `#ff9500`
- Priority — Low: `#34c759`

**Typography:**
- Primary: `JetBrains Mono` (monospace)
- Headings: `Space Mono` (monospace, bold)
- No system fonts — only monospace

**Components:**
- No rounded corners (`border-radius: 0`)
- No gradients — flat colors only
- Box shadows: `4px 4px 0px #1a1a1a` (hard offset, no blur)
- Borders: `3px solid #1a1a1a`
- Buttons: thick border, hard shadow, invert on hover
- Cards: white background, thick border, hard shadow
- Inputs: thick border, no outline glow

**Animations:**
- Activity ticker: CSS `@keyframes` infinite horizontal scroll
- Agent status: pulsing dot (CSS `animation: pulse 2s infinite`)
- Kanban drag: slight rotation + larger shadow while dragging
- Page transitions: none (brutalist — instant)

### 6.4 Real-time Updates

Supabase Realtime subscriptions:
- `tasks` table → Kanban board auto-updates on task changes
- `notes` table → Knowledge page auto-refreshes
- Agent status → Polling every 2s via `/api/v1/agents/status` (ADK doesn't emit events, so we poll)

---

## 7. Infrastructure

### 7.1 Docker Compose (Local Dev)

```yaml
services:
  db:
    image: supabase/postgres:15
    ports:
      - "5432:5432"
    environment:
      POSTGRES_PASSWORD: postgres
    volumes:
      - ./infrastructure/supabase/migrations:/docker-entrypoint-initdb.d

  backend:
    build: .
    ports:
      - "8080:8080"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@db:5432/postgres
      SUPABASE_URL: http://localhost:8000
      SUPABASE_SERVICE_KEY: ${SUPABASE_SERVICE_KEY}
      GEMINI_MODEL: gemini-2.0-flash
      GOOGLE_CLOUD_PROJECT: ${GOOGLE_CLOUD_PROJECT}
      GMAIL_MCP_URL: ${GMAIL_MCP_URL}
      GCAL_MCP_URL: ${GCAL_MCP_URL}
      ALLOWED_ORIGINS: http://localhost:5173
    volumes:
      - ~/.config/gcloud:/root/.config/gcloud:ro
      - ./backend:/app/backend
    depends_on:
      - db

  frontend:
    image: node:20-alpine
    working_dir: /app
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
    command: sh -c "npm install && npm run dev -- --host 0.0.0.0"
    environment:
      - VITE_API_URL=http://localhost:8080/api/v1
    depends_on:
      - backend
```

Note: For local development, we use raw PostgreSQL via `DATABASE_URL` for the backend (direct connection, no Supabase middleware needed server-side). Supabase JS client is used only on the frontend for auth and realtime subscriptions. The Supabase platform (cloud or self-hosted) provides Auth + Realtime layers on top of PostgreSQL. For a fully local setup, the Supabase CLI (`supabase start`) is recommended over raw Docker Compose — it manages all Supabase services (auth, realtime, studio, kong gateway) automatically.

### 7.2 Environment Variables

```env
# Supabase
SUPABASE_URL=http://localhost:8000
SUPABASE_KEY=<anon_key>
SUPABASE_SERVICE_KEY=<service_role_key>

# Google
GOOGLE_CLOUD_PROJECT=your-gcp-project-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json

# MCP Servers
GMAIL_MCP_URL=https://gmail.mcp.claude.com/mcp
GCAL_MCP_URL=https://gcal.mcp.claude.com/mcp

# Security
SECRET_KEY=your-secret-key-min-32-chars
ALLOWED_ORIGINS=http://localhost:5173

# Frontend
VITE_API_URL=http://localhost:8080/api/v1
VITE_SUPABASE_URL=http://localhost:8000
VITE_SUPABASE_ANON_KEY=<anon_key>
```

---

## 8. Error Handling

### 8.1 Agent Tool Failures
- Tools return structured errors to the calling agent
- Orchestrator catches sub-agent failures and informs the user
- No silent failures — every error is surfaced with context

### 8.2 API Errors
- 401: Invalid or missing JWT
- 403: User doesn't own the requested resource
- 404: Resource not found
- 422: Validation error (Pydantic)
- 500: Internal server error (with trace ID for debugging)

### 8.3 Supabase Connection Failures
- Backend retries with exponential backoff (3 attempts)
- Health check endpoint reports database connectivity
- Frontend shows "Connection lost" banner on WebSocket disconnect

---

## 9. Testing Strategy

### 9.1 Backend Tests
- **Unit tests:** Agent tool functions with mocked Supabase client
- **Integration tests:** API endpoints with test Supabase instance
- **Agent workflow tests:** End-to-end orchestrator → sub-agent → tool calls

### 9.2 Frontend Tests
- **Component tests:** Individual UI components with mock data
- **Integration tests:** Page flows (login → chat → task creation)
- **Visual tests:** Brutalist design regression (screenshot comparison)

### 9.3 Test Commands
```bash
# Backend
pytest backend/tests/ -v

# Frontend
npm run test  # Vitest

# Full stack
docker compose -f docker-compose.test.yml up
```

---

## 10. Implementation Order

1. **Phase 1: Foundation** — Docker Compose, Supabase schema, FastAPI skeleton, auth middleware
2. **Phase 2: TaskAgent** — Task tools, task API, Kanban board UI
3. **Phase 3: InfoAgent** — Note tools, pgvector search, knowledge base UI
4. **Phase 4: Orchestrator + Chat** — ADK setup, chat endpoint, chat UI
5. **Phase 5: CalAgent** — Calendar MCP integration, calendar UI
6. **Phase 6: Polish** — Brutalist design, activity ticker, agent status bar, realtime subscriptions
7. **Phase 7: Testing** — Unit, integration, and workflow tests

---

## 11. Non-Functional Requirements

| Requirement | Target |
|---|---|
| API Response P95 | < 3 seconds |
| API Response P99 | < 8 seconds |
| Cold start time | < 5 seconds |
| Max concurrent users | 500 |
| Rate limit | 60 req/min per user |
| Auth token expiry | 24 hours |

---

## 12. Security

- All API endpoints require Supabase JWT verification
- Row Level Security on all tables — users can only access their own data
- Secrets managed via environment variables (GCP Secret Manager in production)
- CORS restricted to allowed origins
- Input sanitization on all user text fields
- No user data used for model training
- MCP tool calls scoped to user's OAuth tokens
