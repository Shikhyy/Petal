from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List
import asyncio
import json
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


class ConnectionManager:
    """Manages WebSocket connections for agent status updates."""

    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(
            f"WebSocket connected. Active connections: {len(self.active_connections)}"
        )

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        logger.info(
            f"WebSocket disconnected. Active connections: {len(self.active_connections)}"
        )

    async def broadcast(self, message: dict):
        """Broadcast a message to all connected clients."""
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.warning(f"Failed to send to connection: {e}")
                disconnected.append(connection)

        for conn in disconnected:
            self.disconnect(conn)


manager = ConnectionManager()


@router.websocket("/ws/agents")
async def websocket_agents(websocket: WebSocket):
    """WebSocket endpoint for real-time agent status updates."""
    await manager.connect(websocket)

    try:
        from ..api.routes.agents import agent_statuses, update_agent_status

        initial_status = {
            "type": "agent_status",
            "agents": list(agent_statuses.values()),
        }
        await websocket.send_json(initial_status)

        while True:
            data = await websocket.receive_text()

            try:
                message = json.loads(data)

                if message.get("type") == "ping":
                    await websocket.send_json({"type": "pong"})

            except json.JSONDecodeError:
                logger.warning(f"Invalid JSON received: {data}")

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)


@router.websocket("/ws/chat/{session_id}")
async def websocket_chat(websocket: WebSocket, session_id: str):
    """WebSocket endpoint for real-time chat with streaming responses."""
    await websocket.accept()
    logger.info(f"Chat WebSocket connected for session: {session_id}")

    try:
        while True:
            data = await websocket.receive_text()

            try:
                message = json.loads(data)

                if message.get("type") == "message":
                    from ..agents.orchestrator import run_agent

                    user_message = message.get("content", "")
                    result = await run_agent(user_message, session_id)

                    await websocket.send_json(
                        {
                            "type": "response",
                            "reply": result["reply"],
                            "agents_invoked": result["agents_invoked"],
                            "tool_calls": result.get("tool_calls", []),
                            "latency_ms": result.get("latency_ms", 0),
                        }
                    )

            except json.JSONDecodeError:
                await websocket.send_json(
                    {
                        "type": "error",
                        "message": "Invalid message format",
                    }
                )

    except WebSocketDisconnect:
        logger.info(f"Chat WebSocket disconnected for session: {session_id}")
    except Exception as e:
        logger.error(f"Chat WebSocket error: {e}")
        await websocket.send_json(
            {
                "type": "error",
                "message": str(e),
            }
        )


async def broadcast_agent_update(agent_name: str, status: str):
    """Broadcast agent status update to all connected clients."""
    from ..api.routes.agents import agent_statuses

    await manager.broadcast(
        {
            "type": "agent_update",
            "agent": agent_name,
            "status": status,
            "timestamp": asyncio.get_event_loop().time(),
        }
    )
