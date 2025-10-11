#!/bin/bash
set -e

echo "🔄 Upgrading Node.js on server..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run this script as root (use sudo)"
    exit 1
fi

# Check current Node.js version
echo "📋 Current Node.js version:"
node --version
npm --version

# Remove old Node.js
echo "🗑️ Removing old Node.js..."
apt-get remove -y nodejs npm

# Clean up any remaining packages
apt-get autoremove -y
apt-get autoclean

# Add NodeSource repository for Node.js 20
echo "📦 Adding NodeSource repository for Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -

# Install Node.js 20
echo "📦 Installing Node.js 20..."
apt-get install -y nodejs

# Verify installation
echo "✅ Installation complete!"
echo "📋 New Node.js version:"
node --version
npm --version

# Update npm to latest version
echo "📦 Updating npm to latest version..."
npm install -g npm@latest

echo "✅ Node.js upgrade complete!"
echo "📋 Final versions:"
node --version
npm --version





