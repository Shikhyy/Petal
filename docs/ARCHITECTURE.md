# PETAL — System Architecture Document
**Version:** 1.0.0 | **Date:** April 2026

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACES                                  │
│   React Web App (Vite)              REST API Clients                    │
└─────────────────────────┬───────────────────────────────────────────────┘
                          │ HTTPS
┌─────────────────────────▼───────────────────────────────────────────────┐
│                    GCP CLOUD RUN                                         │
│                  petal-api service                                       │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  FastAPI Application                                              │   │
│  │  ├── Auth Middleware (Firebase JWT)                               │   │
│  │  ├── Rate Limiting Middleware                                     │   │
│  │  └── API Routes: /chat /tasks /calendar /notes /agents           │   │
│  └────────────────────────┬─────────────────────────────────────────┘   │
└───────────────────────────┼─────────────────────────────────────────────┘
                            │ Google ADK
┌───────────────────────────▼─────────────────────────────────────────────┐
│                    AGENT ORCHESTRATION LAYER                             │
│                   Google ADK Agent Runtime                               │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────┐       │
│   │              PETAL ORCHESTRATOR AGENT                        │       │
│   │           Gemini 2.0 Flash (Vertex AI)                       │       │
│   │      Intent Analysis → Agent Routing → Result Synthesis      │       │
│   └──────────────┬──────────────┬──────────────────┬────────────┘       │
│                  │              │                  │                     │
│        ┌─────────▼──┐  ┌───────▼────┐  ┌─────────▼───────┐            │
│        │ TASK AGENT │  │  CAL AGENT │  │   INFO AGENT    │            │
│        │ Gemini 2.0 │  │ Gemini 2.0 │  │   Gemini 2.0    │            │
│        └─────┬──────┘  └─────┬──────┘  └────────┬────────┘            │
└─────────────────────────────────────────────────────────────────────────┘
              │              │                   │
    ┌─────────▼──────┐  ┌────▼──────────┐  ┌────▼─────────────────┐
    │   Firestore    │  │  Google Cal   │  │  Firestore (notes)   │
    │    (tasks)     │  │   MCP Server  │  │  + Gemini Embeddings  │
    └────────────────┘  │  Gmail MCP    │  └──────────────────────┘
                        └───────────────┘
```

---

## 2. Google ADK Agent Structure

### 2.1 Agent Hierarchy

```
petal_orchestrator (LlmAgent)
├── model: gemini-2.0-flash
├── orchestration: auto
├── sub_agents:
│   ├── task_agent (LlmAgent)
│   │   ├── model: gemini-2.0-flash  
│   │   └── tools: [create_task, list_tasks, update_task, delete_task]
│   ├── cal_agent (LlmAgent)
│   │   ├── model: gemini-2.0-flash
│   │   └── tools: [MCPToolset(gcal), MCPToolset(gmail)]
│   └── info_agent (LlmAgent)
│       ├── model: gemini-2.0-flash
│       └── tools: [save_note, search_notes, summarize_note, generate_embedding]
└── tools: [MCPToolset(gmail), MCPToolset(gcal)]
```

### 2.2 ADK Execution Flow

```
User Message
    │
    ▼
Runner.run_async()
    │
    ▼
Orchestrator receives message
    │
    ▼
Gemini 2.0 Flash analyzes intent
    │
    ├─── Single-agent task?
    │         │
    │         ▼
    │    transfer_to_agent(task_agent | cal_agent | info_agent)
    │         │
    │         ▼
    │    Sub-agent executes tools
    │         │
    │         ▼
    │    Returns result to Orchestrator
    │
    └─── Multi-agent workflow?
              │
              ▼
         Sequential agent calls
         (Orchestrator maintains state)
              │
              ▼
         Synthesize all results
              │
              ▼
         Final response to user
```

---

## 3. MCP Tool Integration

### 3.1 MCP Architecture

```
CalAgent / Orchestrator
         │
         │ SSE Connection
         ▼
MCP Tool Server (gmail.mcp / gcal.mcp)
         │
         │ OAuth 2.0
         ▼
Google Workspace APIs
(Gmail API / Calendar API)
```

### 3.2 Tool Discovery

ADK's `MCPToolset` auto-discovers available tools from each MCP server at startup. For Google Calendar, this includes:
- `create_event` — Create a calendar event
- `list_events` — Query events by date range
- `update_event` — Modify existing event
- `delete_event` — Remove event
- `find_free_slots` — Find available time slots
- `create_meeting_link` — Generate Google Meet link

### 3.3 OAuth Flow

```
User → Login with Google → Firebase Auth
                                │
                                ▼
                    OAuth token stored in Firestore
                                │
                                ▼
                    CalAgent reads token at runtime
                                │
                                ▼
                    MCP Server uses token for API calls
