# PETAL — Implementation Guide
**Version:** 1.0.0  
**Stack:** Python 3.12 · Google ADK · Gemini 2.0 Flash · GCP Cloud Run · Firestore · React

---

## 1. Technology Stack

| Layer | Technology | Reason |
|---|---|---|
| Agent Framework | Google ADK (Agent Development Kit) | Native Gemini integration, built-in MCP support |
| LLM | Gemini 2.0 Flash (Vertex AI) | Fast, cost-efficient, 1M token context |
| Backend Runtime | Python 3.12 + FastAPI | Async, type-safe, great ADK compatibility |
| Frontend | React 18 + Vite | Fast HMR, lightweight |
| Primary DB | Cloud Firestore | Realtime, serverless, ADK-native |
| Relational DB | Cloud SQL (PostgreSQL 15) | Complex queries, analytics |
| Deployment | GCP Cloud Run | Serverless containers, auto-scale |
| Auth | Firebase Auth + Google OAuth | Seamless Workspace integration |
| Secrets | GCP Secret Manager | Production secret management |
| CI/CD | Cloud Build + Artifact Registry | Native GCP pipeline |
| Monitoring | Cloud Logging + Cloud Trace | Distributed tracing for multi-agent calls |

---

## 2. Repository Structure

```
petal/
├── backend/
│   ├── main.py                    # FastAPI app entrypoint
│   ├── agents/
│   │   ├── orchestrator.py        # Primary ADK orchestrator agent
│   │   ├── task_agent.py          # TaskAgent definition
│   │   ├── cal_agent.py           # CalAgent definition
│   │   └── info_agent.py          # InfoAgent definition
│   ├── tools/
│   │   ├── task_tools.py          # Firestore task CRUD tools
│   │   ├── calendar_tools.py      # Google Calendar MCP tools
│   │   ├── gmail_tools.py         # Gmail MCP tools
│   │   └── notes_tools.py         # Notes/search tools
│   ├── api/
│   │   ├── routes/
│   │   │   ├── chat.py            # POST /chat endpoint
│   │   │   ├── tasks.py           # Task CRUD endpoints
│   │   │   ├── calendar.py        # Calendar endpoints
│   │   │   └── notes.py           # Notes endpoints
│   │   └── middleware.py          # Auth, CORS, rate limiting
│   ├── db/
│   │   ├── firestore.py           # Firestore client + helpers
│   │   └── sql.py                 # Cloud SQL client
│   └── config.py                  # Settings from env vars
├── frontend/
│   ├── src/
│   │   ├── components/            # UI components
│   │   ├── pages/                 # Page views
│   │   ├── hooks/                 # Custom React hooks
│   │   └── utils/                 # API client, helpers
│   ├── package.json
│   └── vite.config.ts
├── infrastructure/
│   ├── terraform/
│   │   ├── main.tf                # GCP resources
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── cloudbuild.yaml            # CI/CD pipeline
├── Dockerfile                     # Backend container
├── docker-compose.yml             # Local development
├── requirements.txt
└── .env.example
```

---

## 3. Backend Implementation

### 3.1 Install Dependencies

```bash
pip install google-adk google-cloud-firestore google-cloud-secret-manager \
    fastapi uvicorn python-dotenv google-auth firebase-admin \
    google-cloud-logging opentelemetry-sdk
```

### 3.2 Orchestrator Agent (`backend/agents/orchestrator.py`)

