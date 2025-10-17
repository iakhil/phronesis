"""
Pipecat Server for Phronesis
Handles room creation, bot management, and client connections
"""

import asyncio
import os
import subprocess
import sys
from typing import Dict, Tuple

from dotenv import load_dotenv
import uvicorn

# Load environment variables from .env file
load_dotenv()
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel

# Import Daily REST API for room management
import requests

app = FastAPI(title="Phronesis Pipecat Server", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:5000"],  # React dev servers + legacy backend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store running bot processes
bot_procs: Dict[int, Tuple[subprocess.Popen, str]] = {}

# Daily API setup
daily_api_key = os.getenv("DAILY_API_KEY")
if not daily_api_key:
    print("Warning: DAILY_API_KEY not set. Please set it in your .env file")
    daily_api_key = "your_daily_api_key_here"

DAILY_API_BASE = "https://api.daily.co/v1"

class ConnectionRequest(BaseModel):
    bot_type: str = "general"  # "general", "coding", "quiz", "scroll"
    topic: str = ""
    concept: str = ""

async def create_room_and_token():
    """Create a Daily room and generate access credentials."""
    try:
        # Create room using Daily REST API
        room_response = requests.post(
            f"{DAILY_API_BASE}/rooms",
            headers={
                "Authorization": f"Bearer {daily_api_key}",
                "Content-Type": "application/json"
            },
            json={
                "properties": {
                    "max_participants": 10,
                    "enable_recording": False,
                    "enable_screenshare": False
                }
            }
        )
        
        if room_response.status_code not in [200, 201]:
            raise Exception(f"Failed to create room: {room_response.text}")
        
        room_data = room_response.json()
        room_url = room_data["url"]
        
        # Create token for the room
        token_response = requests.post(
            f"{DAILY_API_BASE}/meeting-tokens",
            headers={
                "Authorization": f"Bearer {daily_api_key}",
                "Content-Type": "application/json"
            },
            json={
                "properties": {
                    "room_name": room_data["name"],
                    "is_owner": True,
                    "user_name": "Phronesis AI"
                }
            }
        )
        
        if token_response.status_code not in [200, 201]:
            raise Exception(f"Failed to create token: {token_response.text}")
        
        token_data = token_response.json()
        token = token_data["token"]
        
        return room_url, token
    except Exception as e:
        print(f"Error creating room: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create room: {str(e)}")

def start_bot_process(room_url: str, token: str, bot_type: str = "general", topic: str = "", concept: str = ""):
    """Start a bot process for a specific room."""
    # Clean up any existing bots for this room
    for pid, (proc, room) in list(bot_procs.items()):
        if room == room_url:
            try:
                proc.terminate()
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                proc.kill()
            del bot_procs[pid]
    
    # Start new bot process
    bot_file = os.path.join(os.path.dirname(__file__), "bot-gemini.py")
    cmd = [
        sys.executable, bot_file,
        "-u", room_url,
        "-t", token,
        "--bot-type", bot_type,
        "--topic", topic,
        "--concept", concept
    ]
    
    try:
        proc = subprocess.Popen(cmd, cwd=os.path.dirname(__file__))
        bot_procs[proc.pid] = (proc, room_url)
        print(f"Started bot process {proc.pid} for room {room_url}")
        return proc.pid
    except Exception as e:
        print(f"Error starting bot process: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to start bot: {str(e)}")

@app.get("/")
async def root():
    """Simple browser access - creates room and redirects to Daily meeting."""
    try:
        room_url, token = await create_room_and_token()
        bot_pid = start_bot_process(room_url, token)
        
        # Return connection info for frontend
        return JSONResponse({
            "room_url": room_url,
            "token": token,
            "bot_pid": bot_pid,
            "meeting_url": f"https://phronesis.daily.co/{room_url.split('/')[-1]}"
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/connect")
async def connect(request: ConnectionRequest):
    """RTVI client connection endpoint."""
    try:
        room_url, token = await create_room_and_token()
        bot_pid = start_bot_process(
            room_url, 
            token, 
            request.bot_type, 
            request.topic, 
            request.concept
        )
        
        return JSONResponse({
            "room_url": room_url,
            "token": token,
            "bot_pid": bot_pid,
            "bot_type": request.bot_type,
            "topic": request.topic,
            "concept": request.concept
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/status")
async def status():
    """Get server status and running bots."""
    return JSONResponse({
        "status": "running",
        "active_bots": len(bot_procs),
        "bot_processes": [
            {"pid": pid, "room": room} 
            for pid, (proc, room) in bot_procs.items()
        ]
    })

@app.delete("/bot/{bot_pid}")
async def stop_bot(bot_pid: int):
    """Stop a specific bot process."""
    if bot_pid not in bot_procs:
        raise HTTPException(status_code=404, detail="Bot not found")
    
    proc, room_url = bot_procs[bot_pid]
    try:
        proc.terminate()
        proc.wait(timeout=5)
    except subprocess.TimeoutExpired:
        proc.kill()
    finally:
        del bot_procs[bot_pid]
    
    return JSONResponse({"message": f"Bot {bot_pid} stopped"})

# Serve React frontend
try:
    app.mount("/", StaticFiles(directory="../frontend/dist", html=True), name="static")
except:
    print("Warning: Could not mount React frontend. Make sure to build it first.")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7860, reload=True)
