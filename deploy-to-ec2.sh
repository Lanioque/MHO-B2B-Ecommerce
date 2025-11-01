#!/bin/bash

# ============================================
# MHO B2B Ecommerce - EC2 Deployment Script
# ============================================

# Configuration - EDIT THESE VALUES
EC2_HOST="your-ec2-ip-or-domain"
EC2_USER="ubuntu"
EC2_KEY="/path/to/your-ec2-key.pem"
REMOTE_DIR="/var/www/mho"
BRANCH="master"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Check if key file exists
if [ ! -f "$EC2_KEY" ]; then
    print_error "SSH key file not found: $EC2_KEY"
    exit 1
fi

# Check if repository is clean
print_info "Checking git status..."
if [ -n "$(git status --porcelain)" ]; then
    print_info "You have uncommitted changes."
    read -p "Do you want to commit them first? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        read -p "Enter commit message: " commit_msg
        git commit -m "$commit_msg"
    fi
fi

# Push to GitHub
print_info "Pushing to GitHub..."
if git push origin $BRANCH; then
    print_success "Code pushed to GitHub"
else
    print_error "Failed to push to GitHub"
    exit 1
fi

# Deploy to EC2
print_info "Deploying to EC2 ($EC2_HOST)..."

ssh -i "$EC2_KEY" -o StrictHostKeyChecking=no "$EC2_USER@$EC2_HOST" << ENDSSH
set -e

echo "📁 Navigating to project directory..."
cd $REMOTE_DIR || (echo "Directory not found. Run initial setup first!" && exit 1)

echo "📥 Pulling latest code..."
git fetch origin
git reset --hard origin/$BRANCH

echo "📦 Installing dependencies..."
cd apps/web
pnpm install --frozen-lockfile

echo "🏗️  Building application..."
NODE_ENV=production pnpm build

echo "🗄️  Running database migrations..."
npx prisma migrate deploy || echo "⚠️  Migration failed or no migrations to run"

echo "🔄 Restarting application..."
pm2 restart mho-web || pm2 start ecosystem.config.js

echo "📊 Application status:"
pm2 status

echo "✅ Deployment complete!"
ENDSSH

if [ $? -eq 0 ]; then
    print_success "Deployment successful!"
    print_info "Visit your application at: https://your-subdomain.yourdomain.com"
else
    print_error "Deployment failed!"
    exit 1
fi

