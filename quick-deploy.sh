#!/bin/bash
set -e

echo "🚀 Quick Deploy - Arena Scheduler Frontend"

# Check if we're in the right directory
if [ ! -f "arena-scheduler/package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Deploy frontend
echo "📦 Deploying frontend..."
./deploy-frontend-only.sh

# Configure Caddy if not already configured
if [ ! -f "/etc/caddy/Caddyfile" ] || ! grep -q "arena.skhojden.se" /etc/caddy/Caddyfile; then
    echo "🔧 Configuring Caddy..."
    sudo cp Caddyfile /etc/caddy/
    sudo caddy validate --config /etc/caddy/Caddyfile
    sudo systemctl start caddy
    sudo systemctl enable caddy
fi

echo ""
echo "🎉 Deployment complete!"
echo "🌐 Frontend: https://arena.skhojden.se"
echo "🔗 API: https://arenaapi.skhojden.se"
echo ""
echo "🔍 Checking services..."
echo "Frontend status:"
curl -I https://arena.skhojden.se 2>/dev/null | head -1 || echo "❌ Frontend not responding"
echo "API status:"
curl -I https://arenaapi.skhojden.se 2>/dev/null | head -1 || echo "❌ API not responding"
