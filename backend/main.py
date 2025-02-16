import asyncio
import json
from datetime import datetime, timedelta
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from utils import generate_room_key

# Configuration: room expires after 5 minutes of inactivity
ROOM_TTL_SECONDS = 5 * 60  # 5 minutes

app = FastAPI()

# Enable CORS for all origins (adjust for production as needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store for room metadata: mapping room_key -> last active timestamp
rooms = {}

# Global dictionary for active WebSocket connections per room:
# mapping room_key -> set of WebSocket connections
room_connections = {}

# Background task to clean up expired rooms
async def clean_expired_rooms():
    while True:
        now = datetime.utcnow()
        expired_rooms = [
            key for key, last_active in rooms.items()
            if (now - last_active) > timedelta(seconds=ROOM_TTL_SECONDS)
        ]
        for key in expired_rooms:
            del rooms[key]
            if key in room_connections:
                for connection in list(room_connections[key]):
                    await connection.close(code=1000)
                del room_connections[key]
            print(f"[DEBUG] Room {key} expired and removed")
        await asyncio.sleep(30)  # Check every 30 seconds

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(clean_expired_rooms())

@app.post("/create_room")
async def create_room():
    """Create a new room and return a shareable link."""
    room_key = generate_room_key()
    rooms[room_key] = datetime.utcnow()  # Set current time as last active
    room_link = f"http://localhost:8000/room/{room_key}"
    return JSONResponse({"room_key": room_key, "room_link": room_link})

@app.get("/room/{room_key}")
async def get_room(room_key: str):
    """Check if a room exists and refresh its activity timestamp."""
    if room_key in rooms:
        rooms[room_key] = datetime.utcnow()  # Refresh last active time
        return JSONResponse({"room_key": room_key, "status": "active"})
    else:
        raise HTTPException(status_code=404, detail="Room not found or expired")

@app.websocket("/ws/{room_key}")
async def websocket_endpoint(websocket: WebSocket, room_key: str):
    """
    Handle a WebSocket connection for real-time signaling, chat, and voice call signaling.
    
    - If a message is JSON, it is treated as a signaling message (for WebRTC) and is broadcast unmodified
      to all other clients in the room.
    - If a message is plain text, the sender receives "me: <message>" and all others receive "other: <message>".
    """
    print(f"[DEBUG] Attempting WebSocket connection for room: {room_key}")
    if room_key not in rooms:
        print(f"[DEBUG] Room {room_key} not found, closing connection.")
        await websocket.close(code=1008)
        return

    await websocket.accept()
    rooms[room_key] = datetime.utcnow()  # Refresh room activity upon connection

    if room_key not in room_connections:
        room_connections[room_key] = set()
    room_connections[room_key].add(websocket)
    print(f"[DEBUG] Connection accepted for room {room_key}. Total connections: {len(room_connections[room_key])}")

    try:
        while True:
            data = await websocket.receive_text()
            print(f"[DEBUG] Received data in room {room_key}: {data}")
            
            # Attempt to parse the message as JSON
            try:
                parsed = json.loads(data)
                is_json = True
            except json.JSONDecodeError:
                is_json = False

            if is_json:
                # Broadcast JSON signaling message unmodified to all connections except sender
                for connection in list(room_connections[room_key]):
                    if connection is not websocket:
                        try:
                            await connection.send_text(data)
                        except Exception as e:
                            print(f"[DEBUG] Error sending JSON message: {e}")
            else:
                # For plain text chat messages, add prefixes: sender gets "me:"; others get "other:"
                for connection in list(room_connections[room_key]):
                    try:
                        if connection is websocket:
                            await connection.send_text(f"me: {data}")
                        else:
                            await connection.send_text(f"other: {data}")
                    except Exception as e:
                        print(f"[DEBUG] Error sending text message: {e}")

            
            rooms[room_key] = datetime.utcnow()
    except WebSocketDisconnect:
        print(f"[DEBUG] Client disconnected from room {room_key}")
    finally:
        room_connections[room_key].remove(websocket)
        if not room_connections[room_key]:
            del room_connections[room_key]
