# Customer Tracking Portal

RealTrack Customer Tracking Portal - A public-facing tracking page where customers can monitor their deliveries in real-time without authentication.

## Features

### 🚀 Public Access
- No authentication required
- Accessible via unique tracking URLs
- Mobile-responsive design
- SEO optimized

### 📍 Live Tracking
- Real-time map view with driver location
- Animated tracking markers
- Route visualization
- ETA calculations

### 📊 Status Updates
- Visual timeline of delivery progress
- Real-time status changes via WebSocket
- Detailed delivery information
- Driver and vehicle details

### 📱 Customer Experience
- Clean, intuitive interface
- Share tracking links easily
- QR code scanning support (placeholder)
- Progressive Web App ready

## Tech Stack

- **Framework**: Next.js 13 with App Router
- **UI**: TailwindCSS + Custom components
- **Maps**: Mapbox GL JS
- **Real-time**: Supabase Realtime subscriptions
- **Backend**: Supabase (public access views)
- **TypeScript**: Full type safety

## Getting Started

### Prerequisites
- Node.js 18+
- Mapbox Access Token

### Installation
```bash
cd apps/customer
npm install
```

### Environment Setup
Copy environment variables from root:
```bash
cp ../../.env.example .env.local
```

Update with your Mapbox token:
```env
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Development
```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) with your browser.

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── TrackingMap.tsx  # Live map component
│   ├── StatusBadge.tsx  # Delivery status indicator
│   ├── TrackingTimeline.tsx # Progress timeline
│   └── LoadingStates.tsx # Loading and error states
├── lib/                # Utilities and services
│   ├── supabase.ts     # Supabase client (public access)
│   ├── tracking-service.ts # Tracking API service
│   └── validations.ts  # Form validation
├── pages/              # Next.js pages
│   ├── index.tsx       # Landing page
│   └── track/[trackingCode].tsx # Tracking page
├── styles/             # CSS styles
│   └── globals.css
├── types/              # TypeScript types
└── utils/              # Helper functions
    └── helpers.ts
```

## Key Features

### Real-time Subscriptions
The tracking page uses Supabase Realtime to subscribe to:
- Location updates for active deliveries
- Delivery status changes
- Driver assignment updates

### Public Access Security
- Uses Supabase Row Level Security (RLS) for public access
- Restricted to delivery_tracking view (safe public data)
- No sensitive information exposed
- Rate limiting via Supabase configuration

### Map Integration
- Interactive Mapbox implementation
- Custom markers for delivery and driver locations
- Route drawing capabilities
- Responsive map sizing

### URL Structure
- **Home**: `/` - Tracking code input form
- **Tracking**: `/track/[trackingCode]` - Live tracking page
- **SEO**: Optimized meta tags and structured data

## API Integration

### Public Tracking Service
```typescript
// Get delivery by tracking code
const delivery = await TrackingService.getDeliveryByTrackingCode('RT123ABC')

// Subscribe to real-time updates
TrackingService.subscribeToLocationUpdates(deliveryId, callback)
```

### Security Model
- Public access via RLS policies
- Limited to non-sensitive delivery data
- No authentication required
- Read-only access for tracking

## Customer Journey

1. **Land on homepage** - Clean tracking interface
2. **Enter tracking code** - Simple input validation
3. **View tracking page** - Live map and status updates
4. **Monitor progress** - Real-time updates via WebSocket
5. **Delivery confirmation** - Complete status with timestamp

## Performance Optimizations

- **Next.js Image Optimization** - For delivery photos
- **Map Loading** - Lazy loading and caching
- **Real-time Updates** - Efficient WebSocket subscriptions
- **Mobile Responsive** - Optimized for all devices

## Deployment

### Environment Variables
Configure these variables for production:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token
```

### Build & Deploy
```bash
npm run build
npm start
```

Deploy to Vercel, Netlify, or any static hosting platform.

## SEO & Analytics

- **Meta Tags** - Optimized for search engines
- **Structured Data** - JSON-LD for delivery tracking
- **Analytics Ready** - Easy integration with GA, Mixpanel
- **Performance** - Core Web Vitals optimized

## Accessibility

- **WCAG 2.1 AA** compliant
- **Screen Reader** support
- **Keyboard Navigation** - Full accessibility
- **ARIA Labels** - Semantic HTML structure

## Browser Support

- **Modern Browsers** - Chrome, Firefox, Safari, Edge
- **Mobile Browsers** - iOS Safari, Android Chrome
- **Progressive Enhancement** - Works without JavaScript
- **PWA Ready** - Can be installed as mobile app