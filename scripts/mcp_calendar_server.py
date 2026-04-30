"""
MCP Server for Google Calendar
Run this to enable Google Calendar integration with PETAL

Requirements:
- Google Cloud project with Calendar API enabled
- Service account with calendar access
- OAuth credentials or service account key

Usage:
    python -m scripts.mcp_calendar_server

Set environment:
    GCAL_MCP_URL=http://localhost:8001
"""

import os
import json
import logging
from datetime import datetime, timedelta
from typing import Optional
from dataclasses import dataclass

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Google Calendar MCP Server")


class CreateEventRequest(BaseModel):
    title: str
    start_time: str
    end_time: str
    attendees: list[str] = []
    location: str = None


class ListEventsRequest(BaseModel):
    start_time: str = None
    end_time: str = None
    max_results: int = 50


class CalendarClient:
    """Google Calendar API client."""

    def __init__(self):
        self.credentials_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
        self.service = None
        self._authenticated = False

    def _authenticate(self):
        if self._authenticated:
            return

        try:
            import google.auth
            from google.oauth2 import service_account
            from googleapiclient.discovery import build

            if self.credentials_path:
                credentials = service_account.Credentials.from_service_account_file(
                    self.credentials_path,
                    scopes=["https://www.googleapis.com/auth/calendar"],
                )
            else:
                credentials, _ = google.auth.default(
                    scopes=["https://www.googleapis.com/auth/calendar"]
                )

            self.service = build("calendar", "v3", credentials=credentials)
            self._authenticated = True
            logger.info("Authenticated with Google Calendar API")
        except ImportError:
            logger.warning("google-api-python-client not installed")
            self.service = None
        except Exception as e:
            logger.warning(f"Failed to authenticate: {e}")
            self.service = None

    def create_event(
        self,
        title: str,
        start_time: str,
        end_time: str,
        attendees: list[str] = None,
        location: str = None,
    ) -> dict:
        self._authenticate()

        if not self.service:
            return {"error": "Google Calendar API not available"}

        try:
            start_dt = datetime.fromisoformat(start_time.replace("Z", "+00:00"))
            end_dt = datetime.fromisoformat(end_time.replace("Z", "+00:00"))

            event = {
                "summary": title,
                "location": location,
                "start": {
                    "dateTime": start_dt.isoformat(),
                    "timeZone": "UTC",
                },
                "end": {
                    "dateTime": end_dt.isoformat(),
                    "timeZone": "UTC",
                },
            }

            if attendees:
                event["attendees"] = [{"email": email} for email in attendees]

            created = (
                self.service.events()
                .insert(
                    calendarId="primary",
                    body=event,
                    conferenceDataVersion=1,
                )
                .execute()
            )

            meet_link = (
                created.get("conferenceData", {}).get("entryPoints", [{}])[0].get("uri")
            )

            return {
                "event_id": created["id"],
                "htmlLink": created.get("htmlLink"),
                "meet_link": meet_link,
            }
        except Exception as e:
            logger.error(f"Failed to create calendar event: {e}")
            return {"error": str(e)}

    def list_events(
        self,
        start_time: str = None,
        end_time: str = None,
        max_results: int = 50,
    ) -> dict:
        self._authenticate()

        if not self.service:
            return {"error": "Google Calendar API not available"}

        try:
            now = datetime.utcnow().isoformat() + "Z"
            time_min = start_time or now
            time_max = (
                end_time or (datetime.utcnow() + timedelta(days=30)).isoformat() + "Z"
            )

            events = (
                self.service.events()
                .list(
                    calendarId="primary",
                    timeMin=time_min,
                    timeMax=time_max,
                    maxResults=max_results,
                    singleEvents=True,
                    orderBy="startTime",
                )
                .execute()
            )

            return {
                "events": [
                    {
                        "id": e["id"],
                        "summary": e.get("summary"),
                        "start": e["start"].get("dateTime", e["start"].get("date")),
                        "end": e["end"].get("dateTime", e["end"].get("date")),
                    }
                    for e in events.get("items", [])
                ]
            }
        except Exception as e:
            logger.error(f"Failed to list calendar events: {e}")
            return {"error": str(e)}

    def delete_event(self, event_id: str) -> dict:
        self._authenticate()

        if not self.service:
            return {"error": "Google Calendar API not available"}

        try:
            self.service.events().delete(
                calendarId="primary",
                eventId=event_id,
            ).execute()
            return {"success": True}
        except Exception as e:
            logger.error(f"Failed to delete calendar event: {e}")
            return {"error": str(e)}

    def find_free_slots(
        self,
        start_date: str,
        end_date: str,
        duration_minutes: int = 60,
    ) -> dict:
        self._authenticate()

        if not self.service:
            return {"error": "Google Calendar API not available"}

        try:
            start_dt = datetime.fromisoformat(start_date)
            end_dt = datetime.fromisoformat(end_date)

            free_slots = []
            current = start_dt

            while current + timedelta(minutes=duration_minutes) <= end_dt:
                time_min = current.isoformat() + "Z"
                time_max = (
                    current + timedelta(minutes=duration_minutes)
                ).isoformat() + "Z"

                events = (
                    self.service.freebusy()
                    .query(
                        body={
                            "timeMin": time_min,
                            "timeMax": time_max,
                            "items": [{"id": "primary"}],
                        },
                    )
                    .execute()
                )

                busy = events.get("calendars", {}).get("primary", {}).get("busy", [])

                if not busy:
                    free_slots.append(
                        {
                            "start": current.isoformat(),
                            "end": (
                                current + timedelta(minutes=duration_minutes)
                            ).isoformat(),
                        }
                    )

                current += timedelta(minutes=30)

            return {"free_slots": free_slots}
        except Exception as e:
            logger.error(f"Failed to find free slots: {e}")
            return {"error": str(e)}


