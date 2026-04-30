import json
import re
import logging
import uuid
import asyncio
from datetime import datetime, timedelta, timezone

from google import genai
from google.genai import types
from groq import Groq

from ..config import settings
from ..tools import task_tools, notes_tools, calendar_tools
from ..tools.mcp_client import get_calendar_mcp
from ..db.supabase import get_db, async_session, SessionModel
from .routing import route_to_agent
from ..api.routes.agents import update_agent_status, normalize_agent_name
from sqlalchemy import select

logger = logging.getLogger(__name__)


async def save_message_to_history(
    user_id: str, session_id: str, role: str, content: str
):
    """Save a message to the session history."""
    async with async_session() as db:
        try:
            result = await db.execute(
                select(SessionModel).where(SessionModel.id == uuid.UUID(session_id))
            )
            session = result.scalar_one_or_none()

            if session:
                messages = session.messages or []
                messages.append({"role": role, "content": content})
                session.messages = messages
            else:
                session = SessionModel(
                    id=uuid.UUID(session_id),
                    user_id=uuid.UUID(user_id),
                    messages=[{"role": role, "content": content}],
                    agents_invoked=[],
                )
                db.add(session)

            await db.commit()
        except Exception as e:
            logger.warning(f"Failed to save message to history: {e}")


async def get_conversation_history(session_id: str) -> list[dict]:
    """Get conversation history for a session."""
    async with async_session() as db:
        try:
            result = await db.execute(
                select(SessionModel).where(SessionModel.id == uuid.UUID(session_id))
            )
            session = result.scalar_one_or_none()
            return session.messages if session and session.messages else []
        except Exception as e:
            logger.warning(f"Failed to get conversation history: {e}")
            return []


def build_context_from_history(history: list[dict]) -> str:
    """Build a context string from conversation history."""
    if not history:
        return ""

    context_parts = []
    for msg in history[-10:]:
        role_label = "User" if msg.get("role") == "user" else "Assistant"
        context_parts.append(f"{role_label}: {msg.get('content', '')}")

    return "\n".join(context_parts)


def build_groq_messages(user_message: str, context: str) -> list[dict[str, str]]:
    messages = [
        {
            "role": "system",
            "content": (
                "You are PETAL's orchestrator assistant. Be concise, helpful, and natural. "
                "If the request is about tasks, notes, or calendar and no tool is available, "
                "explain the next step instead of inventing actions."
            ),
        }
    ]
    if context:
        messages.append({"role": "system", "content": f"Conversation history:\n{context}"})
    messages.append({"role": "user", "content": user_message})
    return messages


async def generate_groq_fallback_reply(user_message: str, context: str) -> str | None:
    client = get_groq_client()
    if not client:
        return None

    def _call() -> str | None:
        response = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=build_groq_messages(user_message, context),
            temperature=0.4,
            max_tokens=256,
        )
        choice = response.choices[0] if response.choices else None
        message = choice.message if choice else None
        content = message.content if message else None
        return content.strip() if content else None

    try:
        return await asyncio.to_thread(_call)
    except Exception as e:
        logger.warning(f"Groq fallback failed: {e}")
        return None


_genai_client = None
_groq_client = None


def get_genai_client():
    """Get cached GenAI client."""
    global _genai_client
    if _genai_client is None:
        api_key = settings.GEMINI_API_KEY
        if api_key:
            _genai_client = genai.Client(api_key=api_key)
    return _genai_client


def get_groq_client():
    """Get cached Groq client for fallback chat completions."""
    global _groq_client
    if _groq_client is None and settings.GROQ_API_KEY:
        _groq_client = Groq(api_key=settings.GROQ_API_KEY)
    return _groq_client


