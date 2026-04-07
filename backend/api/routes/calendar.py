from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from typing import Optional
import logging
from slowapi import Limiter
from slowapi.util import get_remote_address

from ...db.supabase import get_db, CalendarEventModel
from ...api.middleware import get_user_or_dev
from ...db.models import CalendarEventCreate, CalendarEvent
from ...tools.mcp_client import get_calendar_mcp
import uuid

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
    try:
        query = select(CalendarEventModel).where(
            CalendarEventModel.user_id == uuid.UUID(user["user_id"])
        )
        if start:
            query = query.where(
                CalendarEventModel.start_time >= datetime.fromisoformat(start)
            )
        if end:
            query = query.where(
                CalendarEventModel.end_time <= datetime.fromisoformat(end)
            )
        query = query.order_by(CalendarEventModel.start_time.asc())
        result = await db.execute(query)
        events = result.scalars().all()
        return [_event_to_dict(e) for e in events]
    except Exception as e:
        logger.warning(f"DB unavailable for calendar events: {e}")
        return []


@router.post("/calendar/events", response_model=CalendarEvent, status_code=201)
@limiter.limit("30/minute")
async def create_event(
    request: Request,
    data: CalendarEventCreate,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_user_or_dev),
):
    from ...config import settings

    event_id = uuid.uuid4()
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

    try:
        event = CalendarEventModel(
            id=event_id,
            user_id=uuid.UUID(user["user_id"]),
            title=data.title,
            start_time=data.start_time,
            end_time=data.end_time,
            location=data.location,
            meet_link=meet_link,
            attendees=data.attendees,
            google_event_id=google_event_id,
            created_by_agent=True,
        )
        db.add(event)
        await db.commit()
        await db.refresh(event)
        return _event_to_dict(event)
    except Exception as e:
        logger.warning(f"DB unavailable for create_event: {e}")
        raise HTTPException(status_code=503, detail="Database unavailable")


def _event_to_dict(event: CalendarEventModel) -> dict:
    return {
        "id": str(event.id),
        "user_id": str(event.user_id),
        "title": event.title,
        "start_time": event.start_time.isoformat(),
        "end_time": event.end_time.isoformat(),
        "location": event.location,
        "meet_link": event.meet_link,
        "attendees": event.attendees or [],
        "google_event_id": event.google_event_id,
        "created_by_agent": event.created_by_agent,
        "created_at": event.created_at.isoformat(),
    }
