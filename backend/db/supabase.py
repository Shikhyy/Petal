from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import Column, String, DateTime, Boolean, Text, ARRAY, JSON
from sqlalchemy.dialects.postgresql import UUID, JSONB

try:
    from pgvector.sqlalchemy import Vector
except ImportError:
    Vector = None
from sqlalchemy.orm import DeclarativeBase
from datetime import datetime, timezone
import uuid

from ..config import settings

connect_args = {}
if "supabase" in settings.DATABASE_URL:
    # For Supabase, use sslmode query param in URL, not connect_args
    if "?" not in settings.DATABASE_URL:
        settings.DATABASE_URL += "?sslmode=require"
    elif "sslmode" not in settings.DATABASE_URL:
        settings.DATABASE_URL += "&sslmode=require"

engine = create_async_engine(
    settings.DATABASE_URL, echo=False, connect_args=connect_args
)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class TaskModel(Base):
    __tablename__ = "tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    title = Column(Text, nullable=False)
    description = Column(Text, default="")
    priority = Column(String(10), default="medium")
    status = Column(String(20), default="todo")
    tags = Column(ARRAY(String), default=[])
    due_date = Column(DateTime(timezone=True), nullable=True)
    agent_created = Column(Boolean, default=False)
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )


class NoteModel(Base):
    __tablename__ = "notes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    title = Column(Text, nullable=False)
    body = Column(Text, default="")
    tags = Column(ARRAY(String), default=[])
    embedding = (
        Column(JSON, nullable=True)
        if Vector is None
        else Column(Vector(768), nullable=True)
    )
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )


class CalendarEventModel(Base):
    __tablename__ = "calendar_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    title = Column(Text, nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    location = Column(Text, nullable=True)
    meet_link = Column(Text, nullable=True)
    attendees = Column(ARRAY(String), default=[])
    google_event_id = Column(Text, nullable=True)
    created_by_agent = Column(Boolean, default=False)
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )


class SessionModel(Base):
    __tablename__ = "sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    messages = Column(JSONB, default=[])
    agents_invoked = Column(ARRAY(String), default=[])
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )


async def get_db() -> AsyncSession:
    async with async_session() as session:
        yield session


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db():
    await engine.dispose()