```

---

## 4. Data Architecture

### 4.1 Firestore Collections

```
firestore/
├── users/{user_id}/
│   ├── profile: {name, email, preferences}
│   └── oauth_tokens: {gmail, gcal} (encrypted)
│
├── tasks/{task_id}/
│   ├── id, title, priority, status, tags
│   ├── due_date, description
│   └── user_id, created_at, agent_created
│
├── notes/{note_id}/
│   ├── id, title, body, tags
│   ├── embedding: float[] (Gemini text-embedding-004)
│   └── user_id, created_at
│
└── sessions/{session_id}/
    ├── user_id
    ├── messages: [{role, content, timestamp}]
    └── agents_invoked: string[]
```

### 4.2 Semantic Search (Notes)

Notes are stored with Gemini `text-embedding-004` embeddings (768 dimensions). Search uses cosine similarity via Firestore vector search:

```python
from google.cloud.firestore_v1.vector import Vector
from google.cloud.firestore_v1.base_vector_query import DistanceMeasure

async def search_notes(query: str, user_id: str, limit: int = 10):
    embedding = await generate_embedding(query)
    vector_query = db.collection("notes").where("user_id", "==", user_id).find_nearest(
        vector_field="embedding",
        query_vector=Vector(embedding),
        distance_measure=DistanceMeasure.COSINE,
        limit=limit,
    )
    return [doc.to_dict() async for doc in vector_query.stream()]
```

---

## 5. Cloud Run Deployment Architecture

```
GCP Project: petal-prod
Region: us-central1

Cloud Run Services:
├── petal-api (main backend)
│   ├── Image: gcr.io/petal-prod/petal-api:latest
│   ├── Memory: 2GiB
│   ├── CPU: 2
│   ├── Min instances: 1 (avoid cold starts)
│   ├── Max instances: 10
│   └── Concurrency: 80 req/instance
│
└── petal-frontend (static React build via Firebase Hosting)

Supporting Services:
├── Firestore (Native mode, us-central1)
├── Cloud SQL (PostgreSQL 15, db-f1-micro for dev)
├── Secret Manager (API keys, secrets)
├── Artifact Registry (container images)
├── Cloud Build (CI/CD)
└── Cloud Logging + Trace (observability)
```

---

## 6. CI/CD Pipeline (`cloudbuild.yaml`)

```yaml
steps:
  # Run tests
  - name: 'python:3.12'
    entrypoint: pip
    args: ['install', '-r', 'requirements.txt']
  - name: 'python:3.12'
    entrypoint: pytest
    args: ['backend/tests/', '-v', '--tb=short']

  # Build container
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/petal-api:$COMMIT_SHA', '.']

  # Push to Artifact Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/petal-api:$COMMIT_SHA']

  # Deploy to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'petal-api'
      - '--image=gcr.io/$PROJECT_ID/petal-api:$COMMIT_SHA'
      - '--region=us-central1'
      - '--platform=managed'

  # Deploy frontend to Firebase
  - name: 'node:20'
    dir: 'frontend'
    entrypoint: bash
    args:
      - '-c'
      - 'npm ci && npm run build && npx firebase-tools deploy --only hosting --token $$FIREBASE_TOKEN'
    secretEnv: ['FIREBASE_TOKEN']

availableSecrets:
  secretManager:
    - versionName: projects/$PROJECT_ID/secrets/firebase-deploy-token/versions/latest
      env: 'FIREBASE_TOKEN'

timeout: '1200s'
```

---

## 7. Security Architecture

```
Request Flow with Auth:

Client → HTTPS → Cloud Run
                     │
                     ▼
              Firebase JWT Middleware
              verify_id_token(jwt)
                     │
                     ▼ (valid)
              Route Handler
                     │
                     ▼
              Orchestrator (user scoped)
                     │
                     ▼
              Tools access only user's data
              (Firestore rules + user_id filter)
```

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /tasks/{taskId} {
      allow read, write: if request.auth != null 
        && request.auth.uid == resource.data.user_id;
    }
    match /notes/{noteId} {
      allow read, write: if request.auth != null 
        && request.auth.uid == resource.data.user_id;
    }
  }
}
```

---

## 8. Monitoring & Observability

- **Cloud Trace**: Distributed tracing across agent calls (ADK emits spans automatically)
- **Cloud Logging**: Structured JSON logs with `agent_name`, `session_id`, `latency_ms`
- **Cloud Monitoring**: Uptime checks, latency alerts, error rate dashboards
- **ADK Dashboard**: Agent execution traces, tool call success rates

### Key Metrics to Track

| Metric | Alert Threshold |
|---|---|
| API P95 latency | > 5s |
| Error rate | > 5% over 5min |
| Cold start rate | > 20% |
| Agent delegation success | < 90% |
| Firestore read latency | > 200ms |
