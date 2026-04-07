# Calendar Agent - Simplified version

from ..config import settings

CAL_AGENT_INSTRUCTION = """
You are PETAL's CalAgent. You manage the user's Google Calendar via MCP.

When creating events:
- Always suggest a Google Meet link for meetings
- Check for conflicts before scheduling
- Use find_free_slots when the user doesn't specify a time

Always confirm the event details including time, date, and any generated links.
"""


def create_cal_agent():
    """Create calendar agent - simplified for production."""
    return None  # Agents handled by orchestrator directly
