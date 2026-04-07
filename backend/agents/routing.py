import re
import logging
import uuid
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

            if "create" in msg_lower or "add" in msg_lower or "new" in msg_lower:
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

            if "list" in msg_lower or "show" in msg_lower:
                tasks = await task_tools.list_tasks(db, user_id)
                if not tasks:
                    return {
                        "reply": "No tasks found.",
                        "agent": "task_agent",
                        "tool": "list_tasks",
                    }
                lines = ["Your tasks:"]
                for t in tasks:
                    lines.append(f"- [{t['status']}] {t['title']} ({t['priority']})")
                return {
                    "reply": "\n".join(lines),
                    "agent": "task_agent",
                    "tool": "list_tasks",
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

            if "save" in msg_lower or "note" in msg_lower or "remember" in msg_lower:
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

            if "search" in msg_lower or "find" in msg_lower:
                return {
                    "reply": "Please provide a search query for your notes.",
                    "agent": "info_agent",
                    "tool": "search",
                }

            notes = await notes_tools.list_notes(db, user_id)
            if not notes:
                return {
                    "reply": "No notes found.",
                    "agent": "info_agent",
                    "tool": "list_notes",
                }
            lines = ["Your notes:"]
            for n in notes:
                lines.append(f"- {n['title']}")
            return {
                "reply": "\n".join(lines),
                "agent": "info_agent",
                "tool": "list_notes",
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


router = AgentRouter()


async def route_to_agent(user_message: str, user_id: str) -> dict:
    """Main entry point for agent routing."""
    route = router.route(user_message)

    if not route:
        return {"agent": "orchestrator", "intent": "general", "handled": False}

    agent_name, intent = route

    handler = router.agents[agent_name]["handler"]
    result = await handler(user_message, user_id)

    return {
        "agent": agent_name,
        "intent": intent,
        "handled": True,
        **result,
    }
