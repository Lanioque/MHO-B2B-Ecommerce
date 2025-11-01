# AWS EC2 + Nginx Deployment Guide for MHO B2B Ecommerce

This guide will help you deploy your Next.js application to AWS EC2 with Nginx as a reverse proxy on a subdomain.

## Prerequisites

- AWS EC2 instance running (Ubuntu 22.04 LTS recommended)
- Domain name configured with DNS pointing to your EC2 instance
- SSH access to your EC2 instance
- Existing Nginx installation (since you already have other websites)

## Step 1: Connect to Your EC2 Instance

```bash
ssh -i /path/to/your-key.pem ubuntu@your-ec2-ip
```

## Step 2: Install Required Software

### Install Node.js (using NodeSource repository for latest LTS)

```bash
# Install Node.js 20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### Install PM2 (Process Manager)

```bash
sudo npm install -g pm2

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions shown in the output
```

### Install pnpm (since your project uses pnpm)

```bash
sudo npm install -g pnpm

# Verify
pnpm --version
```

### Install PostgreSQL (if not already installed)

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib -y

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Install Redis (if needed locally, or use Upstash)

```bash
sudo apt install redis-server -y
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

## Step 3: Create Application Directory

```bash
# Create directory for your application
sudo mkdir -p /var/www/mho
sudo chown -R $USER:$USER /var/www/mho
cd /var/www/mho
```

## Step 4: Clone Your Repository

```bash
# Option 1: Clone from GitHub (recommended)
git clone https://github.com/Lanioque/MHO-B2B-Ecommerce.git .

# Option 2: If using SSH
git clone git@github.com:Lanioque/MHO-B2B-Ecommerce.git .

# Navigate to the web app
cd apps/web
```

## Step 5: Install Dependencies and Build

```bash
# Install dependencies (from project root)
cd /var/www/mho
pnpm install

# Navigate to web app
cd apps/web

# Build the Next.js application
NODE_ENV=production pnpm build
```

## Step 6: Set Up Environment Variables

```bash
# Create production .env file
cd /var/www/mho/apps/web
nano .env.production
```

Add your production environment variables:

```env
# App Configuration
NEXT_PUBLIC_APP_URL=https://your-subdomain.yourdomain.com
NODE_ENV=production

# Database (use RDS endpoint if using AWS RDS, or local PostgreSQL)
DATABASE_URL="postgresql://username:password@localhost:5432/mho_production"

# Redis (Upstash)
REDIS_URL="https://your-redis-instance.upstash.io"
REDIS_REST_TOKEN="your-redis-token"

# NextAuth
NEXTAUTH_URL=https://your-subdomain.yourdomain.com
NEXTAUTH_SECRET="generate-a-strong-secret-here"

# Telr Payment Gateway
TELR_MODE=live
TELR_STORE_ID="your-telr-store-id"
TELR_AUTH_KEY="your-telr-auth-key"
TELR_ENDPOINT=https://secure.telr.com/gateway/remote.xml
TELR_RETURN_SUCCESS=https://your-subdomain.yourdomain.com/checkout/success
TELR_RETURN_DECLINE=https://your-subdomain.yourdomain.com/checkout/decline
TELR_RETURN_CANCEL=https://your-subdomain.yourdomain.com/checkout/cancel

# Zoho Integration
ZOHO_CLIENT_ID="your-zoho-client-id"
ZOHO_CLIENT_SECRET="your-zoho-client-secret"
ZOHO_REDIRECT_URI=https://your-subdomain.yourdomain.com/api/zoho/oauth/callback
ZOHO_REGION=eu
ZOHO_SCOPE=ZohoInventory.items.READ,ZohoBooks.contacts.CREATE,ZohoBooks.contacts.READ,ZohoBooks.salesorders.CREATE,ZohoBooks.invoices.CREATE,ZohoBooks.invoices.READ,ZohoBooks.estimates.CREATE,ZohoBooks.estimates.READ
ZOHO_ACCESS_TOKEN="your-access-token-here"
ZOHO_REFRESH_TOKEN="your-refresh-token-here"
ZOHO_ORGANIZATION_ID="your-zoho-organization-id"
ZOHO_BOOKS_ORGANIZATION_ID="your-zoho-books-organization-id"

# Cron Jobs
CRON_SECRET="your-cron-secret-here"

# Sentry (optional)
SENTRY_DSN="your-sentry-dsn"

# Logging
LOG_LEVEL=info

# GitHub Integration (optional)
GITHUB_TOKEN=your-github-personal-access-token
GITHUB_REPO_OWNER=Lanioque
GITHUB_REPO_NAME=MHO-B2B-Ecommerce
GITHUB_REPO_BRANCH=master
```

