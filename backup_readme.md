# 🧠 Phronesis - Multi-Modal AI Learning Platform

Transform your scrolling habit into a learning journey! Phronesis is an AI-powered learning platform that combines engaging content feeds with interactive voice chat for a truly multi-modal learning experience.

## ✨ Features

### 🏠 Home - Interactive Learning Hub
- **CS Subtopics**: Data Structures, Computer Architecture, Networks, Operating Systems
- **AI-Generated Curriculum**: Structured learning paths with beginner to advanced concepts
- **Learn Mode**: Voice chat with AI tutor that explains curriculum first, then answers questions
- **Quiz Mode**: AI-generated questions with real-time evaluation and feedback
- **Database-Backed**: Curriculum stored in SQLite for instant retrieval and caching

### 📱 Scroll - Infinite Learning Feed
- **Topic Selection**: Choose from 6 categories and 36+ specialized topics
- **AI-Generated Content**: Powered by Gemini 2.0 Flash for diverse, engaging content
- **Multiple Content Types**: Facts, stories, questions, tips, and challenges
- **Infinite Scroll**: Just like social media, but educational
- **Interactive Features**: Like, share, and bookmark content

### 🎨 Design & UX
- **Tabbed Interface**: Seamlessly switch between Home and Scroll modes
- **Responsive Design**: Works beautifully on desktop and mobile
- **Modern UI**: Glassmorphism effects, gradients, and smooth animations
- **Keyboard & Voice**: Multiple input methods for accessibility

## 🚀 Quick Start

### Prerequisites

