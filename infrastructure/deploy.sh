#!/bin/bash

# HOA Connect Production Deployment Script
# Usage: ./deploy.sh [environment] [action]
# Example: ./deploy.sh production deploy

set -e

# Configuration
ENVIRONMENT=${1:-staging}
ACTION=${2:-deploy}
PROJECT_NAME="hoa-connect"
DOCKER_COMPOSE_FILE="docker-compose.production.yml"

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

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if Docker is installed and running
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        log_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    
    # Check if Docker Compose is available
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not available. Please install Docker Compose."
        exit 1
    fi
    
    # Check if environment file exists
    if [ ! -f ".env.${ENVIRONMENT}" ]; then
        log_error "Environment file .env.${ENVIRONMENT} not found."
        log_info "Please create .env.${ENVIRONMENT} with required environment variables."
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Load environment variables
load_environment() {
    log_info "Loading environment variables for ${ENVIRONMENT}..."
    
    # Load environment-specific variables
    if [ -f ".env.${ENVIRONMENT}" ]; then
        export $(cat .env.${ENVIRONMENT} | grep -v '^#' | xargs)
        log_success "Environment variables loaded"
    else
        log_error "Environment file .env.${ENVIRONMENT} not found"
        exit 1
    fi
}

# Build Docker images
build_images() {
    log_info "Building Docker images..."
    
    # Build frontend
    log_info "Building frontend image..."
    docker build -f infrastructure/Dockerfile.frontend -t ${PROJECT_NAME}-frontend:${ENVIRONMENT} .
    
    # Build backend
    log_info "Building backend image..."
    docker build -f infrastructure/Dockerfile.backend -t ${PROJECT_NAME}-backend:${ENVIRONMENT} ./hoa-connect-backend
    
    log_success "Docker images built successfully"
}

# Deploy services
deploy_services() {
    log_info "Deploying services to ${ENVIRONMENT}..."
    
    # Create necessary directories
    mkdir -p logs ssl
    
    # Generate SSL certificates if they don't exist (for development)
    if [ ! -f "ssl/cert.pem" ] && [ "${ENVIRONMENT}" != "production" ]; then
        log_info "Generating self-signed SSL certificates for ${ENVIRONMENT}..."
        openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes \
            -subj "/C=US/ST=CA/L=Newport Beach/O=Seabreeze Management/CN=localhost"
    fi
    
    # Deploy using Docker Compose
    docker-compose -f infrastructure/${DOCKER_COMPOSE_FILE} --env-file .env.${ENVIRONMENT} up -d
    
    log_success "Services deployed successfully"
}

# Health check
health_check() {
    log_info "Performing health checks..."
    
    # Wait for services to start
    sleep 30
    
    # Check backend health
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        log_success "Backend health check passed"
    else
        log_error "Backend health check failed"
        return 1
    fi
    
    # Check frontend
    if curl -f http://localhost/ > /dev/null 2>&1; then
        log_success "Frontend health check passed"
    else
        log_error "Frontend health check failed"
        return 1
    fi
    
    # Check database
    if docker-compose -f infrastructure/${DOCKER_COMPOSE_FILE} exec -T database pg_isready -U ${DB_USER} -d hoa_connect_prod > /dev/null 2>&1; then
        log_success "Database health check passed"
    else
        log_error "Database health check failed"
        return 1
    fi
    
    log_success "All health checks passed"
}

# Database migration
migrate_database() {
    log_info "Running database migrations..."
    
    # Wait for database to be ready
    sleep 10
    
    # Run migrations (if migration scripts exist)
    if [ -d "migrations" ]; then
        docker-compose -f infrastructure/${DOCKER_COMPOSE_FILE} exec backend npm run migrate
        log_success "Database migrations completed"
    else
        log_info "No migrations directory found, skipping migrations"
    fi
}

# Backup database
backup_database() {
    log_info "Creating database backup..."
    
    BACKUP_FILE="backup_${ENVIRONMENT}_$(date +%Y%m%d_%H%M%S).sql"
    
    docker-compose -f infrastructure/${DOCKER_COMPOSE_FILE} exec -T database \
        pg_dump -U ${DB_USER} -d hoa_connect_prod > backups/${BACKUP_FILE}
    
    log_success "Database backup created: ${BACKUP_FILE}"
}

# Stop services
stop_services() {
    log_info "Stopping services..."
    
    docker-compose -f infrastructure/${DOCKER_COMPOSE_FILE} down
    
    log_success "Services stopped"
}

# View logs
view_logs() {
    log_info "Viewing logs for ${ENVIRONMENT}..."
    
    docker-compose -f infrastructure/${DOCKER_COMPOSE_FILE} logs -f
}

# Show status
show_status() {
    log_info "Service status for ${ENVIRONMENT}:"
    
    docker-compose -f infrastructure/${DOCKER_COMPOSE_FILE} ps
}

# Cleanup old images and containers
cleanup() {
    log_info "Cleaning up old Docker images and containers..."
    
    # Remove old containers
    docker container prune -f
    
    # Remove old images
    docker image prune -f
    
    # Remove unused volumes (be careful with this in production)
    if [ "${ENVIRONMENT}" != "production" ]; then
        docker volume prune -f
    fi
    
    log_success "Cleanup completed"
}

# Main deployment function
deploy() {
    log_info "Starting deployment to ${ENVIRONMENT}..."
    
    check_prerequisites
    load_environment
    
    # Create backup in production
    if [ "${ENVIRONMENT}" = "production" ]; then
        mkdir -p backups
        backup_database
    fi
    
    build_images
    deploy_services
    migrate_database
    health_check
    
    log_success "Deployment to ${ENVIRONMENT} completed successfully!"
    log_info "Services are now running. Use './deploy.sh ${ENVIRONMENT} status' to check status."
}

# Main script logic
case $ACTION in
    deploy)
        deploy
        ;;
    stop)
        stop_services
        ;;
    restart)
        stop_services
        sleep 5
        deploy_services
        health_check
        ;;
    logs)
        view_logs
        ;;
    status)
        show_status
        ;;
    health)
        health_check
        ;;
    backup)
        mkdir -p backups
        backup_database
        ;;
    cleanup)
        cleanup
        ;;
    *)
        echo "Usage: $0 [environment] [action]"
        echo ""
        echo "Environments: staging, production"
        echo "Actions:"
        echo "  deploy   - Deploy the application (default)"
        echo "  stop     - Stop all services"
        echo "  restart  - Restart all services"
        echo "  logs     - View service logs"
        echo "  status   - Show service status"
        echo "  health   - Run health checks"
        echo "  backup   - Create database backup"
        echo "  cleanup  - Clean up old Docker resources"
        echo ""
        echo "Examples:"
        echo "  $0 staging deploy"
        echo "  $0 production stop"
        echo "  $0 staging logs"
        exit 1
        ;;
esac








