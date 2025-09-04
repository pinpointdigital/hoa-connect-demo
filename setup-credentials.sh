#!/bin/bash

# HOA Connect Credential Setup Script
# This script configures your production environment with real credentials

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "🔧 HOA Connect Production Credential Setup"
echo "=========================================="
echo ""

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    log_error ".env.production file not found. Creating from template..."
    cp infrastructure/env.production.template .env.production
fi

log_info "Configuring production environment with your credentials..."

# Your credentials - REPLACE WITH YOUR ACTUAL VALUES
SENDGRID_API_KEY="YOUR_SENDGRID_API_KEY_HERE"
TWILIO_ACCOUNT_SID="YOUR_TWILIO_ACCOUNT_SID_HERE"
TWILIO_AUTH_TOKEN="YOUR_TWILIO_AUTH_TOKEN_HERE"
TWILIO_PHONE_NUMBER="YOUR_TWILIO_PHONE_NUMBER_HERE"

# Generated secure keys - REPLACE WITH SECURE GENERATED VALUES
JWT_SECRET="YOUR_JWT_SECRET_HERE"
ENCRYPTION_KEY="YOUR_ENCRYPTION_KEY_HERE"
SESSION_SECRET="YOUR_SESSION_SECRET_HERE"

# Database password
DB_PASSWORD="HOAConnect2024_SecureDB_$(openssl rand -base64 12 | tr -d '=+/' | cut -c1-8)"

log_info "🔑 Setting up security keys..."

# Update security keys
sed -i.bak "s|^JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET}|" .env.production
sed -i.bak "s|^ENCRYPTION_KEY=.*|ENCRYPTION_KEY=${ENCRYPTION_KEY}|" .env.production
sed -i.bak "s|^SESSION_SECRET=.*|SESSION_SECRET=${SESSION_SECRET}|" .env.production

log_success "Security keys configured"

log_info "📧 Setting up SendGrid configuration..."

# Update SendGrid configuration
sed -i.bak "s|^SENDGRID_API_KEY=.*|SENDGRID_API_KEY=${SENDGRID_API_KEY}|" .env.production
sed -i.bak "s|^SENDGRID_FROM_EMAIL=.*|SENDGRID_FROM_EMAIL=noreply@tryhoaconnect.com|" .env.production
sed -i.bak "s|^SENDGRID_FROM_NAME=.*|SENDGRID_FROM_NAME=HOA Connect|" .env.production

log_success "SendGrid configuration updated"

log_info "📱 Setting up Twilio configuration..."

# Update Twilio configuration
sed -i.bak "s|^TWILIO_ACCOUNT_SID=.*|TWILIO_ACCOUNT_SID=${TWILIO_ACCOUNT_SID}|" .env.production
sed -i.bak "s|^TWILIO_AUTH_TOKEN=.*|TWILIO_AUTH_TOKEN=${TWILIO_AUTH_TOKEN}|" .env.production
sed -i.bak "s|^TWILIO_PHONE_NUMBER=.*|TWILIO_PHONE_NUMBER=${TWILIO_PHONE_NUMBER}|" .env.production

log_success "Twilio configuration updated"

log_info "🗄️ Setting up database configuration..."

# Update database configuration
sed -i.bak "s|^DB_PASSWORD=.*|DB_PASSWORD=${DB_PASSWORD}|" .env.production
sed -i.bak "s|CHANGE_ME_STRONG_PASSWORD_HERE|${DB_PASSWORD}|g" .env.production

log_success "Database configuration updated"

log_info "🌐 Setting up domain configuration..."

# Update domain configuration
sed -i.bak "s|^REACT_APP_API_URL=.*|REACT_APP_API_URL=https://api.tryhoaconnect.com|" .env.production
sed -i.bak "s|^CORS_ORIGIN=.*|CORS_ORIGIN=https://app.tryhoaconnect.com|" .env.production

log_success "Domain configuration updated"

# Clean up backup files
rm -f .env.production.bak

log_success "✅ Production environment configured successfully!"
echo ""
log_info "📋 Configuration Summary:"
echo "   SendGrid: noreply@tryhoaconnect.com"
echo "   Twilio Phone: ${TWILIO_PHONE_NUMBER}"
echo "   API Domain: https://api.tryhoaconnect.com"
echo "   App Domain: https://app.tryhoaconnect.com"
echo "   Database Password: ${DB_PASSWORD}"
echo ""
log_warning "⚠️  Keep your .env.production file secure and never commit it to version control!"
echo ""
log_info "🧪 Next step: Test your configuration with:"
echo "   ./test-notifications.sh"