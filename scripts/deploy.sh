#!/bin/bash
# Deploy Sign in with Ethos to production server
# Usage: ./scripts/deploy.sh

set -e

# Configuration
SERVER_IP="46.62.227.142"
SERVER_USER="root"
APP_DIR="/opt/ethos"
DOMAIN="api.thebbz.xyz"

echo "🚀 Deploying Sign in with Ethos to $SERVER_IP"

# Check if SSH key is available
if ! ssh -o BatchMode=yes -o ConnectTimeout=5 "$SERVER_USER@$SERVER_IP" exit 2>/dev/null; then
    echo "❌ Cannot connect to server. Check SSH key and server IP."
    exit 1
fi

echo "✅ SSH connection verified"

# Create deployment package
echo "📦 Creating deployment package..."
tar -czf deploy.tar.gz \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='dist' \
    --exclude='build' \
    --exclude='.env.local' \
    --exclude='deploy.tar.gz' \
    .

# Upload to server
echo "📤 Uploading to server..."
scp deploy.tar.gz "$SERVER_USER@$SERVER_IP:/tmp/"

# Deploy on server
echo "🔧 Deploying on server..."
ssh "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
set -e

APP_DIR="/opt/ethos"

# Create app directory
mkdir -p "$APP_DIR"
cd "$APP_DIR"

# Extract deployment package
tar -xzf /tmp/deploy.tar.gz
rm /tmp/deploy.tar.gz

# Create .env.production if it doesn't exist
if [ ! -f .env.production ]; then
    cp .env.production.example .env.production
    echo "⚠️  Created .env.production from example. Please edit with actual values!"
fi

# Create certbot directories
mkdir -p certbot/conf certbot/www

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi

# Install Docker Compose if not present
if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

echo "✅ Docker is ready"
ENDSSH

# Clean up local package
rm deploy.tar.gz

echo ""
echo "✅ Deployment package uploaded!"
echo ""
echo "📋 Next steps on server:"
echo "   1. SSH to server: ssh $SERVER_USER@$SERVER_IP"
echo "   2. Edit environment: nano $APP_DIR/.env.production"
echo "   3. Run SSL setup: cd $APP_DIR && ./scripts/init-ssl.sh"
echo "   4. Start services: docker-compose up -d"
echo ""