```python
from google.adk.agents import LlmAgent
from google.adk.tools.mcp_tool.mcp_toolset import MCPToolset, SseServerParams
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types
import google.genai as genai

from .task_agent import task_agent
from .cal_agent import cal_agent
from .info_agent import info_agent
from ..config import settings

ORCHESTRATOR_INSTRUCTION = """
You are PETAL's Orchestrator Agent — the primary coordinator in a multi-agent 
productivity workspace powered by Google ADK.

Your sub-agents:
- task_agent: Creates, updates, and manages tasks in Firestore
- cal_agent: Manages Google Calendar events via MCP
- info_agent: Stores and retrieves notes from the knowledge base

Workflow rules:
1. Analyze the user's request to determine which agents are needed
2. Delegate to sub-agents in the optimal order
3. Synthesize all results into a clear, actionable response
4. Show your orchestration steps (which agents you invoked and why)
5. For multi-step workflows, execute sequentially and handle failures gracefully

Always confirm what was accomplished and what the user should do next.
"""

def create_orchestrator() -> LlmAgent:
    # MCP Toolsets for Google Workspace
    gmail_toolset = MCPToolset(
        connection_params=SseServerParams(
            url="https://gmail.mcp.claude.com/mcp"
        )
    )
    gcal_toolset = MCPToolset(
        connection_params=SseServerParams(
            url="https://gcal.mcp.claude.com/mcp"
        )
    )

    orchestrator = LlmAgent(
        name="petal_orchestrator",
        model=settings.GEMINI_MODEL,  # "gemini-2.0-flash"
        description="Primary orchestrator that coordinates all PETAL sub-agents",
        instruction=ORCHESTRATOR_INSTRUCTION,
        sub_agents=[task_agent, cal_agent, info_agent],
        tools=[gmail_toolset, gcal_toolset],
    )
    return orchestrator


async def run_agent(user_message: str, session_id: str) -> dict:
    """Run the orchestrator with a user message."""
    orchestrator = create_orchestrator()
    session_service = InMemorySessionService()
    
    runner = Runner(
        agent=orchestrator,
        app_name="petal",
        session_service=session_service,
    )

    session = await session_service.create_session(
        app_name="petal",
        user_id=session_id,
        session_id=session_id,
    )

    content = types.Content(
        role="user",
        parts=[types.Part(text=user_message)]
    )

    result_text = ""
    agents_invoked = []
    tool_calls = []

    async for event in runner.run_async(
        user_id=session_id,
        session_id=session_id,
        new_message=content,
    ):
        if event.is_final_response():
            if event.content and event.content.parts:
                result_text = event.content.parts[0].text
        if hasattr(event, 'agent_name') and event.agent_name:
            if event.agent_name not in agents_invoked:
                agents_invoked.append(event.agent_name)
        if hasattr(event, 'tool_call'):
            tool_calls.append({
                "tool": event.tool_call.name,
                "result": str(event.tool_call.result)[:200]
            })

    return {
        "reply": result_text,
        "agents_invoked": agents_invoked,
        "tool_calls": tool_calls,
        "session_id": session_id,
    }
```

### 3.3 TaskAgent (`backend/agents/task_agent.py`)

```python
from google.adk.agents import LlmAgent
from ..tools.task_tools import (
    create_task, list_tasks, update_task, delete_task
)
from ..config import settings

TASK_AGENT_INSTRUCTION = """
You are PETAL's TaskAgent. You manage the user's task list in Firestore.

Capabilities:
- create_task: Create a new task with title, priority, due date, tags
- list_tasks: List tasks, optionally filtered by status/priority/tag
- update_task: Update task status, priority, or other fields
- delete_task: Remove a task

Priority levels: 'high', 'medium', 'low'
Status options: 'todo', 'in_progress', 'done'

Always confirm what action was taken and the task ID for reference.
"""

task_agent = LlmAgent(
    name="task_agent",
    model=settings.GEMINI_MODEL,
    description="Manages tasks — create, update, list, prioritize",
    instruction=TASK_AGENT_INSTRUCTION,
    tools=[create_task, list_tasks, update_task, delete_task],
)
```

### 3.4 Task Tools (`backend/tools/task_tools.py`)