calendar_client = CalendarClient()


@app.get("/")
async def root():
    return {"service": "Google Calendar MCP", "status": "running"}


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/tools/call")
async def call_tool(request: dict):
    """MCP tool call endpoint."""
    tool_name = request.get("name")
    arguments = request.get("arguments", {})

    logger.info(f"Tool call: {tool_name}")

    if tool_name == "create_event":
        return calendar_client.create_event(
            title=arguments.get("title"),
            start_time=arguments.get("start_time"),
            end_time=arguments.get("end_time"),
            attendees=arguments.get("attendees", []),
            location=arguments.get("location"),
        )

    elif tool_name == "list_events":
        return calendar_client.list_events(
            start_time=arguments.get("start_time"),
            end_time=arguments.get("end_time"),
            max_results=arguments.get("max_results", 50),
        )

    elif tool_name == "delete_event":
        return calendar_client.delete_event(arguments.get("event_id"))

    elif tool_name == "find_free_slots":
        return calendar_client.find_free_slots(
            start_date=arguments.get("start_date"),
            end_date=arguments.get("end_date"),
            duration_minutes=arguments.get("duration_minutes", 60),
        )

    raise HTTPException(status_code=400, detail=f"Unknown tool: {tool_name}")


@app.get("/tools")
async def list_tools():
    """List available MCP tools."""
    return {
        "tools": [
            {
                "name": "create_event",
                "description": "Create a Google Calendar event",
                "parameters": {
                    "title": "string",
                    "start_time": "string (ISO format)",
                    "end_time": "string (ISO format)",
                    "attendees": "array of email strings",
                    "location": "string (optional)",
                },
            },
            {
                "name": "list_events",
                "description": "List Google Calendar events",
                "parameters": {
                    "start_time": "string (optional)",
                    "end_time": "string (optional)",
                    "max_results": "integer",
                },
            },
            {
                "name": "delete_event",
                "description": "Delete a Google Calendar event",
                "parameters": {
                    "event_id": "string",
                },
            },
            {
                "name": "find_free_slots",
                "description": "Find available time slots",
                "parameters": {
                    "start_date": "string",
                    "end_date": "string",
                    "duration_minutes": "integer",
                },
            },
        ]
    }


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("MCP_PORT", "8001"))
    uvicorn.run(app, host="0.0.0.0", port=port)
