# Quick Start Guide - Arena Scheduler Deployment

## Prerequisites
- Glesys server with Ubuntu 20.04+
- Root access to the server
- DNS records configured:
  - `arena.skhojden.se` → Server IP
  - `arenaapi.skhojden.se` → Server IP

## Quick Deployment Steps

### 1. Initial Server Setup
```bash
# On your server, run:
sudo ./setup-server.sh
```

### 2. Deploy Your API
```bash
# Clone your API repository to /var/www/arena-api
sudo su - arena-app
cd /var/www/arena-api
git clone <your-api-repo-url> .

# Install dependencies
npm install

# Copy the systemd service file
sudo cp arena-api.service /etc/systemd/system/

# Enable and start the service
sudo systemctl daemon-reload
sudo systemctl enable arena-api
sudo systemctl start arena-api
```

### 3. Configure Caddy
```bash
# Copy the Caddyfile
sudo cp Caddyfile /etc/caddy/

# Test configuration
sudo caddy validate --config /etc/caddy/Caddyfile

# Start Caddy
sudo systemctl start caddy
sudo systemctl enable caddy
```

### 4. Deploy Frontend
```bash
# From your local machine, run:
./deploy-frontend.sh
```

## Verification

Check that everything is working:

```bash
# Check services
sudo systemctl status caddy
sudo systemctl status arena-api

# Test endpoints
curl -I https://arena.skhojden.se
curl -I https://arenaapi.skhojden.se/api/health
```

## Environment Files

- Copy `production.env` to `arena-scheduler/.env.production` before building
- Update the API base URL in the environment file if needed

## Troubleshooting

### Caddy Issues
```bash
# Check Caddy logs
sudo journalctl -u caddy -f

# Test configuration
sudo caddy validate --config /etc/caddy/Caddyfile
```

### API Issues
```bash
# Check API logs
sudo journalctl -u arena-api -f

# Check service status
sudo systemctl status arena-api
```

### Frontend Issues
```bash
# Check if files are in place
ls -la /var/www/arena-scheduler/

# Check permissions
sudo chown -R www-data:www-data /var/www/arena-scheduler
```

## File Locations

- **Frontend**: `/var/www/arena-scheduler/`
- **API**: `/var/www/arena-api/`
- **Caddy config**: `/etc/caddy/Caddyfile`
- **API service**: `/etc/systemd/system/arena-api.service`
- **Logs**: `/var/log/caddy/` and `journalctl -u arena-api`

## Security Notes

1. Update the email in Caddyfile for SSL certificate notifications
2. Ensure firewall allows ports 80, 443, and 22
3. Consider setting up fail2ban for additional security
4. Regularly update system packages

## Next Steps

1. Set up monitoring and alerting
2. Configure automated backups
3. Set up CI/CD pipeline
4. Implement proper logging and error tracking

