"""
Phronesis - AI-Powered Learning Platform
Backend API built with FastAPI
"""
import os
import json
import time
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Phronesis API",
    description="AI-powered educational learning platform",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173", 
        "http://localhost:5000",
        "http://127.0.0.1:5000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini API
gemini_api_key = os.environ.get('GEMINI_API_KEY')
if gemini_api_key:
    genai.configure(api_key=gemini_api_key)
    model = genai.GenerativeModel('gemini-2.0-flash-exp')
else:
    model = None
    print("Warning: GEMINI_API_KEY not found. Content generation will be disabled.")

# Computer Science subtopics with structured curriculum
CS_SUBTOPICS = {
    "Data Structures": {
        "icon": "🗂️",
        "description": "Master the fundamental building blocks of efficient algorithms",
        "concepts": []  # Will be generated dynamically
    },
    "Computer Architecture": {
        "icon": "🖥️",
        "description": "Understand how computers work from transistors to processors",
        "concepts": []
    },
    "Computer Networks": {
        "icon": "🌐",
        "description": "Learn how computers communicate across the internet",
        "concepts": []
    },
    "Operating Systems": {
        "icon": "⚙️",
        "description": "Explore how software manages hardware resources",
        "concepts": []
    }
}

# Legacy topic categories (kept for Scroll mode)
TOPIC_CATEGORIES = {
    "Science & Technology": [
        "Artificial Intelligence", "Space Exploration", "Quantum Physics", 
        "Biotechnology", "Climate Science", "Computer Science"
    ],
    "History & Culture": [
        "Ancient Civilizations", "World Wars", "Art History", 
        "Philosophy", "Archaeology", "Cultural Studies"
    ],
    "Health & Wellness": [
        "Nutrition Science", "Mental Health", "Exercise Science", 
        "Medical Breakthroughs", "Psychology", "Mindfulness"
    ],
    "Business & Economics": [
        "Entrepreneurship", "Economics", "Finance", 
        "Marketing", "Innovation", "Leadership"
    ],
    "Arts & Literature": [
        "Creative Writing", "Visual Arts", "Music Theory", 
        "Film Studies", "Poetry", "Literary Analysis"
    ],
    "Mathematics & Logic": [
        "Pure Mathematics", "Statistics", "Logic Puzzles", 
        "Mathematical History", "Applied Mathematics", "Problem Solving"
    ]
}

# Pydantic models for request validation
class ContentRequest(BaseModel):
    topic: str
    type: str = 'fact'

class CurriculumRequest(BaseModel):
    subtopic: str

class SummaryRequest(BaseModel):
    topic: str

class QuizRequest(BaseModel):
    subtopic: str
    num_questions: int = 5

class AnswerSubmission(BaseModel):
    question: str
    correct_answer: str
    user_answer: str

# API Routes
@app.get("/api/topics")
async def get_topics():
    """Get all available topics"""
    return TOPIC_CATEGORIES

@app.get("/api/cs-subtopics")
async def get_cs_subtopics():
    """Get Computer Science subtopics"""
    return CS_SUBTOPICS

@app.get("/api/get-api-key")
async def get_api_key():
    """Get Gemini API key for Live API (use ephemeral tokens in production)"""
    api_key = os.environ.get('GEMINI_API_KEY')
    if not api_key:
        raise HTTPException(status_code=500, detail="API key not configured")
    return {"apiKey": api_key}

