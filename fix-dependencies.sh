#!/bin/bash

cd "$(dirname "$0")"

echo "🔧 Fixing corrupted node_modules..."
echo ""

# Kill any running servers
echo "1. Stopping any running servers..."
lsof -ti:3000 | xargs kill -9 2>/dev/null
pkill -f "next dev" 2>/dev/null
sleep 1
echo ""

# Remove corrupted node_modules
echo "2. Removing corrupted node_modules..."
rm -rf node_modules
rm -f package-lock.json
echo ""

# Clear Next.js cache
echo "3. Clearing Next.js cache..."
rm -rf .next
echo ""

# Reinstall dependencies
echo "4. Reinstalling dependencies..."
npm install
echo ""

echo "✅ Done! You can now run ./start-app.command or npm run dev"
echo ""


