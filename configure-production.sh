#!/bin/bash

# HOA Connect Production Configuration Script
# This script helps you configure your production environment variables

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

echo "🚀 HOA Connect Production Configuration"
echo "========================================"
echo ""

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    log_error ".env.production file not found. Please run: cp infrastructure/env.production.template .env.production"
    exit 1
fi

log_info "This script will help you configure your production environment variables."
log_warning "Please have your SendGrid API key and Twilio credentials ready."
echo ""

# Function to update environment variable
update_env_var() {
    local var_name=$1
    local var_description=$2
    local current_value=$3
    local is_secret=${4:-false}
    
    echo "📝 $var_description"
    if [ "$is_secret" = true ]; then
        echo "Current: [HIDDEN]"
        read -s -p "Enter new value (or press Enter to keep current): " new_value
        echo ""
    else
        echo "Current: $current_value"
        read -p "Enter new value (or press Enter to keep current): " new_value
    fi
    
    if [ ! -z "$new_value" ]; then
        # Escape special characters for sed
        escaped_value=$(printf '%s\n' "$new_value" | sed 's/[[\.*^$()+?{|]/\\&/g')
        sed -i.bak "s|^${var_name}=.*|${var_name}=${escaped_value}|" .env.production
        log_success "Updated $var_name"
    else
        log_info "Keeping current value for $var_name"
    fi
    echo ""
}

# Generate secure random strings
generate_secure_key() {
    local length=${1:-64}
    openssl rand -base64 $length | head -c $length
}

log_info "🔐 Generating secure keys..."

# Generate JWT secret
JWT_SECRET=$(generate_secure_key 64)
sed -i.bak "s|^JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET}|" .env.production

# Generate encryption key (32 chars)
ENCRYPTION_KEY=$(generate_secure_key 32 | head -c 32)
sed -i.bak "s|^ENCRYPTION_KEY=.*|ENCRYPTION_KEY=${ENCRYPTION_KEY}|" .env.production

# Generate session secret
SESSION_SECRET=$(generate_secure_key 64)
sed -i.bak "s|^SESSION_SECRET=.*|SESSION_SECRET=${SESSION_SECRET}|" .env.production

log_success "Generated secure keys for JWT, encryption, and sessions"
echo ""

# SendGrid Configuration
log_info "📧 SendGrid Configuration"
echo "Please provide your SendGrid credentials:"

current_sendgrid_key=$(grep "^SENDGRID_API_KEY=" .env.production | cut -d'=' -f2)
update_env_var "SENDGRID_API_KEY" "SendGrid API Key (starts with SG.)" "$current_sendgrid_key" true

current_from_email=$(grep "^SENDGRID_FROM_EMAIL=" .env.production | cut -d'=' -f2)
update_env_var "SENDGRID_FROM_EMAIL" "From Email Address (e.g., noreply@seabreezemanagement.com)" "$current_from_email"

current_from_name=$(grep "^SENDGRID_FROM_NAME=" .env.production | cut -d'=' -f2)
update_env_var "SENDGRID_FROM_NAME" "From Name (e.g., Seabreeze Management)" "$current_from_name"

# Twilio Configuration
log_info "📱 Twilio Configuration"
echo "Please provide your Twilio credentials:"

current_twilio_sid=$(grep "^TWILIO_ACCOUNT_SID=" .env.production | cut -d'=' -f2)
update_env_var "TWILIO_ACCOUNT_SID" "Twilio Account SID" "$current_twilio_sid" true

current_twilio_token=$(grep "^TWILIO_AUTH_TOKEN=" .env.production | cut -d'=' -f2)
update_env_var "TWILIO_AUTH_TOKEN" "Twilio Auth Token" "$current_twilio_token" true

current_twilio_phone=$(grep "^TWILIO_PHONE_NUMBER=" .env.production | cut -d'=' -f2)
update_env_var "TWILIO_PHONE_NUMBER" "Twilio Phone Number (e.g., +1234567890)" "$current_twilio_phone"

# Database Configuration
log_info "🗄️ Database Configuration"
echo "Database configuration (you can update this later when you set up your database):"

current_db_password=$(grep "^DB_PASSWORD=" .env.production | cut -d'=' -f2)
update_env_var "DB_PASSWORD" "Database Password (use a strong password)" "$current_db_password" true

# Domain Configuration
log_info "🌐 Domain Configuration"
echo "Domain and URL configuration:"

current_api_url=$(grep "^REACT_APP_API_URL=" .env.production | cut -d'=' -f2)
update_env_var "REACT_APP_API_URL" "API URL (e.g., https://api.seabreezemanagement.com)" "$current_api_url"

current_cors_origin=$(grep "^CORS_ORIGIN=" .env.production | cut -d'=' -f2)
update_env_var "CORS_ORIGIN" "Frontend URL (e.g., https://app.seabreezemanagement.com)" "$current_cors_origin"

# Clean up backup files
rm -f .env.production.bak

log_success "✅ Production configuration completed!"
echo ""
log_info "📋 Next Steps:"
echo "1. Test your SendGrid and Twilio configuration"
echo "2. Set up your domain and SSL certificates"
echo "3. Deploy to staging environment"
echo "4. Run end-to-end tests"
echo ""
log_info "🧪 To test your notification configuration, run:"
echo "   ./test-notifications.sh"
echo ""
log_warning "⚠️  Keep your .env.production file secure and never commit it to version control!"



