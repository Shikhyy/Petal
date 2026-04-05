# 🌸 PETAL
### Personalized Execution & Task Agent Layer

**Multi-agent AI workspace powered by Google ADK · Gemini 2.0 Flash · GCP Cloud Run**

[![Deploy on Cloud Run](https://deploy.cloud.run/button.svg)](https://deploy.cloud.run)

---

## What is PETAL?

PETAL is a production-grade multi-agent AI system that manages your tasks, calendar, and knowledge base through a coordinated team of specialized AI agents — all orchestrated by **Google ADK** and backed by **Gemini 2.0 Flash**.

```
You → Orchestrator → TaskAgent  → Firestore
                   → CalAgent   → Google Calendar (MCP)
                   → InfoAgent  → Knowledge Base
                   → Gmail Tool → Gmail (MCP)
```

---

## Features

- **Multi-agent orchestration** via Google ADK with auto-delegation
- **Gemini 2.0 Flash** as the LLM backbone (Vertex AI)
- **Gmail & Google Calendar** integrations via MCP
- **Task management** with Kanban board, priorities, due dates
- **Calendar management** with smart scheduling
- **Knowledge base** with semantic search (Gemini embeddings)
- **Multi-step workflow** execution ("plan my launch" → tasks + events + notes)
- **Brutalist UI** with animated ticker, agent status indicators
- **GCP Cloud Run** deployment with auto-scaling

---

## Quick Start

```bash
# Clone
git clone https://github.com/yourorg/petal.git && cd petal

# Setup
cp .env.example .env  # fill in your GCP project + Firebase details
docker-compose up --build

# Open http://localhost:5173
```

Full setup: see [docs/SETUP.md](docs/SETUP.md)

---

## Documentation

| Document | Description |
|---|---|
| [docs/PRD.md](docs/PRD.md) | Product Requirements Document |
| [docs/IMPLEMENTATION.md](docs/IMPLEMENTATION.md) | Full implementation guide with code |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture & data models |
| [docs/SETUP.md](docs/SETUP.md) | Setup & deployment guide |

---

## Project Structure

```
petal/
├── backend/           Python FastAPI + Google ADK agents
├── frontend/          React 18 + Vite UI
├── infrastructure/    Terraform (GCP) + Cloud Build CI/CD
├── scripts/           Workflow tests, utilities
└── docs/              PRD, Architecture, Implementation, Setup
```

---

## Stack

| | Technology |
|---|---|
| Agent Framework | Google ADK (Agent Development Kit) |
| LLM | Gemini 2.0 Flash via Vertex AI |
| Backend | Python 3.12 + FastAPI |
| Frontend | React 18 + Vite |
| Database | Cloud Firestore + Cloud SQL |
| Deployment | GCP Cloud Run (us-central1) |
| Auth | Firebase Auth |
| CI/CD | Cloud Build + Artifact Registry |
| Infra-as-Code | Terraform |

---

## License

MIT © 2026 PETAL Project
