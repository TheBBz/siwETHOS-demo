#!/bin/bash
# Initialize SSL certificates with Let's Encrypt
# Run this on the server after first deployment

set -e

DOMAIN="api.thebbz.xyz"
EMAIL="admin@thebbz.xyz"  # Change this to your email
APP_DIR="/opt/ethos"

cd "$APP_DIR"

echo "🔐 Setting up SSL certificates for $DOMAIN"

# Check if certificates already exist
if [ -f "certbot/conf/live/$DOMAIN/fullchain.pem" ]; then
    echo "✅ Certificates already exist"
    exit 0
fi

# Create dummy certificates first (so nginx can start)
echo "📝 Creating dummy certificates..."
mkdir -p "certbot/conf/live/$DOMAIN"
openssl req -x509 -nodes -newkey rsa:4096 -days 1 \
    -keyout "certbot/conf/live/$DOMAIN/privkey.pem" \
    -out "certbot/conf/live/$DOMAIN/fullchain.pem" \
    -subj "/CN=localhost"

# Create options-ssl-nginx.conf if it doesn't exist
mkdir -p "certbot/conf"
if [ ! -f "certbot/conf/options-ssl-nginx.conf" ]; then
    curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > "certbot/conf/options-ssl-nginx.conf"
fi

# Start nginx with dummy certs
echo "🚀 Starting nginx..."
docker-compose up -d nginx

# Wait for nginx to be ready
sleep 5

# Delete dummy certificates
rm -rf "certbot/conf/live/$DOMAIN"
rm -rf "certbot/conf/archive/$DOMAIN"
rm -rf "certbot/conf/renewal/$DOMAIN.conf"

# Request real certificates
echo "📜 Requesting Let's Encrypt certificates..."
docker-compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAIN"

# Restart nginx with real certificates
echo "🔄 Restarting nginx with real certificates..."
docker-compose restart nginx

echo ""
echo "✅ SSL certificates installed successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. Start all services: docker-compose up -d"
echo "   2. Check status: docker-compose ps"
echo "   3. View logs: docker-compose logs -f"
echo ""
