# Arena Scheduler Deployment Plan

## Overview
This document outlines the deployment process for the Arena Scheduler application on a Glesys server using Caddy as the web server.

**Domains:**
- Frontend: `arena.skhojden.se`
- API: `arenaapi.skhojden.se`

## Prerequisites

### Server Requirements
- Glesys server with Ubuntu 20.04+ or similar Linux distribution
- Node.js 18+ installed
- Caddy web server installed
- Git installed
- SSL certificates (handled by Caddy)

### Domain Configuration
- DNS records pointing to your Glesys server IP:
  - `arena.skhojden.se` → Server IP
  - `arenaapi.skhojden.se` → Server IP

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

# Build for production
npm run build
```

### 2. Configure Environment

Create production environment file:

```bash
# Create .env.production file
cat > .env.production << EOF
VITE_API_BASE_URL=https://arenaapi.skhojden.se/api
VITE_APP_ENV=production
EOF
```

### 3. Update API Configuration

The API base URL needs to be updated in the source code for production:

```typescript
// In src/services/api.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://arenaapi.skhojden.se/api';
```

### 4. Build and Deploy

```bash
# Build with production environment
npm run build

# Copy built files to web root
sudo cp -r dist/* /var/www/arena-scheduler/
sudo chown -R www-data:www-data /var/www/arena-scheduler
```

## API Deployment

### 1. API Server Setup

Assuming your API is a separate service (Node.js/Express, Python/Django, etc.):

```bash
# Create API directory
sudo mkdir -p /var/www/arena-api
sudo chown arena-app:www-data /var/www/arena-api

# Deploy API code
cd /var/www/arena-api
git clone <your-api-repo-url> .
```

### 2. API Configuration

Create API environment configuration:

```bash
# Create .env file for API
cat > .env << EOF
NODE_ENV=production
PORT=3001
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
CORS_ORIGIN=https://arena.skhojden.se
EOF
```

### 3. API Service Setup

Create systemd service for API:

```bash
# Create service file
sudo tee /etc/systemd/system/arena-api.service << EOF
[Unit]
Description=Arena API Service
After=network.target

[Service]
Type=simple
User=arena-app
WorkingDirectory=/var/www/arena-api
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable arena-api
sudo systemctl start arena-api
```

## Caddy Configuration

### 1. Create Caddyfile

```bash
# Create Caddyfile
sudo tee /etc/caddy/Caddyfile << EOF
# Frontend - arena.skhojden.se
arena.skhojden.se {
    root * /var/www/arena-scheduler
    file_server
    
    # Handle SPA routing
    try_files {path} /index.html
    
    # Security headers
    header {
        X-Content-Type-Options nosniff
        X-Frame-Options DENY
        X-XSS-Protection "1; mode=block"
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
    }
    
    # Cache static assets
    @static {
        path *.js *.css *.png *.jpg *.jpeg *.gif *.ico *.svg *.woff *.woff2
    }
    header @static Cache-Control "public, max-age=31536000"
}

# API - arenaapi.skhojden.se
arenaapi.skhojden.se {
    reverse_proxy localhost:3001
    
    # CORS headers
    header {
        Access-Control-Allow-Origin "https://arena.skhojden.se"
        Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
        Access-Control-Allow-Headers "Content-Type, Authorization"
        Access-Control-Allow-Credentials "true"
    }
    
    # Handle preflight requests
    @options {
        method OPTIONS
    }
    respond @options 200
    
    # Security headers
    header {
        X-Content-Type-Options nosniff
        X-Frame-Options DENY
        X-XSS-Protection "1; mode=block"
    }
}
EOF
```

### 2. Test and Reload Caddy

```bash
# Test Caddy configuration
sudo caddy validate --config /etc/caddy/Caddyfile

# Reload Caddy
sudo systemctl reload caddy
```

## SSL Certificate Setup

Caddy will automatically handle SSL certificates for both domains. Ensure:

1. DNS records are properly configured
2. Ports 80 and 443 are open in your Glesys firewall
3. Caddy can bind to these ports

## Deployment Scripts

### 1. Frontend Deployment Script

Create `deploy-frontend.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Deploying Arena Scheduler Frontend..."

# Navigate to project directory
cd /var/www/arena-scheduler/arena-scheduler

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build for production
echo "🔨 Building for production..."
npm run build

# Copy built files
echo "📋 Copying built files..."
sudo cp -r dist/* /var/www/arena-scheduler/
sudo chown -R www-data:www-data /var/www/arena-scheduler

# Reload Caddy
echo "🔄 Reloading Caddy..."
sudo systemctl reload caddy

echo "✅ Frontend deployment complete!"
```

### 2. API Deployment Script

Create `deploy-api.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Deploying Arena API..."

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

# Check service status
echo "🔍 Checking service status..."
sudo systemctl status arena-api --no-pager

echo "✅ API deployment complete!"
```

### 3. Full Deployment Script

Create `deploy-all.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Deploying Arena Scheduler Application..."

# Deploy API first
./deploy-api.sh

# Wait a moment for API to start
sleep 5

# Deploy frontend
./deploy-frontend.sh

echo "🎉 Full deployment complete!"
echo "Frontend: https://arena.skhojden.se"
echo "API: https://arenaapi.skhojden.se"
```

## Monitoring and Maintenance

### 1. Log Monitoring

```bash
# View Caddy logs
sudo journalctl -u caddy -f

# View API logs
sudo journalctl -u arena-api -f

# View application logs
tail -f /var/log/arena-scheduler/app.log
```

### 2. Health Checks

Create health check endpoints:

- Frontend: `https://arena.skhojden.se` (should return the app)
- API: `https://arenaapi.skhojden.se/api/health` (if implemented)

### 3. Backup Strategy

```bash
# Backup application files
tar -czf arena-backup-$(date +%Y%m%d).tar.gz /var/www/arena-scheduler /var/www/arena-api

# Backup Caddy configuration
cp /etc/caddy/Caddyfile /var/backups/caddy-$(date +%Y%m%d).conf
```

## Security Considerations

1. **Firewall**: Ensure only necessary ports are open (22, 80, 443)
2. **User Permissions**: Run services with minimal required permissions
3. **SSL/TLS**: Caddy handles automatic SSL certificate renewal
4. **Updates**: Regularly update system packages and dependencies
5. **Monitoring**: Set up log monitoring and alerting

## Troubleshooting

### Common Issues

1. **Caddy won't start**: Check configuration with `sudo caddy validate`
2. **API not responding**: Check service status with `sudo systemctl status arena-api`
3. **SSL issues**: Ensure DNS is properly configured and ports are open
4. **CORS errors**: Verify CORS configuration in Caddyfile

### Useful Commands

```bash
# Check Caddy status
sudo systemctl status caddy

# Check API status
sudo systemctl status arena-api

# View Caddy configuration
sudo caddy config --adapter caddyfile --config /etc/caddy/Caddyfile

# Test API connectivity
curl -I https://arenaapi.skhojden.se/api/health

# Check disk space
df -h

# Check memory usage
free -h
```

## Next Steps

1. Set up monitoring and alerting
2. Configure automated backups
3. Set up CI/CD pipeline for automated deployments
4. Implement proper logging and error tracking
5. Set up database backups (if applicable)

---

**Note**: This deployment plan assumes you have a separate API service. If your API is part of the same repository, adjust the API deployment steps accordingly.