ORCHESTRATOR_PROMPT = """You are PETAL's Orchestrator Agent — the primary coordinator in a multi-agent productivity workspace.

Available tools:
- create_task: Create a new task. Parameters: title (required), priority (optional: high/medium/low), due_date (optional), tags (optional)
- list_tasks: List all tasks. No parameters needed.
- update_task: Update a task. Parameters: task_id (required), status (optional: todo/in_progress/done), priority (optional)
- delete_task: Delete a task. Parameter: task_id (required)
- save_note: Save a note. Parameters: title (required), body (required), tags (optional)
- list_notes: List all notes. No parameters needed.
- create_event: Create a calendar event. Parameters: title (required), start_time (required, ISO datetime), end_time (optional, ISO datetime), location (optional), attendees (optional)
- list_events: List upcoming calendar events. Optional parameter: max_results
- delete_event: Delete a calendar event by event_id

When user asks to create, update, list or delete tasks or notes, respond with a JSON object containing the tool name and parameters.
Example: {"tool": "create_task", "title": "Buy milk", "priority": "medium"}
Example: {"tool": "list_tasks"}
Example: {"tool": "save_note", "title": "Meeting notes", "body": "Discussed project timeline"}
Example: {"tool": "create_event", "title": "Standup", "start_time": "2026-05-02T09:00:00Z", "end_time": "2026-05-02T09:30:00Z"}

For anything else (greeting, general chat), respond normally without JSON.
"""

TOOL_SCHEMA = {
    "create_task": {
        "name": "create_task",
        "description": "Create a new task",
        "parameters": {
            "type": "object",
            "properties": {
                "title": {"type": "string", "description": "Task title"},
                "priority": {"type": "string", "enum": ["high", "medium", "low"]},
                "due_date": {"type": "string"},
                "tags": {"type": "array", "items": {"type": "string"}},
            },
            "required": ["title"],
        },
    },
    "list_tasks": {
        "name": "list_tasks",
        "description": "List all tasks",
        "parameters": {"type": "object", "properties": {}},
    },
    "update_task": {
        "name": "update_task",
        "description": "Update a task",
        "parameters": {
            "type": "object",
            "properties": {
                "task_id": {"type": "string"},
                "status": {"type": "string", "enum": ["todo", "in_progress", "done"]},
                "priority": {"type": "string", "enum": ["high", "medium", "low"]},
            },
            "required": ["task_id"],
        },
    },
    "delete_task": {
        "name": "delete_task",
        "description": "Delete a task",
        "parameters": {
            "type": "object",
            "properties": {"task_id": {"type": "string"}},
            "required": ["task_id"],
        },
    },
    "save_note": {
        "name": "save_note",
        "description": "Save a note",
        "parameters": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "body": {"type": "string"},
                "tags": {"type": "array", "items": {"type": "string"}},
            },
            "required": ["title", "body"],
        },
    },
    "list_notes": {
        "name": "list_notes",
        "description": "List all notes",
        "parameters": {"type": "object", "properties": {}},
    },
    "create_event": {
        "name": "create_event",
        "description": "Create a calendar event",
        "parameters": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "start_time": {"type": "string", "description": "ISO 8601 datetime"},
                "end_time": {"type": "string", "description": "ISO 8601 datetime"},
                "location": {"type": "string"},
                "attendees": {"type": "array", "items": {"type": "string"}},
            },
            "required": ["title", "start_time"],
        },
    },
    "list_events": {
        "name": "list_events",
        "description": "List upcoming calendar events",
        "parameters": {
            "type": "object",
            "properties": {
                "max_results": {"type": "integer"},
            },
        },
    },
    "delete_event": {
        "name": "delete_event",
        "description": "Delete a calendar event",
        "parameters": {
            "type": "object",
            "properties": {
                "event_id": {"type": "string"},
            },
            "required": ["event_id"],
        },
    },
}


