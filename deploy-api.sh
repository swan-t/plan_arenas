#!/bin/bash
set -e

echo "🚀 Deploying Arena API..."

# Check if API directory exists
if [ ! -d "/var/www/arena-api" ]; then
    echo "❌ Error: API directory not found at /var/www/arena-api"
    echo "Please ensure your API is deployed there first"
    exit 1
fi

# Navigate to API directory
cd /var/www/arena-api

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Restart API service
echo "🔄 Restarting API service..."
sudo systemctl restart arena-api

# Wait for service to start
echo "⏳ Waiting for service to start..."
sleep 5

# Check service status
echo "🔍 Checking service status..."
if sudo systemctl is-active --quiet arena-api; then
    echo "✅ API service is running"
else
    echo "❌ API service failed to start"
    sudo systemctl status arena-api --no-pager
    exit 1
fi

echo "✅ API deployment complete!"
echo "🌐 API available at: https://arenaapi.skhojden.se"

