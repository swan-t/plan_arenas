#!/bin/bash
set -e

echo "🚀 Deploying Arena Scheduler Frontend..."

# Check if we're in the right directory
if [ ! -f "arena-scheduler/package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Navigate to frontend directory
cd arena-scheduler

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Copy production environment file
echo "📋 Setting up production environment..."
cp ../production.env .env.production

# Build for production
echo "🔨 Building for production..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Build failed - dist directory not found"
    exit 1
fi

# Copy built files to web root (adjust path as needed)
echo "📋 Copying built files..."
sudo cp -r dist/* /var/www/arena-scheduler/
sudo chown -R www-data:www-data /var/www/arena-scheduler

# Reload Caddy
echo "🔄 Reloading Caddy..."
sudo systemctl reload caddy

echo "✅ Frontend deployment complete!"
echo "🌐 Frontend available at: https://arena.skhojden.se"

