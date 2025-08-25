#!/bin/bash

# HOA Connect Notification Testing Script
# Tests SendGrid and Twilio integration

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

echo "🧪 HOA Connect Notification Testing"
echo "===================================="
echo ""

# Load environment variables
if [ -f ".env.production" ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
    log_info "Loaded production environment variables"
else
    log_error ".env.production file not found. Please run ./configure-production.sh first."
    exit 1
fi

# Check if required variables are set
check_required_vars() {
    local missing_vars=()
    
    if [ -z "$SENDGRID_API_KEY" ] || [ "$SENDGRID_API_KEY" = "SG.REPLACE_WITH_REAL_SENDGRID_API_KEY" ]; then
        missing_vars+=("SENDGRID_API_KEY")
    fi
    
    if [ -z "$TWILIO_ACCOUNT_SID" ] || [ "$TWILIO_ACCOUNT_SID" = "REPLACE_WITH_REAL_TWILIO_ACCOUNT_SID" ]; then
        missing_vars+=("TWILIO_ACCOUNT_SID")
    fi
    
    if [ -z "$TWILIO_AUTH_TOKEN" ] || [ "$TWILIO_AUTH_TOKEN" = "REPLACE_WITH_REAL_TWILIO_AUTH_TOKEN" ]; then
        missing_vars+=("TWILIO_AUTH_TOKEN")
    fi
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        log_error "Missing or placeholder values for: ${missing_vars[*]}"
        log_info "Please run ./configure-production.sh to set up your credentials."
        exit 1
    fi
}

# Test SendGrid API connection
test_sendgrid() {
    log_info "🔍 Testing SendGrid API connection..."
    
    response=$(curl -s -w "%{http_code}" -X GET "https://api.sendgrid.com/v3/user/profile" \
        -H "Authorization: Bearer $SENDGRID_API_KEY" \
        -H "Content-Type: application/json")
    
    http_code="${response: -3}"
    response_body="${response%???}"
    
    if [ "$http_code" = "200" ]; then
        log_success "SendGrid API connection successful"
        echo "   Account: $(echo $response_body | grep -o '"username":"[^"]*' | cut -d'"' -f4)"
    else
        log_error "SendGrid API connection failed (HTTP $http_code)"
        echo "   Response: $response_body"
        return 1
    fi
}

# Test Twilio API connection
test_twilio() {
    log_info "🔍 Testing Twilio API connection..."
    
    response=$(curl -s -w "%{http_code}" -X GET "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID.json" \
        -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN")
    
    http_code="${response: -3}"
    response_body="${response%???}"
    
    if [ "$http_code" = "200" ]; then
        log_success "Twilio API connection successful"
        echo "   Account: $(echo $response_body | grep -o '"friendly_name":"[^"]*' | cut -d'"' -f4)"
    else
        log_error "Twilio API connection failed (HTTP $http_code)"
        echo "   Response: $response_body"
        return 1
    fi
}

# Send test email via SendGrid
send_test_email() {
    local test_email=${1:-"test@example.com"}
    
    log_info "📧 Sending test email to $test_email..."
    
    local email_data='{
        "personalizations": [
            {
                "to": [{"email": "'$test_email'"}],
                "subject": "HOA Connect - Test Email"
            }
        ],
        "from": {
            "email": "'$SENDGRID_FROM_EMAIL'",
            "name": "'$SENDGRID_FROM_NAME'"
        },
        "content": [
            {
                "type": "text/html",
                "value": "<h2>🎉 HOA Connect Test Email</h2><p>This is a test email from your HOA Connect system.</p><p><strong>Status:</strong> Email notifications are working correctly!</p><p>Sent at: '$(date)'</p>"
            }
        ]
    }'
    
    response=$(curl -s -w "%{http_code}" -X POST "https://api.sendgrid.com/v3/mail/send" \
        -H "Authorization: Bearer $SENDGRID_API_KEY" \
        -H "Content-Type: application/json" \
        -d "$email_data")
    
    http_code="${response: -3}"
    response_body="${response%???}"
    
    if [ "$http_code" = "202" ]; then
        log_success "Test email sent successfully to $test_email"
        log_info "Check your inbox (and spam folder) for the test email."
    else
        log_error "Failed to send test email (HTTP $http_code)"
        echo "   Response: $response_body"
        return 1
    fi
}

# Send test SMS via Twilio
send_test_sms() {
    local test_phone=${1:-"+15551234567"}
    
    log_info "📱 Sending test SMS to $test_phone..."
    
    local sms_body="🏠 HOA Connect Test SMS: Your notification system is working correctly! Sent at $(date +%H:%M)"
    
    response=$(curl -s -w "%{http_code}" -X POST "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages.json" \
        -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN" \
        --data-urlencode "From=$TWILIO_PHONE_NUMBER" \
        --data-urlencode "To=$test_phone" \
        --data-urlencode "Body=$sms_body")
    
    http_code="${response: -3}"
    response_body="${response%???}"
    
    if [ "$http_code" = "201" ]; then
        log_success "Test SMS sent successfully to $test_phone"
        local message_sid=$(echo $response_body | grep -o '"sid":"[^"]*' | cut -d'"' -f4)
        log_info "Message SID: $message_sid"
    else
        log_error "Failed to send test SMS (HTTP $http_code)"
        echo "   Response: $response_body"
        return 1
    fi
}

# Main testing function
run_tests() {
    log_info "Starting notification service tests..."
    echo ""
    
    # Check required variables
    check_required_vars
    
    # Test API connections
    test_sendgrid
    echo ""
    test_twilio
    echo ""
    
    # Ask for test email and phone
    read -p "📧 Enter email address for test email (or press Enter to skip): " test_email
    if [ ! -z "$test_email" ]; then
        send_test_email "$test_email"
        echo ""
    fi
    
    read -p "📱 Enter phone number for test SMS (format: +1234567890, or press Enter to skip): " test_phone
    if [ ! -z "$test_phone" ]; then
        send_test_sms "$test_phone"
        echo ""
    fi
    
    log_success "✅ Notification testing completed!"
    echo ""
    log_info "📋 Next Steps:"
    echo "1. If tests passed, your notification services are ready!"
    echo "2. Set up your domain and SSL certificates"
    echo "3. Deploy to staging environment: ./infrastructure/deploy.sh staging deploy"
    echo "4. Run full end-to-end tests"
}

# Handle command line arguments
case "${1:-test}" in
    "test")
        run_tests
        ;;
    "email")
        check_required_vars
        test_sendgrid
        send_test_email "${2:-test@example.com}"
        ;;
    "sms")
        check_required_vars
        test_twilio
        send_test_sms "${2:-+15551234567}"
        ;;
    "check")
        check_required_vars
        test_sendgrid
        test_twilio
        log_success "All API connections working!"
        ;;
    *)
        echo "Usage: $0 [test|email|sms|check] [recipient]"
        echo ""
        echo "Commands:"
        echo "  test   - Run interactive test suite (default)"
        echo "  email  - Send test email to specified address"
        echo "  sms    - Send test SMS to specified phone number"
        echo "  check  - Check API connections only"
        echo ""
        echo "Examples:"
        echo "  $0 test"
        echo "  $0 email admin@seabreezemanagement.com"
        echo "  $0 sms +19495551234"
        exit 1
        ;;
esac



