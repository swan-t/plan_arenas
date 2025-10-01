# Frontend Deployment Plan - Arena Scheduler

## Overview
This document outlines the deployment process for the Arena Scheduler React frontend on a Glesys server using Caddy as the web server.

**Domain:**
- Frontend: `arena.skhojden.se`
- API: `arenaapi.skhojden.se` (already deployed)

## Prerequisites

### Server Requirements
- Glesys server with Ubuntu 20.04+ or similar Linux distribution
- Node.js 18+ installed
- Caddy web server installed
- Git installed
- SSL certificates (handled by Caddy)

### Domain Configuration
- DNS record pointing to your Glesys server IP:
  - `arena.skhojden.se` → Server IP

## Server Setup

### 1. Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Caddy
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy

# Install Git
sudo apt install git
```

### 2. Create Application User

```bash
# Create dedicated user for the application
sudo useradd -m -s /bin/bash arena-app
sudo usermod -aG www-data arena-app
```

### 3. Set Up Application Directory

```bash
# Create application directory
sudo mkdir -p /var/www/arena-scheduler
sudo chown arena-app:www-data /var/www/arena-scheduler
sudo chmod 755 /var/www/arena-scheduler

# Switch to application user
sudo su - arena-app
cd /var/www/arena-scheduler
```

## Frontend Deployment

### 1. Clone and Build Frontend

```bash
# Clone repository
git clone <your-repo-url> .

# Install dependencies
cd arena-scheduler
npm install

# Copy production environment
cp ../production.env .env.production

# Build for production
npm run build
```

### 2. Deploy Built Files

```bash
# Copy built files to web root
sudo cp -r dist/* /var/www/arena-scheduler/
sudo chown -R www-data:www-data /var/www/arena-scheduler
```

## Caddy Configuration

### 1. Create Caddyfile

```bash
# Create Caddyfile
sudo tee /etc/caddy/Caddyfile << EOF
# Arena Scheduler Frontend
arena.skhojden.se {
    root * /var/www/arena-scheduler
    file_server
    
    # Handle SPA routing - serve index.html for all routes
    try_files {path} /index.html
    
    # Security headers
    header {
        X-Content-Type-Options nosniff
        X-Frame-Options DENY
        X-XSS-Protection "1; mode=block"
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
        Referrer-Policy "strict-origin-when-cross-origin"
    }
    
    # Cache static assets
    @static {
        path *.js *.css *.png *.jpg *.jpeg *.gif *.ico *.svg *.woff *.woff2 *.ttf *.eot
    }
    header @static Cache-Control "public, max-age=31536000"
    
    # Compress responses
    encode gzip
    
    # Logging
    log {
        output file /var/log/caddy/arena-frontend.log
        format json
    }
}
EOF
```

### 2. Test and Start Caddy

```bash
# Test Caddy configuration
sudo caddy validate --config /etc/caddy/Caddyfile

# Start and enable Caddy
sudo systemctl start caddy
sudo systemctl enable caddy
```

## Deployment Scripts

### 1. Frontend Deployment Script

Create `deploy-frontend.sh`:

```bash
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

# Copy built files to web root
echo "📋 Copying built files..."
sudo cp -r dist/* /var/www/arena-scheduler/
sudo chown -R www-data:www-data /var/www/arena-scheduler

# Reload Caddy
echo "🔄 Reloading Caddy..."
sudo systemctl reload caddy

echo "✅ Frontend deployment complete!"
echo "🌐 Frontend available at: https://arena.skhojden.se"
```

### 2. Server Setup Script

Create `setup-frontend-server.sh`:

```bash
#!/bin/bash
set -e

echo "🛠️ Setting up Arena Scheduler Frontend Server..."

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
chown arena-app:www-data /var/www/arena-scheduler
chmod 755 /var/www/arena-scheduler

# Create log directory
mkdir -p /var/log/caddy
chown caddy:caddy /var/log/caddy

echo "✅ Server setup complete!"
echo ""
echo "Next steps:"
echo "1. Run ./deploy-frontend.sh to deploy the frontend"
echo "2. Configure Caddy with the provided Caddyfile"
echo "3. Start Caddy service"
```

## Environment Configuration

### Production Environment

The `production.env` file should contain:

```bash
# Production Environment Configuration
VITE_API_BASE_URL=https://arenaapi.skhojden.se/api
VITE_APP_ENV=production
VITE_APP_NAME=Arena Scheduler
VITE_APP_VERSION=1.0.0
```

## Quick Start

### 1. Initial Setup (run once)
```bash
# On your server
sudo ./setup-frontend-server.sh
```

### 2. Deploy Frontend
```bash
# From your local machine or server
./deploy-frontend.sh
```

### 3. Configure Caddy
```bash
# Copy Caddyfile to Caddy config directory
sudo cp Caddyfile /etc/caddy/

# Test and start Caddy
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl start caddy
sudo systemctl enable caddy
```

## Verification

Check that everything is working:

```bash
# Check Caddy status
sudo systemctl status caddy

# Test frontend
curl -I https://arena.skhojden.se

# Check if API is accessible from frontend
curl -I https://arenaapi.skhojden.se/api
```

## Troubleshooting

### Common Issues

1. **Caddy won't start**: Check configuration with `sudo caddy validate`
2. **Frontend not loading**: Check file permissions and Caddy logs
3. **API connection issues**: Verify API is running and accessible
4. **SSL issues**: Ensure DNS is properly configured

### Useful Commands

```bash
# Check Caddy status
sudo systemctl status caddy

# View Caddy logs
sudo journalctl -u caddy -f

# Check file permissions
ls -la /var/www/arena-scheduler/

# Test configuration
sudo caddy validate --config /etc/caddy/Caddyfile
```

## File Locations

- **Frontend files**: `/var/www/arena-scheduler/`
- **Caddy config**: `/etc/caddy/Caddyfile`
- **Logs**: `/var/log/caddy/arena-frontend.log`
- **Environment**: `arena-scheduler/.env.production`

## Security Notes

1. Update the email in Caddyfile for SSL certificate notifications
2. Ensure firewall allows ports 80 and 443
3. Regularly update system packages
4. Monitor Caddy logs for any issues

---

**Note**: This deployment plan assumes your API is already running at `arenaapi.skhojden.se`. The frontend will connect to this API endpoint.
