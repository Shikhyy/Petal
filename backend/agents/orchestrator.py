import json
import re
import logging
import uuid

from google import genai
from google.genai import types

from ..config import settings
from ..tools import task_tools, notes_tools
from ..db.supabase import get_db, async_session, SessionModel
from .routing import route_to_agent
from ..api.routes.agents import update_agent_status
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


_genai_client = None


def get_genai_client():
    """Get cached GenAI client."""
    global _genai_client
    if _genai_client is None:
        api_key = settings.GEMINI_API_KEY
        if api_key:
            _genai_client = genai.Client(api_key=api_key)
        else:
            _genai_client = genai.Client()
    return _genai_client


ORCHESTRATOR_PROMPT = """You are PETAL's Orchestrator Agent — the primary coordinator in a multi-agent productivity workspace.

Available tools:
- create_task: Create a new task. Parameters: title (required), priority (optional: high/medium/low), due_date (optional), tags (optional)
- list_tasks: List all tasks. No parameters needed.
- update_task: Update a task. Parameters: task_id (required), status (optional: todo/in_progress/done), priority (optional)
- delete_task: Delete a task. Parameter: task_id (required)
- save_note: Save a note. Parameters: title (required), body (required), tags (optional)
- list_notes: List all notes. No parameters needed.

When user asks to create, update, list or delete tasks or notes, respond with a JSON object containing the tool name and parameters.
Example: {"tool": "create_task", "title": "Buy milk", "priority": "medium"}
Example: {"tool": "list_tasks"}
Example: {"tool": "save_note", "title": "Meeting notes", "body": "Discussed project timeline"}

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

            else:
                return f"Unknown tool: {tool_name}"
        except Exception as e:
            return f"Error: {str(e)}"


async def run_agent(user_message: str, session_id: str) -> dict:
    import time

    start_time = time.time()
    client = get_genai_client()

    user_id = None
    try:
        if session_id and "_" in session_id:
            parts = session_id.split("_")
            if len(parts) >= 2:
                potential_uuid = parts[1]
                try:
                    uuid.UUID(potential_uuid)
                    user_id = potential_uuid
                except ValueError:
                    pass
        if not user_id and session_id:
            try:
                uuid.UUID(session_id)
                user_id = session_id
            except ValueError:
                pass
    except Exception:
        pass

    if not user_id:
        user_id = str(uuid.uuid4())

    logger.info(f"Processing message for user {user_id}: {user_message[:50]}...")

    # Get conversation history for context
    history = await get_conversation_history(session_id)
    context = build_context_from_history(history)

    # Save user message to history
    await save_message_to_history(user_id, session_id, "user", user_message)

    # First, try routing to specialized agents
    try:
        routed = await route_to_agent(user_message, user_id)
        if routed.get("handled"):
            logger.info(f"Routed to {routed.get('agent')} agent")
            update_agent_status("orchestrator", "working")
            update_agent_status(routed.get("agent", "unknown"), "working")
            reply_text = routed.get("reply", "Action completed")
            latency_ms = round((time.time() - start_time) * 1000, 2)

            # Save assistant response to history
            await save_message_to_history(user_id, session_id, "assistant", reply_text)

            return {
                "reply": reply_text,
                "agents_invoked": [routed.get("agent", "unknown")],
                "tool_calls": [
                    {
                        "agent": routed.get("agent", "unknown"),
                        "tool": routed.get("tool", "unknown"),
                        "result": routed.get("reply", ""),
                    }
                ],
                "session_id": session_id,
                "latency_ms": latency_ms,
            }
    except Exception as e:
        logger.warning(f"Routing failed, falling back to LLM: {e}")

    # Fall back to LLM-based tool calling
    system_with_context = ORCHESTRATOR_PROMPT
    if context:
        system_with_context = f"{ORCHESTRATOR_PROMPT}\n\nPrevious conversation:\n{context}\n\nRemember to consider the conversation history above when responding."

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

    # Check if model wants to call a function
    if response.candidates and response.candidates[0].content.parts:
        for part in response.candidates[0].content.parts:
            if part.function_call:
                fc = part.function_call
                params = {k: v for k, v in fc.args.items()}
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
                await save_message_to_history(
                    user_id, session_id, "assistant", reply_text
                )

                return {
                    "reply": reply_text,
                    "agents_invoked": ["orchestrator", fc.name],
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
    reply_text = response.text if response.text else "I couldn't process that request."
    latency_ms = round((time.time() - start_time) * 1000, 2)

    # Save assistant response to history
    await save_message_to_history(user_id, session_id, "assistant", reply_text)

    return {
        "reply": reply_text,
        "agents_invoked": ["orchestrator"],
        "tool_calls": [],
        "session_id": session_id,
        "latency_ms": latency_ms,
    }