@app.post("/api/generate-content")
async def generate_content(request: ContentRequest):
    """Generate engaging content for a specific topic"""
    if not model:
        raise HTTPException(
            status_code=500,
            detail="Content generation is not available. Please configure GEMINI_API_KEY."
        )
    
    if not request.topic:
        raise HTTPException(status_code=400, detail="Topic is required")
    
    try:
        # Define different content types and their prompts
        prompts = {
            'fact': f"""Generate an interesting, surprising fact about {request.topic}. 
                       Make it engaging and educational. Include why this fact is important or fascinating.
                       Keep it under 150 words. Format as a single engaging paragraph.""",
            
            'story': f"""Tell a brief, captivating story related to {request.topic}. 
                        It could be historical, biographical, or about a discovery/invention.
                        Make it narrative and engaging. Keep it under 200 words.""",
            
            'question': f"""Create a thought-provoking question about {request.topic} followed by 
                           an insightful explanation of the answer. Make it intellectually stimulating.
                           Keep it under 150 words.""",
            
            'tip': f"""Provide a practical, actionable tip or insight related to {request.topic}.
                      Make it something someone can apply or think about in their daily life.
                      Keep it under 100 words.""",
            
            'challenge': f"""Present an interesting challenge or puzzle related to {request.topic}.
                            Include the solution and explanation. Make it engaging and educational.
                            Keep it under 180 words."""
        }
        
        prompt = prompts.get(request.type, prompts['fact'])
        
        response = model.generate_content(prompt)
        content = response.text.strip()
        
        return {
            "content": content,
            "type": request.type,
            "topic": request.topic,
            "timestamp": int(time.time())
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate content: {str(e)}")

@app.post("/api/generate-curriculum")
async def generate_curriculum(request: CurriculumRequest):
    """Generate curriculum for a CS subtopic"""
    if not model:
        raise HTTPException(
            status_code=500,
            detail="Content generation is not available. Please configure GEMINI_API_KEY."
        )
    
    if not request.subtopic:
        raise HTTPException(status_code=400, detail="Subtopic is required")
    
    try:
        prompt = f"""You are a Computer Science curriculum designer. Generate a comprehensive curriculum for "{request.subtopic}".

Create a structured list of 8-10 major concepts that a student should learn, ordered from beginner to advanced.
Each concept should be clear, specific, and build upon previous concepts.

Format your response as a JSON array of concept objects with this structure:
[
  {{"title": "Concept Name", "level": "beginner|intermediate|advanced", "description": "Brief 1-sentence description"}},
  ...
]

Return ONLY the JSON array, no other text."""
        
        response = model.generate_content(prompt)
        content = response.text.strip()
        
        # Clean up response to extract JSON
        if '```json' in content:
            content = content.split('```json')[1].split('```')[0].strip()
        elif '```' in content:
            content = content.split('```')[1].split('```')[0].strip()
        
        # Parse JSON
        curriculum = json.loads(content)
        
        return {
            "subtopic": request.subtopic,
            "curriculum": curriculum
        }
        
    except Exception as e:
        print(f"Error generating curriculum: {e}")
        # Fallback curriculum
        fallback = [
            {"title": "Introduction", "level": "beginner", "description": f"Overview of {request.subtopic}"},
            {"title": "Fundamentals", "level": "beginner", "description": f"Core concepts in {request.subtopic}"},
            {"title": "Intermediate Topics", "level": "intermediate", "description": f"Building on the basics"},
            {"title": "Advanced Concepts", "level": "advanced", "description": f"Deep dive into {request.subtopic}"},
        ]
        return {
            "subtopic": request.subtopic,
            "curriculum": fallback
        }

@app.post("/api/generate-summary")
async def generate_summary(request: SummaryRequest):
    """Generate a brief summary for a topic"""
    if not model:
        raise HTTPException(
            status_code=500,
            detail="Content generation is not available. Please configure GEMINI_API_KEY."
        )
    
    if not request.topic:
        raise HTTPException(status_code=400, detail="Topic is required")
    
    try:
        prompt = f"""Write a brief, engaging one-paragraph summary about {request.topic}. 
                    Make it informative and captivating in 2-3 sentences (max 60 words).
                    Focus on why it's interesting and what makes it worth learning about."""
        
        response = model.generate_content(prompt)
        summary = response.text.strip()
        
        return {
            "summary": summary,
            "topic": request.topic
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate summary: {str(e)}")

# Serve React frontend
frontend_path = Path(__file__).parent / "frontend" / "dist"

@app.get("/assets/{path:path}")
async def serve_assets(path: str):
    """Serve static assets"""
    file_path = frontend_path / "assets" / path
    if file_path.exists():
        return FileResponse(file_path)
    raise HTTPException(status_code=404, detail="Asset not found")

@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    """Serve React SPA - catch all route for client-side routing"""
    # If it's an API route that doesn't exist, return 404
    if full_path.startswith("api/"):
        raise HTTPException(status_code=404, detail="API endpoint not found")
    
    # Serve index.html for all other routes (SPA fallback)
    index_path = frontend_path / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
    
    raise HTTPException(
        status_code=500,
        detail="Frontend build not found. Run 'npm run build' in frontend/ directory."
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=5000,
        reload=True,
        log_level="info"
    )
