from datetime import datetime, timezone
from typing import Any
import logging
import asyncio

import httpx
from fastapi import APIRouter, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from ...config import settings

logger = logging.getLogger(__name__)
router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


def _service_template(name: str, url: str | None) -> dict[str, Any]:
    configured = bool(url and url.strip())
    return {
        "name": name,
        "configured": configured,
        "url": url if configured else None,
        "status": "not_configured" if not configured else "unknown",
        "reachable": False,
        "latency_ms": None,
        "message": "Set MCP server URL in environment." if not configured else "Pending check.",
        "last_checked": datetime.now(timezone.utc).isoformat(),
    }


async def _probe_health(url: str) -> tuple[bool, str, int | None]:
    endpoint = f"{url.rstrip('/')}/health"
    started = datetime.now(timezone.utc)
    try:
        async with httpx.AsyncClient(timeout=2.5) as client:
            response = await client.get(endpoint)
            latency_ms = int((datetime.now(timezone.utc) - started).total_seconds() * 1000)
            if response.is_success:
                return True, "Connected", latency_ms
            return False, f"Health check failed ({response.status_code})", latency_ms
    except Exception as exc:
        logger.warning("MCP health check failed for %s: %s", endpoint, exc)
        return False, f"Connection failed: {exc}", None


@router.get("/mcp/status")
@limiter.limit("30/minute")
async def get_mcp_status(request: Request):
    calendar = _service_template("google_calendar", settings.GCAL_MCP_URL)
    gmail = _service_template("gmail", settings.GMAIL_MCP_URL)
    notes = _service_template("notes", settings.NOTES_MCP_URL)
    services = [calendar, gmail, notes]

    async def _check_service(service: dict[str, Any]) -> None:
        if not service["configured"]:
            return
        reachable, message, latency_ms = await _probe_health(service["url"])
        service["reachable"] = reachable
        service["latency_ms"] = latency_ms
        service["status"] = "connected" if reachable else "error"
        service["message"] = message
        service["last_checked"] = datetime.now(timezone.utc).isoformat()

    await asyncio.gather(*[_check_service(service) for service in services])

    connected = sum(1 for service in services if service["status"] == "connected")
    configured = sum(1 for service in services if service["configured"])

    return {
        "summary": {
            "total": len(services),
            "configured": configured,
            "connected": connected,
            "overall_status": "healthy" if configured and connected == configured else "degraded",
        },
        "services": services,
    }