# Quick Start - Frontend Deployment

## Prerequisites
- Glesys server with Ubuntu 20.04+
- Root access to the server
- DNS record: `arena.skhojden.se` → Server IP
- API already deployed at `arenaapi.skhojden.se`

## 🚀 Super Quick Deploy (3 steps)

### 1. Initial Server Setup (run once)
```bash
# On your server, run as root:
sudo ./setup-frontend-server.sh
```

### 2. Deploy Everything
```bash
# From your local machine or server:
./quick-deploy.sh
```

### 3. Verify
```bash
# Check if it's working:
curl -I https://arena.skhojden.se
```

## 📁 What Gets Deployed

- **Frontend**: React app built and served from `/var/www/arena-scheduler/`
- **Domain**: `arena.skhojden.se`
- **SSL**: Automatic via Caddy
- **API Connection**: Points to `arenaapi.skhojden.se/api`

## 🔧 Manual Steps (if needed)

### Deploy Frontend Only
```bash
./deploy-frontend-only.sh
```

### Configure Caddy Manually
```bash
sudo cp Caddyfile-frontend /etc/caddy/Caddyfile
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl start caddy
sudo systemctl enable caddy
```

## 🔍 Troubleshooting

### Check Services
```bash
# Caddy status
sudo systemctl status caddy

# View logs
sudo journalctl -u caddy -f
```

### Check Files
```bash
# Frontend files
ls -la /var/www/arena-scheduler/

# Fix permissions if needed
sudo chown -R www-data:www-data /var/www/arena-scheduler
```

### Test Configuration
```bash
# Test Caddy config
sudo caddy validate --config /etc/caddy/Caddyfile
```

## 📋 File Locations

- **Frontend**: `/var/www/arena-scheduler/`
- **Caddy config**: `/etc/caddy/Caddyfile`
- **Logs**: `/var/log/caddy/arena-frontend.log`
- **Environment**: `arena-scheduler/.env.production`

## 🔄 Updates

To update the frontend:
```bash
./deploy-frontend-only.sh
```

That's it! The script will pull latest changes, build, and deploy automatically.

---

**Note**: Make sure your API is running at `arenaapi.skhojden.se` before deploying the frontend.
