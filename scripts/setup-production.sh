#!/bin/bash

# RealTrack Production Setup Script
# This script sets up the complete production environment

set -e

echo "🚀 Setting up RealTrack Production Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check kubectl (for Kubernetes if needed)
    if command -v kubectl &> /dev/null; then
        print_success "kubectl found"
    else
        print_warning "kubectl not found - Kubernetes setup will be skipped"
    fi
    
    print_success "Dependencies check completed"
}

# Setup environment configuration
setup_environment() {
    print_status "Setting up environment configuration..."
    
    if [ ! -f .env.local ]; then
        cp .env.production.example .env.local
        print_warning "Created .env.local from template. Please edit it with your actual values."
    else
        print_success ".env.local already exists"
    fi
    
    # Verify required environment variables are set
    required_vars=(
        "NEXT_PUBLIC_SUPABASE_URL"
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        "NEXT_PUBLIC_MAPBOX_TOKEN"
        "SENTRY_DSN"
    )
    
    missing_vars=()
    for var in "${required_vars[@]}"; do
        if ! grep -q "^$var=" .env.local; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        print_error "Missing required environment variables: ${missing_vars[*]}"
        exit 1
    fi
    
    print_success "Environment configuration completed"
}

# Setup Supabase database
setup_database() {
    print_status "Setting up Supabase database..."
    
    # Check if Supabase CLI is installed
    if ! command -v supabase &> /dev/null; then
        print_status "Installing Supabase CLI..."
        curl -L https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz | tar xz
        sudo mv supabase /usr/local/bin/
    fi
    
    # Link to production project
    if [ -n "$PRODUCTION_SUPABASE_PROJECT_ID" ]; then
        cd supabase
        supabase link --project-ref "$PRODUCTION_SUPABASE_PROJECT_ID"
        cd ..
        print_success "Linked to Supabase project: $PRODUCTION_SUPABASE_PROJECT_ID"
    else
        print_warning "PRODUCTION_SUPABASE_PROJECT_ID not set in environment"
    fi
    
    # Run database migrations
    print_status "Running database migrations..."
    cd supabase
    supabase db push
    cd ..
    
    # Seed initial data
    if [ "$ENVIRONMENT" = "production" ]; then
        print_status "Skipping seed data in production"
    else
        print_status "Seeding database..."
        cd supabase
        psql "$DATABASE_URL" -f seed.sql
        psql "$DATABASE_URL" -f enhanced_driver_seed.sql
        cd ..
    fi
    
    print_success "Database setup completed"
}

# Setup monitoring and observability
setup_monitoring() {
    print_status "Setting up monitoring infrastructure..."
    
    # Create monitoring directory
    mkdir -p monitoring/prometheus-data
    mkdir -p monitoring/grafana-data
    mkdir -p monitoring/alertmanager-data
    mkdir -p monitoring/redis-data
    mkdir -p monitoring/loki-data
    mkdir -p monitoring/backups
    
    # Set correct permissions
    sudo chown -R $USER:$USER monitoring/
    chmod -R 755 monitoring/
    
    # Start monitoring stack
    print_status "Starting monitoring services..."
    docker-compose -f monitoring/docker-compose.monitoring.yml up -d
    
    # Wait for services to start
    print_status "Waiting for services to start..."
    sleep 30
    
    # Check if services are running
    services=("prometheus:9090" "grafana:3001" "alertmanager:9093" "redis:6379")
    for service in "${services[@]}"; do
        IFS=':' read -ra ADDR <<< "$service"
        host=${ADDR[0]}
        port=${ADDR[1]}
        
        if curl -f "http://localhost:$port" > /dev/null 2>&1; then
            print_success "$host is running on port $port"
        else
            print_error "$host failed to start on port $port"
        fi
    done
    
    print_success "Monitoring setup completed"
}

# Setup SSL certificates
setup_ssl() {
    print_status "Setting up SSL certificates..."
    
    mkdir -p ssl
    
    if [ ! -f ssl/fullchain.pem ]; then
        print_status "Generating self-signed certificates for development..."
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout ssl/privkey.pem \
            -out ssl/fullchain.pem \
            -subj "/C=US/ST=CA/L=San Francisco/O=RealTrack/CN=realtrack.app"
    else
        print_success "SSL certificates already exist"
    fi
    
    print_success "SSL setup completed"
}

