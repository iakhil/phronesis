import os
import json
import time
from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__, static_folder='frontend/dist', static_url_path='/')
cors = CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}})
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key')

# Configure Gemini API
gemini_api_key = os.environ.get('GEMINI_API_KEY')
if gemini_api_key:
    genai.configure(api_key=gemini_api_key)
    model = genai.GenerativeModel('gemini-2.0-flash-exp')
else:
    model = None
    print("Warning: GEMINI_API_KEY not found. Content generation will be disabled.")

# Predefined topic categories
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

@app.route('/')
def index():
    """Serve React app index during production build."""
    try:
        return send_from_directory(app.static_folder, 'index.html')
    except Exception:
        return jsonify({"error": "Frontend build not found. Run npm run build in frontend/."}), 500

@app.route('/api/generate-content', methods=['POST'])
def generate_content():
    """Generate engaging content for a specific topic"""
    if not model:
        return jsonify({
            'error': 'Content generation is not available. Please configure GEMINI_API_KEY.'
        }), 500
    
    data = request.json
    topic = data.get('topic', '')
    content_type = data.get('type', 'fact')  # fact, story, question, tip
    
    if not topic:
        return jsonify({'error': 'Topic is required'}), 400
    
    try:
        # Define different content types and their prompts
        prompts = {
            'fact': f"""Generate an interesting, surprising fact about {topic}. 
                       Make it engaging and educational. Include why this fact is important or fascinating.
                       Keep it under 150 words. Format as a single engaging paragraph.""",
            
            'story': f"""Tell a brief, captivating story related to {topic}. 
                        It could be historical, biographical, or about a discovery/invention.
                        Make it narrative and engaging. Keep it under 200 words.""",
            
            'question': f"""Create a thought-provoking question about {topic} followed by 
                           an insightful explanation of the answer. Make it intellectually stimulating.
                           Keep it under 150 words.""",
            
            'tip': f"""Provide a practical, actionable tip or insight related to {topic}.
                      Make it something someone can apply or think about in their daily life.
                      Keep it under 100 words.""",
            
            'challenge': f"""Present an interesting challenge or puzzle related to {topic}.
                            Include the solution and explanation. Make it engaging and educational.
                            Keep it under 180 words."""
        }
        
        prompt = prompts.get(content_type, prompts['fact'])
        
        response = model.generate_content(prompt)
        content = response.text.strip()
        
        return jsonify({
            'content': content,
            'type': content_type,
            'topic': topic,
            'timestamp': int(time.time())
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to generate content: {str(e)}'}), 500

@app.route('/api/topics')
def get_topics():
    """Get all available topics"""
    return jsonify(TOPIC_CATEGORIES)

# SPA fallback and static assets
@app.route('/assets/<path:path>')
def assets(path):
    return send_from_directory(app.static_folder + '/assets', path)

@app.errorhandler(404)
def spa_fallback(_):
    # If path doesn't start with /api, serve React index.html
    if not request.path.startswith('/api'):
        try:
            return send_from_directory(app.static_folder, 'index.html')
        except Exception:
            return jsonify({"error": "Frontend build not found. Run npm run build in frontend/."}), 404
    return jsonify({'error': 'Not found'}), 404

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) 