# PETAL Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build PETAL — a multi-agent AI workspace with Google ADK, Gemini 2.0 Flash, Supabase (PostgreSQL + pgvector), FastAPI backend, and brutalist React frontend.

**Architecture:** Monolith with clean boundaries. Single FastAPI backend hosts Google ADK agents (Orchestrator, TaskAgent, CalAgent, InfoAgent). Supabase PostgreSQL for all data with pgvector for semantic search. React + TypeScript frontend with Zustand state and hand-crafted brutalist CSS.

**Tech Stack:** Python 3.12, FastAPI, Google ADK, Gemini 2.0 Flash, Supabase (PostgreSQL 15 + pgvector), React 18, TypeScript, Vite, Zustand, Docker Compose

---

## File Map

### Infrastructure
- `infrastructure/supabase/migrations/001_initial_schema.sql` — Full DB schema with RLS
- `infrastructure/supabase/seed.sql` — Optional seed data
- `docker-compose.yml` — Local dev: db, backend, frontend
- `.env.example` — Environment variable template
- `Dockerfile` — Backend container
- `requirements.txt` — Python dependencies

### Backend
- `backend/__init__.py` — Package marker
- `backend/main.py` — FastAPI app entrypoint + lifespan
- `backend/config.py` — Pydantic settings from env vars
- `backend/db/__init__.py` — Package marker
- `backend/db/supabase.py` — Supabase/PostgreSQL client + helpers
- `backend/db/models.py` — Pydantic data models
- `backend/api/__init__.py` — Package marker
- `backend/api/middleware.py` — Supabase JWT auth, CORS, error handlers
- `backend/api/routes/__init__.py` — Package marker
- `backend/api/routes/chat.py` — POST /chat endpoint
- `backend/api/routes/tasks.py` — Task CRUD endpoints
- `backend/api/routes/calendar.py` — Calendar endpoints
- `backend/api/routes/notes.py` — Notes endpoints
- `backend/api/routes/agents.py` — Agent status endpoint
- `backend/agents/__init__.py` — Package marker
- `backend/agents/orchestrator.py` — Primary ADK orchestrator agent
- `backend/agents/task_agent.py` — TaskAgent definition
- `backend/agents/cal_agent.py` — CalAgent definition
- `backend/agents/info_agent.py` — InfoAgent definition
- `backend/tools/__init__.py` — Package marker
- `backend/tools/task_tools.py` — Supabase-backed task CRUD tools
- `backend/tools/notes_tools.py` — Notes CRUD + pgvector search tools
- `backend/tools/calendar_tools.py` — Calendar MCP wrapper tools

### Frontend
- `frontend/package.json` — Dependencies
- `frontend/vite.config.ts` — Vite config
- `frontend/tsconfig.json` — TypeScript config
- `frontend/index.html` — HTML entrypoint
- `frontend/src/main.tsx` — React entrypoint
- `frontend/src/App.tsx` — Router + layout with status bar + ticker
- `frontend/src/styles/brutalist.css` — Hand-crafted brutalist styles
- `frontend/src/utils/supabase.ts` — Supabase JS client
- `frontend/src/utils/api.ts` — Axios API client
- `frontend/src/hooks/useAuth.ts` — Supabase auth hook
- `frontend/src/hooks/useTasks.ts` — Task CRUD + realtime hook
- `frontend/src/hooks/useNotes.ts` — Notes CRUD + realtime hook
- `frontend/src/hooks/useAgents.ts` — Agent status polling hook
- `frontend/src/store/index.ts` — Zustand store
- `frontend/src/pages/ChatPage.tsx` — Main chat interface
- `frontend/src/pages/TasksPage.tsx` — Kanban board
- `frontend/src/pages/CalendarPage.tsx` — Calendar view
- `frontend/src/pages/KnowledgePage.tsx` — Notes + search
- `frontend/src/pages/LoginPage.tsx` — Auth page
- `frontend/src/components/AgentStatusBar.tsx` — Persistent status bar
- `frontend/src/components/ActivityTicker.tsx` — Animated ticker
- `frontend/src/components/ChatWindow.tsx` — Chat messages
- `frontend/src/components/KanbanBoard.tsx` — Drag-and-drop board
- `frontend/src/components/KanbanCard.tsx` — Individual task card
- `frontend/src/components/NoteEditor.tsx` — Note editor
- `frontend/src/components/NoteSearch.tsx` — Semantic search
- `frontend/src/components/CalendarView.tsx` — Calendar grid

### Tests
- `backend/tests/__init__.py` — Package marker
- `backend/tests/test_task_tools.py` — Task tool unit tests
- `backend/tests/test_notes_tools.py` — Notes tool unit tests
- `backend/tests/test_api_tasks.py` — Task API integration tests
- `backend/tests/test_api_notes.py` — Notes API integration tests
- `backend/tests/conftest.py` — Pytest fixtures

---

## Phase 1: Foundation

### Task 1: Project Skeleton + Infrastructure

**Files:**
- Create: `infrastructure/supabase/migrations/001_initial_schema.sql`
- Create: `docker-compose.yml`
- Create: `.env.example`
- Create: `Dockerfile`
- Create: `requirements.txt`
- Create: `backend/__init__.py`
- Create: `backend/config.py`

- [ ] **Step 1: Create the database migration file**

Create `infrastructure/supabase/migrations/001_initial_schema.sql`:

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL,
    name TEXT,
    avatar_url TEXT,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
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

-- Notes table with vector embeddings
CREATE TABLE IF NOT EXISTS notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    body TEXT DEFAULT '',
    tags TEXT[] DEFAULT '{}',
    embedding VECTOR(768),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    messages JSONB DEFAULT '[]',
    agents_invoked TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Calendar events table
CREATE TABLE IF NOT EXISTS calendar_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON tasks(user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_user_priority ON tasks(user_id, priority, due_date ASC);
CREATE INDEX IF NOT EXISTS idx_notes_user_updated ON notes(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_embedding ON notes USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);
CREATE INDEX IF NOT EXISTS idx_calendar_user_time ON calendar_events(user_id, start_time ASC);

-- For local dev without RLS (auth handled by backend middleware)
-- In production with Supabase Auth, enable these:
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
```

- [ ] **Step 2: Create docker-compose.yml**

Create `docker-compose.yml`:

```yaml
services:
  db:
    image: ankane/pgvector:latest
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: petal
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./infrastructure/supabase/migrations:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build: .
    ports:
      - "8080:8080"
    environment:
      DATABASE_URL: postgresql+asyncpg://postgres:postgres@db:5432/petal
      GEMINI_MODEL: gemini-2.0-flash
      GOOGLE_CLOUD_PROJECT: ${GOOGLE_CLOUD_PROJECT:-local}
      GMAIL_MCP_URL: ${GMAIL_MCP_URL:-}
      GCAL_MCP_URL: ${GCAL_MCP_URL:-}
      ALLOWED_ORIGINS: http://localhost:5173,http://localhost:3000
      JWT_SECRET: ${JWT_SECRET:-petal-dev-secret-key-change-in-production}
    volumes:
      - ./backend:/app/backend
    depends_on:
      db:
        condition: service_healthy
    command: uvicorn backend.main:app --host 0.0.0.0 --port 8080 --reload

  frontend:
    image: node:20-alpine
    working_dir: /app
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    command: sh -c "npm install && npm run dev -- --host 0.0.0.0"
    environment:
      - VITE_API_URL=http://localhost:8080/api/v1
    depends_on:
      - backend

volumes:
  pgdata:
```

- [ ] **Step 3: Create .env.example**

Create `.env.example`:

```env
# Database
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/petal

# Google / Gemini
GOOGLE_CLOUD_PROJECT=your-gcp-project-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json

# MCP Servers (optional for local dev)
GMAIL_MCP_URL=
GCAL_MCP_URL=

# Security
JWT_SECRET=petal-dev-secret-key-change-in-production
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Frontend
VITE_API_URL=http://localhost:8080/api/v1
```

- [ ] **Step 4: Create Dockerfile**

Create `Dockerfile`:

```dockerfile
FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend/

RUN useradd -m -u 1001 appuser && chown -R appuser:appuser /app
USER appuser

ENV PORT=8080
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "2", "--log-level", "info"]
```

- [ ] **Step 5: Create requirements.txt**

Create `requirements.txt`:

```
google-adk>=1.0.0
google-cloud-firestore>=2.19.0
google-cloud-secret-manager>=2.20.0
google-cloud-logging>=3.10.0
google-cloud-trace>=1.11.0
google-auth>=2.29.0
firebase-admin>=6.5.0
fastapi>=0.111.0
uvicorn[standard]>=0.29.0
pydantic>=2.7.0
pydantic-settings>=2.3.0
python-dotenv>=1.0.1
httpx>=0.27.0
google-generativeai>=0.7.0
vertexai>=1.60.0
numpy>=1.26.4
asyncpg>=0.29.0
SQLAlchemy[asyncio]>=2.0.0
alembic>=1.13.0
PyJWT>=2.8.0
pytest>=8.0.0
pytest-asyncio>=0.23.0
pytest-httpx>=0.30.0
```

- [ ] **Step 6: Create backend/__init__.py**

Create `backend/__init__.py` (empty file).

- [ ] **Step 7: Create backend/config.py**

Create `backend/config.py`:

```python
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/petal"
    GEMINI_MODEL: str = "gemini-2.0-flash"
    GOOGLE_CLOUD_PROJECT: str = "local"
    GMAIL_MCP_URL: Optional[str] = None
    GCAL_MCP_URL: Optional[str] = None
    ALLOWED_ORIGINS: list[str] = ["http://localhost:5173"]
    JWT_SECRET: str = "petal-dev-secret-key-change-in-production"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
