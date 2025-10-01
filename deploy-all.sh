#!/bin/bash
set -e

echo "🚀 Deploying Arena Scheduler Application..."

# Check if we're in the right directory
if [ ! -f "arena-scheduler/package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Deploy API first
echo "📡 Deploying API..."
./deploy-api.sh

# Wait a moment for API to start
echo "⏳ Waiting for API to stabilize..."
sleep 10

# Deploy frontend
echo "🎨 Deploying Frontend..."
./deploy-frontend.sh

echo ""
echo "🎉 Full deployment complete!"
echo "🌐 Frontend: https://arena.skhojden.se"
echo "🌐 API: https://arenaapi.skhojden.se"
echo ""
echo "🔍 Checking services..."
echo "Frontend status:"
curl -I https://arena.skhojden.se 2>/dev/null | head -1 || echo "❌ Frontend not responding"
echo "API status:"
curl -I https://arenaapi.skhojden.se 2>/dev/null | head -1 || echo "❌ API not responding"

