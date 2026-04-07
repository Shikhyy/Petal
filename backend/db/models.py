from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class TaskCreate(BaseModel):
    title: str
    description: str = ""
    priority: str = "medium"
    due_date: Optional[datetime] = None
    tags: list[str] = Field(default_factory=list)


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    tags: Optional[list[str]] = None
    due_date: Optional[datetime] = None


class Task(BaseModel):
    id: str
    user_id: str
    title: str
    description: str = ""
    priority: str = "medium"
    status: str = "todo"
    tags: list[str] = Field(default_factory=list)
    due_date: Optional[datetime] = None
    agent_created: bool = False
    created_at: datetime
    updated_at: datetime


class NoteCreate(BaseModel):
    title: str
    body: str = ""
    tags: list[str] = Field(default_factory=list)


class NoteUpdate(BaseModel):
    title: Optional[str] = None
    body: Optional[str] = None
    tags: Optional[list[str]] = None
    deleted: Optional[bool] = None


class Note(BaseModel):
    id: str
    user_id: str
    title: str
    body: str = ""
    tags: list[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class CalendarEventCreate(BaseModel):
    title: str
    start_time: datetime
    end_time: datetime
    location: Optional[str] = None
    attendees: list[str] = Field(default_factory=list)


class CalendarEvent(BaseModel):
    id: str
    user_id: str
    title: str
    start_time: datetime
    end_time: datetime
    location: Optional[str] = None
    meet_link: Optional[str] = None
    attendees: list[str] = Field(default_factory=list)
    google_event_id: Optional[str] = None
    created_by_agent: bool = False
    created_at: datetime


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None


class ToolCall(BaseModel):
    agent: str
    tool: str
    result: str


class ChatResponse(BaseModel):
    reply: str
    agents_invoked: list[str]
    tool_calls: list[ToolCall] = Field(default_factory=list)
    session_id: str
    latency_ms: int
