from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
from typing import Optional
import logging
from slowapi import Limiter
from slowapi.util import get_remote_address

from ...db.supabase import get_db
from ...api.middleware import get_user_or_dev
from ...db.models import CalendarEventCreate, CalendarEvent
from ...tools.mcp_client import get_calendar_mcp
from ...tools import calendar_tools

logger = logging.getLogger(__name__)
router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.get("/calendar/events", response_model=list[CalendarEvent])
@limiter.limit("60/minute")
async def get_events(
    request: Request,
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_user_or_dev),
):
    start_dt = datetime.fromisoformat(start) if start else None
    end_dt = datetime.fromisoformat(end) if end else None
    return await calendar_tools.list_events(
        db,
        user["user_id"],
        start_time=start_dt,
        end_time=end_dt,
        limit=200,
    )


@router.post("/calendar/events", response_model=CalendarEvent, status_code=201)
@limiter.limit("30/minute")
async def create_event(
    request: Request,
    data: CalendarEventCreate,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_user_or_dev),
):
    from ...config import settings

    google_event_id = None
    meet_link = None

    if settings.GCAL_MCP_URL:
        try:
            mcp = get_calendar_mcp()
            gcal_result = await mcp.create_event(
                title=data.title,
                start_time=data.start_time.isoformat(),
                end_time=data.end_time.isoformat(),
                attendees=data.attendees,
                location=data.location,
            )
            if "error" not in gcal_result:
                google_event_id = gcal_result.get("event_id")
                meet_link = gcal_result.get("meet_link")
                logger.info(f"Created Google Calendar event: {google_event_id}")
        except Exception as e:
            logger.warning(f"Failed to create Google Calendar event: {e}")

    created = await calendar_tools.create_event(
        db,
        user["user_id"],
        title=data.title,
        start_time=data.start_time,
        end_time=data.end_time,
        location=data.location,
        attendees=data.attendees,
        google_event_id=google_event_id,
        meet_link=meet_link,
        created_by_agent=True,
    )
    return created
