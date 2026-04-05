# PETAL — Product Requirements Document
**Version:** 1.0.0  
**Date:** April 2026  
**Status:** Approved for Development  
**Project Codename:** PETAL (Personalized Execution & Task Agent Layer)

---

## 1. Executive Summary

PETAL is a multi-agent AI workspace that helps users manage tasks, schedules, and information through a coordinated network of specialized AI agents. Built on **Google Agent Development Kit (ADK)**, powered by **Gemini 2.0 Flash**, and deployed on **GCP Cloud Run**, PETAL demonstrates production-grade multi-agent orchestration with real-world tool integrations via MCP (Model Context Protocol).

---

## 2. Problem Statement

Modern knowledge workers juggle tasks across disconnected tools — a calendar here, a task manager there, emails everywhere. Existing AI assistants handle single-turn queries but fail at multi-step, cross-tool workflows. There is no unified agent layer that:
- Understands intent and routes to the right tool/agent
- Coordinates multi-agent workflows without user micromanagement
- Persists structured data and learns from usage
- Integrates seamlessly with Google Workspace via MCP

---

## 3. Goals & Non-Goals

### Goals
- Build a primary orchestrator agent coordinating ≥3 specialized sub-agents
- Integrate Gmail and Google Calendar via MCP tool servers
- Store/retrieve structured data in Cloud Firestore and Cloud SQL
- Deploy as a fully containerized API on GCP Cloud Run
- Achieve sub-3s response time for 95th percentile queries
- Support multi-step workflows (e.g., "schedule a meeting AND create prep tasks AND draft agenda email")

### Non-Goals
- Mobile native app (web-first, responsive)
- Real-time collaborative editing
- Custom LLM fine-tuning in v1.0
- On-premise deployment

---

## 4. Target Users

| Persona | Description | Primary Need |
|---|---|---|
| **Solo Professional** | Freelancer / IC managing own workflow | Unified task + calendar assistant |
| **Team Lead** | Manages small team of 3–10 | Delegation, scheduling, status tracking |
| **Product Manager** | Heavy calendar + documentation load | Cross-tool multi-step automation |
| **Developer** | API-first power user | Programmatic access to agent capabilities |

---

## 5. Core Features

### 5.1 Orchestrator Agent
- Primary agent that receives all user input
- Analyzes intent and delegates to appropriate sub-agents
- Synthesizes results from multiple sub-agents into coherent responses
- Maintains conversation context across turns
- Built with Google ADK `LlmAgent` with `auto` orchestration

### 5.2 TaskAgent
- Create, read, update, delete tasks
- Priority scoring (high / medium / low)
- Due date management and overdue detection
- Tag-based organization (work, personal, urgent)
- Persists to Cloud Firestore `tasks` collection
- Tool: `create_task`, `list_tasks`, `update_task`, `delete_task`

### 5.3 CalAgent
- Create and query Google Calendar events via MCP
- Smart scheduling (find free slots, avoid conflicts)
- Recurring event support
- Meeting link generation (Google Meet)
- Tool: `gcal_create_event`, `gcal_list_events`, `gcal_find_free_slot`

### 5.4 InfoAgent
- Store and retrieve notes/documents
- AI-powered summarization using Gemini
- Full-text search across knowledge base
- Auto-tagging and categorization
- Persists to Firestore `notes` collection
- Tool: `save_note`, `search_notes`, `summarize_note`

### 5.5 Gmail Integration (MCP)
- Read recent emails (with user consent)
- Draft and send emails
- Thread summarization
- Action item extraction from emails
- Tool: `gmail_read`, `gmail_draft`, `gmail_send`

### 5.6 Multi-Step Workflow Engine
- Chain multi-agent calls within single user request
- Rollback on partial failure
- Workflow state persistence
- Example: "Plan my product launch" →
  1. InfoAgent: retrieve launch notes
  2. TaskAgent: create launch tasks
  3. CalAgent: schedule launch events
  4. InfoAgent: generate launch brief

---

## 6. System Architecture

