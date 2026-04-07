from fastapi import APIRouter, Request
import time
import logging
from slowapi import Limiter
from slowapi.util import get_remote_address

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)
logger = logging.getLogger(__name__)

agent_statuses = {
    "orchestrator": {
        "name": "Orchestrator",
        "status": "idle",
        "color": "#ff3b30",
        "last_active": 0,
    },
    "task_agent": {
        "name": "TaskAgent",
        "status": "idle",
        "color": "#007aff",
        "last_active": 0,
    },
    "cal_agent": {
        "name": "CalAgent",
        "status": "idle",
        "color": "#34c759",
        "last_active": 0,
    },
    "info_agent": {
        "name": "InfoAgent",
        "status": "idle",
        "color": "#ff9500",
        "last_active": 0,
    },
}

ACTIVE_TIMEOUT = 30


def update_agent_status(agent_name: str, status: str = "working"):
    """Update agent status when it's invoked."""
    if agent_name in agent_statuses:
        agent_statuses[agent_name]["status"] = status
        agent_statuses[agent_name]["last_active"] = time.time()
        logger.debug(f"Updated {agent_name} status to {status}")


def reset_idle_agents():
    """Reset agents that haven't been active recently."""
    current = time.time()
    for name, info in agent_statuses.items():
        if (
            info["status"] == "working"
            and current - info["last_active"] > ACTIVE_TIMEOUT
        ):
            info["status"] = "idle"


@router.get("/agents/status")
@limiter.limit("30/minute")
async def get_agents_status(request: Request):
    reset_idle_agents()
    return {"agents": list(agent_statuses.values())}
