import re
import logging
import uuid
import asyncio
from typing import Optional

from ..config import settings
from ..tools import task_tools, notes_tools
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

        for agent_name, agent_info in self.agents.items():
            for keyword in agent_info["keywords"]:
                if keyword in msg_lower:
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
        msg_lower = user_message.lower()

        if not settings.GCAL_MCP_URL:
            return {
                "reply": "Calendar integration is not configured. Please set GCAL_MCP_URL in your environment.",
                "agent": "cal_agent",
                "tool": "unavailable",
            }

        msg_lower = user_message.lower()
        if "schedule" in msg_lower or "meeting" in msg_lower or "book" in msg_lower:
            return {
                "reply": "I can help schedule a meeting. Please provide the title, date, and time.",
                "agent": "cal_agent",
                "tool": "create_event",
            }

        return {
            "reply": "I can help you schedule meetings or view calendar events.",
            "agent": "cal_agent",
            "tool": "help",
        }

    async def _handle_info_request(self, user_message: str, user_id: str) -> dict:
        """Handle info/notes-related requests."""
        async with async_session() as db:
            msg_lower = user_message.lower()

            if any(x in msg_lower for x in ["search", "find", "lookup"]):
                query = self._extract_search_query(user_message)
                notes = await notes_tools.list_notes(db, user_id)
                if not query:
                    return {
                        "reply": "Please provide a search query for your notes.",
                        "agent": "info_agent",
                        "tool": "search_notes",
                    }

                matches = []
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
