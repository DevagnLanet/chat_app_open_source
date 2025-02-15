# FastAPI Backend for Ephemeral Virtual Meeting Space

This backend uses FastAPI with an in-memory model to manage ephemeral room metadata without any persistent storage. All data is transient and maintained only while the application is running.

## Features

- **Room Creation:** Generates a unique room key and shareable link.
- **Room Validation:** Checks if a room exists and refreshes its last active timestamp.
- **WebSocket Endpoint:** Handles real-time signaling/chat; data is only relayed, not stored.
- **Ephemeral Data:** Uses an in-memory dictionary; rooms expire after 5 minutes of inactivity.
- **Background Cleanup:** A background task automatically removes expired rooms.

## Setup Instructions

1. **Clone the Repository** and navigate to the `backend/` folder.

2. **Create a Virtual Environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
