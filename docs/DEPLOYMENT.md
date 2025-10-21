# RealTrack Deployment Configuration

This document provides comprehensive instructions for deploying the RealTrack delivery tracking platform.

## Overview

RealTrack consists of multiple applications and services:

- **Business Portal** (Next.js) - `apps/business/`
- **Customer Tracking** (Next.js) - `apps/customer/`  
- **Driver App** (Flutter) - `apps/driver/`
- **Real-time Service** (TypeScript) - `packages/realtime-service/`
- **Shared Types** (TypeScript) - `packages/types/`
- **Database** (Supabase/PostgreSQL) - `supabase/`

## Prerequisites

### Development Environment
- Node.js 18+
- Flutter 3.24.5+
- Supabase CLI 1.190.3+
- Docker & Docker Compose

### Hosting & Services
- **Web Hosting**: Vercel (Business & Customer Portals)
- **Mobile Distribution**: Google Play Store & Apple App Store
- **Database**: Supabase (PostgreSQL with PostGIS)
- **Real-time**: Supabase Realtime
- **Maps**: Mapbox
- **Monitoring**: Sentry, custom dashboard
- **CI/CD**: GitHub Actions

## Environment Configuration

### Required Secrets & Environment Variables

#### Supabase Configuration
```bash
# Production
PRODUCTION_SUPABASE_URL=https://your-project.supabase.co
PRODUCTION_SUPABASE_ANON_KEY=your-anon-key
PRODUCTION_DATABASE_URL=postgresql://user:pass@host:port/dbname
PRODUCTION_SUPABASE_PROJECT_ID=your-project-id

# Staging
STAGING_SUPABASE_URL=https://staging-project.supabase.co
STAGING_SUPABASE_ANON_KEY=your-staging-anon-key
STAGING_DATABASE_URL=postgresql://user:pass@host:port/dbname
STAGING_SUPABASE_PROJECT_ID=staging-project-id
```

#### Mapbox Configuration
```bash
NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-public-token
PRODUCTION_MAPBOX_TOKEN=your-production-mapbox-token
```

#### Vercel Configuration
```bash
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-vercel-org-id
BUSINESS_VERCEL_PROJECT_ID=business-project-id
CUSTOMER_VERCEL_PROJECT_ID=customer-project-id
```

#### Mobile App Configuration
```bash
# Android Signing
ANDROID_KEYSTORE_BASE64=base64-encoded-keystore
ANDROID_KEYSTORE_PASSWORD=keystore-password
ANDROID_KEY_ALIAS=key-alias
ANDROID_KEY_PASSWORD=key-password

# Apple Distribution
APPLE_ID=your-apple-id
APPLE_APP_SPECIFIC_PASSWORD=app-specific-password
APPLE_KEY_ID=key-id
APPLE_ISSUER_ID=issuer-id
MATCH_PASSWORD=match-password
APPLE_SIGNING_KEY=base64-signing-key

# Firebase App Distribution
FIREBASE_ANDROID_APP_ID=android-app-id
FIREBASE_SERVICE_ACCOUNT=json-service-account
FIREBASE_IOS_APP_ID=ios-app-id
```

#### Monitoring & Notifications
```bash
SLACK_WEBHOOK_URL=your-slack-webhook
SENTRY_DSN=your-sentry-dsn
LHCI_GITHUB_APP_TOKEN=lighthouse-token
LHCI_SERVER_URL=lighthouse-server-url
```

## Deployment Process

### 1. Database Setup & Migration

#### Local Development
```bash
# Start local Supabase
cd supabase
supabase start

# Run migrations
supabase db push

# Seed data
psql "$DATABASE_URL" -f seed.sql
psql "$DATABASE_URL" -f enhanced_driver_seed.sql
```

#### Production Deployment
1. **Database migrations are automated** via GitHub Actions
2. **Manual approval required** for production deployments
3. **Automatic backups** created before each deployment
4. **Rollback capability** if deployment fails

### 2. Web Applications (Business & Customer Portals)

#### Automated Deployment
- **Push to `develop`**: Deploys to staging environments
- **Push to `main`**: Deploys to production after approval
- **Pull Requests**: Runs tests but doesn't deploy

#### Manual Deployment
```bash
# Business Portal
cd apps/business
vercel --prod

# Customer Tracking  
cd apps/customer
vercel --prod
```

### 3. Mobile Application (Driver App)

#### Build Process
1. **Automated builds** on every push
2. **Testing builds** distributed to Firebase App Testing
3. **Production builds** submitted to app stores

#### Release Process
```bash
# Build for testing
flutter build apk --release --obfuscate
flutter build appbundle --release --obfuscate

# Deploy to Firebase
firebase appdistribution:distribute app-release.aab \
  --app 1:1234567890:android:abcdef \
  --groups testing-team \
  --release-notes "New features and bug fixes"

# Deploy to Google Play (Manual)
# Upload AAB to Google Play Console
# Submit for review
```

### 4. Real-time Service Configuration

