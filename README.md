# 🧠 Phronesis - AI Learning Feed

Transform your scrolling habit into a learning journey! Phronesis is an AI-powered learning app that provides engaging, educational content feeds as an alternative to mindless social media scrolling.

## ✨ Features

- **Topic Selection**: Choose from 6 categories and 36+ specialized topics
- **AI-Generated Content**: Powered by Gemini 2.0 Flash for diverse, engaging content
- **Multiple Content Types**: Facts, stories, questions, tips, and challenges
- **Infinite Scroll**: Just like social media, but educational
- **Responsive Design**: Works beautifully on desktop and mobile
- **Interactive Features**: Like, share, and bookmark content
- **Keyboard Shortcuts**: Space to generate new content, Escape to go back

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- Google Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd phronesis
   ```

2. **Create a virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   cp env_example.txt .env
   ```
   
   Edit `.env` and add your Gemini API key:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   FLASK_ENV=development
   FLASK_DEBUG=True
   ```

5. **Run the application**
   ```bash
   python app.py
   ```

6. **Open your browser**
   Navigate to `http://localhost:5000`

## 🔑 Getting a Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and add it to your `.env` file

## 📱 How to Use

1. **Choose a Topic**: Browse categories and select any topic that interests you
2. **Start Learning**: The app will generate engaging content using AI
3. **Scroll to Learn**: New content loads automatically as you scroll
4. **Interact**: Like and share content you find valuable
5. **Navigate**: Use the back button or press Escape to choose a new topic

## 🛠️ Tech Stack

- **Backend**: Flask (Python)
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **AI**: Google Gemini 2.0 Flash
- **Styling**: Modern CSS with gradients and animations
- **Responsive**: Mobile-first design

## 🎯 Content Types

- **💡 Facts**: Surprising and educational facts
- **📖 Stories**: Captivating narratives and histories
- **❓ Questions**: Thought-provoking Q&A
- **💡 Tips**: Practical, actionable insights
- **🧩 Challenges**: Interactive puzzles and problems

## 📂 Project Structure

```
phronesis/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── env_example.txt       # Environment variables template
├── templates/
│   ├── base.html         # Base template with common styles
│   ├── index.html        # Topic selection page
│   └── feed.html         # Content feed page
└── README.md             # This file
```

## 🚀 Deployment

### Local Development
```bash
python app.py
```

### Production (using Gunicorn)
```bash
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

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
Customize the appearance by editing the CSS in the template files or the base styles in `templates/base.html`.

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
