import asyncio
import uuid
from datetime import datetime, timezone

from sqlalchemy import delete as sa_delete
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.supabase import CalendarEventModel


_USE_DB_BACKEND = True
_DB_TIMEOUT_SECONDS = 15
_FALLBACK_EVENTS: dict[str, list[dict]] = {}


def _fallback_event_bucket(user_id: str) -> list[dict]:
    return _FALLBACK_EVENTS.setdefault(user_id, [])


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _parse_uuid(value: str) -> uuid.UUID:
    return uuid.UUID(value)


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


def _create_fallback_event(
    user_id: str,
    title: str,
    start_time: datetime,
    end_time: datetime,
    location: str | None = None,
    attendees: list[str] | None = None,
    google_event_id: str | None = None,
    meet_link: str | None = None,
    created_by_agent: bool = True,
) -> dict:
    now = _now_iso()
    event = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "title": title,
        "start_time": start_time.astimezone(timezone.utc).isoformat(),
        "end_time": end_time.astimezone(timezone.utc).isoformat(),
        "location": location,
        "meet_link": meet_link,
        "attendees": attendees or [],
        "google_event_id": google_event_id,
        "created_by_agent": created_by_agent,
        "created_at": now,
    }
    _fallback_event_bucket(user_id).append(event)
    return event


def _to_dt(value: str | datetime | None) -> datetime | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def _list_fallback_events(
    user_id: str,
    start_time: datetime | None = None,
    end_time: datetime | None = None,
    limit: int = 50,
    upcoming_only: bool = False,
) -> list[dict]:
    now = datetime.now(timezone.utc)
    events = []
    for event in _fallback_event_bucket(user_id):
        st = _to_dt(event.get("start_time"))
        et = _to_dt(event.get("end_time"))
        if st is None or et is None:
            continue
        if upcoming_only and et < now:
            continue
        if start_time and st < start_time:
            continue
        if end_time and et > end_time:
            continue
        events.append(event)

    return sorted(events, key=lambda e: e.get("start_time", ""))[:limit]


def _delete_fallback_event(user_id: str, event_id: str) -> dict | None:
    bucket = _fallback_event_bucket(user_id)
    for idx, event in enumerate(bucket):
        if event.get("id") == event_id:
            return bucket.pop(idx)
    return None


async def create_event(
    db: AsyncSession,
    user_id: str,
    title: str,
    start_time: datetime,
    end_time: datetime,
    location: str | None = None,
    attendees: list[str] | None = None,
    google_event_id: str | None = None,
    meet_link: str | None = None,
    created_by_agent: bool = True,
) -> dict:
    if not _USE_DB_BACKEND:
        return _create_fallback_event(
            user_id,
            title,
            start_time,
            end_time,
            location,
            attendees,
            google_event_id,
            meet_link,
            created_by_agent,
        )

    async def _db_create() -> dict:
        event = CalendarEventModel(
            id=uuid.uuid4(),
            user_id=_parse_uuid(user_id),
            title=title,
            start_time=start_time,
            end_time=end_time,
            location=location,
            meet_link=meet_link,
            attendees=attendees or [],
            google_event_id=google_event_id,
            created_by_agent=created_by_agent,
            created_at=datetime.now(timezone.utc),
        )
        db.add(event)
        await db.commit()
        await db.refresh(event)
        return _event_to_dict(event)

    try:
        return await asyncio.wait_for(_db_create(), timeout=_DB_TIMEOUT_SECONDS)
    except Exception:
        return _create_fallback_event(
            user_id,
            title,
            start_time,
            end_time,
            location,
            attendees,
            google_event_id,
            meet_link,
            created_by_agent,
        )


async def list_events(
    db: AsyncSession,
    user_id: str,
    start_time: datetime | None = None,
    end_time: datetime | None = None,
    limit: int = 50,
    upcoming_only: bool = False,
) -> list[dict]:
    fallback_events = _list_fallback_events(user_id, start_time, end_time, limit, upcoming_only)

    if not _USE_DB_BACKEND:
        return fallback_events

    async def _db_list() -> list[dict]:
        query = select(CalendarEventModel).where(CalendarEventModel.user_id == _parse_uuid(user_id))
        if start_time:
            query = query.where(CalendarEventModel.start_time >= start_time)
        if end_time:
            query = query.where(CalendarEventModel.end_time <= end_time)
        if upcoming_only:
            query = query.where(CalendarEventModel.end_time >= datetime.now(timezone.utc))
        query = query.order_by(CalendarEventModel.start_time.asc()).limit(limit)
        result = await db.execute(query)
        events = result.scalars().all()
        return [_event_to_dict(e) for e in events]

    try:
        db_events = await asyncio.wait_for(_db_list(), timeout=_DB_TIMEOUT_SECONDS)
        merged = {event["id"]: event for event in db_events}
        for event in fallback_events:
            merged.setdefault(event["id"], event)
        ordered = sorted(merged.values(), key=lambda e: e.get("start_time", ""))
        return ordered[:limit]
    except Exception:
        return fallback_events


async def delete_event(
    db: AsyncSession,
    user_id: str,
    event_id: str,
) -> dict | None:
    if not _USE_DB_BACKEND:
        return _delete_fallback_event(user_id, event_id)

    async def _db_delete() -> dict | None:
        query = select(CalendarEventModel).where(
            CalendarEventModel.id == _parse_uuid(event_id),
            CalendarEventModel.user_id == _parse_uuid(user_id),
        )
        result = await db.execute(query)
        event = result.scalar_one_or_none()
        if not event:
            return None

        event_dict = _event_to_dict(event)
        await db.delete(event)
        await db.commit()
        return event_dict

    try:
        return await asyncio.wait_for(_db_delete(), timeout=_DB_TIMEOUT_SECONDS)
    except Exception:
        return _delete_fallback_event(user_id, event_id)
