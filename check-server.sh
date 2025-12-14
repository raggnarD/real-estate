#!/bin/bash

echo "=== Checking Server Status ==="
echo ""

echo "1. Processes on port 3000:"
lsof -i :3000 2>/dev/null || echo "   No process found"
echo ""

echo "2. Node processes:"
ps aux | grep -i "node.*next\|next.*dev" | grep -v grep || echo "   No Next.js processes found"
echo ""

echo "3. Testing connection:"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:3000 2>&1 || echo "   Connection failed"
echo ""

echo "4. Checking .next directory:"
if [ -d ".next" ]; then
    echo "   .next directory exists"
    ls -la .next | head -5
else
    echo "   .next directory missing"
fi
echo ""

echo "=== Done ==="