```python
from google.adk.tools import FunctionTool
from google.cloud import firestore
from datetime import datetime, timezone
import uuid
from ..config import settings

db = firestore.AsyncClient(project=settings.GCP_PROJECT)

async def create_task(
    title: str,
    priority: str = "medium",
    due_date: str = None,
    tags: list[str] = None,
    description: str = ""
) -> dict:
    """Create a new task in Firestore.
    
    Args:
        title: Task title (required)
        priority: 'high', 'medium', or 'low'
        due_date: ISO 8601 date string (optional)
        tags: List of tag strings (optional)
        description: Detailed description (optional)
    
    Returns:
        dict with task_id and confirmation
    """
    task_id = str(uuid.uuid4())[:8]
    task = {
        "id": task_id,
        "title": title,
        "priority": priority,
        "status": "todo",
        "tags": tags or [],
        "description": description,
        "due_date": due_date,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "agent_created": True,
    }
    await db.collection("tasks").document(task_id).set(task)
    return {"task_id": task_id, "status": "created", "title": title}


async def list_tasks(
    status: str = None,
    priority: str = None,
    limit: int = 20
) -> list[dict]:
    """List tasks, optionally filtered."""
    query = db.collection("tasks")
    if status:
        query = query.where("status", "==", status)
    if priority:
        query = query.where("priority", "==", priority)
    query = query.limit(limit)
    docs = await query.get()
    return [doc.to_dict() for doc in docs]


async def update_task(task_id: str, **updates) -> dict:
    """Update task fields."""
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.collection("tasks").document(task_id).update(updates)
    return {"task_id": task_id, "status": "updated", "changes": list(updates.keys())}


async def delete_task(task_id: str) -> dict:
    """Delete a task."""
    await db.collection("tasks").document(task_id).delete()
    return {"task_id": task_id, "status": "deleted"}
```

### 3.5 FastAPI Chat Endpoint (`backend/api/routes/chat.py`)

```python
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from ...agents.orchestrator import run_agent
from ...api.middleware import get_current_user
import time

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    session_id: str = None

class ChatResponse(BaseModel):
    reply: str
    agents_invoked: list[str]
    tool_calls: list[dict]
    session_id: str
    latency_ms: int

@router.post("/chat", response_model=ChatResponse)
async def chat(
    req: ChatRequest,
    user=Depends(get_current_user)
):
    start = time.time()
    session_id = req.session_id or f"sess_{user.uid}_{int(start)}"
    
    try:
        result = await run_agent(req.message, session_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    latency_ms = int((time.time() - start) * 1000)
    return ChatResponse(**result, latency_ms=latency_ms)
```

### 3.6 Main App (`backend/main.py`)

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from .api.routes import chat, tasks, calendar, notes
from .config import settings
import google.cloud.logging

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Setup Cloud Logging
    client = google.cloud.logging.Client()
    client.setup_logging()
    yield

