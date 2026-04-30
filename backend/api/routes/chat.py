from fastapi import APIRouter, Depends, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
import time
import re
import logging
import uuid

from ...agents.orchestrator import run_agent
from ...api.middleware import get_user_or_dev
from ...db.models import ChatRequest, ChatResponse, ToolCall

logger = logging.getLogger(__name__)
router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


def sanitize_input(text: str) -> str:
    """Sanitize user input to prevent injection attacks."""
    if not text:
        return ""
    sanitized = text.strip()
    sanitized = re.sub(r"[\x00-\x1F\x7F-\x9F]", "", sanitized)
    sanitized = re.sub(
        r"<script[^>]*>.*?</script>", "", sanitized, flags=re.IGNORECASE | re.DOTALL
    )
    sanitized = re.sub(r"javascript:", "", sanitized, flags=re.IGNORECASE)
    sanitized = re.sub(r"on\w+\s*=", "", sanitized, flags=re.IGNORECASE)
    return sanitized[:10000]


@router.post("/chat", response_model=ChatResponse)
@limiter.limit("10/minute")
async def chat(
    request: Request,
    req: ChatRequest,
    user: dict = Depends(get_user_or_dev),
):
    sanitized_message = sanitize_input(req.message)
    if not sanitized_message:
        raise HTTPException(status_code=400, detail="Empty message")

    start = time.time()
    session_id = req.session_id
    if session_id:
        try:
            uuid.UUID(session_id)
        except ValueError:
            session_id = None
    if not session_id:
        session_id = str(uuid.uuid4())

    try:
        result = await run_agent(sanitized_message, session_id, user.get("user_id"))
    except Exception as e:
        logger.error(f"Chat error: {e}")
        msg = str(e)
        if "RESOURCE_EXHAUSTED" in msg or "Quota exceeded" in msg:
            raise HTTPException(
                status_code=503,
                detail="AI provider capacity is temporarily exhausted. Please retry shortly.",
            )
        raise HTTPException(status_code=500, detail="Chat service unavailable")

    latency_ms = int((time.time() - start) * 1000)
    return ChatResponse(
        reply=result["reply"],
        agents_invoked=result["agents_invoked"],
        tool_calls=[ToolCall(**tc) for tc in result.get("tool_calls", [])],
        session_id=session_id,
        latency_ms=latency_ms,
    )