**Important:** 
- Generate a secure `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

- Secure the .env file:
```bash
chmod 600 .env.production
```

## Step 7: Set Up Database

```bash
# If using local PostgreSQL, create database and user
sudo -u postgres psql

# In PostgreSQL prompt:
CREATE DATABASE mho_production;
CREATE USER mho_user WITH ENCRYPTED PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE mho_production TO mho_user;
\q

# Run Prisma migrations
cd /var/www/mho/apps/web
npx prisma migrate deploy

# (Optional) Seed the database
npx prisma db seed
```

## Step 8: Configure Nginx for Your Subdomain

```bash
# Create Nginx configuration for your subdomain
sudo nano /etc/nginx/sites-available/mho-subdomain
```

Add the following configuration (replace `your-subdomain.yourdomain.com` with your actual subdomain):

```nginx
# Upstream for Next.js application
upstream nextjs_backend {
    server localhost:3000;
    keepalive 64;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your-subdomain.yourdomain.com;
    
    # Let's Encrypt certificate validation
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name your-subdomain.yourdomain.com;

    # SSL Configuration (will be updated after SSL setup)
    ssl_certificate /etc/letsencrypt/live/your-subdomain.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-subdomain.yourdomain.com/privkey.pem;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Logging
    access_log /var/log/nginx/mho-access.log;
    error_log /var/log/nginx/mho-error.log;

    # Increase timeouts for Next.js
    proxy_connect_timeout 600s;
    proxy_send_timeout 600s;
    proxy_read_timeout 600s;
    send_timeout 600s;

    # Buffer settings
    client_max_body_size 50M;
    client_body_buffer_size 128k;
    proxy_buffer_size 4k;
    proxy_buffers 4 32k;
    proxy_busy_buffers_size 64k;
    proxy_temp_file_write_size 64k;

    # Proxy headers
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Port $server_port;

    # WebSocket support (for Next.js HMR in development, if needed)
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";

    # Main location block
    location / {
        proxy_pass http://nextjs_backend;
        proxy_redirect off;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files caching (Next.js static assets)
    location /_next/static/ {
        proxy_pass http://nextjs_backend;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
    }

    # Image optimization
    location /_next/image {
        proxy_pass http://nextjs_backend;
        proxy_cache_valid 200 60m;
    }
}
```

Enable the site:

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/mho-subdomain /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# If test is successful, reload Nginx
sudo systemctl reload nginx
```

## Step 9: Set Up SSL Certificate with Let's Encrypt

```bash
# Install Certbot if not already installed
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d your-subdomain.yourdomain.com

# Follow the prompts:
# - Enter your email
# - Agree to terms
# - Choose whether to redirect HTTP to HTTPS (recommended: Yes)

# Certbot will automatically update your Nginx configuration
# Verify SSL certificate auto-renewal
sudo certbot renew --dry-run
```

## Step 10: Start Application with PM2

Create a PM2 ecosystem file:

```bash
cd /var/www/mho/apps/web
nano ecosystem.config.js
```

Add:

```javascript
module.exports = {
  apps: [{
    name: 'mho-web',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    cwd: '/var/www/mho/apps/web',
    instances: 2, // Use 2 instances for better performance
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    error_file: '/var/www/mho/logs/pm2-error.log',
    out_file: '/var/www/mho/logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G',
    watch: false,
    ignore_watch: ['node_modules', '.next', 'logs'],
  }]
};
```

Create logs directory:

```bash
mkdir -p /var/www/mho/logs
```

Start the application:

```bash
cd /var/www/mho/apps/web
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Check status
pm2 status
pm2 logs mho-web
```

## Step 11: Configure Firewall (if needed)

```bash
# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'

# If using AWS Security Groups, ensure ports 80 and 443 are open
# This is configured in AWS Console
```

## Step 12: Set Up Auto-Deployment Script (Optional)

Create a deployment script:

```bash
nano /var/www/mho/deploy.sh
```

Add:

```bash
#!/bin/bash

set -e

echo "Starting deployment..."

# Navigate to project directory
cd /var/www/mho

# Pull latest changes
git pull origin master

# Install dependencies
pnpm install

# Build Next.js app
cd apps/web
NODE_ENV=production pnpm build

# Run database migrations
npx prisma migrate deploy

# Restart PM2
pm2 restart mho-web

echo "Deployment complete!"
```

Make it executable:

```bash
chmod +x /var/www/mho/deploy.sh
```

## Step 13: Monitoring and Maintenance

### PM2 Monitoring

```bash
# View real-time logs
pm2 logs mho-web

# View process info
pm2 info mho-web

# Monitor resources
pm2 monit

# Restart application
pm2 restart mho-web

# Stop application
pm2 stop mho-web
```

### Nginx Logs

```bash
# View access logs
sudo tail -f /var/log/nginx/mho-access.log

# View error logs
sudo tail -f /var/log/nginx/mho-error.log
```

### Database Backups

```bash
# Create backup script
nano /var/www/mho/backup-db.sh
```

Add:

```bash
#!/bin/bash
BACKUP_DIR="/var/www/mho/backups"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="mho_production_${DATE}.sql"

mkdir -p $BACKUP_DIR

# Backup PostgreSQL database
sudo -u postgres pg_dump mho_production > $BACKUP_DIR/$FILENAME

# Compress backup
gzip $BACKUP_DIR/$FILENAME

# Remove backups older than 7 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup created: $BACKUP_DIR/${FILENAME}.gz"
```

Make executable and add to crontab:

```bash
chmod +x /var/www/mho/backup-db.sh

# Add to crontab (run daily at 2 AM)
crontab -e
# Add: 0 2 * * * /var/www/mho/backup-db.sh
```

## Step 14: Verify Deployment

1. **Check application is running:**
```bash
pm2 status
curl http://localhost:3000
```

2. **Test Nginx configuration:**
```bash
sudo nginx -t
```

3. **Visit your subdomain in browser:**
```
https://your-subdomain.yourdomain.com
```

4. **Check SSL certificate:**
```bash
sudo certbot certificates
```

## Troubleshooting

### Application not starting
```bash
# Check PM2 logs
pm2 logs mho-web --lines 100

# Check if port 3000 is in use
sudo lsof -i :3000

# Restart PM2
pm2 restart all
```

### Nginx 502 Bad Gateway
```bash
# Check if Next.js is running
pm2 status

# Check Nginx error logs
sudo tail -f /var/log/nginx/mho-error.log

# Restart both services
pm2 restart mho-web
sudo systemctl restart nginx
```

### Database connection issues
```bash
# Test PostgreSQL connection
sudo -u postgres psql -d mho_production -c "SELECT 1;"

# Check database URL in .env
cat .env.production | grep DATABASE_URL
```

### SSL certificate issues
```bash
# Renew certificate manually
sudo certbot renew

# Check certificate expiry
sudo certbot certificates
```

## Security Recommendations

1. **Keep system updated:**
```bash
sudo apt update && sudo apt upgrade -y
```

2. **Set up fail2ban for SSH protection:**
```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
```

3. **Regular backups:**
   - Database backups (automated via cron)
   - Application code (Git repository)
   - Environment variables (store securely, not in Git)

4. **Monitor logs regularly:**
   - PM2 logs
   - Nginx logs
   - System logs

## Performance Optimization

1. **Enable Next.js production optimizations** (already in next.config.ts)
2. **Use CDN for static assets** (CloudFront recommended)
3. **Database connection pooling** (configure in Prisma)
4. **Enable Redis caching** (already configured)
5. **Monitor PM2 memory usage:**
```bash
pm2 monit
```

## Next Steps

- Set up monitoring (e.g., PM2 Plus, Datadog, New Relic)
- Configure CloudFront CDN for static assets
- Set up automated CI/CD pipeline
- Configure log aggregation (e.g., CloudWatch)
- Set up alerts for downtime

---

**Important Notes:**
- Replace `your-subdomain.yourdomain.com` with your actual subdomain
- Ensure DNS A record points to your EC2 instance IP
- Keep your `.env.production` file secure and never commit it to Git
- Regularly update dependencies: `pnpm update`
- Monitor PM2 and Nginx logs for errors