async def execute_tool(tool_name: str, params: dict, user_id: str) -> str:
    """Execute a tool and return the result."""
    async with async_session() as db:
        try:
            if tool_name == "create_task":
                due_date = params.get("due_date")
                if due_date and isinstance(due_date, str):
                    try:
                        from datetime import datetime

                        due_date = datetime.fromisoformat(
                            due_date.replace("Z", "+00:00")
                        )
                    except (ValueError, AttributeError):
                        due_date = None
                result = await task_tools.create_task(
                    db,
                    user_id=user_id,
                    title=params["title"],
                    priority=params.get("priority", "medium"),
                    due_date=due_date,
                    tags=params.get("tags", []),
                )
                return f"Task created: {result['title']} (ID: {result['id']})"

            elif tool_name == "list_tasks":
                tasks = await task_tools.list_tasks(db, user_id)
                if not tasks:
                    return "No tasks found."
                lines = ["Your tasks:"]
                for t in tasks:
                    lines.append(
                        f"- [{t['status']}] {t['title']} (priority: {t['priority']})"
                    )
                return "\n".join(lines)

            elif tool_name == "update_task":
                result = await task_tools.update_task(
                    db,
                    user_id,
                    params["task_id"],
                    status=params.get("status"),
                    priority=params.get("priority"),
                )
                return (
                    f"Task updated: {result['title']}" if result else "Task not found"
                )

            elif tool_name == "delete_task":
                deleted = await task_tools.delete_task(db, user_id, params["task_id"])
                return "Task deleted" if deleted else "Task not found"

            elif tool_name == "save_note":
                result = await notes_tools.save_note(
                    db,
                    user_id=user_id,
                    title=params["title"],
                    body=params["body"],
                    tags=params.get("tags", []),
                )
                return f"Note saved: {result['title']} (ID: {result['id']})"

            elif tool_name == "list_notes":
                notes = await notes_tools.list_notes(db, user_id)
                if not notes:
                    return "No notes found."
                lines = ["Your notes:"]
                for n in notes:
                    lines.append(f"- {n['title']}")
                return "\n".join(lines)

            elif tool_name == "create_event":
                start_raw = params.get("start_time")
                if not start_raw:
                    return "start_time is required to schedule an event."

                start_time = datetime.fromisoformat(str(start_raw).replace("Z", "+00:00"))
                end_raw = params.get("end_time")
                if end_raw:
                    end_time = datetime.fromisoformat(str(end_raw).replace("Z", "+00:00"))
                else:
                    end_time = start_time + timedelta(hours=1)

                if end_time <= start_time:
                    end_time = start_time + timedelta(hours=1)

                google_event_id = None
                meet_link = None
                if settings.GCAL_MCP_URL:
                    mcp = get_calendar_mcp()
                    mcp_result = await mcp.create_event(
                        title=params["title"],
                        start_time=start_time.isoformat(),
                        end_time=end_time.isoformat(),
                        attendees=params.get("attendees", []),
                        location=params.get("location"),
                    )
                    if "error" not in mcp_result:
                        google_event_id = mcp_result.get("event_id")
                        meet_link = mcp_result.get("meet_link")

                event = await calendar_tools.create_event(
                    db,
                    user_id,
                    title=params["title"],
                    start_time=start_time,
                    end_time=end_time,
                    location=params.get("location"),
                    attendees=params.get("attendees", []),
                    google_event_id=google_event_id,
                    meet_link=meet_link,
                    created_by_agent=True,
                )

                when = datetime.fromisoformat(event["start_time"].replace("Z", "+00:00")).astimezone(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
                sync = "synced to Google Calendar" if google_event_id else "saved locally"
                if meet_link:
                    return f"Event created: {event['title']} at {when}, {sync}. Meet link: {meet_link}"
                return f"Event created: {event['title']} at {when}, {sync}."

            elif tool_name == "list_events":
                max_results = int(params.get("max_results", 20) or 20)
                events = await calendar_tools.list_events(
                    db,
                    user_id,
                    limit=max_results,
                    upcoming_only=True,
                )
                if not events:
                    return "No upcoming events found."

                lines = ["Upcoming events:"]
                for event in events:
                    when = datetime.fromisoformat(event["start_time"].replace("Z", "+00:00")).astimezone(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
                    lines.append(f"- {event['title']} at {when} (ID: {event['id']})")
                return "\n".join(lines)

            elif tool_name == "delete_event":
                event_id = params.get("event_id")
                if not event_id:
                    return "event_id is required to delete an event."

                event = await calendar_tools.delete_event(db, user_id, str(event_id))
                if not event:
                    return "Event not found"

                google_event_id = event.get("google_event_id")

                if google_event_id and settings.GCAL_MCP_URL:
                    mcp = get_calendar_mcp()
                    await mcp.delete_event(google_event_id)

                return "Event deleted"

            else:
                return f"Unknown tool: {tool_name}"
        except Exception as e:
            return f"Error: {str(e)}"


async def run_agent(user_message: str, session_id: str, user_id: str | None = None) -> dict:
    import time

    start_time = time.time()
    update_agent_status("orchestrator", "working")

    client = get_genai_client()

    if not user_id:
        try:
            if session_id:
                uuid.UUID(session_id)
                user_id = session_id
        except Exception:
            pass

    if not user_id:
        user_id = str(uuid.uuid4())

    logger.info(f"Processing message for user {user_id}: {user_message[:50]}...")

    # Get conversation history for context, but do not block chat if storage is slow.
    try:
        history = await asyncio.wait_for(get_conversation_history(session_id), timeout=2)
    except Exception:
        history = []
    context = build_context_from_history(history)

    # Save user message to history, but keep the chat response path fast.
    try:
        await asyncio.wait_for(
            save_message_to_history(user_id, session_id, "user", user_message),
            timeout=2,
        )
    except Exception:
        pass

    def tool_to_agent_key(tool_name: str) -> str:
        if tool_name in {"create_task", "list_tasks", "update_task", "delete_task"}:
            return "task_agent"
        if tool_name in {"save_note", "list_notes"}:
            return "info_agent"
        if tool_name in {"create_event", "list_events", "delete_event"}:
            return "cal_agent"
        return "orchestrator"

    try:
        # First, try routing to specialized agents
        try:
            routed = await route_to_agent(user_message, user_id)
            if routed.get("handled"):
                routed_agent = normalize_agent_name(routed.get("agent", "unknown"))
                logger.info(f"Routed to {routed_agent} agent")
                update_agent_status(routed_agent, "working")
                reply_text = routed.get("reply", "Action completed")
                latency_ms = round((time.time() - start_time) * 1000, 2)

                # Save assistant response to history
                try:
                    await asyncio.wait_for(
                        save_message_to_history(user_id, session_id, "assistant", reply_text),
                        timeout=2,
                    )
                except Exception:
                    pass
                finally:
                    update_agent_status(routed_agent, "idle")

                return {
                    "reply": reply_text,
                    "agents_invoked": [routed_agent],
                    "tool_calls": [
                        {
                            "agent": routed_agent,
                            "tool": routed.get("tool", "unknown"),
                            "result": routed.get("reply", ""),
                        }
                    ],
                    "session_id": session_id,
                    "latency_ms": latency_ms,
                }
        except Exception as e:
            logger.warning(f"Routing failed, falling back to general chat: {e}")

        def fallback_reply() -> str:
            msg = user_message.lower()
            if any(x in msg for x in ["task", "todo", "remind", "deadline", "priority"]):
                return "I can help with tasks, but I need a clearer instruction like create, list, update, or delete."
            if any(x in msg for x in ["note", "notes", "remember", "knowledge"]):
                return "I can help with notes. Try asking me to save a note, list notes, or search notes."
            if any(x in msg for x in ["calendar", "schedule", "meeting", "event", "appointment"]):
                return "I can help with calendar-related requests. If you want to schedule something, include the title, date, and time."
            return "I’m PETAL’s orchestrator. I can manage tasks, notes, and calendar requests. Ask me to create, list, update, or delete something."

        # Fall back to LLM-based tool calling
        system_with_context = ORCHESTRATOR_PROMPT
        if context:
            system_with_context = f"{ORCHESTRATOR_PROMPT}\n\nPrevious conversation:\n{context}\n\nRemember to consider the conversation history above when responding."

        if not client:
            logger.warning("Gemini not configured, using Groq or rule-based fallback")
            reply_text = await generate_groq_fallback_reply(user_message, context) or fallback_reply()
            latency_ms = round((time.time() - start_time) * 1000, 2)

            try:
                await asyncio.wait_for(
                    save_message_to_history(user_id, session_id, "assistant", reply_text),
                    timeout=2,
                )
            except Exception:
                pass

            return {
                "reply": reply_text,
                "agents_invoked": ["orchestrator"],
                "tool_calls": [],
                "session_id": session_id,
                "latency_ms": latency_ms,
            }

        try:
            response = await client.aio.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=user_message,
                config=types.GenerateContentConfig(
                    system_instruction=system_with_context,
                    tools=[
                        types.Tool(
                            function_declarations=[
                                types.FunctionDeclaration(
                                    name=sch["name"],
                                    description=sch["description"],
                                    parameters=sch["parameters"],
                                )
                                for sch in TOOL_SCHEMA.values()
                            ]
                        )
                    ],
                ),
            )
        except Exception as e:
            logger.warning(f"Gemini unavailable, using Groq fallback reply: {e}")
            reply_text = await generate_groq_fallback_reply(user_message, context) or fallback_reply()
            latency_ms = round((time.time() - start_time) * 1000, 2)

            try:
                await asyncio.wait_for(
                    save_message_to_history(user_id, session_id, "assistant", reply_text),
                    timeout=2,
                )
            except Exception:
                pass

            return {
                "reply": reply_text,
                "agents_invoked": ["orchestrator"],
                "tool_calls": [],
                "session_id": session_id,
                "latency_ms": latency_ms,
            }

        # Check if model wants to call a function
        if response.candidates and response.candidates[0].content.parts:
            for part in response.candidates[0].content.parts:
                if part.function_call:
                    fc = part.function_call
                    params = {k: v for k, v in fc.args.items()}
                    tool_agent = tool_to_agent_key(fc.name)
                    update_agent_status(tool_agent, "working")
                    tool_result = await execute_tool(fc.name, params, user_id)

                    # Get final response with tool result
                    final_response = await client.aio.models.generate_content(
                        model=settings.GEMINI_MODEL,
                        contents=f"User asked: {user_message}\n\nTool result: {tool_result}\n\nProvide a friendly response to the user.",
                        config=types.GenerateContentConfig(
                            system_instruction="You are a helpful assistant. Summarize the tool result in a friendly way.",
                        ),
                    )
                    reply_text = final_response.text if final_response.text else tool_result
                    latency_ms = round((time.time() - start_time) * 1000, 2)

                    # Save assistant response to history
                    try:
                        await asyncio.wait_for(
                            save_message_to_history(user_id, session_id, "assistant", reply_text),
                            timeout=2,
                        )
                    except Exception:
                        pass
                    finally:
                        update_agent_status(tool_agent, "idle")

                    return {
                        "reply": reply_text,
                        "agents_invoked": ["orchestrator", tool_agent],
                        "tool_calls": [
                            {
                                "agent": "orchestrator",
                                "tool": fc.name,
                                "result": tool_result,
                            }
                        ],
                        "session_id": session_id,
                        "latency_ms": latency_ms,
                    }

        # No tool call, return regular response
        reply_text = response.text if response.text else fallback_reply()
        latency_ms = round((time.time() - start_time) * 1000, 2)

        # Save assistant response to history
        try:
            await asyncio.wait_for(
                save_message_to_history(user_id, session_id, "assistant", reply_text),
                timeout=2,
            )
        except Exception:
            pass

        return {
            "reply": reply_text,
            "agents_invoked": ["orchestrator"],
            "tool_calls": [],
            "session_id": session_id,
            "latency_ms": latency_ms,
        }
    finally:
        update_agent_status("orchestrator", "idle")