- Python 3.9+
- [uv](https://docs.astral.sh/uv/) (fast Python package installer)
- Google Gemini API key
- Node.js 18+ (for React frontend)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd phronesis
   ```

2. **Install uv (if not already installed)**
   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```

3. **Install Python dependencies**
   ```bash
   uv sync
   ```

4. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

5. **Set up environment variables**
   ```bash
   cp env_example.txt .env
   ```
   
   Edit `.env` and add your Gemini API key:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   FLASK_ENV=development
   FLASK_DEBUG=True
   ```

6. **Run the application**
   
   **Development mode (with hot reload):**
   ```bash
   # Terminal 1 - Backend
   uv run python app.py
   
   # Terminal 2 - Frontend
   cd frontend && npm run dev
   ```
   Then open `http://localhost:5173` (Vite dev server)
   
   **Production mode:**
   ```bash
   cd frontend && npm run build && cd ..
   uv run python app.py
   ```
   Then open `http://localhost:5000` (Flask serves built React app)

## 🔑 Getting a Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and add it to your `.env` file

## 📱 How to Use

### Home Tab - Interactive Learning
1. **Browse CS Subtopics**: Choose from Data Structures, Computer Architecture, Networks, or Operating Systems
2. **View Curriculum**: Click "View Curriculum" to see the AI-generated learning path
3. **Learn Mode**: 
   - AI tutor introduces the curriculum via voice
   - Continuous voice conversation for Q&A
   - Topic-focused explanations and examples
   - Voice interruption supported
4. **Quiz Mode**: 
   - **Voice-powered interactive quizzes** with 5-7 questions
   - Immediate AI feedback after each answer
   - Adaptive difficulty levels
   - Comprehensive final report with:
     - Final score and percentage
     - Areas you ACED
     - Areas to IMPROVE
     - Personalized recommendations
5. **Database Storage**: Curriculums are cached for instant loading

### Scroll Tab - Feed Mode
1. **Choose a Topic**: Browse categories and select any topic that interests you
2. **Start Scrolling**: The app will generate engaging content using AI
3. **Intelligent Caching**: Generated content is cached for instant reloads
   - First user generates content (3-7 seconds)
   - Subsequent users get instant cached content
   - Keeps 5 variations per topic/type for variety
4. **Navigate**: Scroll or swipe through content cards
5. **Interact**: Like and share content you find valuable
6. **Switch Tabs**: Return to Home to try voice chat or explore other topics

## 🛠️ Tech Stack

- **Backend**: FastAPI (Python)
- **Frontend**: React + TypeScript + Vite
- **Database**: SQLite with SQLAlchemy ORM
- **AI**: Google Gemini 2.5 Flash with Native Audio (Live API)
- **Voice**: Gemini Live API for real-time bidirectional audio
- **Package Management**: uv (Python), npm (JavaScript)
- **Styling**: Modern CSS with glassmorphism and animations
- **Responsive**: Mobile-first design with touch support

## 🎯 Content Types

- **💡 Facts**: Surprising and educational facts
- **📖 Stories**: Captivating narratives and histories
- **❓ Questions**: Thought-provoking Q&A
- **💡 Tips**: Practical, actionable insights
- **🧩 Challenges**: Interactive puzzles and problems

## 📂 Project Structure

```
phronesis/
├── app.py                 # Main FastAPI application (API + serves React build)
├── database.py            # Database configuration and session management
├── models.py              # SQLAlchemy models (Curriculum, LearningSession)
├── crud.py                # Database CRUD operations
├── pyproject.toml         # Python dependencies (uv)
├── requirements.txt       # Legacy pip requirements (kept for compatibility)
├── env_example.txt        # Environment variables template
├── phronesis.db           # SQLite database (created on first run)
├── frontend/              # React frontend
│   ├── src/
│   │   ├── App.tsx       # Main React component with routing
│   │   ├── VoiceChat.tsx # Gemini Live API voice chat component
│   │   └── main.tsx      # React entry point
│   ├── dist/             # Production build output
│   ├── package.json      # Node dependencies
│   └── vite.config.ts    # Vite configuration with proxy
├── templates/             # Legacy Jinja templates (deprecated)
└── README.md              # This file
```

## 🔌 API Endpoints

### Core Endpoints
- `GET /api/topics` - Get all available topics for Scroll mode
- `GET /api/cs-subtopics` - Get Computer Science subtopics
- `POST /api/generate-content` - Generate AI content for a topic
- `POST /api/generate-summary` - Generate topic summary
- `GET /api/get-api-key` - Get Gemini API key (dev only)

### Curriculum Management (Database-backed)
- `POST /api/generate-curriculum` - Generate and store curriculum (with caching)
- `GET /api/curriculums` - Get all stored curriculums
- `GET /api/curriculum/{subtopic}` - Get specific curriculum
- `PUT /api/curriculum/{subtopic}` - Update curriculum
- `DELETE /api/curriculum/{subtopic}` - Delete curriculum
- `GET /api/curriculum-explanation/{subtopic}` - Get AI-generated explanation for Learn mode

## 🚀 Deployment

### Local Development
```bash
# Backend
uv run python app.py

# Frontend (separate terminal)
cd frontend && npm run dev
```

### Production (using Uvicorn)
```bash
# Build frontend first
cd frontend && npm run build && cd ..

# Run with Uvicorn (production mode with multiple workers)
uv run uvicorn app:app --host 0.0.0.0 --port 5000 --workers 4
```

**Note**: FastAPI provides automatic interactive API documentation at `/docs` and `/redoc`

## 🎨 Customization

### Adding New Topics
Edit the `TOPIC_CATEGORIES` dictionary in `app.py`:

```python
TOPIC_CATEGORIES = {
    "Your Category": [
        "Topic 1", "Topic 2", "Topic 3"
    ]
}
```

### Modifying Content Types
Update the `prompts` dictionary in the `generate_content()` function to add new content types or modify existing ones.

### Styling
Customize the appearance by editing:
- React component inline styles in `frontend/src/App.tsx`
- Global styles in `frontend/src/index.css`
- Add CSS modules or styled-components for more complex styling

## 🔧 Configuration

### Environment Variables
- `GEMINI_API_KEY`: Your Google Gemini API key (required)
- `FLASK_ENV`: Set to 'development' for debug mode
- `FLASK_DEBUG`: Set to 'True' for debug mode
- `SECRET_KEY`: Flask secret key (optional, defaults to 'dev-secret-key')

### API Rate Limits
The app includes built-in rate limiting to prevent excessive API calls:
- Maximum 1 request per second
- Auto-generation pauses after 10 items
- Content generation only when tab is active

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Google Gemini for providing the AI capabilities
- Flask community for the excellent web framework
- Design inspiration from modern social media platforms

---

**Start your learning journey today!** 🎓
