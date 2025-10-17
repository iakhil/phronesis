#!/bin/bash
set -e

echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

echo "🎨 Building frontend..."
cd frontend
npm install
npm run build
cd ..

echo "📂 Copying frontend to dist..."
mkdir -p dist
cp -r frontend/dist/* dist/

echo "✅ Build complete!"