```
User (Browser/API)
       │
       ▼
  API Gateway (Cloud Run)
       │
       ▼
  Orchestrator Agent (Google ADK)
  ├── TaskAgent ──────────────────► Firestore (tasks)
  ├── CalAgent ───────────────────► Google Calendar MCP
  ├── InfoAgent ──────────────────► Firestore (notes)
  │                                 Gemini Embeddings
  └── Gmail Tool ─────────────────► Gmail MCP
  
  All agents: Gemini 2.0 Flash via Vertex AI
  Deployment: GCP Cloud Run (us-central1)
  Auth: Google Cloud IAM + Firebase Auth
  DB: Firestore + Cloud SQL (PostgreSQL)
```

---

## 7. API Specification

### Base URL
`https://petal-api-[hash]-uc.a.run.app/api/v1`

### Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/chat` | Send message to orchestrator |
| `GET` | `/tasks` | List all tasks |
| `POST` | `/tasks` | Create task |
| `PATCH` | `/tasks/{id}` | Update task |
| `DELETE` | `/tasks/{id}` | Delete task |
| `GET` | `/calendar/events` | List calendar events |
| `POST` | `/calendar/events` | Create calendar event |
| `GET` | `/notes` | List notes |
| `POST` | `/notes` | Create note |
| `GET` | `/notes/search?q={query}` | Semantic search notes |
| `GET` | `/agents/status` | Get all agent statuses |
| `POST` | `/workflows/run` | Trigger named workflow |

### Chat Request/Response

```json
// POST /api/v1/chat
{
  "message": "Schedule a standup tomorrow at 9am and create prep tasks",
  "session_id": "usr_abc123",
  "context": {}
}

// Response
{
  "reply": "Done! I've coordinated your request across 2 agents...",
  "agents_invoked": ["CalAgent", "TaskAgent"],
  "tool_calls": [
    {"agent": "CalAgent", "tool": "gcal_create_event", "result": "event_id_123"},
    {"agent": "TaskAgent", "tool": "create_task", "result": "task_id_456"}
  ],
  "session_id": "usr_abc123",
  "latency_ms": 1842
}
```

---

## 8. Data Models

### Task
```typescript
interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'high' | 'medium' | 'low';
  status: 'todo' | 'in_progress' | 'done';
  tags: string[];
  due_date?: string;  // ISO 8601
  created_at: string;
  updated_at: string;
  user_id: string;
  agent_created: boolean;
}
```

### CalendarEvent
```typescript
interface CalendarEvent {
  id: string;
  title: string;
  start: string;   // ISO 8601
  end: string;
  location?: string;
  meet_link?: string;
  attendees: string[];
  calendar_id: string;
  created_by_agent: boolean;
}
```

### Note
```typescript
interface Note {
  id: string;
  title: string;
  body: string;
  tags: string[];
  embedding?: number[];   // 768-dim Gemini embedding
  created_at: string;
  updated_at: string;
  user_id: string;
}
```

---

## 9. Non-Functional Requirements

| Requirement | Target |
|---|---|
| API Response P95 | < 3 seconds |
| API Response P99 | < 8 seconds |
| Uptime SLA | 99.5% |
| Cold start time | < 5 seconds |
| Max concurrent users | 500 |
| Data retention | 90 days default |
| Auth token expiry | 24 hours |
| Rate limit | 60 req/min per user |

---

## 10. Security Requirements

- All API endpoints require Firebase Auth JWT
- MCP tool calls scoped to user's OAuth tokens
- PII masked in logs
- Secrets managed via GCP Secret Manager
- CORS restricted to allowed origins
- Input sanitization on all user text fields
- No user data used for model training

---

## 11. Success Metrics

| Metric | 30-Day Target |
|---|---|
| Multi-agent workflow completion rate | > 85% |
| User task completion via agent | > 70% |
| Average session length | > 5 minutes |
| API error rate | < 2% |
| User satisfaction (CSAT) | > 4.2 / 5 |

---

## 12. Release Timeline

| Milestone | Date | Deliverables |
|---|---|---|
| M0: Foundation | Week 1–2 | ADK setup, Gemini integration, basic Orchestrator |
| M1: Core Agents | Week 3–4 | TaskAgent + InfoAgent functional, Firestore live |
| M2: MCP Integrations | Week 5–6 | CalAgent + Gmail MCP, end-to-end workflow |
| M3: UI + API | Week 7–8 | Frontend, REST API, auth |
| M4: Cloud Deploy | Week 9–10 | GCP Cloud Run, CI/CD, monitoring |
| M5: Beta | Week 11–12 | Load testing, bug fixes, documentation |
