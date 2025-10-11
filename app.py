"""
Phronesis - AI-Powered Learning Platform
Backend API built with FastAPI
"""
import os
import json
import time
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
import google.generativeai as genai
from dotenv import load_dotenv

# Import database and models
from database import get_db, init_db
import crud
from models import Curriculum

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Phronesis API",
    description="AI-powered educational learning platform",
    version="1.0.0"
)

# Initialize database on startup (will be called automatically)
def startup_event():
    """Initialize database tables on application startup"""
    init_db()
    print("✓ Database initialized successfully")

# Call startup on module load (alternative to deprecated on_event)
startup_event()

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

class CurriculumUpdate(BaseModel):
    curriculum_data: list

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
async def generate_curriculum(request: CurriculumRequest, db: Session = Depends(get_db)):
    """Generate curriculum for a CS subtopic and store in database"""
    if not request.subtopic:
        raise HTTPException(status_code=400, detail="Subtopic is required")
    
    # Check if curriculum already exists in database
    existing_curriculum = crud.get_curriculum(db, request.subtopic)
    if existing_curriculum:
        print(f"✓ Retrieved curriculum from database: {request.subtopic}")
        return {
            "subtopic": request.subtopic,
            "curriculum": existing_curriculum.curriculum_data,
            "cached": True
        }
    
    # Generate new curriculum if not in database
    if not model:
        raise HTTPException(
            status_code=500,
            detail="Content generation is not available. Please configure GEMINI_API_KEY."
        )
    
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
        
        # Store in database
        crud.create_curriculum(db, request.subtopic, curriculum)
        print(f"✓ Stored curriculum in database: {request.subtopic}")
        
        return {
            "subtopic": request.subtopic,
            "curriculum": curriculum,
            "cached": False
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
        
        # Store fallback in database
        try:
            crud.create_curriculum(db, request.subtopic, fallback)
        except:
            pass  # Ignore database errors for fallback
        
        return {
            "subtopic": request.subtopic,
            "curriculum": fallback,
            "cached": False
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

# ============================================================================
# Curriculum CRUD API Endpoints
# ============================================================================

@app.get("/api/curriculums")
async def get_all_curriculums(db: Session = Depends(get_db)):
    """Get all stored curriculums from database"""
    curriculums = crud.get_all_curriculums(db)
    return {
        "count": len(curriculums),
        "curriculums": [
            {
                "subtopic": c.subtopic,
                "curriculum": c.curriculum_data,
                "created_at": c.created_at.isoformat() if c.created_at else None,
                "updated_at": c.updated_at.isoformat() if c.updated_at else None
            }
            for c in curriculums
        ]
    }

@app.get("/api/curriculum/{subtopic}")
async def get_curriculum_by_subtopic(subtopic: str, db: Session = Depends(get_db)):
    """Get curriculum for a specific subtopic from database"""
    curriculum = crud.get_curriculum(db, subtopic)
    if not curriculum:
        raise HTTPException(status_code=404, detail=f"Curriculum not found for: {subtopic}")
    
    return {
        "subtopic": curriculum.subtopic,
        "curriculum": curriculum.curriculum_data,
        "created_at": curriculum.created_at.isoformat() if curriculum.created_at else None,
        "updated_at": curriculum.updated_at.isoformat() if curriculum.updated_at else None
    }

@app.delete("/api/curriculum/{subtopic}")
async def delete_curriculum_by_subtopic(subtopic: str, db: Session = Depends(get_db)):
    """Delete a curriculum from database"""
    success = crud.delete_curriculum(db, subtopic)
    if not success:
        raise HTTPException(status_code=404, detail=f"Curriculum not found for: {subtopic}")
    
    return {"message": f"Curriculum deleted successfully for: {subtopic}"}

@app.put("/api/curriculum/{subtopic}")
async def update_curriculum_by_subtopic(
    subtopic: str,
    update: CurriculumUpdate,
    db: Session = Depends(get_db)
):
    """Update or create curriculum for a subtopic"""
    curriculum = crud.update_curriculum(db, subtopic, update.curriculum_data)
    return {
        "subtopic": curriculum.subtopic,
        "curriculum": curriculum.curriculum_data,
        "message": "Curriculum updated successfully"
    }

@app.get("/api/curriculum-explanation/{subtopic}")
async def get_curriculum_explanation(subtopic: str, db: Session = Depends(get_db)):
    """
    Get a comprehensive explanation of the curriculum for Learn mode.
    This generates the initial AI introduction that the voice agent will read.
    """
    # Get curriculum from database
    curriculum = crud.get_curriculum(db, subtopic)
    if not curriculum:
        raise HTTPException(status_code=404, detail=f"Curriculum not found for: {subtopic}")
    
    if not model:
        raise HTTPException(
            status_code=500,
            detail="Content generation is not available. Please configure GEMINI_API_KEY."
        )
    
    try:
        # Generate a conversational explanation of the curriculum
        curriculum_list = "\n".join([
            f"{i+1}. {item['title']} ({item['level']}): {item['description']}"
            for i, item in enumerate(curriculum.curriculum_data)
        ])
        
        prompt = f"""You are a specialized AI tutor for {subtopic} ONLY. The student wants to learn about {subtopic}.

Here is the curriculum they'll be learning:
{curriculum_list}

Create a warm, engaging introduction (2-3 short paragraphs) that:
1. Welcomes them to learning specifically about {subtopic}
2. Briefly explains why {subtopic} is important and exciting in Computer Science
3. Gives a high-level overview of the key concepts they'll learn (without listing them all)
4. Clearly state that you are specialized in {subtopic} and ready to answer ANY questions about this topic
5. Mention that you'll keep discussions focused on {subtopic} to ensure deep learning

Keep it conversational and encouraging, as if you're speaking to them. Maximum 150 words.
Important: Emphasize that you are a specialized tutor for {subtopic} specifically."""
        
        response = model.generate_content(prompt)
        explanation = response.text.strip()
        
        return {
            "subtopic": subtopic,
            "explanation": explanation,
            "curriculum": curriculum.curriculum_data
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate explanation: {str(e)}")

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
