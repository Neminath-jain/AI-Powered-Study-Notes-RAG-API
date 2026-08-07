import json
import uuid
from typing import Dict, List
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from backend.core.logging import logger

router = APIRouter(prefix="/ws", tags=["websockets"])

class ConnectionManager:
    def __init__(self):
        # Maps session_id to list of active WebSockets
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, session_id: str, websocket: WebSocket):
        await websocket.accept()
        if session_id not in self.active_connections:
            self.active_connections[session_id] = []
        self.active_connections[session_id].append(websocket)
        logger.info("WebSocket client connected to study room", session_id=session_id)

    def disconnect(self, session_id: str, websocket: WebSocket):
        if session_id in self.active_connections:
            if websocket in self.active_connections[session_id]:
                self.active_connections[session_id].remove(websocket)
            if not self.active_connections[session_id]:
                del self.active_connections[session_id]
        logger.info("WebSocket client disconnected from study room", session_id=session_id)

    async def broadcast(self, session_id: str, message: dict):
        if session_id in self.active_connections:
            for connection in self.active_connections[session_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.warning("Error broadcasting WebSocket message", error=str(e))

manager = ConnectionManager()

@router.websocket("/chat/{session_id}")
async def websocket_chat_endpoint(websocket: WebSocket, session_id: str):
    await manager.connect(session_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                payload = json.loads(data)
                # Broadcast incoming room message to all connected participants
                await manager.broadcast(session_id, {
                    "type": "chat_message",
                    "user": payload.get("user", "Anonymous Peer"),
                    "content": payload.get("content", ""),
                    "timestamp": payload.get("timestamp", "")
                })
            except Exception as parse_err:
                logger.warning("Invalid WebSocket message payload", error=str(parse_err))
    except WebSocketDisconnect:
        manager.disconnect(session_id, websocket)
