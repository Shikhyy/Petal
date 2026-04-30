import re
import logging
import uuid
import asyncio
from typing import Optional
from datetime import datetime, timedelta, timezone

from ..config import settings
from ..tools import task_tools, notes_tools, calendar_tools
from ..tools.mcp_client import get_calendar_mcp, get_notes_mcp
from ..db.supabase import async_session

logger = logging.getLogger(__name__)


class AgentRouter:
    """Routes user requests to appropriate specialized agents."""

    def __init__(self):
        self.agents = {
            "task": {
                "keywords": [
                    "task",
                    "todo",
                    "to-do",
                    "remind",
                    "reminder",
                    "deadline",
                    "priority",
                ],
                "handler": self._handle_task_request,
            },
            "calendar": {
                "keywords": [
                    "calendar",
                    "schedule",
                    "meeting",
                    "event",
                    "book",
                    "schedule",
                    "appointment",
                ],
                "handler": self._handle_calendar_request,
            },
            "info": {
                "keywords": [
                    "note",
                    "notes",
                    "knowledge",
                    "search",
                    "find",
                    "remember",
                    "information",
                    "summarize",
                ],
                "handler": self._handle_info_request,
            },
        }

    def route(self, user_message: str) -> Optional[tuple[str, str]]:
        """Route message to appropriate agent and return (agent_name, intent)."""
        msg_lower = user_message.lower()

        def has_keyword(text: str, keyword: str) -> bool:
            if " " in keyword:
                return keyword in text
            return re.search(rf"\b{re.escape(keyword)}\b", text) is not None

        for agent_name, agent_info in self.agents.items():
            for keyword in agent_info["keywords"]:
                if has_keyword(msg_lower, keyword):
                    intent = self._extract_intent(msg_lower, keyword)
                    logger.info(f"Routed to {agent_name} agent with intent: {intent}")
                    return agent_name, intent

        return None

    def _extract_intent(self, message: str, keyword: str) -> str:
        """Extract the intent based on context around the keyword."""
        if any(x in message for x in ["create", "add", "new", "make"]):
            return "create"
        if any(x in message for x in ["list", "show", "get", "all"]):
            return "list"
        if any(x in message for x in ["update", "edit", "change", "modify"]):
            return "update"
        if any(x in message for x in ["delete", "remove"]):
            return "delete"
        if any(x in message for x in ["search", "find", "lookup"]):
            return "search"
        return "general"

    async def _handle_task_request(self, user_message: str, user_id: str) -> dict:
        """Handle task-related requests."""
        # Validate user_id
        try:
            uuid.UUID(user_id)
        except ValueError:
            user_id = str(uuid.uuid4())

        async with async_session() as db:
            msg_lower = user_message.lower()

            if any(x in msg_lower for x in ["create", "add", "new"]):
                title = self._extract_title(user_message)
                priority = self._extract_priority(user_message)
                result = await task_tools.create_task(
                    db, user_id=user_id, title=title, priority=priority
                )
                return {
                    "reply": f"Created task: {result['title']}",
                    "agent": "task_agent",
                    "tool": "create_task",
                }

            if any(x in msg_lower for x in ["list", "show", "view", "all"]):
                tasks = await task_tools.list_tasks(db, user_id)
                if not tasks:
                    return {
                        "reply": "No tasks found.",
                        "agent": "task_agent",
                        "tool": "list_tasks",
                    }
                lines = ["Your tasks:"]
                for t in tasks:
                    lines.append(
                        f"- [{t['status']}] {t['title']} ({t['priority']}) ID: {t['id']}"
                    )
                return {
                    "reply": "\n".join(lines),
                    "agent": "task_agent",
                    "tool": "list_tasks",
                }

            task_id = self._extract_uuid(user_message)
            if any(x in msg_lower for x in ["update", "edit", "change", "modify", "complete", "done", "finish", "mark"]):
                if not task_id:
                    return {
                        "reply": "Please include the task ID so I can update it.",
                        "agent": "task_agent",
                        "tool": "update_task",
                    }

                status = self._extract_task_status(msg_lower)
                result = await task_tools.update_task(
                    db,
                    user_id,
                    task_id,
                    status=status,
                )
                if not result:
                    return {
                        "reply": "Task not found.",
                        "agent": "task_agent",
                        "tool": "update_task",
                    }

                return {
                    "reply": f"Updated task: {result['title']} ({result['status']})",
                    "agent": "task_agent",
                    "tool": "update_task",
                }

            if any(x in msg_lower for x in ["delete", "remove", "cancel"]):
                if not task_id:
                    return {
                        "reply": "Please include the task ID so I can delete it.",
                        "agent": "task_agent",
                        "tool": "delete_task",
                    }

                deleted = await task_tools.delete_task(db, user_id, task_id)
                return {
                    "reply": "Task deleted." if deleted else "Task not found.",
                    "agent": "task_agent",
                    "tool": "delete_task",
                }

            return {
                "reply": "I can help you create, list, update, or delete tasks.",
                "agent": "task_agent",
                "tool": "help",
            }

    async def _handle_calendar_request(self, user_message: str, user_id: str) -> dict:
        """Handle calendar-related requests."""
        try:
            uuid.UUID(user_id)
        except ValueError:
            user_id = str(uuid.uuid4())

        msg_lower = user_message.lower()

        def has_keyword(text: str, keyword: str) -> bool:
            if " " in keyword:
                return keyword in text
            return re.search(rf"\b{re.escape(keyword)}\b", text) is not None

        def has_any_keywords(text: str, keywords: list[str]) -> bool:
            return any(has_keyword(text, keyword) for keyword in keywords)

        async with async_session() as db:
            if has_any_keywords(msg_lower, ["schedule", "meeting", "event", "book", "appointment", "calendar"]):
                payload = self._extract_calendar_payload(user_message)
                if not payload:
                    return {
                        "reply": "I can schedule this, but I need a date/time. Try: Schedule Design Review tomorrow at 3pm for 45 minutes.",
                        "agent": "cal_agent",
                        "tool": "create_event",
                        "handled": False,
                    }

                google_event_id = None
                meet_link = None
                if settings.GCAL_MCP_URL:
                    mcp = get_calendar_mcp()
                    mcp_result = await mcp.create_event(
                        title=payload["title"],
                        start_time=payload["start_time"].isoformat(),
                        end_time=payload["end_time"].isoformat(),
                        attendees=payload.get("attendees", []),
                        location=payload.get("location"),
                    )
                    if "error" not in mcp_result:
                        google_event_id = mcp_result.get("event_id")
                        meet_link = mcp_result.get("meet_link")

                event = await calendar_tools.create_event(
                    db,
                    user_id,
                    title=payload["title"],
                    start_time=payload["start_time"],
                    end_time=payload["end_time"],
                    location=payload.get("location"),
                    attendees=payload.get("attendees", []),
                    google_event_id=google_event_id,
                    meet_link=meet_link,
                    created_by_agent=True,
                )

                start_dt = datetime.fromisoformat(event["start_time"].replace("Z", "+00:00"))
                end_dt = datetime.fromisoformat(event["end_time"].replace("Z", "+00:00"))
                start_str = start_dt.astimezone(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
                duration_minutes = int((end_dt - start_dt).total_seconds() / 60)
                sync_msg = "synced to Google Calendar" if google_event_id else "saved locally"
                meet_msg = f" Meet: {meet_link}" if meet_link else ""
                return {
                    "reply": f"Scheduled '{event['title']}' for {start_str} ({duration_minutes} min), {sync_msg}.{meet_msg} Event ID: {event['id']}",
                    "agent": "cal_agent",
                    "tool": "create_event",
                }

            if has_any_keywords(msg_lower, ["list", "show", "view", "upcoming", "what", "events"]):
                events = await calendar_tools.list_events(
                    db,
                    user_id,
                    limit=20,
                    upcoming_only=True,
                )

                if not events:
                    return {
                        "reply": "No upcoming calendar events found.",
                        "agent": "cal_agent",
                        "tool": "list_events",
                    }

                lines = ["Upcoming events:"]
                for event in events:
                    local_time = datetime.fromisoformat(event["start_time"].replace("Z", "+00:00")).astimezone(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
                    lines.append(f"- {event['title']} at {local_time} (ID: {event['id']})")

                return {
                    "reply": "\n".join(lines),
                    "agent": "cal_agent",
                    "tool": "list_events",
                }

            if has_any_keywords(msg_lower, ["delete", "remove", "cancel"]):
                event_id = self._extract_uuid(user_message)
                if not event_id:
                    return {
                        "reply": "Please include the event ID so I can delete it.",
                        "agent": "cal_agent",
                        "tool": "delete_event",
                    }

                event = await calendar_tools.delete_event(db, user_id, event_id)
                if not event:
                    return {
                        "reply": "Event not found.",
                        "agent": "cal_agent",
                        "tool": "delete_event",
                    }

                google_event_id = event.get("google_event_id")

                if google_event_id and settings.GCAL_MCP_URL:
                    mcp = get_calendar_mcp()
                    mcp_result = await mcp.delete_event(google_event_id)
                    if "error" in mcp_result:
                        logger.warning("Failed deleting Google Calendar event %s: %s", google_event_id, mcp_result["error"])

                return {
                    "reply": "Calendar event deleted.",
                    "agent": "cal_agent",
                    "tool": "delete_event",
                }

        return {
            "reply": "I can help you schedule, list, or delete calendar events.",
            "agent": "cal_agent",
            "tool": "help",
        }

    async def _handle_info_request(self, user_message: str, user_id: str) -> dict:
        """Handle info/notes-related requests."""
        async with async_session() as db:
            msg_lower = user_message.lower()
            notes_mcp = get_notes_mcp() if settings.NOTES_MCP_URL else None

            if any(x in msg_lower for x in ["search", "find", "lookup"]):
                query = self._extract_search_query(user_message)
                if not query:
                    return {
                        "reply": "Please provide a search query for your notes.",
                        "agent": "info_agent",
                        "tool": "search_notes",
                    }

                matches = []
                if notes_mcp:
                    mcp_result = await notes_mcp.search_notes(query=query, limit=10)
                    if "error" not in mcp_result:
                        raw_results = mcp_result.get("results") or mcp_result.get("notes") or []
                        if isinstance(raw_results, list):
                            matches = raw_results

                if not matches:
                    notes = await notes_tools.list_notes(db, user_id)
                    query_lower = query.lower()
                    for note in notes:
                        haystack = f"{note['title']} {note.get('body', '')} {' '.join(note.get('tags', []))}".lower()
                        if query_lower in haystack:
                            matches.append(note)

                if not matches:
                    return {
                        "reply": f"No notes matched '{query}'.",
                        "agent": "info_agent",
                        "tool": "search_notes",
                    }

                lines = [f"Notes matching '{query}':"]
                for n in matches[:10]:
                    lines.append(f"- {n['title']} ID: {n['id']}")
                return {
                    "reply": "\n".join(lines),
                    "agent": "info_agent",
                    "tool": "search_notes",
                }

            if any(x in msg_lower for x in ["list", "show", "view", "all"]):
                notes = []
                if notes_mcp:
                    mcp_result = await notes_mcp.list_notes(limit=50)
                    if "error" not in mcp_result:
                        raw_results = mcp_result.get("notes") or mcp_result.get("results") or []
                        if isinstance(raw_results, list):
                            notes = raw_results

                if not notes:
                    notes = await notes_tools.list_notes(db, user_id)
                if not notes:
                    return {
                        "reply": "No notes found.",
                        "agent": "info_agent",
                        "tool": "list_notes",
                    }
                lines = ["Your notes:"]
                for n in notes:
                    lines.append(f"- {n['title']} ID: {n['id']}")
                return {
                    "reply": "\n".join(lines),
                    "agent": "info_agent",
                    "tool": "list_notes",
                }

            if any(x in msg_lower for x in ["save", "create", "add", "remember", "write"]):
                title = self._extract_title(user_message)
                body = self._extract_body(user_message)
                result = None
                if notes_mcp:
                    mcp_result = await notes_mcp.save_note(title=title, body=body, tags=[])
                    if "error" not in mcp_result:
                        result = {
                            "title": mcp_result.get("title", title),
                            "id": mcp_result.get("id", "mcp-note"),
                        }

                if not result:
                    result = await notes_tools.save_note(
                        db, user_id=user_id, title=title, body=body
                    )
                return {
                    "reply": f"Saved note: {result['title']}",
                    "agent": "info_agent",
                    "tool": "save_note",
                }

            return {
                "reply": "I can help you save, list, or search notes.",
                "agent": "info_agent",
                "tool": "help",
            }

    def _extract_title(self, message: str) -> str:
        """Extract title from message."""
        patterns = [
            r"(?:create|add|new|make|save)\s+(?:a\s+)?(?:task|note|reminder)\s+(?:called\s+)?([^\n\.]+)",
            r"(?:task|note|reminder|todo):\s*([^\n\.]+)",
        ]
        for pattern in patterns:
            match = re.search(pattern, message, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        return "Untitled"

    def _extract_body(self, message: str) -> str:
        """Extract body from message."""
        body_match = re.search(
            r"(?:with|containing|saying|about)\s+[\"']?([^\"']+)[\"']?",
            message,
            re.IGNORECASE,
        )
        if body_match:
            return body_match.group(1).strip()
        return ""

    def _extract_priority(self, message: str) -> str:
        """Extract priority from message."""
        msg_lower = message.lower()
        if "high" in msg_lower or "urgent" in msg_lower:
            return "high"
        if "low" in msg_lower:
            return "low"
        return "medium"

    def _extract_uuid(self, message: str) -> str | None:
        match = re.search(
            r"\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b",
            message,
            re.IGNORECASE,
        )
        return match.group(0) if match else None

    def _extract_task_status(self, message: str) -> str | None:
        if "in progress" in message or "progress" in message or "working" in message:
            return "in_progress"
        if "done" in message or "complete" in message or "finished" in message:
            return "done"
        if "todo" in message or "to do" in message:
            return "todo"
        return None

    def _extract_search_query(self, message: str) -> str:
        patterns = [
            r"(?:search|find|lookup)(?:\s+my)?(?:\s+notes)?(?:\s+for|\s+about|\s+on)?\s+(.+)$",
            r"(?:notes?)(?:\s+about|\s+for)\s+(.+)$",
        ]
        for pattern in patterns:
            match = re.search(pattern, message, re.IGNORECASE)
            if match:
                return match.group(1).strip().strip('"\'')
        return ""

    def _extract_calendar_payload(self, message: str) -> dict | None:
        msg = message.strip()
        now = datetime.now(timezone.utc)

        title = "Meeting"
        titled_match = re.search(r"(?:called|titled|named)\s+[\"']?([^\"'\n]+)", msg, re.IGNORECASE)
        if titled_match:
            title = re.split(r"\b(?:tomorrow|today|at|on|for)\b", titled_match.group(1), maxsplit=1, flags=re.IGNORECASE)[0].strip()
        else:
            cleaned = re.sub(r"^(schedule|book|create|add)\s+(a\s+)?", "", msg, flags=re.IGNORECASE)
            title = re.split(r"\b(?:tomorrow|today|at|on|for)\b", cleaned, maxsplit=1, flags=re.IGNORECASE)[0].strip(" .") or title

        duration_minutes = 60
        duration_match = re.search(r"for\s+(\d{1,3})\s*(min|minute|minutes|hr|hour|hours)", msg, re.IGNORECASE)
        if duration_match:
            amount = int(duration_match.group(1))
            unit = duration_match.group(2).lower()
            duration_minutes = amount * 60 if unit.startswith("h") else amount

        day = None
        if "tomorrow" in msg.lower():
            day = (now + timedelta(days=1)).date()
        elif "today" in msg.lower():
            day = now.date()

        iso_match = re.search(r"(\d{4}-\d{2}-\d{2})(?:[ t](\d{1,2})(?::(\d{2}))?\s*(am|pm)?)?", msg, re.IGNORECASE)
        if iso_match:
            day = datetime.fromisoformat(iso_match.group(1)).date()
            hour = int(iso_match.group(2) or 9)
            minute = int(iso_match.group(3) or 0)
            ampm = (iso_match.group(4) or "").lower()
            if ampm == "pm" and hour < 12:
                hour += 12
            if ampm == "am" and hour == 12:
                hour = 0
            start_dt = datetime(day.year, day.month, day.day, hour, minute, tzinfo=timezone.utc)
            return {
                "title": title,
                "start_time": start_dt,
                "end_time": start_dt + timedelta(minutes=duration_minutes),
                "location": None,
                "attendees": [],
            }

        time_match = re.search(r"(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)", msg, re.IGNORECASE)
        if day and time_match:
            hour = int(time_match.group(1))
            minute = int(time_match.group(2) or 0)
            ampm = time_match.group(3).lower()
            if ampm == "pm" and hour < 12:
                hour += 12
            if ampm == "am" and hour == 12:
                hour = 0
            start_dt = datetime(day.year, day.month, day.day, hour, minute, tzinfo=timezone.utc)
            return {
                "title": title,
                "start_time": start_dt,
                "end_time": start_dt + timedelta(minutes=duration_minutes),
                "location": None,
                "attendees": [],
            }

        return None


router = AgentRouter()


async def route_to_agent(user_message: str, user_id: str) -> dict:
    """Main entry point for agent routing."""
    route = router.route(user_message)

    if not route:
        return {"agent": "orchestrator", "intent": "general", "handled": False}

    agent_name, intent = route

    handler = router.agents[agent_name]["handler"]
    try:
        result = await asyncio.wait_for(handler(user_message, user_id), timeout=25)
    except asyncio.TimeoutError:
        return {
            "agent": agent_name,
            "intent": intent,
            "handled": True,
            "reply": f"{agent_name.capitalize()} is taking too long right now. Please try again in a moment.",
            "tool": "timeout",
        }
    except Exception as e:
        return {
            "agent": agent_name,
            "intent": intent,
            "handled": True,
            "reply": f"{agent_name.capitalize()} could not complete that request: {e}",
            "tool": "error",
        }

    return {
        "agent": agent_name,
        "intent": intent,
        "handled": True,
        **result,
    }
