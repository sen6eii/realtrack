import 'package:geolocator/geolocator.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:background_fetch/background_fetch.dart';

part 'location_service.g.dart';

@riverpod
class LocationService extends _$LocationService {
  static bool _isInitialized = false;
  static Position? _currentPosition;
  static Stream<Position>? _positionStream;
  
  @override
  bool build() => false;
  
  static Future<void> initialize() async {
    if (_isInitialized) return;
    
    await _requestPermissions();
    await BackgroundFetch.configure(
      BackgroundFetchConfig(
        minimumFetchInterval: 15,
        stopOnTerminate: false,
        enableHeadless: true,
        requiresBatteryNotLow: false,
        requiresCharging: false,
        requiresStorageNotLow: false,
        requiresDeviceIdle: false,
        requiredNetworkType: NetworkType.NONE,
      ),
    );
    
    _isInitialized = true;
  }
  
  static Future<void> _requestPermissions() async {
    // Request location permissions
    final locationPermission = await Permission.locationWhenInUse.request();
    if (locationPermission.isDenied) {
      throw Exception('Location permission is required');
    }
    
    // Request background location permission for Android
    if (await Permission.locationAlways.isDenied) {
      await Permission.locationAlways.request();
    }
    
    // Request notification permission
    await Permission.notification.request();
  }
  
  static Future<Position?> getCurrentLocation() async {
    if (!await _isLocationServiceEnabled()) {
      return null;
    }
    
    try {
      _currentPosition = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 10),
      );
      return _currentPosition;
    } catch (e) {
      return null;
    }
  }
  
  static Future<bool> _isLocationServiceEnabled() async {
    return await Geolocator.isLocationServiceEnabled();
  }
  
  static Stream<Position> getPositionStream({LocationSettings? locationSettings}) {
    _positionStream ??= Geolocator.getPositionStream(
      locationSettings: locationSettings ?? const LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 10, // Update every 10 meters
      ),
    );
    return _positionStream!;
  }
  
  static void startLocationUpdates(Function(Position) onUpdate) {
    getPositionStream().listen(
      (Position position) {
        _currentPosition = position;
        onUpdate(position);
      },
      onError: (error) {
        print('Location stream error: $error');
      },
    );
  }
  
  static void stopLocationUpdates() {
    _positionStream = null;
  }
  
  static Position? get currentPosition => _currentPosition;
  
  static double calculateDistance(double startLatitude, double startLongitude, double endLatitude, double endLongitude) {
    return Geolocator.distanceBetween(startLatitude, startLongitude, endLatitude, endLongitude);
  }
  
  // Background location update registration
  static Future<void> registerBackgroundTask() async {
    await BackgroundFetch.registerHeadlessTask(backgroundTask);
  }
  
  @pragma('vm:entry-point')
  static void backgroundTask(String taskId) async {
    print('[BackgroundFetch] Task started: $taskId');
    
    try {
      final position = await getCurrentLocation();
      if (position != null) {
        // Update location in background
        // This would need to be connected to the Supabase service
        print('Background location update: ${position.latitude}, ${position.longitude}');
      }
      BackgroundFetch.finish(taskId);
    } catch (e) {
      print('Background task error: $e');
      BackgroundFetch.finish(taskId);
    }
  }
  
  static Future<void> startBackgroundLocationTracking() async {
    await BackgroundFetch.start();
  }
  
  static Future<void> stopBackgroundLocationTracking() async {
    await BackgroundFetch.stop();
  }
}