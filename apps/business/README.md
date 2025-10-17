# Business Portal

RealTrack Business Portal - A comprehensive dashboard for businesses to create, manage, and track deliveries in real-time.

## Features

### 📊 Dashboard
- Real-time delivery statistics
- Active delivery monitoring
- Live driver tracking on map
- Quick delivery creation

### 📦 Delivery Management
- Create new deliveries with customer details
- Generate QR codes and tracking links
- Assign drivers manually or automatically
- Update delivery status
- View delivery history

### 👥 Driver Management
- Add and manage drivers
- Monitor driver locations in real-time
- View driver performance statistics
- Track driver availability

### 🗺️ Live Tracking
- Real-time map view of all active drivers
- Individual delivery tracking
- ETA calculations
- Route visualization

## Tech Stack

- **Framework**: Next.js 13 with App Router
- **UI**: TailwindCSS + Headless UI
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod validation
- **Maps**: Mapbox GL JS
- **Backend**: Supabase (PostgreSQL + Realtime)
- **Authentication**: Supabase Auth
- **TypeScript**: Full type safety

## Getting Started

### Prerequisites
- Node.js 18+
- Mapbox Access Token

### Installation
```bash
cd apps/business
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
```

### Development
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components
│   ├── DeliveryCard.tsx
│   ├── Map.tsx
│   └── ...
├── lib/                # Utilities and services
│   ├── supabase.ts     # Supabase client
│   ├── services.ts     # API services
│   └── validations.ts  # Form validation schemas
├── pages/              # Next.js pages
│   ├── dashboard.tsx
│   ├── login.tsx
│   └── ...
├── store/              # Zustand stores
│   ├── auth.ts
│   └── delivery.ts
├── styles/             # CSS styles
│   └── globals.css
├── types/              # TypeScript types
│   └── supabase.ts
└── utils/              # Helper functions
    └── helpers.ts
```

## Key Features

### Multi-tenant Architecture
- Row Level Security (RLS) ensures businesses can only access their own data
- Secure authentication with custom user roles
- Isolated data per business account

### Real-time Updates
- Live driver location tracking via Supabase Realtime
- Instant status updates across all connected clients
- WebSocket subscriptions for real-time data sync

### Responsive Design
- Mobile-first approach with TailwindCSS
- Optimized for desktop, tablet, and mobile devices
- Accessible UI components following WCAG guidelines

### Form Validation
- Comprehensive validation with Zod schemas
- Client-side validation with immediate feedback
- Type-safe form handling with React Hook Form

## API Integration

The business portal connects to the Supabase backend with these key services:

- **Authentication**: User login/signup with role management
- **Deliveries**: CRUD operations and status management
- **Drivers**: Driver profiles and location tracking
- **Real-time**: Live subscriptions for location updates

## Authentication Flow

1. User logs in with email/password
2. Supabase Auth returns JWT token
3. Client stores user session in Zustand
4. All API calls include JWT token
5. RLS policies enforce data access based on user role

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

Deploy to Vercel, Netlify, or any Node.js hosting platform.