#### Supabase Realtime Setup
```sql
-- Enable realtime on required tables
ALTER PUBLICATION supabase_realtime ADD TABLE deliveries;
ALTER PUBLICATION supabase_realtime ADD TABLE drivers;
ALTER PUBLICATION supabase_realtime ADD TABLE location_updates;
ALTER PUBLICATION supabase_realtime ADD TABLE driver_notifications;
```

#### Connection Configuration
```javascript
const realtimeService = createRealtimeService({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  businessId: userBusinessId,
})
```

## CI/CD Pipeline

### GitHub Actions Workflows

1. **`deploy-business.yml`** - Business portal deployment
2. **`deploy-customer.yml`** - Customer tracking deployment  
3. **`deploy-driver.yml`** - Mobile app building and distribution
4. **`deploy-database.yml`** - Database migrations and management
5. **`quality-gates.yml`** - Code quality, security, and E2E tests

### Quality Gates

- **Code Coverage**: Minimum 80%
- **Security**: No high-severity vulnerabilities
- **Performance**: Lighthouse score > 90
- **E2E Tests**: All critical paths tested

### Environments

| Environment | Business Portal | Customer Tracking | Database | Purpose |
|-------------|-----------------|-------------------|----------|---------|
| Local | `localhost:3000` | `localhost:3001` | Local Supabase | Development |
| Staging | Vercel Preview | Vercel Preview | Staging Supabase | Testing |
| Production | Vercel Production | Vercel Production | Production Supabase | Live |

## Monitoring & Observability

### Application Monitoring
- **Error Tracking**: Sentry
- **Performance**: Custom dashboard + Lighthouse CI
- **Uptime**: UptimeRobot + health checks
- **Real-time Status**: WebSocket connection monitoring

### Database Monitoring
- **Query Performance**: pg_stat_statements
- **Connection Pooling**: PgBouncer metrics
- **Real-time Load**: Supabase dashboard
- **Backup Status**: Automated monitoring

### Mobile App Analytics
- **Crash Reporting**: Firebase Crashlytics
- **Usage Analytics**: Firebase Analytics
- **Performance**: Firebase Performance Monitoring
- **Distribution**: Firebase App Distribution

## Security Considerations

### Database Security
- **Row Level Security (RLS)** enabled on all tables
- **Multi-tenant isolation** by business_id
- **API Rate limiting** implemented
- **Regular security audits** automated

### Application Security
- **Environment variables** encrypted in GitHub
- **Dependency scanning** automated
- **Code signing** for mobile apps
- **HTTPS enforcement** everywhere

### Data Protection
- **GDPR compliance** considered
- **Data encryption** at rest and in transit
- **Access controls** role-based
- **Audit logging** implemented

## Scaling & Performance

### Horizontal Scaling
- **Web apps**: Auto-scaling via Vercel
- **Database**: Connection pooling + read replicas
- **Real-time**: Load balanced WebSocket connections

### Performance Optimization
- **Code splitting** implemented
- **Image optimization** automatic
- **CDN delivery** for all assets
- **Database indexing** optimized

### Caching Strategy
- **Static assets**: CDN cached
- **API responses**: Redis caching
- **Database queries**: Materialized views
- **Real-time data**: Optimized subscriptions

## Rollback Procedures

### Web Applications
```bash
# Vercel rollback
vercel rollback [deployment-url]

# Git rollback
git revert HEAD
git push origin main
```

### Database Rollback
```bash
# Supabase rollback
supabase db reset

# Point-in-time recovery
# Contact Supabase support for PITR
```

### Mobile App Rollback
```bash
# Google Play Console
# Submit new version with previous code

# App Store Connect  
# Use "Reject this build" and submit previous version
```

## Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check connection string
psql "$DATABASE_URL" -c "SELECT 1"

# Check connection pool
SELECT * FROM pg_stat_activity WHERE state = 'active';
```

#### Real-time Subscription Issues
```javascript
// Check connection status
const status = realtimeService.getConnectionStatus()

// Health check
const isHealthy = await realtimeService.healthCheck()
```

#### Build Failures
```bash
# Clear Flutter cache
flutter clean
flutter pub get

# Clear Node modules
rm -rf node_modules package-lock.json
npm install
```

### Support Channels
- **Development Team**: Slack #development
- **Production Issues**: Slack #alerts
- **Documentation**: GitHub Wiki
- **Emergency**: On-call rotation

## Deployment Checklist

### Pre-deployment
- [ ] All tests passing
- [ ] Security audit clean
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] Backup created
- [ ] Rollback plan ready

### Post-deployment
- [ ] Health checks passing
- [ ] Monitoring alerts configured
- [ ] Team notified
- [ ] Documentation updated
- [ ] Performance validated
- [ ] User acceptance testing

## Future Improvements

### Planned Enhancements
- **Multi-region deployment** for global scalability
- **Advanced analytics** dashboard
- **Automated testing** expansion
- **Infrastructure as Code** implementation
- **Blue-green deployments** for zero downtime

### Monitoring Improvements
- **AI-powered anomaly detection**
- **Business metrics tracking**
- **User experience monitoring**
- **Cost optimization insights**