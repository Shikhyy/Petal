"""
MCP Client for Google Calendar integration.
This provides the Model Context Protocol interface for calendar operations.
"""

import os
import logging
from typing import Optional, Any
import httpx
from ..config import settings

logger = logging.getLogger(__name__)


class MCPClient:
    """Base MCP client for connecting to MCP servers."""

    def __init__(self, server_url: str):
        self.server_url = server_url
        self.client = httpx.AsyncClient(timeout=30.0)

    async def call_tool(self, tool_name: str, arguments: dict) -> dict:
        """Call an MCP tool."""
        if not self.server_url:
            raise ValueError("MCP server URL not configured")

        try:
            response = await self.client.post(
                f"{self.server_url}/tools/call",
                json={
                    "name": tool_name,
                    "arguments": arguments,
                },
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"MCP tool call failed: {e}")
            return {"error": str(e)}

    async def close(self):
        await self.client.aclose()


class CalendarMCPClient(MCPClient):
    """MCP client for Google Calendar operations."""

    def __init__(self):
        super().__init__(settings.GCAL_MCP_URL or "")

    async def create_event(
        self,
        title: str,
        start_time: str,
        end_time: str,
        attendees: list[str] = None,
        location: str = None,
    ) -> dict:
        """Create a Google Calendar event."""
        if not self.server_url:
            return {
                "error": "Google Calendar MCP not configured. Set GCAL_MCP_URL in environment."
            }

        return await self.call_tool(
            "create_event",
            {
                "title": title,
                "start_time": start_time,
                "end_time": end_time,
                "attendees": attendees or [],
                "location": location,
            },
        )

    async def list_events(
        self,
        start_time: str = None,
        end_time: str = None,
        max_results: int = 50,
    ) -> dict:
        """List Google Calendar events."""
        if not self.server_url:
            return {
                "error": "Google Calendar MCP not configured. Set GCAL_MCP_URL in environment."
            }

        return await self.call_tool(
            "list_events",
            {
                "start_time": start_time,
                "end_time": end_time,
                "max_results": max_results,
            },
        )

    async def delete_event(self, event_id: str) -> dict:
        """Delete a Google Calendar event."""
        if not self.server_url:
            return {
                "error": "Google Calendar MCP not configured. Set GCAL_MCP_URL in environment."
            }

        return await self.call_tool(
            "delete_event",
            {
                "event_id": event_id,
            },
        )

    async def find_free_slots(
        self,
        start_date: str,
        end_date: str,
        duration_minutes: int = 60,
    ) -> dict:
        """Find free time slots."""
        if not self.server_url:
            return {
                "error": "Google Calendar MCP not configured. Set GCAL_MCP_URL in environment."
            }

        return await self.call_tool(
            "find_free_slots",
            {
                "start_date": start_date,
                "end_date": end_date,
                "duration_minutes": duration_minutes,
            },
        )


class GmailMCPClient(MCPClient):
    """MCP client for Gmail operations."""

    def __init__(self):
        super().__init__(settings.GMAIL_MCP_URL or "")

    async def send_email(
        self,
        to: str,
        subject: str,
        body: str,
        cc: str = None,
    ) -> dict:
        """Send an email via Gmail."""
        if not self.server_url:
            return {
                "error": "Gmail MCP not configured. Set GMAIL_MCP_URL in environment."
            }

        return await self.call_tool(
            "send_email",
            {
                "to": to,
                "subject": subject,
                "body": body,
                "cc": cc,
            },
        )

    async def list_emails(self, max_results: int = 20) -> dict:
        """List recent emails."""
        if not self.server_url:
            return {
                "error": "Gmail MCP not configured. Set GMAIL_MCP_URL in environment."
            }

        return await self.call_tool(
            "list_emails",
            {
                "max_results": max_results,
            },
        )


_calendar_client = None
_gmail_client = None


def get_calendar_mcp() -> CalendarMCPClient:
    """Get cached Calendar MCP client."""
    global _calendar_client
    if _calendar_client is None:
        _calendar_client = CalendarMCPClient()
    return _calendar_client


def get_gmail_mcp() -> GmailMCPClient:
    """Get cached Gmail MCP client."""
    global _gmail_client
    if _gmail_client is None:
        _gmail_client = GmailMCPClient()
    return _gmail_client


async def close_mcp_clients():
    """Close all MCP clients."""
    global _calendar_client, _gmail_client
    if _calendar_client:
        await _calendar_client.close()
        _calendar_client = None
    if _gmail_client:
        await _gmail_client.close()
        _gmail_client = None