```

### Task 2: Database Layer (SQLAlchemy + asyncpg)

**Files:**
- Create: `backend/db/__init__.py`
- Create: `backend/db/supabase.py`
- Create: `backend/db/models.py`

- [ ] **Step 1: Create db/__init__.py**

Create `backend/db/__init__.py` (empty file).

- [ ] **Step 2: Create db/models.py — Pydantic data models**

Create `backend/db/models.py`:

```python
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class TaskCreate(BaseModel):
    title: str
    description: str = ""
    priority: str = "medium"
    due_date: Optional[datetime] = None
    tags: list[str] = Field(default_factory=list)


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    tags: Optional[list[str]] = None
    due_date: Optional[datetime] = None


class Task(BaseModel):
    id: str
    user_id: str
    title: str
    description: str = ""
    priority: str = "medium"
    status: str = "todo"
    tags: list[str] = Field(default_factory=list)
    due_date: Optional[datetime] = None
    agent_created: bool = False
    created_at: datetime
    updated_at: datetime


class NoteCreate(BaseModel):
    title: str
    body: str = ""
    tags: list[str] = Field(default_factory=list)


class Note(BaseModel):
    id: str
    user_id: str
    title: str
    body: str = ""
    tags: list[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class CalendarEventCreate(BaseModel):
    title: str
    start_time: datetime
    end_time: datetime
    location: Optional[str] = None
    attendees: list[str] = Field(default_factory=list)


class CalendarEvent(BaseModel):
    id: str
    user_id: str
    title: str
    start_time: datetime
    end_time: datetime
    location: Optional[str] = None
    meet_link: Optional[str] = None
    attendees: list[str] = Field(default_factory=list)
    google_event_id: Optional[str] = None
    created_by_agent: bool = False
    created_at: datetime


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None


class ToolCall(BaseModel):
    agent: str
    tool: str
    result: str


class ChatResponse(BaseModel):
    reply: str
    agents_invoked: list[str]
    tool_calls: list[ToolCall] = Field(default_factory=list)
    session_id: str
    latency_ms: int
```

- [ ] **Step 3: Create db/supabase.py — Database engine + async session**

Create `backend/db/supabase.py`:

```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import Column, String, DateTime, Boolean, Text, ARRAY, text
from sqlalchemy.dialects.postgresql import UUID, JSONB, VECTOR
from sqlalchemy.orm import DeclarativeBase
from datetime import datetime, timezone
import uuid

from ..config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class TaskModel(Base):
    __tablename__ = "tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    title = Column(Text, nullable=False)
    description = Column(Text, default="")
    priority = Column(String(10), default="medium")
    status = Column(String(20), default="todo")
    tags = Column(ARRAY(String), default=[])
    due_date = Column(DateTime(timezone=True), nullable=True)
    agent_created = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class NoteModel(Base):
    __tablename__ = "notes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    title = Column(Text, nullable=False)
    body = Column(Text, default="")
    tags = Column(ARRAY(String), default=[])
    embedding = Column(VECTOR(768), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class CalendarEventModel(Base):
    __tablename__ = "calendar_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    title = Column(Text, nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    location = Column(Text, nullable=True)
    meet_link = Column(Text, nullable=True)
    attendees = Column(ARRAY(String), default=[])
    google_event_id = Column(Text, nullable=True)
    created_by_agent = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class SessionModel(Base):
    __tablename__ = "sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    messages = Column(JSONB, default=[])
    agents_invoked = Column(ARRAY(String), default=[])
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


async def get_db() -> AsyncSession:
    async with async_session() as session:
        yield session


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db():
    await engine.dispose()
```

### Task 3: FastAPI App + Auth Middleware + Health Check

**Files:**
- Create: `backend/api/__init__.py`
- Create: `backend/api/middleware.py`
- Create: `backend/main.py`

- [ ] **Step 1: Create api/__init__.py**

Create `backend/api/__init__.py` (empty file).

- [ ] **Step 2: Create api/middleware.py**

Create `backend/api/middleware.py`:

```python
from fastapi import Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
import jwt
from datetime import datetime

from ..config import settings


def setup_cors(app):
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


def decode_jwt(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        return payload
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


async def get_current_user(request: Request) -> dict:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authorization header")

    token = auth_header.split(" ", 1)[1]
    payload = decode_jwt(token)

    user_id = payload.get("sub") or payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token: no user_id")

    return {"user_id": str(user_id), "email": payload.get("email", "")}


async def get_optional_user(request: Request) -> dict | None:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    try:
        token = auth_header.split(" ", 1)[1]
        payload = decode_jwt(token)
        user_id = payload.get("sub") or payload.get("user_id")
        if user_id:
            return {"user_id": str(user_id), "email": payload.get("email", "")}
    except HTTPException:
        pass
    return None
```

- [ ] **Step 3: Create backend/main.py**

Create `backend/main.py`:

```python
from fastapi import FastAPI
from contextlib import asynccontextmanager

from .api.middleware import setup_cors
from .api.routes import chat, tasks, calendar, notes, agents
from .db.supabase import init_db, close_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
    await close_db()


app = FastAPI(
    title="PETAL API",
    version="2.0.0",
    description="Multi-Agent Productivity Workspace",
    lifespan=lifespan,
)

setup_cors(app)

app.include_router(chat.router, prefix="/api/v1")
app.include_router(tasks.router, prefix="/api/v1")
app.include_router(calendar.router, prefix="/api/v1")
app.include_router(notes.router, prefix="/api/v1")
app.include_router(agents.router, prefix="/api/v1")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "petal-api", "version": "2.0.0"}
```

- [ ] **Step 4: Verify the app starts**

Run: `cd /Users/shikhar/Petal && uvicorn backend.main:app --host 0.0.0.0 --port 8080`

Expected: Server starts on http://0.0.0.0:8080

Test: `curl http://localhost:8080/health`
Expected: `{"status":"ok","service":"petal-api","version":"2.0.0"}`

- [ ] **Step 5: Commit**

```bash
cd /Users/shikhar/Petal
git add -A
git commit -m "feat: foundation — DB schema, Docker Compose, FastAPI skeleton, auth middleware"
```

---

## Phase 2: TaskAgent + Task API + Kanban Board

### Task 4: Task Tools (Supabase-backed CRUD)

**Files:**
- Create: `backend/tools/__init__.py`
- Create: `backend/tools/task_tools.py`

- [ ] **Step 1: Create tools/__init__.py**

Create `backend/tools/__init__.py` (empty file).

- [ ] **Step 2: Create tools/task_tools.py**

Create `backend/tools/task_tools.py`:

```python
from sqlalchemy import select, update as sa_update, delete as sa_delete
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone
import uuid

from ..db.supabase import TaskModel
from ..db.models import Task


async def create_task(
    db: AsyncSession,
    user_id: str,
    title: str,
    priority: str = "medium",
    due_date: datetime = None,
    tags: list[str] = None,
    description: str = "",
) -> dict:
    task_id = uuid.uuid4()
    task = TaskModel(
        id=task_id,
        user_id=uuid.UUID(user_id),
        title=title,
        description=description,
        priority=priority,
        status="todo",
        tags=tags or [],
        due_date=due_date,
        agent_created=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return {
        "id": str(task.id),
        "user_id": str(task.user_id),
        "title": task.title,
        "priority": task.priority,
        "status": task.status,
        "tags": task.tags,
        "description": task.description,
        "due_date": task.due_date.isoformat() if task.due_date else None,
        "agent_created": task.agent_created,
        "created_at": task.created_at.isoformat(),
        "updated_at": task.updated_at.isoformat(),
    }


async def list_tasks(
    db: AsyncSession,
    user_id: str,
    status: str = None,
    priority: str = None,
    tag: str = None,
    limit: int = 50,
) -> list[dict]:
    query = select(TaskModel).where(TaskModel.user_id == uuid.UUID(user_id))
    if status:
        query = query.where(TaskModel.status == status)
    if priority:
        query = query.where(TaskModel.priority == priority)
    if tag:
        query = query.where(TaskModel.tags.contains([tag]))
    query = query.order_by(TaskModel.created_at.desc()).limit(limit)
    result = await db.execute(query)
    tasks = result.scalars().all()
    return [_task_to_dict(t) for t in tasks]


async def update_task(
    db: AsyncSession,
    user_id: str,
    task_id: str,
    **updates,
) -> dict | None:
    updates["updated_at"] = datetime.now(timezone.utc)
    stmt = (
        sa_update(TaskModel)
        .where(TaskModel.id == uuid.UUID(task_id), TaskModel.user_id == uuid.UUID(user_id))
        .values(**{k: v for k, v in updates.items() if v is not None})
        .returning(TaskModel)
    )
    result = await db.execute(stmt)
    await db.commit()
    task = result.scalar_one_or_none()
    if task is None:
        return None
    return _task_to_dict(task)


async def delete_task(
    db: AsyncSession,
    user_id: str,
    task_id: str,
) -> bool:
    stmt = (
        sa_delete(TaskModel)
        .where(TaskModel.id == uuid.UUID(task_id), TaskModel.user_id == uuid.UUID(user_id))
    )
    result = await db.execute(stmt)
    await db.commit()
    return result.rowcount > 0


def _task_to_dict(task: TaskModel) -> dict:
    return {
        "id": str(task.id),
        "user_id": str(task.user_id),
        "title": task.title,
        "description": task.description,
        "priority": task.priority,
        "status": task.status,
        "tags": task.tags or [],
        "due_date": task.due_date.isoformat() if task.due_date else None,
        "agent_created": task.agent_created,
        "created_at": task.created_at.isoformat(),
        "updated_at": task.updated_at.isoformat(),
    }
```

### Task 5: Task API Routes

**Files:**
- Create: `backend/api/routes/__init__.py`
- Create: `backend/api/routes/tasks.py`

- [ ] **Step 1: Create api/routes/__init__.py**

Create `backend/api/routes/__init__.py` (empty file).

- [ ] **Step 2: Create api/routes/tasks.py**

Create `backend/api/routes/tasks.py`:

```python
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from ...db.supabase import get_db
from ...api.middleware import get_current_user
from ...tools import task_tools
from ...db.models import TaskCreate, TaskUpdate, Task

router = APIRouter()


@router.get("/tasks", response_model=list[Task])
async def get_tasks(
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    tag: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    return await task_tools.list_tasks(db, user["user_id"], status=status, priority=priority, tag=tag, limit=limit)


@router.post("/tasks", response_model=Task, status_code=201)
async def create_task(
    data: TaskCreate,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    return await task_tools.create_task(
        db,
        user_id=user["user_id"],
        title=data.title,
        description=data.description,
        priority=data.priority,
        due_date=data.due_date,
        tags=data.tags,
    )


@router.patch("/tasks/{task_id}", response_model=Task)
async def update_task(
    task_id: str,
    data: TaskUpdate,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    updates = data.model_dump(exclude_unset=True)
    result = await task_tools.update_task(db, user["user_id"], task_id, **updates)
    if result is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return result


@router.delete("/tasks/{task_id}", status_code=204)
async def delete_task(
    task_id: str,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    deleted = await task_tools.delete_task(db, user["user_id"], task_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Task not found")
```

### Task 6: TaskAgent Definition

**Files:**
- Create: `backend/agents/__init__.py`
- Create: `backend/agents/task_agent.py`

- [ ] **Step 1: Create agents/__init__.py**

Create `backend/agents/__init__.py` (empty file).

- [ ] **Step 2: Create agents/task_agent.py**

Create `backend/agents/task_agent.py`:

```python
from google.adk.agents import LlmAgent

from ..config import settings

TASK_AGENT_INSTRUCTION = """
You are PETAL's TaskAgent. You manage the user's task list in the database.

Capabilities:
- create_task: Create a new task with title, priority, due date, tags
- list_tasks: List tasks, optionally filtered by status/priority/tag
- update_task: Update task status, priority, or other fields
- delete_task: Remove a task

Priority levels: 'high', 'medium', 'low'
Status options: 'todo', 'in_progress', 'done'

Always confirm what action was taken and the task ID for reference.
When listing tasks, format them clearly with priority indicators and due dates.
"""

task_agent = LlmAgent(
    name="task_agent",
    model=settings.GEMINI_MODEL,
    description="Manages tasks — create, update, list, prioritize",
    instruction=TASK_AGENT_INSTRUCTION,
)
```

### Task 7: Task API Tests

**Files:**
- Create: `backend/tests/__init__.py`
- Create: `backend/tests/conftest.py`
- Create: `backend/tests/test_api_tasks.py`

- [ ] **Step 1: Create tests/__init__.py**

Create `backend/tests/__init__.py` (empty file).

- [ ] **Step 2: Create tests/conftest.py**

Create `backend/tests/conftest.py`:

```python
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from datetime import datetime, timezone
import uuid

from backend.main import app
from backend.db.supabase import Base, get_db


TEST_DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/petal_test"

test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
test_session_factory = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)


@pytest_asyncio.fixture
async def db_session():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with test_session_factory() as session:
        yield session
        await session.close()
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


async def override_get_db():
    async with test_session_factory() as session:
        yield session


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture
def test_user():
    return {"user_id": str(uuid.uuid4()), "email": "test@example.com"}


@pytest.fixture
def auth_header(test_user):
    import jwt
    from backend.config import settings

    token = jwt.encode(
        {"sub": test_user["user_id"], "email": test_user["email"]},
        settings.JWT_SECRET,
        algorithm="HS256",
    )
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def client(auth_header):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        ac.headers = auth_header
        yield ac
```

- [ ] **Step 3: Create tests/test_api_tasks.py**

Create `backend/tests/test_api_tasks.py`:

```python
import pytest


@pytest.mark.asyncio
async def test_create_task(client):
    response = await client.post("/api/v1/tasks", json={
        "title": "Test task",
        "priority": "high",
        "tags": ["test"],
    })
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test task"
    assert data["priority"] == "high"
    assert data["status"] == "todo"
    assert data["tags"] == ["test"]
    assert "id" in data


@pytest.mark.asyncio
async def test_list_tasks(client):
    await client.post("/api/v1/tasks", json={"title": "Task 1"})
    await client.post("/api/v1/tasks", json={"title": "Task 2"})
    response = await client.get("/api/v1/tasks")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2


@pytest.mark.asyncio
async def test_update_task(client):
    create_resp = await client.post("/api/v1/tasks", json={"title": "Update me"})
    task_id = create_resp.json()["id"]
    response = await client.patch(f"/api/v1/tasks/{task_id}", json={"status": "done"})
    assert response.status_code == 200
    assert response.json()["status"] == "done"


@pytest.mark.asyncio
async def test_delete_task(client):
    create_resp = await client.post("/api/v1/tasks", json={"title": "Delete me"})
    task_id = create_resp.json()["id"]
    response = await client.delete(f"/api/v1/tasks/{task_id}")
    assert response.status_code == 204
    list_resp = await client.get("/api/v1/tasks")
    ids = [t["id"] for t in list_resp.json()]
    assert task_id not in ids


@pytest.mark.asyncio
async def test_unauthorized_request():
    from httpx import ASGITransport, AsyncClient
    from backend.main import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/v1/tasks")
        assert response.status_code == 401
```

- [ ] **Step 4: Run tests**

Run: `cd /Users/shikhar/Petal && python -m pytest backend/tests/test_api_tasks.py -v`
Expected: 5 tests pass

- [ ] **Step 5: Commit**

```bash
cd /Users/shikhar/Petal
git add -A
git commit -m "feat: TaskAgent — task tools, API routes, tests"
```

---

## Phase 3: InfoAgent + Notes API + Knowledge Base UI

### Task 8: Notes Tools (Supabase + pgvector)

**Files:**
- Create: `backend/tools/notes_tools.py`

- [ ] **Step 1: Create tools/notes_tools.py**

Create `backend/tools/notes_tools.py`:

```python
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone
import uuid
import numpy as np

from ..db.supabase import NoteModel


async def save_note(
    db: AsyncSession,
    user_id: str,
    title: str,
    body: str = "",
    tags: list[str] = None,
    embedding: list[float] = None,
) -> dict:
    note_id = uuid.uuid4()
    note = NoteModel(
        id=note_id,
        user_id=uuid.UUID(user_id),
        title=title,
        body=body,
        tags=tags or [],
        embedding=embedding,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(note)
    await db.commit()
    await db.refresh(note)
    return _note_to_dict(note)


async def list_notes(
    db: AsyncSession,
    user_id: str,
    limit: int = 50,
) -> list[dict]:
    query = (
        select(NoteModel)
        .where(NoteModel.user_id == uuid.UUID(user_id))
        .order_by(NoteModel.updated_at.desc())
        .limit(limit)
    )
    result = await db.execute(query)
    notes = result.scalars().all()
    return [_note_to_dict(n) for n in notes]


async def search_notes(
    db: AsyncSession,
    user_id: str,
    query_embedding: list[float],
    limit: int = 10,
) -> list[dict]:
    embedding_str = f"[{','.join(str(x) for x in query_embedding)}]"
    sql = text("""
        SELECT id, user_id, title, body, tags, created_at, updated_at,
               1 - (embedding <=> :embedding) as similarity
        FROM notes
        WHERE user_id = :user_id AND embedding IS NOT NULL
        ORDER BY embedding <=> :embedding
        LIMIT :limit
    """)
    result = await db.execute(sql, {
        "user_id": uuid.UUID(user_id),
        "embedding": embedding_str,
        "limit": limit,
    })
    rows = result.fetchall()
    return [
        {
            "id": str(row.id),
            "user_id": str(row.user_id),
            "title": row.title,
            "body": row.body,
            "tags": row.tags or [],
            "created_at": row.created_at.isoformat(),
            "updated_at": row.updated_at.isoformat(),
            "similarity": float(row.similarity),
        }
        for row in rows
    ]


async def delete_note(
    db: AsyncSession,
    user_id: str,
    note_id: str,
) -> bool:
    from sqlalchemy import delete as sa_delete
    stmt = (
        sa_delete(NoteModel)
        .where(NoteModel.id == uuid.UUID(note_id), NoteModel.user_id == uuid.UUID(user_id))
    )
    result = await db.execute(stmt)
    await db.commit()
    return result.rowcount > 0


def _note_to_dict(note: NoteModel) -> dict:
    return {
        "id": str(note.id),
        "user_id": str(note.user_id),
        "title": note.title,
        "body": note.body,
        "tags": note.tags or [],
        "created_at": note.created_at.isoformat(),
        "updated_at": note.updated_at.isoformat(),
    }
```

### Task 9: Notes API Routes

**Files:**
- Create: `backend/api/routes/notes.py`

- [ ] **Step 1: Create api/routes/notes.py**

Create `backend/api/routes/notes.py`:

```python
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from ...db.supabase import get_db
from ...api.middleware import get_current_user
from ...tools import notes_tools
from ...db.models import NoteCreate, Note

router = APIRouter()


@router.get("/notes", response_model=list[Note])
async def get_notes(
    limit: int = Query(50, le=200),
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    return await notes_tools.list_notes(db, user["user_id"], limit=limit)


@router.post("/notes", response_model=Note, status_code=201)
async def create_note(
    data: NoteCreate,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    return await notes_tools.save_note(
        db,
        user_id=user["user_id"],
        title=data.title,
        body=data.body,
        tags=data.tags,
    )


@router.get("/notes/search")
async def search_notes(
    q: str = Query(..., min_length=1),
    limit: int = Query(10, le=50),
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    from google import genai
    from ..config import settings

    client = genai.Client()
    embedding_response = client.models.embed_content(
        model="text-embedding-004",
        contents=q,
    )
    query_embedding = embedding_response.embeddings[0].values

    results = await notes_tools.search_notes(
        db, user["user_id"], query_embedding, limit=limit
    )
    return {"query": q, "results": results}


@router.delete("/notes/{note_id}", status_code=204)
async def delete_note(
    note_id: str,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    deleted = await notes_tools.delete_note(db, user["user_id"], note_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Note not found")
```

### Task 10: InfoAgent Definition

**Files:**
- Create: `backend/agents/info_agent.py`

- [ ] **Step 1: Create agents/info_agent.py**

Create `backend/agents/info_agent.py`:

```python
from google.adk.agents import LlmAgent

from ..config import settings

INFO_AGENT_INSTRUCTION = """
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
"""

info_agent = LlmAgent(
    name="info_agent",
    model=settings.GEMINI_MODEL,
    description="Stores and retrieves notes from the knowledge base with semantic search",
    instruction=INFO_AGENT_INSTRUCTION,
)
```

### Task 11: Notes API Tests

**Files:**
- Create: `backend/tests/test_api_notes.py`

- [ ] **Step 1: Create tests/test_api_notes.py**

Create `backend/tests/test_api_notes.py`:

```python
import pytest


@pytest.mark.asyncio
async def test_create_note(client):
    response = await client.post("/api/v1/notes", json={
        "title": "Test note",
        "body": "This is a test note",
        "tags": ["test"],
    })
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test note"
    assert data["body"] == "This is a test note"
    assert "id" in data


@pytest.mark.asyncio
async def test_list_notes(client):
    await client.post("/api/v1/notes", json={"title": "Note 1"})
    await client.post("/api/v1/notes", json={"title": "Note 2"})
    response = await client.get("/api/v1/notes")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2


@pytest.mark.asyncio
async def test_delete_note(client):
    create_resp = await client.post("/api/v1/notes", json={"title": "Delete me"})
    note_id = create_resp.json()["id"]
    response = await client.delete(f"/api/v1/notes/{note_id}")
    assert response.status_code == 204
```

- [ ] **Step 2: Run all tests**

Run: `cd /Users/shikhar/Petal && python -m pytest backend/tests/ -v`
Expected: All 8 tests pass

- [ ] **Step 3: Commit**

```bash
cd /Users/shikhar/Petal
git add -A
git commit -m "feat: InfoAgent — notes tools, API routes, pgvector search, tests"
```

---

## Phase 4: Orchestrator + Chat + Frontend Skeleton

### Task 12: Orchestrator Agent

**Files:**
- Create: `backend/agents/orchestrator.py`

- [ ] **Step 1: Create agents/orchestrator.py**

Create `backend/agents/orchestrator.py`:

```python
from google.adk.agents import LlmAgent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types
import time

from .task_agent import task_agent
from .cal_agent import cal_agent
from .info_agent import info_agent
from ..config import settings

ORCHESTRATOR_INSTRUCTION = """
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
"""

_session_service = InMemorySessionService()


def create_orchestrator() -> LlmAgent:
    return LlmAgent(
        name="petal_orchestrator",
        model=settings.GEMINI_MODEL,
        description="Primary orchestrator that coordinates all PETAL sub-agents",
        instruction=ORCHESTRATOR_INSTRUCTION,
        sub_agents=[task_agent, cal_agent, info_agent],
    )


async def run_agent(user_message: str, session_id: str) -> dict:
    orchestrator = create_orchestrator()

    runner = Runner(
        agent=orchestrator,
        app_name="petal",
        session_service=_session_service,
    )

    session = await _session_service.create_session(
        app_name="petal",
        user_id=session_id,
        session_id=session_id,
    )

    content = types.Content(
        role="user",
        parts=[types.Part(text=user_message)],
    )

    result_text = ""
    agents_invoked = []

    async for event in runner.run_async(
        user_id=session_id,
        session_id=session_id,
        new_message=content,
    ):
        if hasattr(event, "is_final_response") and event.is_final_response():
            if event.content and event.content.parts:
                result_text = event.content.parts[0].text
        if hasattr(event, "agent_name") and event.agent_name:
            if event.agent_name not in agents_invoked:
                agents_invoked.append(event.agent_name)

    return {
        "reply": result_text,
        "agents_invoked": agents_invoked,
        "tool_calls": [],
        "session_id": session_id,
    }
```

### Task 13: Chat API Route

**Files:**
- Create: `backend/api/routes/chat.py`

- [ ] **Step 1: Create api/routes/chat.py**

Create `backend/api/routes/chat.py`:

```python
from fastapi import APIRouter, Depends, HTTPException
import time

from ...agents.orchestrator import run_agent
from ...api.middleware import get_current_user
from ...db.models import ChatRequest, ChatResponse, ToolCall

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat(
    req: ChatRequest,
    user: dict = Depends(get_current_user),
):
    start = time.time()
    session_id = req.session_id or f"sess_{user['user_id']}_{int(start)}"

    try:
        result = await run_agent(req.message, session_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    latency_ms = int((time.time() - start) * 1000)
    return ChatResponse(
        reply=result["reply"],
        agents_invoked=result["agents_invoked"],
        tool_calls=[ToolCall(**tc) for tc in result.get("tool_calls", [])],
        session_id=session_id,
        latency_ms=latency_ms,
    )
```

### Task 14: CalAgent Definition + Calendar Routes

**Files:**
- Create: `backend/agents/cal_agent.py`
- Create: `backend/api/routes/calendar.py`
- Create: `backend/api/routes/agents.py`

- [ ] **Step 1: Create agents/cal_agent.py**

Create `backend/agents/cal_agent.py`:

```python
from google.adk.agents import LlmAgent

from ..config import settings

CAL_AGENT_INSTRUCTION = """
You are PETAL's CalAgent. You manage the user's Google Calendar via MCP.

When creating events:
- Always suggest a Google Meet link for meetings
- Check for conflicts before scheduling
- Use find_free_slots when the user doesn't specify a time

Always confirm the event details including time, date, and any generated links.
"""

cal_agent = LlmAgent(
    name="cal_agent",
    model=settings.GEMINI_MODEL,
    description="Manages Google Calendar events via MCP",
    instruction=CAL_AGENT_INSTRUCTION,
)
```

- [ ] **Step 2: Create api/routes/calendar.py**

Create `backend/api/routes/calendar.py`:

```python
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from typing import Optional

from ...db.supabase import get_db, CalendarEventModel
from ...api.middleware import get_current_user
from ...db.models import CalendarEventCreate, CalendarEvent
import uuid

router = APIRouter()


@router.get("/calendar/events", response_model=list[CalendarEvent])
async def get_events(
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    query = select(CalendarEventModel).where(
        CalendarEventModel.user_id == uuid.UUID(user["user_id"])
    )
    if start:
        query = query.where(CalendarEventModel.start_time >= datetime.fromisoformat(start))
    if end:
        query = query.where(CalendarEventModel.end_time <= datetime.fromisoformat(end))
    query = query.order_by(CalendarEventModel.start_time.asc())
    result = await db.execute(query)
    events = result.scalars().all()
    return [_event_to_dict(e) for e in events]


@router.post("/calendar/events", response_model=CalendarEvent, status_code=201)
async def create_event(
    data: CalendarEventCreate,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    event_id = uuid.uuid4()
    event = CalendarEventModel(
        id=event_id,
        user_id=uuid.UUID(user["user_id"]),
        title=data.title,
        start_time=data.start_time,
        end_time=data.end_time,
        location=data.location,
        attendees=data.attendees,
        created_by_agent=True,
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return _event_to_dict(event)


def _event_to_dict(event: CalendarEventModel) -> dict:
    return {
        "id": str(event.id),
        "user_id": str(event.user_id),
        "title": event.title,
        "start_time": event.start_time.isoformat(),
        "end_time": event.end_time.isoformat(),
        "location": event.location,
        "meet_link": event.meet_link,
        "attendees": event.attendees or [],
        "google_event_id": event.google_event_id,
        "created_by_agent": event.created_by_agent,
        "created_at": event.created_at.isoformat(),
    }
```

- [ ] **Step 3: Create api/routes/agents.py**

Create `backend/api/routes/agents.py`:

```python
from fastapi import APIRouter

router = APIRouter()

AGENT_STATUSES = {
    "orchestrator": {"name": "Orchestrator", "status": "idle", "color": "#ff3b30"},
    "task_agent": {"name": "TaskAgent", "status": "idle", "color": "#007aff"},
    "cal_agent": {"name": "CalAgent", "status": "idle", "color": "#34c759"},
    "info_agent": {"name": "InfoAgent", "status": "idle", "color": "#ff9500"},
}


@router.get("/agents/status")
async def get_agents_status():
    return {"agents": list(AGENT_STATUSES.values())}
```

### Task 15: Frontend Skeleton + Auth + Brutalist CSS

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/tsconfig.json`
- Create: `frontend/index.html`
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/App.tsx`
- Create: `frontend/src/styles/brutalist.css`
- Create: `frontend/src/utils/api.ts`
- Create: `frontend/src/utils/supabase.ts`
- Create: `frontend/src/hooks/useAuth.ts`
- Create: `frontend/src/hooks/useAgents.ts`
- Create: `frontend/src/store/index.ts`
- Create: `frontend/src/pages/LoginPage.tsx`
- Create: `frontend/src/components/AgentStatusBar.tsx`
- Create: `frontend/src/components/ActivityTicker.tsx`

- [ ] **Step 1: Create frontend/package.json**

Create `frontend/package.json`:

```json
{
  "name": "petal-frontend",
  "private": true,
  "version": "2.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "^1.7.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.23.0",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.4.0",
    "vite": "^5.2.0"
  }
}
```

- [ ] **Step 2: Create frontend/vite.config.ts**

Create `frontend/vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
});
```

- [ ] **Step 3: Create frontend/tsconfig.json**

Create `frontend/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Create frontend/index.html**

Create `frontend/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>PETAL — Multi-Agent Workspace</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Create frontend/src/styles/brutalist.css**

Create `frontend/src/styles/brutalist.css`:

```css
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  border-radius: 0;
}

:root {
  --bg: #f5f5f0;
  --text: #1a1a1a;
  --border: #1a1a1a;
  --white: #ffffff;
  --orchestrator: #ff3b30;
  --task-agent: #007aff;
  --cal-agent: #34c759;
  --info-agent: #ff9500;
  --priority-high: #ff3b30;
  --priority-medium: #ff9500;
  --priority-low: #34c759;
  --border-width: 3px;
  --shadow: 4px 4px 0px #1a1a1a;
}

body {
  font-family: 'JetBrains Mono', monospace;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  min-height: 100vh;
}

h1, h2, h3, h4, h5, h6 {
  font-family: 'Space Mono', monospace;
  font-weight: 700;
}

a {
  color: inherit;
  text-decoration: none;
}

button, .btn {
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  padding: 8px 16px;
  background: var(--white);
  color: var(--text);
  border: var(--border-width) solid var(--border);
  box-shadow: var(--shadow);
  cursor: pointer;
  transition: all 0.1s ease;
}

button:hover, .btn:hover {
  background: var(--text);
  color: var(--white);
  box-shadow: 2px 2px 0px #1a1a1a;
  transform: translate(2px, 2px);
}

button:active {
  box-shadow: none;
  transform: translate(4px, 4px);
}

input, textarea, select {
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  padding: 8px 12px;
  background: var(--white);
  color: var(--text);
  border: var(--border-width) solid var(--border);
  outline: none;
  width: 100%;
}

input:focus, textarea:focus, select:focus {
  border-color: var(--task-agent);
}

.card {
  background: var(--white);
  border: var(--border-width) solid var(--border);
  box-shadow: var(--shadow);
  padding: 16px;
}

.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.nav-bar {
  display: flex;
  gap: 0;
  border-top: var(--border-width) solid var(--border);
  background: var(--white);
}

.nav-bar a {
  flex: 1;
  padding: 12px;
  text-align: center;
  border-right: var(--border-width) solid var(--border);
  font-weight: 700;
  font-size: 14px;
}

.nav-bar a:last-child {
  border-right: none;
}

.nav-bar a:hover {
  background: var(--text);
  color: var(--white);
}

.nav-bar a.active {
  background: var(--text);
  color: var(--white);
}

/* Agent Status Bar */
.agent-status-bar {
  display: flex;
  gap: 16px;
  padding: 8px 16px;
  background: var(--white);
  border-bottom: var(--border-width) solid var(--border);
  font-size: 12px;
  font-weight: 700;
}

.agent-status-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border: 2px solid var(--border);
}

.status-dot.idle {
  background: var(--white);
}

.status-dot.working {
  background: currentColor;
  animation: pulse 1.5s infinite;
}

.status-dot.error {
  background: var(--priority-high);
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

/* Activity Ticker */
.activity-ticker {
  overflow: hidden;
  background: var(--text);
  color: var(--white);
  padding: 6px 0;
  font-size: 12px;
  border-bottom: var(--border-width) solid var(--border);
}

.ticker-content {
  display: inline-block;
  white-space: nowrap;
  animation: ticker-scroll 30s linear infinite;
  padding-left: 100%;
}

@keyframes ticker-scroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(-100%); }
}

/* Chat */
.chat-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 200px);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chat-message {
  max-width: 80%;
  padding: 12px 16px;
}

.chat-message.user {
  align-self: flex-end;
  background: var(--text);
  color: var(--white);
}

.chat-message.assistant {
  align-self: flex-start;
  background: var(--white);
  border: var(--border-width) solid var(--border);
  box-shadow: var(--shadow);
}

.chat-message .agents-invoked {
  font-size: 11px;
  margin-top: 8px;
  opacity: 0.7;
}

.chat-input-area {
  display: flex;
  gap: 8px;
  padding: 16px;
  border-top: var(--border-width) solid var(--border);
  background: var(--white);
}

.chat-input-area input {
  flex: 1;
}

/* Kanban */
.kanban-board {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  height: calc(100vh - 260px);
}

.kanban-column {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: var(--border-width) solid var(--border);
  background: var(--bg);
  overflow-y: auto;
}

.kanban-column-header {
  font-family: 'Space Mono', monospace;
  font-weight: 700;
  font-size: 14px;
  padding: 8px;
  text-align: center;
  border-bottom: var(--border-width) solid var(--border);
  margin-bottom: 8px;
  text-transform: uppercase;
}

.kanban-card {
  padding: 12px;
  background: var(--white);
  border: var(--border-width) solid var(--border);
  box-shadow: 2px 2px 0px var(--border);
  cursor: grab;
  transition: transform 0.1s, box-shadow 0.1s;
}

.kanban-card:hover {
  box-shadow: 4px 4px 0px var(--border);
}

.kanban-card.dragging {
  opacity: 0.5;
  transform: rotate(2deg);
  box-shadow: 6px 6px 0px var(--border);
}

.kanban-card .card-title {
  font-weight: 700;
  font-size: 13px;
  margin-bottom: 4px;
}

.kanban-card .card-meta {
  font-size: 11px;
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
}

.priority-badge {
  display: inline-block;
  padding: 2px 6px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  border: 2px solid var(--border);
}

.priority-badge.high { background: var(--priority-high); color: var(--white); }
.priority-badge.medium { background: var(--priority-medium); color: var(--white); }
.priority-badge.low { background: var(--priority-low); color: var(--white); }

/* Calendar */
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  border: var(--border-width) solid var(--border);
}

.calendar-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border: var(--border-width) solid var(--border);
  margin-bottom: 2px;
}

.calendar-header-cell {
  padding: 8px;
  text-align: center;
  font-weight: 700;
  font-size: 12px;
  background: var(--text);
  color: var(--white);
  border-right: 2px solid var(--bg);
}

.calendar-cell {
  min-height: 100px;
  padding: 8px;
  border: 2px solid var(--border);
  background: var(--white);
  font-size: 12px;
}

.calendar-cell.today {
  background: var(--bg);
  border-width: var(--border-width);
}

.calendar-event {
  padding: 2px 4px;
  margin-top: 4px;
  font-size: 11px;
  border-left: 3px solid var(--task-agent);
  background: var(--bg);
}

/* Knowledge Base */
.knowledge-layout {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 16px;
  height: calc(100vh - 260px);
}

.note-list {
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.note-item {
  padding: 12px;
  cursor: pointer;
  border: var(--border-width) solid var(--border);
  background: var(--white);
}

.note-item:hover, .note-item.active {
  background: var(--text);
  color: var(--white);
}

.note-item .note-title {
  font-weight: 700;
  font-size: 13px;
}

.note-item .note-date {
  font-size: 11px;
  opacity: 0.7;
  margin-top: 4px;
}

.note-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.note-editor textarea {
  flex: 1;
  resize: none;
  font-size: 14px;
  line-height: 1.8;
}

/* Login */
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--bg);
}

.login-card {
  width: 400px;
  padding: 32px;
}

.login-card h1 {
  font-size: 32px;
  margin-bottom: 8px;
}

.login-card p {
  margin-bottom: 24px;
  font-size: 14px;
  opacity: 0.7;
}

.login-card .form-group {
  margin-bottom: 16px;
}

.login-card label {
  display: block;
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 4px;
  text-transform: uppercase;
}

.login-card input {
  margin-bottom: 8px;
}

.login-card button {
  width: 100%;
  padding: 12px;
  font-size: 16px;
  font-weight: 700;
}

/* Utility */
.tag {
  display: inline-block;
  padding: 2px 6px;
  font-size: 10px;
  border: 2px solid var(--border);
  margin-right: 4px;
}

.search-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.search-bar input {
  flex: 1;
}

.empty-state {
  text-align: center;
  padding: 48px;
  opacity: 0.5;
}
```

- [ ] **Step 6: Create frontend/src/utils/api.ts**

Create `frontend/src/utils/api.ts`:

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1',
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('petal_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  agents_invoked?: string[];
  timestamp: Date;
}

export interface ToolCall {
  agent: string;
  tool: string;
  result: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'todo' | 'in_progress' | 'done';
  tags: string[];
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  title: string;
  body: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface AgentStatus {
  name: string;
  status: 'idle' | 'working' | 'error';
  color: string;
}

export const sendMessage = async (message: string, sessionId?: string) => {
  const { data } = await api.post('/chat', { message, session_id: sessionId });
  return data;
};

export const getTasks = () => api.get<Task[]>('/tasks').then(r => r.data);
export const createTask = (task: { title: string; description?: string; priority?: string; tags?: string[]; due_date?: string }) =>
  api.post<Task>('/tasks', task).then(r => r.data);
export const updateTask = (id: string, updates: Partial<Task>) =>
  api.patch<Task>(`/tasks/${id}`, updates).then(r => r.data);
export const deleteTask = (id: string) =>
  api.delete(`/tasks/${id}`);

export const getNotes = () => api.get<Note[]>('/notes').then(r => r.data);
export const createNote = (note: { title: string; body?: string; tags?: string[] }) =>
  api.post<Note>('/notes', note).then(r => r.data);
export const searchNotes = (q: string) =>
  api.get(`/notes/search?q=${encodeURIComponent(q)}`).then(r => r.data);

export const getEvents = (start?: string, end?: string) => {
  const params = new URLSearchParams();
  if (start) params.set('start', start);
  if (end) params.set('end', end);
  return api.get(`/calendar/events?${params}`).then(r => r.data);
};

export const getAgentsStatus = () =>
  api.get<{ agents: AgentStatus[] }>('/agents/status').then(r => r.data);

export default api;
```

- [ ] **Step 7: Create frontend/src/utils/supabase.ts**

Create `frontend/src/utils/supabase.ts`:

```typescript
// Supabase client — used for auth and realtime subscriptions
// For local dev without Supabase, we use direct JWT auth via the API

export function setAuthToken(token: string) {
  localStorage.setItem('petal_token', token);
}

export function getAuthToken(): string | null {
  return localStorage.getItem('petal_token');
}

export function clearAuthToken() {
  localStorage.removeItem('petal_token');
}

export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

// For dev mode: generate a test JWT token
export async function devLogin(userId: string = '00000000-0000-0000-0000-000000000001'): Promise<string> {
  // In production, this would call Supabase Auth
  // For dev, we use a simple token that the backend accepts with the dev JWT_SECRET
  const token = btoa(JSON.stringify({ sub: userId, email: 'dev@petal.local' }));
  setAuthToken(token);
  return token;
}
```

- [ ] **Step 8: Create frontend/src/hooks/useAuth.ts**

Create `frontend/src/hooks/useAuth.ts`:

```typescript
import { useState, useEffect } from 'react';
import { isAuthenticated, getAuthToken, devLogin, clearAuthToken } from '../utils/supabase';

export function useAuth() {
  const [authenticated, setAuthenticated] = useState(isAuthenticated());
  const [token, setToken] = useState<string | null>(getAuthToken());

  useEffect(() => {
    setAuthenticated(isAuthenticated());
    setToken(getAuthToken());
  }, []);

  const login = async () => {
    const t = await devLogin();
    setToken(t);
    setAuthenticated(true);
  };

  const logout = () => {
    clearAuthToken();
    setToken(null);
    setAuthenticated(false);
  };

  return { authenticated, token, login, logout };
}
```

- [ ] **Step 9: Create frontend/src/hooks/useAgents.ts**

Create `frontend/src/hooks/useAgents.ts`:

```typescript
import { useState, useEffect } from 'react';
import { getAgentsStatus, AgentStatus } from '../utils/api';

export function useAgents() {
  const [agents, setAgents] = useState<AgentStatus[]>([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getAgentsStatus();
        setAgents(data.agents);
      } catch {
        // Silently fail — agent status is non-critical
      }
    };

    fetch();
    const interval = setInterval(fetch, 5000);
    return () => clearInterval(interval);
  }, []);

  return { agents };
}
```

- [ ] **Step 10: Create frontend/src/store/index.ts**

Create `frontend/src/store/index.ts`:

```typescript
import { create } from 'zustand';
import { ChatMessage, Task, Note } from '../utils/api';

interface AppState {
  sessionId: string | null;
  setSessionId: (id: string) => void;
  messages: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;
  clearMessages: () => void;
  tickerItems: string[];
  addTickerItem: (item: string) => void;
}

export const useStore = create<AppState>((set) => ({
  sessionId: null,
  setSessionId: (id) => set({ sessionId: id }),

  messages: [],
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  clearMessages: () => set({ messages: [] }),

  tickerItems: [],
  addTickerItem: (item) => set((state) => ({
    tickerItems: [...state.tickerItems.slice(-20), item],
  })),
}));
```

- [ ] **Step 11: Create frontend/src/components/AgentStatusBar.tsx**

Create `frontend/src/components/AgentStatusBar.tsx`:

```typescript
import { useAgents } from '../hooks/useAgents';

export function AgentStatusBar() {
  const { agents } = useAgents();

  return (
    <div className="agent-status-bar">
      {agents.map((agent) => (
        <div key={agent.name} className="agent-status-item">
          <span
            className={`status-dot ${agent.status}`}
            style={{ color: agent.color }}
          />
          <span>{agent.name}</span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 12: Create frontend/src/components/ActivityTicker.tsx**

Create `frontend/src/components/ActivityTicker.tsx`:

```typescript
import { useStore } from '../store';

export function ActivityTicker() {
  const tickerItems = useStore((s) => s.tickerItems);

  if (tickerItems.length === 0) {
    return (
      <div className="activity-ticker">
        <span style={{ paddingLeft: '16px', opacity: 0.5 }}>
          PETAL — Multi-Agent Workspace — Awaiting input...
        </span>
      </div>
    );
  }

  return (
    <div className="activity-ticker">
      <div className="ticker-content">
        {tickerItems.map((item, i) => (
          <span key={i} style={{ marginRight: '48px' }}>
            → {item}
          </span>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 13: Create frontend/src/pages/LoginPage.tsx**

Create `frontend/src/pages/LoginPage.tsx`:

```typescript
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const { login } = useAuth();

  return (
    <div className="login-page">
      <div className="login-card card">
        <h1>PETAL</h1>
        <p>Personalized Execution & Task Agent Layer</p>
        <button onClick={login} style={{ width: '100%', padding: '12px' }}>
          ENTER WORKSPACE
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 14: Create frontend/src/App.tsx**

Create `frontend/src/App.tsx`:

```typescript
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { AgentStatusBar } from './components/AgentStatusBar';
import { ActivityTicker } from './components/ActivityTicker';
import { LoginPage } from './pages/LoginPage';
import { ChatPage } from './pages/ChatPage';
import { TasksPage } from './pages/TasksPage';
import { CalendarPage } from './pages/CalendarPage';
import { KnowledgePage } from './pages/KnowledgePage';
import './styles/brutalist.css';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { authenticated } = useAuth();
  if (!authenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="layout">
      <AgentStatusBar />
      <ActivityTicker />
      <div className="content">{children}</div>
      <nav className="nav-bar">
        <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>
          CHAT
        </NavLink>
        <NavLink to="/tasks" className={({ isActive }) => isActive ? 'active' : ''}>
          TASKS
        </NavLink>
        <NavLink to="/calendar" className={({ isActive }) => isActive ? 'active' : ''}>
          CALENDAR
        </NavLink>
        <NavLink to="/knowledge" className={({ isActive }) => isActive ? 'active' : ''}>
          KNOWLEDGE
        </NavLink>
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <ChatPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tasks"
          element={
            <ProtectedRoute>
              <Layout>
                <TasksPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <Layout>
                <CalendarPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/knowledge"
          element={
            <ProtectedRoute>
              <Layout>
                <KnowledgePage />
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
```

- [ ] **Step 15: Create frontend/src/main.tsx**

Create `frontend/src/main.tsx`:

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 16: Verify frontend builds**

Run: `cd /Users/shikhar/Petal/frontend && npm install && npm run build`
Expected: Build succeeds (may have type errors for missing page files — that's expected, we'll create them next)

- [ ] **Step 17: Commit**

```bash
cd /Users/shikhar/Petal
git add -A
git commit -m "feat: orchestrator, chat endpoint, frontend skeleton, brutalist CSS, auth"
```

---

## Phase 5: Frontend Pages

### Task 16: Chat Page

**Files:**
- Create: `frontend/src/pages/ChatPage.tsx`
- Create: `frontend/src/components/ChatWindow.tsx`

- [ ] **Step 1: Create frontend/src/components/ChatWindow.tsx**

Create `frontend/src/components/ChatWindow.tsx`:

```typescript
import { useEffect, useRef } from 'react';
import { ChatMessage } from '../utils/api';

interface ChatWindowProps {
  messages: ChatMessage[];
}

export function ChatWindow({ messages }: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="chat-messages">
      {messages.map((msg, i) => (
        <div key={i} className={`chat-message ${msg.role}`}>
          <div>{msg.content}</div>
          {msg.agents_invoked && msg.agents_invoked.length > 0 && (
            <div className="agents-invoked">
              Agents: {msg.agents_invoked.join(', ')}
            </div>
          )}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
```

- [ ] **Step 2: Create frontend/src/pages/ChatPage.tsx**

Create `frontend/src/pages/ChatPage.tsx`:

```typescript
import { useState } from 'react';
import { sendMessage } from '../utils/api';
import { useStore } from '../store';
import { ChatWindow } from '../components/ChatWindow';

export function ChatPage() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messages = useStore((s) => s.messages);
  const addMessage = useStore((s) => s.addMessage);
  const sessionId = useStore((s) => s.sessionId);
  const setSessionId = useStore((s) => s.setSessionId);
  const addTickerItem = useStore((s) => s.addTickerItem);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setLoading(true);

    addMessage({
      role: 'user',
      content: userMsg,
      timestamp: new Date(),
    });

    try {
      const response = await sendMessage(userMsg, sessionId || undefined);
      if (!sessionId) setSessionId(response.session_id);

      addMessage({
        role: 'assistant',
        content: response.reply,
        agents_invoked: response.agents_invoked,
        timestamp: new Date(),
      });

      if (response.agents_invoked.length > 0) {
        addTickerItem(
          `Orchestrator invoked: ${response.agents_invoked.join(', ')}`
        );
      }
    } catch (err) {
      addMessage({
        role: 'assistant',
        content: 'Error: Failed to get response from the orchestrator.',
        timestamp: new Date(),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <ChatWindow messages={messages} />
      <div className="chat-input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask PETAL anything..."
          disabled={loading}
        />
        <button onClick={handleSend} disabled={loading}>
          {loading ? 'THINKING...' : 'SEND'}
        </button>
      </div>
    </div>
  );
}
```

### Task 17: Tasks Page (Kanban Board)

**Files:**
- Create: `frontend/src/pages/TasksPage.tsx`
- Create: `frontend/src/components/KanbanBoard.tsx`
- Create: `frontend/src/components/KanbanCard.tsx`
- Create: `frontend/src/hooks/useTasks.ts`

- [ ] **Step 1: Create frontend/src/hooks/useTasks.ts**

Create `frontend/src/hooks/useTasks.ts`:

```typescript
import { useState, useEffect, useCallback } from 'react';
import { getTasks, createTask, updateTask, deleteTask, Task } from '../utils/api';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    try {
      const data = await getTasks();
      setTasks(data);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const addTask = async (task: { title: string; description?: string; priority?: string; tags?: string[] }) => {
    const created = await createTask(task);
    setTasks((prev) => [created, ...prev]);
    return created;
  };

  const moveTask = async (id: string, status: Task['status']) => {
    const updated = await updateTask(id, { status });
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
  };

  const removeTask = async (id: string) => {
    await deleteTask(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  return { tasks, loading, fetchTasks, addTask, moveTask, removeTask };
}
```

- [ ] **Step 2: Create frontend/src/components/KanbanCard.tsx**

Create `frontend/src/components/KanbanCard.tsx`:

```typescript
import { Task } from '../utils/api';

interface KanbanCardProps {
  task: Task;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
}

export function KanbanCard({ task, onDragStart }: KanbanCardProps) {
  return (
    <div
      className="kanban-card"
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
    >
      <div className="card-title">{task.title}</div>
      {task.description && (
        <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>
          {task.description.substring(0, 80)}
          {task.description.length > 80 ? '...' : ''}
        </div>
      )}
      <div className="card-meta">
        <span className={`priority-badge ${task.priority}`}>
          {task.priority}
        </span>
        {task.due_date && (
          <span>{new Date(task.due_date).toLocaleDateString()}</span>
        )}
      </div>
      {task.tags.length > 0 && (
        <div style={{ marginTop: '8px' }}>
          {task.tags.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create frontend/src/components/KanbanBoard.tsx**

Create `frontend/src/components/KanbanBoard.tsx`:

```typescript
import { useState } from 'react';
import { Task } from '../utils/api';
import { KanbanCard } from './KanbanCard';

interface KanbanBoardProps {
  tasks: Task[];
  onMove: (id: string, status: Task['status']) => void;
  onDelete: (id: string) => void;
}

const COLUMNS: { status: Task['status']; label: string }[] = [
  { status: 'todo', label: 'TODO' },
  { status: 'in_progress', label: 'IN PROGRESS' },
  { status: 'done', label: 'DONE' },
];

export function KanbanBoard({ tasks, onMove, onDelete }: KanbanBoardProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const handleDragStart = (_e: React.DragEvent, taskId: string) => {
    setDraggedId(taskId);
  };

  const handleDrop = (_e: React.DragEvent, status: Task['status']) => {
    if (draggedId) {
      onMove(draggedId, status);
      setDraggedId(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="kanban-board">
      {COLUMNS.map((col) => (
        <div
          key={col.status}
          className="kanban-column"
          onDrop={(e) => handleDrop(e, col.status)}
          onDragOver={handleDragOver}
        >
          <div className="kanban-column-header">
            {col.label} ({tasks.filter((t) => t.status === col.status).length})
          </div>
          {tasks
            .filter((t) => t.status === col.status)
            .map((task) => (
              <KanbanCard
                key={task.id}
                task={task}
                onDragStart={handleDragStart}
              />
            ))}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Create frontend/src/pages/TasksPage.tsx**

Create `frontend/src/pages/TasksPage.tsx`:

```typescript
import { useState } from 'react';
import { useTasks } from '../hooks/useTasks';
import { KanbanBoard } from '../components/KanbanBoard';

export function TasksPage() {
  const { tasks, loading, addTask, moveTask, removeTask } = useTasks();
  const [newTitle, setNewTitle] = useState('');

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    await addTask({ title: newTitle.trim(), priority: 'medium' });
    setNewTitle('');
  };

  if (loading) return <div className="empty-state">Loading tasks...</div>;

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          placeholder="New task title..."
          style={{ maxWidth: '400px' }}
        />
        <button onClick={handleCreate}>ADD TASK</button>
      </div>
      <KanbanBoard tasks={tasks} onMove={moveTask} onDelete={removeTask} />
    </div>
  );
}
```

### Task 18: Calendar Page

**Files:**
- Create: `frontend/src/pages/CalendarPage.tsx`
- Create: `frontend/src/components/CalendarView.tsx`

- [ ] **Step 1: Create frontend/src/components/CalendarView.tsx**

Create `frontend/src/components/CalendarView.tsx`:

```typescript
interface CalendarEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  location?: string;
  meet_link?: string;
}

interface CalendarViewProps {
  events: CalendarEvent[];
  currentDate: Date;
}

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export function CalendarView({ events, currentDate }: CalendarViewProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter((e) => e.start_time.startsWith(dateStr));
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h2>
          {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h2>
      </div>
      <div className="calendar-header">
        {DAYS.map((d) => (
          <div key={d} className="calendar-header-cell">
            {d}
          </div>
        ))}
      </div>
      <div className="calendar-grid">
        {cells.map((day, i) => {
          const isToday =
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear();
          const dayEvents = day ? getEventsForDay(day) : [];

          return (
            <div key={i} className={`calendar-cell ${isToday ? 'today' : ''}`}>
              {day && (
                <>
                  <div style={{ fontWeight: 700, marginBottom: '4px' }}>{day}</div>
                  {dayEvents.map((ev) => (
                    <div key={ev.id} className="calendar-event">
                      {ev.title}
                    </div>
                  ))}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create frontend/src/pages/CalendarPage.tsx**

Create `frontend/src/pages/CalendarPage.tsx`:

```typescript
import { useState, useEffect } from 'react';
import { getEvents } from '../utils/api';
import { CalendarView } from '../components/CalendarView';

export function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const start = new Date(year, month, 1).toISOString();
    const end = new Date(year, month + 1, 0).toISOString();

    getEvents(start, end)
      .then(setEvents)
      .catch(() => setEvents([]));
  }, [currentDate]);

  return (
    <CalendarView events={events} currentDate={currentDate} />
  );
}
```

### Task 19: Knowledge Page

**Files:**
- Create: `frontend/src/pages/KnowledgePage.tsx`
- Create: `frontend/src/components/NoteEditor.tsx`
- Create: `frontend/src/components/NoteSearch.tsx`
- Create: `frontend/src/hooks/useNotes.ts`

- [ ] **Step 1: Create frontend/src/hooks/useNotes.ts**

Create `frontend/src/hooks/useNotes.ts`:

```typescript
import { useState, useEffect, useCallback } from 'react';
import { getNotes, createNote, Note } from '../utils/api';

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotes = useCallback(async () => {
    try {
      const data = await getNotes();
      setNotes(data);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const addNote = async (note: { title: string; body?: string; tags?: string[] }) => {
    const created = await createNote(note);
    setNotes((prev) => [created, ...prev]);
    return created;
  };

  return { notes, loading, fetchNotes, addNote };
}
```

- [ ] **Step 2: Create frontend/src/components/NoteEditor.tsx**

Create `frontend/src/components/NoteEditor.tsx`:

```typescript
import { useState } from 'react';
import { Note } from '../utils/api';

interface NoteEditorProps {
  note?: Note;
  onSave: (title: string, body: string) => void;
}

export function NoteEditor({ note, onSave }: NoteEditorProps) {
  const [title, setTitle] = useState(note?.title || '');
  const [body, setBody] = useState(note?.body || '');

  return (
    <div className="note-editor">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Note title..."
        style={{ fontSize: '18px', fontWeight: 700 }}
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write your note..."
      />
      <button onClick={() => onSave(title, body)}>SAVE NOTE</button>
    </div>
  );
}
```

- [ ] **Step 3: Create frontend/src/components/NoteSearch.tsx**

Create `frontend/src/components/NoteSearch.tsx`:

```typescript
import { useState } from 'react';
import { searchNotes, Note } from '../utils/api';

interface NoteSearchProps {
  onSelectNote: (note: Note) => void;
}

export function NoteSearch({ onSelectNote }: NoteSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const data = await searchNotes(query);
      setResults(data.results || []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div>
      <div className="search-bar">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search notes semantically..."
        />
        <button onClick={handleSearch} disabled={searching}>
          {searching ? 'SEARCHING...' : 'SEARCH'}
        </button>
      </div>
      {results.length > 0 && (
        <div className="note-list">
          {results.map((note: any) => (
            <div
              key={note.id}
              className="note-item"
              onClick={() => onSelectNote(note)}
            >
              <div className="note-title">{note.title}</div>
              <div className="note-date">
                {new Date(note.updated_at).toLocaleDateString()} ·{' '}
                {Math.round(note.similarity * 100)}% match
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create frontend/src/pages/KnowledgePage.tsx**

Create `frontend/src/pages/KnowledgePage.tsx`:

```typescript
import { useState } from 'react';
import { useNotes } from '../hooks/useNotes';
import { NoteEditor } from '../components/NoteEditor';
import { NoteSearch } from '../components/NoteSearch';
import { Note } from '../utils/api';

export function KnowledgePage() {
  const { notes, loading, addNote } = useNotes();
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  const handleSave = async (title: string, body: string) => {
    if (!title.trim()) return;
    await addNote({ title: title.trim(), body, tags: [] });
    setSelectedNote(null);
  };

  if (loading) return <div className="empty-state">Loading notes...</div>;

  return (
    <div className="knowledge-layout">
      <div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button onClick={() => { setSelectedNote(null); setShowSearch(false); }}>
            + NEW
          </button>
          <button onClick={() => setShowSearch(!showSearch)}>
            {showSearch ? 'LIST' : 'SEARCH'}
          </button>
        </div>
        {showSearch ? (
          <NoteSearch onSelectNote={setSelectedNote} />
        ) : (
          <div className="note-list">
            {notes.map((note) => (
              <div
                key={note.id}
                className={`note-item ${selectedNote?.id === note.id ? 'active' : ''}`}
                onClick={() => setSelectedNote(note)}
              >
                <div className="note-title">{note.title}</div>
                <div className="note-date">
                  {new Date(note.updated_at).toLocaleDateString()}
                </div>
              </div>
            ))}
            {notes.length === 0 && (
              <div className="empty-state">No notes yet</div>
            )}
          </div>
        )}
      </div>
      <NoteEditor note={selectedNote || undefined} onSave={handleSave} />
    </div>
  );
}
```

- [ ] **Step 5: Verify full frontend build**

Run: `cd /Users/shikhar/Petal/frontend && npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 6: Commit**

```bash
cd /Users/shikhar/Petal
git add -A
git commit -m "feat: all frontend pages — Chat, Kanban, Calendar, Knowledge Base"
```

---

## Phase 6: Final Polish + Tests

### Task 20: Wire Everything Together + Integration Tests

**Files:**
- Modify: `backend/main.py` (register all agents)
- Create: `backend/tests/test_task_tools.py`
- Create: `backend/tests/test_notes_tools.py`

- [ ] **Step 1: Create backend/tests/test_task_tools.py**

Create `backend/tests/test_task_tools.py`:

```python
import pytest
from datetime import datetime, timezone
import uuid

from backend.tools import task_tools


@pytest.mark.asyncio
async def test_create_and_list_task(db_session):
    user_id = str(uuid.uuid4())
    result = await task_tools.create_task(
        db_session, user_id, "Test task", priority="high", tags=["test"]
    )
    assert result["title"] == "Test task"
    assert result["priority"] == "high"

    tasks = await task_tools.list_tasks(db_session, user_id)
    assert len(tasks) == 1
    assert tasks[0]["title"] == "Test task"


@pytest.mark.asyncio
async def test_update_task(db_session):
    user_id = str(uuid.uuid4())
    created = await task_tools.create_task(db_session, user_id, "Update test")
    task_id = created["id"]

    updated = await task_tools.update_task(db_session, user_id, task_id, status="done")
    assert updated is not None
    assert updated["status"] == "done"


@pytest.mark.asyncio
async def test_delete_task(db_session):
    user_id = str(uuid.uuid4())
    created = await task_tools.create_task(db_session, user_id, "Delete test")
    task_id = created["id"]

    deleted = await task_tools.delete_task(db_session, user_id, task_id)
    assert deleted is True

    tasks = await task_tools.list_tasks(db_session, user_id)
    assert len(tasks) == 0


@pytest.mark.asyncio
async def test_filter_tasks(db_session):
    user_id = str(uuid.uuid4())
    await task_tools.create_task(db_session, user_id, "High priority", priority="high")
    await task_tools.create_task(db_session, user_id, "Low priority", priority="low")

    high = await task_tools.list_tasks(db_session, user_id, priority="high")
    assert len(high) == 1
    assert high[0]["priority"] == "high"
```

- [ ] **Step 2: Create backend/tests/test_notes_tools.py**

Create `backend/tests/test_notes_tools.py`:

```python
import pytest
import uuid

from backend.tools import notes_tools


@pytest.mark.asyncio
async def test_create_and_list_note(db_session):
    user_id = str(uuid.uuid4())
    result = await notes_tools.save_note(
        db_session, user_id, "Test note", "Body content", ["test"]
    )
    assert result["title"] == "Test note"
    assert result["body"] == "Body content"

    notes = await notes_tools.list_notes(db_session, user_id)
    assert len(notes) == 1


@pytest.mark.asyncio
async def test_delete_note(db_session):
    user_id = str(uuid.uuid4())
    created = await notes_tools.save_note(db_session, user_id, "Delete me")
    note_id = created["id"]

    deleted = await notes_tools.delete_note(db_session, user_id, note_id)
    assert deleted is True

    notes = await notes_tools.list_notes(db_session, user_id)
    assert len(notes) == 0
```

- [ ] **Step 3: Run all backend tests**

Run: `cd /Users/shikhar/Petal && python -m pytest backend/tests/ -v`
Expected: All 10+ tests pass

- [ ] **Step 4: Final commit**

```bash
cd /Users/shikhar/Petal
git add -A
git commit -m "feat: integration tests, final polish — PETAL v2.0 complete"
```

---

## Quick Start Commands

```bash
# Start everything with Docker Compose
cd /Users/shikhar/Petal
docker compose up --build

# Backend: http://localhost:8080
# Frontend: http://localhost:5173
# Health check: curl http://localhost:8080/health

# Or run locally:
# Terminal 1: uvicorn backend.main:app --reload --port 8080
# Terminal 2: cd frontend && npm install && npm run dev
```
