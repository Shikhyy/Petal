from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import Column, String, DateTime, Boolean, Text, ARRAY, JSON
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.pool import NullPool
import logging

logger = logging.getLogger(__name__)

try:
    from pgvector.sqlalchemy import Vector
except ImportError:
    Vector = None
from sqlalchemy.orm import DeclarativeBase
from datetime import datetime, timezone
import uuid

from ..config import settings


def get_database_url() -> str:
    """Normalize database URL while preserving provider query parameters."""
    url = settings.DATABASE_URL

    logger.info(f"Original DATABASE_URL: {url[:50]}...")

    if not url.startswith("postgresql+asyncpg"):
        if url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://")
            logger.info("Converted to asyncpg driver")

    logger.info(f"Final URL: {url[:60]}...")
    return url


# Create engine with connection args for SSL
logger.info("Creating database engine...")
try:
    engine = create_async_engine(
        get_database_url(),
        echo=False,
        poolclass=NullPool,
        connect_args={
            "ssl": "require",
            "timeout": 5,
            "command_timeout": 5,
        },
        pool_pre_ping=True,
    )
    logger.info("Database engine created successfully!")
except Exception as e:
    logger.error(f"Failed to create database engine: {e}")
    engine = create_async_engine(
        "postgresql+asyncpg://postgres:postgres@localhost:5432/petal",
        echo=False,
    )
    logger.info("Fallback engine created (local dev)")

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
logger.info("Database session factory ready")


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


class SessionModel(Base):
    __tablename__ = "sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    messages = Column(JSON, default=[])
    agents_invoked = Column(ARRAY(String), default=[])
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
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


async def init_db():
    """Initialize database tables."""
    logger.info("Database initialization skipped - using existing tables")


async def get_db():
    """Get database session."""
    async with async_session() as session:
        yield session


async def close_db():
    """Close database connections."""
    await engine.dispose()
