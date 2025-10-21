import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'src/app.dart';
import 'src/core/services/supabase_service.dart';
import 'src/core/services/location_service.dart';
import 'src/core/services/notification_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  await Supabase.initialize(
    url: const String.fromEnvironment('SUPABASE_URL'),
    anonKey: const String.fromEnvironment('SUPABASE_ANON_KEY'),
  );
  
  await initializeServices();
  
  runApp(
    const ProviderScope(
      child: RealTrackDriverApp(),
    ),
  );
}

Future<void> initializeServices() async {
  try {
    await LocationService.initialize();
    await NotificationService.initialize();
    await SupabaseService.initialize();
  } catch (e) {
    debugPrint('Error initializing services: $e');
  }
}