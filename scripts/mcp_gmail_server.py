"""
MCP Server for Gmail
Run this to enable Gmail integration with PETAL.
"""

import base64
import logging
import os
from email.mime.text import MIMEText

from fastapi import FastAPI, HTTPException
import google.auth
from google.oauth2 import service_account
from googleapiclient.discovery import build

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Gmail MCP Server")


class GmailClient:
    def __init__(self):
        self.credentials_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
        self.service = None
        self._authenticated = False

    def _authenticate(self):
        if self._authenticated:
            return

        scopes = ["https://www.googleapis.com/auth/gmail.modify", "https://www.googleapis.com/auth/gmail.send"]

        try:
            if self.credentials_path:
                credentials = service_account.Credentials.from_service_account_file(
                    self.credentials_path,
                    scopes=scopes,
                )
            else:
                credentials, _ = google.auth.default(scopes=scopes)

            self.service = build("gmail", "v1", credentials=credentials)
            self._authenticated = True
            logger.info("Authenticated with Gmail API")
        except Exception as e:
            logger.warning("Failed to authenticate Gmail client: %s", e)
            self.service = None

    def list_emails(self, max_results: int = 20):
        self._authenticate()
        if not self.service:
            return {"error": "Gmail API not available"}

        try:
            response = self.service.users().messages().list(userId="me", maxResults=max_results).execute()
            messages = response.get("messages", [])
            items = []
            for message in messages[:max_results]:
                detail = self.service.users().messages().get(userId="me", id=message["id"], format="metadata").execute()
                headers = detail.get("payload", {}).get("headers", [])
                header_map = {h.get("name", "").lower(): h.get("value", "") for h in headers}
                items.append(
                    {
                        "id": message["id"],
                        "subject": header_map.get("subject", "(no subject)"),
                        "from": header_map.get("from", ""),
                        "date": header_map.get("date", ""),
                    }
                )
            return {"emails": items}
        except Exception as e:
            logger.error("Failed to list emails: %s", e)
            return {"error": str(e)}

    def send_email(self, to: str, subject: str, body: str, cc: str | None = None):
        self._authenticate()
        if not self.service:
            return {"error": "Gmail API not available"}

        try:
            msg = MIMEText(body)
            msg["to"] = to
            msg["subject"] = subject
            if cc:
                msg["cc"] = cc

            raw = base64.urlsafe_b64encode(msg.as_bytes()).decode()
            sent = self.service.users().messages().send(userId="me", body={"raw": raw}).execute()
            return {"id": sent.get("id"), "threadId": sent.get("threadId"), "success": True}
        except Exception as e:
            logger.error("Failed to send email: %s", e)
            return {"error": str(e)}


gmail_client = GmailClient()


@app.get("/")
async def root():
    return {"service": "Gmail MCP", "status": "running"}


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/tools/call")
async def call_tool(request: dict):
    tool_name = request.get("name")
    arguments = request.get("arguments", {})

    if tool_name == "list_emails":
        return gmail_client.list_emails(max_results=arguments.get("max_results", 20))

    if tool_name == "send_email":
        return gmail_client.send_email(
            to=arguments.get("to", ""),
            subject=arguments.get("subject", ""),
            body=arguments.get("body", ""),
            cc=arguments.get("cc"),
        )

    raise HTTPException(status_code=400, detail=f"Unknown tool: {tool_name}")


@app.get("/tools")
async def list_tools():
    return {
        "tools": [
            {
                "name": "list_emails",
                "description": "List recent emails",
                "parameters": {
                    "max_results": "integer",
                },
            },
            {
                "name": "send_email",
                "description": "Send an email",
                "parameters": {
                    "to": "string",
                    "subject": "string",
                    "body": "string",
                    "cc": "string (optional)",
                },
            },
        ]
    }
