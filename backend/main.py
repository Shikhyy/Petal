from fastapi import FastAPI
from contextlib import asynccontextmanager
import logging

from .api.middleware import setup_cors
from .api.rate_limit import limiter, rate_limit_exceeded_handler
from .api.monitoring import LoggingMiddleware
from .api.websocket import router as ws_router
from .api.routes import chat, tasks, calendar, notes, agents
from .db.supabase import init_db, close_db

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Skip DB init for now - tables exist in Supabase
    # await init_db()
    yield
    await close_db()


app = FastAPI(
    title="PETAL API",
    version="2.0.0",
    description="Multi-Agent Productivity Workspace",
    lifespan=lifespan,
)

app.state.limiter = limiter
try:
    from slowapi.errors import RateLimitExceeded

    app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)
except ImportError:
    pass
app.add_middleware(LoggingMiddleware)

setup_cors(app)

app.include_router(ws_router, prefix="/api/v1")

app.include_router(chat.router, prefix="/api/v1")
app.include_router(tasks.router, prefix="/api/v1")
app.include_router(calendar.router, prefix="/api/v1")
app.include_router(notes.router, prefix="/api/v1")
app.include_router(agents.router, prefix="/api/v1")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "petal-api", "version": "2.0.0"}
