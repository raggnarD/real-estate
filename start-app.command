#!/bin/bash

# Get the directory where this script is located
cd "$(dirname "$0")"

echo "🚀 Starting Real Estate App..."
echo ""

# Kill any existing processes on port 3000
echo "🧹 Cleaning up port 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null 2>/dev/null
sleep 1
echo ""

# Check if node_modules exists and is valid
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
elif [ -f "node_modules/next/dist/compiled/semver/package.json" ]; then
    # Check if the corrupted file exists
    if ! node -e "require('next')" 2>/dev/null; then
        echo "⚠️  Detected corrupted node_modules. Cleaning and reinstalling..."
        rm -rf node_modules package-lock.json
        npm install
        echo ""
    fi
fi

# Clear Next.js cache
echo "🧹 Clearing Next.js cache..."
rm -rf .next
echo ""

# Start the development server
echo "🔥 Starting Next.js development server..."
echo "📱 App will be available at http://localhost:3000"
echo ""
echo "Waiting for server to start..."
echo "Press Ctrl+C to stop the server"
echo ""

# Start server and show output
npm run dev

