from fastapi import APIRouter, Request
import time
import logging
import asyncio
import os
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


def normalize_agent_name(agent_name: str) -> str:
    name = (agent_name or "").lower().strip()
    alias_map = {
        "orchestrator": "orchestrator",
        "task": "task_agent",
        "taskagent": "task_agent",
        "task_agent": "task_agent",
        "calendar": "cal_agent",
        "cal": "cal_agent",
        "calagent": "cal_agent",
        "cal_agent": "cal_agent",
        "info": "info_agent",
        "infoagent": "info_agent",
        "info_agent": "info_agent",
    }
    return alias_map.get(name, name)


def _broadcast_status_update(agent_key: str):
    """Try broadcasting without breaking status updates if ws layer is unavailable."""
    try:
        from ...api.websocket import manager

        payload = {
            "type": "agent_update",
            "agent": agent_statuses[agent_key],
            "agents": list(agent_statuses.values()),
            "timestamp": time.time(),
        }
        loop = asyncio.get_running_loop()
        loop.create_task(manager.broadcast(payload))
    except Exception:
        # Status updates should never fail because websocket broadcasting failed.
        return


def update_agent_status(agent_name: str, status: str = "working"):
    """Update agent status when it's invoked."""
    key = normalize_agent_name(agent_name)
    if key in agent_statuses:
        agent_statuses[key]["status"] = status
        agent_statuses[key]["last_active"] = time.time()
        logger.debug(f"Updated {key} status to {status}")
        _broadcast_status_update(key)


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
    return {
        "agents": list(agent_statuses.values()),
        "generated_at": time.time(),
        "instance": os.getenv("K_SERVICE", "local"),
    }


@router.get("/agents/healthcheck")
@limiter.limit("10/minute")
async def agents_healthcheck(request: Request):
    from ...agents.routing import route_to_agent

    check_user_id = "00000000-0000-4000-8000-000000000001"
    probes = [
        ("task_agent", "list all my tasks"),
        ("info_agent", "list all my notes"),
        ("cal_agent", "show my calendar events"),
    ]

    results = []
    for expected_agent, prompt in probes:
        started = time.time()
        status = "ok"
        detail = "responsive"
        try:
            routed = await asyncio.wait_for(route_to_agent(prompt, check_user_id), timeout=12)
            reply = (routed.get("reply") or "").strip()
            routed_agent = normalize_agent_name(routed.get("agent", ""))
            if not routed.get("handled"):
                status = "error"
                detail = "route_not_handled"
            elif routed_agent != expected_agent:
                status = "error"
                detail = f"unexpected_agent:{routed_agent}"
            elif not reply:
                status = "error"
                detail = "empty_reply"
        except Exception as e:
            status = "error"
            detail = str(e)

        results.append(
            {
                "agent": expected_agent,
                "status": status,
                "detail": detail,
                "latency_ms": round((time.time() - started) * 1000, 2),
            }
        )

    overall = "healthy" if all(r["status"] == "ok" for r in results) else "degraded"
    return {
        "overall": overall,
        "results": results,
        "checked_at": time.time(),
        "instance": os.getenv("K_SERVICE", "local"),
    }