# Setup backup and restore
setup_backup() {
    print_status "Setting up backup configuration..."
    
    # Create backup directories
    mkdir -p backups/daily
    mkdir -p backups/weekly
    mkdir -p backups/monthly
    
    # Create backup script
    cat > scripts/backup.sh << 'EOF'
#!/bin/bash

# Backup script for RealTrack
BACKUP_DIR="/workspace/repo/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/daily/realtrack_backup_$TIMESTAMP.sql"

# Create database backup
pg_dump "$DATABASE_URL" > "$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_FILE"

# Remove backups older than 7 days
find "$BACKUP_DIR/daily" -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE.gz"
EOF
    
    chmod +x scripts/backup.sh
    
    # Create restore script
    cat > scripts/restore.sh << 'EOF'
#!/bin/bash

if [ $# -ne 1 ]; then
    echo "Usage: $0 <backup_file>"
    exit 1
fi

BACKUP_FILE="$1"

# Restore database
gunzip -c "$BACKUP_FILE" | psql "$DATABASE_URL"

echo "Restore completed from: $BACKUP_FILE"
EOF
    
    chmod +x scripts/restore.sh
    
    print_success "Backup setup completed"
}

# Setup security policies
setup_security() {
    print_status "Setting up security policies..."
    
    # Create security headers configuration
    cat > monitoring/nginx/security-headers.conf << 'EOF'
# Security Headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https: wss:; frame-ancestors 'none';" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    
# Hide server version
server_tokens off;
EOF
    
    print_success "Security policies setup completed"
}

# Setup log rotation
setup_logging() {
    print_status "Setting up log rotation..."
    
    cat > monitoring/logrotate.conf << 'EOF'
/workspace/repo/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    copytruncate
    postrotate
        docker-compose -f monitoring/docker-compose.monitoring.yml restart nginx
    endscript
}
EOF
    
    print_success "Log rotation setup completed"
}

# Performance optimization
optimize_performance() {
    print_status "Optimizing performance settings..."
    
    # Database performance tuning
    cat > supabase/performance.sql << 'EOF'
-- Performance optimizations for production
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;

-- Apply changes
SELECT pg_reload_conf();
EOF
    
    print_success "Performance optimization completed"
}

# Run health checks
run_health_checks() {
    print_status "Running health checks..."
    
    # Check database connection
    if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
        print_success "Database connection OK"
    else
        print_error "Database connection failed"
    fi
    
    # Check web applications
    if [ -n "$PRODUCTION_BUSINESS_URL" ]; then
        if curl -f "$PRODUCTION_BUSINESS_URL" > /dev/null 2>&1; then
            print_success "Business portal accessible"
        else
            print_warning "Business portal not accessible"
        fi
    fi
    
    if [ -n "$PRODUCTION_CUSTOMER_URL" ]; then
        if curl -f "$PRODUCTION_CUSTOMER_URL" > /dev/null 2>&1; then
            print_success "Customer tracking accessible"
        else
            print_warning "Customer tracking not accessible"
        fi
    fi
    
    # Check monitoring services
    if curl -f "http://localhost:9090" > /dev/null 2>&1; then
        print_success "Prometheus monitoring OK"
    else
        print_warning "Prometheus monitoring not accessible"
    fi
    
    if curl -f "http://localhost:3001" > /dev/null 2>&1; then
        print_success "Grafana dashboard OK"
    else
        print_warning "Grafana dashboard not accessible"
    fi
    
    print_success "Health checks completed"
}

# Display setup completion message
display_completion() {
    echo ""
    echo "🎉 RealTrack Production Setup Complete!"
    echo ""
    echo "📊 Monitoring Dashboard: http://localhost:3001 (admin/admin123)"
    echo "📈 Prometheus: http://localhost:9090"
    echo "🚨 AlertManager: http://localhost:9093"
    echo ""
    echo "🔧 Next Steps:"
    echo "1. Configure your actual environment variables in .env.local"
    echo "2. Set up proper SSL certificates for production"
    echo "3. Configure your domain names in DNS"
    echo "4. Set up external monitoring alerts"
    echo "5. Test the complete system end-to-end"
    echo ""
    echo "📚 Documentation:"
    echo "- Deployment Guide: docs/DEPLOYMENT.md"
    echo "- Infrastructure: docs/INFRASTRUCTURE.md"
    echo "- Runbooks: docs/runbooks/"
    echo ""
    echo "✅ Setup completed successfully!"
}

# Main execution
main() {
    echo "RealTrack Production Setup Script"
    echo "=================================="
    
    check_dependencies
    setup_environment
    setup_database
    setup_monitoring
    setup_ssl
    setup_backup
    setup_security
    setup_logging
    optimize_performance
    run_health_checks
    display_completion
}

# Run main function
main "$@"