# Flutter Driver App

A Flutter mobile application for delivery drivers in the RealTrack system.

## Features

- **Authentication**: Secure login and signup for drivers
- **Delivery Management**: View assigned deliveries with status filtering
- **QR Code Scanning**: Self-assign deliveries by scanning QR codes
- **Real-time Location Tracking**: GPS tracking with battery optimization
- **Status Updates**: Update delivery status (Pending → On Route → Delivered)
- **Real-time Sync**: Live data synchronization with Supabase

## Getting Started

### Prerequisites

- Flutter SDK (>=3.0.0)
- Dart SDK
- Android Studio / Xcode for mobile development
- Supabase project

### Installation

1. Clone the repository
2. Navigate to the driver app directory:
   ```bash
   cd apps/driver
   ```

3. Install dependencies:
   ```bash
   flutter pub get
   ```

4. Set up environment variables:
   ```bash
   flutter run --dart-define=SUPABASE_URL=your_supabase_url --dart-define=SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. Run the app:
   ```bash
   flutter run
   ```

### Environment Variables

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key

### Key Dependencies

- `flutter_riverpod`: State management
- `supabase_flutter`: Supabase integration
- `geolocator`: Location services
- `qr_code_scanner`: QR code scanning
- `mapbox_gl`: Map integration
- `permission_handler`: Permission management

### Project Structure

```
lib/
├── src/
│   ├── app.dart                    # Main app widget
│   ├── core/
│   │   └── services/               # Core services (Supabase, Location, etc.)
│   ├── features/
│   │   ├── auth/                   # Authentication module
│   │   └── delivery/               # Delivery management module
│   └── theme/
│       └── app_theme.dart          # App theme configuration
└── main.dart                       # App entry point
```

### Build for Production

#### Android
```bash
flutter build apk --release
flutter build appbundle --release
```

#### iOS
```bash
flutter build ios --release
```

## Development Notes

- The app uses Riverpod for state management
- Location tracking runs in background with battery optimization
- Real-time updates use Supabase subscriptions
- QR code scanning requires camera permissions
- Location permissions are required for GPS tracking