app = FastAPI(
    title="PETAL API",
    version="1.0.0",
    description="Multi-Agent Productivity Workspace",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/api/v1")
app.include_router(tasks.router, prefix="/api/v1")
app.include_router(calendar.router, prefix="/api/v1")
app.include_router(notes.router, prefix="/api/v1")

@app.get("/health")
async def health():
    return {"status": "ok", "service": "petal-api", "version": "1.0.0"}
```

---

## 4. Frontend Implementation

### 4.1 Setup

```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install axios react-query zustand react-router-dom
```

### 4.2 API Client (`frontend/src/utils/api.ts`)

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1',
  timeout: 30000,
});

// Attach Firebase auth token
api.interceptors.request.use(async (config) => {
  const token = await getFirebaseToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  agents_invoked?: string[];
  tool_calls?: ToolCall[];
  timestamp: Date;
}

export interface ToolCall {
  tool: string;
  result: string;
}

export const sendMessage = async (
  message: string,
  sessionId: string
): Promise<{ reply: string; agents_invoked: string[]; tool_calls: ToolCall[] }> => {
  const { data } = await api.post('/chat', { message, session_id: sessionId });
  return data;
};

export const getTasks = () => api.get('/tasks').then(r => r.data);
export const createTask = (task: Partial<Task>) => api.post('/tasks', task).then(r => r.data);
export const updateTask = (id: string, updates: Partial<Task>) => api.patch(`/tasks/${id}`, updates).then(r => r.data);
export const deleteTask = (id: string) => api.delete(`/tasks/${id}`).then(r => r.data);

export const getNotes = () => api.get('/notes').then(r => r.data);
export const searchNotes = (q: string) => api.get(`/notes/search?q=${encodeURIComponent(q)}`).then(r => r.data);

export const getEvents = (start: string, end: string) =>
  api.get(`/calendar/events?start=${start}&end=${end}`).then(r => r.data);
```

---

## 5. Configuration (`backend/config.py`)

```python
from pydantic_settings import BaseSettings
from typing import list

class Settings(BaseSettings):
    # GCP
    GCP_PROJECT: str
    GCP_REGION: str = "us-central1"
    
    # Gemini / Vertex AI
    GEMINI_MODEL: str = "gemini-2.0-flash"
    GOOGLE_CLOUD_PROJECT: str  # same as GCP_PROJECT, for Vertex
    
    # Firebase
    FIREBASE_PROJECT_ID: str
    
    # MCP Servers
    GMAIL_MCP_URL: str = "https://gmail.mcp.claude.com/mcp"
    GCAL_MCP_URL: str = "https://gcal.mcp.claude.com/mcp"
    
    # Security
    ALLOWED_ORIGINS: list[str] = ["http://localhost:5173"]
    SECRET_KEY: str
    
    # Rate limiting
    RATE_LIMIT_PER_MINUTE: int = 60

    class Config:
        env_file = ".env"

settings = Settings()
```

---

## 6. Docker & Deployment

### 6.1 Dockerfile

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend/

ENV PORT=8080
EXPOSE 8080

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "2"]
```

### 6.2 Deploy to GCP Cloud Run

```bash
# 1. Build and push to Artifact Registry
gcloud builds submit --tag gcr.io/$PROJECT_ID/petal-api

# 2. Deploy to Cloud Run
gcloud run deploy petal-api \
  --image gcr.io/$PROJECT_ID/petal-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GCP_PROJECT=$PROJECT_ID \
  --set-secrets "SECRET_KEY=petal-secret-key:latest" \
  --memory 2Gi \
  --cpu 2 \
  --max-instances 10 \
  --min-instances 1 \
  --port 8080
```

---

## 7. Environment Variables (`.env.example`)

```env
# GCP
GCP_PROJECT=your-gcp-project-id
GCP_REGION=us-central1

# Gemini
GEMINI_MODEL=gemini-2.0-flash
GOOGLE_CLOUD_PROJECT=your-gcp-project-id

# Firebase
FIREBASE_PROJECT_ID=your-firebase-project

# MCP
GMAIL_MCP_URL=https://gmail.mcp.claude.com/mcp
GCAL_MCP_URL=https://gcal.mcp.claude.com/mcp

# Security  
SECRET_KEY=your-secret-key-min-32-chars
ALLOWED_ORIGINS=http://localhost:5173,https://petal.yourdomain.com

# Frontend (Vite)
VITE_API_URL=http://localhost:8080/api/v1
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-firebase-project
```

---

## 8. Local Development

```bash
# Clone and setup
git clone https://github.com/yourorg/petal
cd petal

# Backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # fill in values
uvicorn backend.main:app --reload --port 8080

# Frontend (separate terminal)
cd frontend
npm install
npm run dev   # starts on http://localhost:5173

# Or use Docker Compose
docker-compose up --build
```

---

## 9. Testing

```bash
# Unit tests
pytest backend/tests/ -v

# Integration tests (requires live GCP)
pytest backend/tests/integration/ -v --env=test

# Load test
k6 run scripts/load_test.js

# Agent workflow test
python scripts/test_workflows.py
```
