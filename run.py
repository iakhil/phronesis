#!/usr/bin/env python3
"""
Phronesis Startup Script
Checks environment setup and starts the Flask application.
"""

import os
import sys
import subprocess
from pathlib import Path

def check_requirements():
    """Check if all requirements are met before starting."""
    print("🧠 Phronesis - AI Learning Feed")
    print("=" * 40)
    
    # Check if virtual environment is active
    if not hasattr(sys, 'real_prefix') and not (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
        print("⚠️  Warning: No virtual environment detected.")
        print("   Consider creating one with: python -m venv venv")
        print("   Then activate it with: source venv/bin/activate")
        print()
    
    # Check if .env file exists
    env_file = Path('.env')
    if not env_file.exists():
        print("⚠️  No .env file found!")
        print("   Please copy env_example.txt to .env and add your Gemini API key.")
        print("   Command: cp env_example.txt .env")
        print()
        return False
    
    # Check if API key is set
    try:
        from dotenv import load_dotenv
        load_dotenv()
        api_key = os.environ.get('GEMINI_API_KEY')
        if not api_key or api_key == 'your_gemini_api_key_here':
            print("⚠️  Gemini API key not configured!")
            print("   Please edit .env and add your actual API key.")
            print("   Get one from: https://makersuite.google.com/app/apikey")
            print()
            return False
    except ImportError:
        print("⚠️  Missing dependencies!")
        print("   Please install with: pip install -r requirements.txt")
        print()
        return False
    
    print("✅ Environment check passed!")
    print()
    return True

def start_app():
    """Start the Flask application."""
    if not check_requirements():
        print("Please fix the issues above before starting the app.")
        sys.exit(1)
    
    print("🚀 Starting Phronesis...")
    print("   Open your browser and go to: http://localhost:5000")
    print("   Press Ctrl+C to stop the server")
    print()
    
    try:
        from app import app
        app.run(debug=True, host='0.0.0.0', port=5000)
    except KeyboardInterrupt:
        print("\n👋 Thanks for using Phronesis! Happy learning!")
    except Exception as e:
        print(f"❌ Error starting the app: {e}")
        sys.exit(1)

if __name__ == '__main__':
    start_app() 