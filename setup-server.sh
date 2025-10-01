#!/bin/bash
set -e

echo "🛠️ Setting up Arena Scheduler Server..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run this script as root (use sudo)"
    exit 1
fi

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install Node.js 18+
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install Caddy
echo "📦 Installing Caddy..."
apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update
apt install caddy

# Install Git
echo "📦 Installing Git..."
apt install git

# Create application user
echo "👤 Creating application user..."
useradd -m -s /bin/bash arena-app || echo "User already exists"
usermod -aG www-data arena-app

# Create application directories
echo "📁 Creating application directories..."
mkdir -p /var/www/arena-scheduler
mkdir -p /var/www/arena-api
chown arena-app:www-data /var/www/arena-scheduler
chown arena-app:www-data /var/www/arena-api
chmod 755 /var/www/arena-scheduler
chmod 755 /var/www/arena-api

# Create log directory
mkdir -p /var/log/arena-scheduler
chown arena-app:www-data /var/log/arena-scheduler

echo "✅ Server setup complete!"
echo ""
echo "Next steps:"
echo "1. Deploy your API to /var/www/arena-api"
echo "2. Run ./deploy-frontend.sh to deploy the frontend"
echo "3. Configure Caddy with the provided Caddyfile"
echo "4. Start the services"

