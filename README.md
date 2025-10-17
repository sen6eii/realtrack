# RealTrack - Multi-tenant Real-time Delivery Tracking Platform

A comprehensive SaaS platform that enables businesses to provide customers with live delivery tracking, similar to Uber but for e-commerce orders. Built with modern technologies and designed for scalability.

## 🚀 Platform Overview

RealTrack consists of three main components:

1. **Business Portal** - Dashboard for merchants to create and manage deliveries
2. **Driver App** - Mobile application for delivery drivers (Flutter)
3. **Customer Tracking** - Public tracking page for real-time delivery visibility

## ✨ Key Features

### For Businesses 🏪
- **Multi-tenant Dashboard** - Secure, isolated business accounts
- **Delivery Management** - Create, assign, and track deliveries
- **QR Code Generation** - Easy package labeling and tracking
- **Live Driver Monitoring** - Real-time map view of all active deliveries
- **Analytics & Reporting** - Performance metrics and insights
- **Driver Management** - Add, assign, and monitor delivery drivers

### For Drivers 🚗
- **Cross-platform Mobile App** - Flutter app for iOS and Android
- **QR Code Scanning** - Simple delivery assignment
- **Real-time Location Sharing** - Battery-optimized GPS tracking
- **Delivery Status Management** - Update delivery progress
- **Route History** - Complete delivery log and performance stats
- **Push Notifications** - Instant delivery assignments

### For Customers 📍
- **Public Tracking Access** - No authentication required
- **Live Map View** - See driver location in real-time
- **ETA Calculations** - Accurate delivery time estimates
- **Status Timeline** - Visual delivery progress tracking
- **Mobile Optimized** - Works perfectly on smartphones
- **Shareable Links** - Easy tracking link sharing

## 🛠️ Technology Stack

### Backend Infrastructure
- **Database**: PostgreSQL with PostGIS for geospatial data
- **BaaS**: Supabase (Authentication, Realtime, Storage)
- **API**: RESTful APIs with Row Level Security (RLS)
- **Real-time**: WebSocket subscriptions via Supabase Realtime

### Business Portal & Customer Tracking
- **Framework**: Next.js 13 with App Router
- **Frontend**: React + TypeScript
- **UI**: TailwindCSS + Custom components
- **Maps**: Mapbox GL JS for interactive maps
- **State**: Zustand for state management
- **Forms**: React Hook Form + Zod validation

### Driver Mobile App
- **Framework**: Flutter (Cross-platform)
- **Maps**: Mapbox SDK for Flutter
- **State**: Riverpod for state management
- **Location**: Background GPS tracking with battery optimization
- **Notifications**: Firebase Cloud Messaging

### Development & Deployment
- **Containerization**: Docker + Docker Compose
- **Development**: Hot reloading for all applications
- **CI/CD**: GitHub Actions ready
- **Hosting**: Vercel (web), App Stores (mobile)

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Business     │    │    Customer     │    │    Driver App   │
│   Portal       │    │   Tracking      │    │   (Flutter)     │
│   (Next.js)    │    │   (Next.js)     │    │                 │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │      Supabase Backend     │
                    │  PostgreSQL + Realtime    │
                    │    + Authentication       │
                    └───────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Flutter (for mobile development)
- Mapbox Access Token

### 1. Clone & Setup
```bash
git clone <repository-url>
cd realtrack
npm run setup:dev
```

### 2. Configure Environment
```bash
# Edit .env with your configuration
cp .env.example .env
```

Required environment variables:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Mapbox (required for maps)
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token

# Firebase (for mobile push notifications)
FCM_SERVER_KEY=your_fcm_key
```

### 3. Start Development Environment
```bash
# Start Supabase backend services
npm run db:start

# Install dependencies and build types
npm install
npm run build:types

# Start all applications
npm run dev:all
```

### 4. Access Applications
- **Business Portal**: http://localhost:3000
- **Customer Tracking**: http://localhost:3001
- **Supabase Studio**: http://localhost:3000 (database dashboard)

## 📊 Database Schema

The platform uses a multi-tenant PostgreSQL schema with these core tables:

- **`businesses`** - Multi-tenant business accounts
- **`drivers`** - Driver profiles and real-time location
- **`deliveries`** - Delivery orders with tracking codes
- **`location_updates`** - Real-time GPS location history
- **Views** - Secure public tracking data

### Key Features
- **Row Level Security (RLS)** for complete data isolation
- **PostGIS** for efficient geospatial queries
- **Real-time subscriptions** for live tracking
- **Database functions** for delivery management

## 🔐 Security Model

- **Multi-tenant Isolation**: RLS policies ensure businesses only access their own data
- **Role-based Access**: Custom roles (merchant/driver) with specific permissions
- **Public Tracking**: Secure, limited public access for customer tracking
- **JWT Authentication**: Supabase Auth with secure token management
- **API Security**: Rate limiting and request validation

## 📱 Mobile Development

### Flutter Driver App
```bash
cd apps/driver
flutter pub get
flutter run
```

### Key Features
- QR code scanning for delivery assignment
- Background location tracking with battery optimization
- Real-time status updates via Supabase subscriptions
- Offline support with data synchronization
- Native performance on iOS and Android

## 🔌 Integration Options

### Manual Mode
- Businesses create deliveries via web portal
- Generate QR codes and tracking links
- Share links via WhatsApp, email, or SMS

### No-code Mode (Future)
- **Shopify, WooCommerce, Tiendanube, Wix** plugins
- Automatic delivery creation on order placement
- Tracking links in order confirmation emails

### API/SDK Mode (Future)
- **REST API** for custom integrations
- **JavaScript SDK** for developers
- **Webhooks** for delivery status updates

## 📈 Analytics & Monitoring

- **Business Analytics**: Delivery volumes, completion rates, driver performance
- **Driver Statistics**: Completed deliveries, average times, distance traveled
- **Real-time Monitoring**: Active deliveries, driver locations, system health
- **Customer Insights**: Tracking link usage, delivery satisfaction

## 🌐 Deployment

### Production Environment
1. **Supabase Cloud** - Managed backend services
2. **Vercel** - Web application hosting
3. **App Stores** - iOS App Store and Google Play Store
4. **Monitoring** - Error tracking and analytics

### Environment Setup
```bash
# Production build
npm run build:all

# Deploy to Vercel (web apps)
vercel --prod

# Deploy Flutter app
cd apps/driver
flutter build apk --release
flutter build ios --release
```

## 🧪 Testing

```bash
# Run all tests
npm run test

# Type checking
npm run type-check

# Linting
npm run lint
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation in `/docs`
- Review the API documentation
- Contact the development team

---

**RealTrack** - Making delivery tracking simple, transparent, and reliable for everyone. 🚗📦✨