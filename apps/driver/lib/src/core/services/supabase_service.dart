import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'supabase_service.g.dart';

@riverpod
class SupabaseService extends _$SupabaseService {
  late final SupabaseClient _client;
  
  @override
  SupabaseClient build() {
    _client = Supabase.instance.client;
    return _client;
  }
  
  static Future<void> initialize() async {
    // Additional initialization if needed
  }
  
  SupabaseClient get client => _client;
  
  // Authentication methods
  Future<AuthResponse> signInWithEmail(String email, String password) async {
    return await _client.auth.signInWithPassword(email: email, password: password);
  }
  
  Future<AuthResponse> signUpWithEmail(String email, String password, {Map<String, String>? metadata}) async {
    return await _client.auth.signUp(email: email, password: password, data: metadata);
  }
  
  Future<void> signOut() async {
    await _client.auth.signOut();
  }
  
  User? get currentUser => _client.auth.currentUser;
  
  Stream<AuthState> get authStateStream => _client.auth.onAuthStateChange;
  
  // Database methods
  Future<List<Map<String, dynamic>>> getDeliveriesForDriver(String driverId) async {
    final response = await _client
        .from('deliveries')
        .select('*')
        .eq('driver_id', driverId)
        .order('created_at', ascending: false);
    
    if (response.error != null) {
      throw Exception(response.error!.message);
    }
    
    return List<Map<String, dynamic>>.from(response.data as List);
  }
  
  Future<Map<String, dynamic>?> getDeliveryByTrackingCode(String trackingCode) async {
    final response = await _client
        .from('delivery_tracking')
        .select('*')
        .eq('tracking_code', trackingCode)
        .maybeSingle();
    
    if (response.error != null) {
      throw Exception(response.error!.message);
    }
    
    return response.data as Map<String, dynamic>?;
  }
  
  Future<void> updateDeliveryStatus(String deliveryId, String status) async {
    final response = await _client
        .from('deliveries')
        .update({
          'status': status,
          'updated_at': DateTime.now().toIso8601String(),
          if (status == 'delivered') 'actual_delivery_time': DateTime.now().toIso8601String(),
        })
        .eq('id', deliveryId);
    
    if (response.error != null) {
      throw Exception(response.error!.message);
    }
  }
  
  Future<void> assignDeliveryToDriver(String deliveryId, String driverId) async {
    final response = await _client
        .from('deliveries')
        .update({
          'driver_id': driverId,
          'status': 'assigned',
          'updated_at': DateTime.now().toIso8601String(),
        })
        .eq('id', deliveryId);
    
    if (response.error != null) {
      throw Exception(response.error!.message);
    }
  }
  
  Future<void> updateDriverLocation(String driverId, double latitude, double longitude, {double? speed, double? heading}) async {
    // Update driver's current location
    final driverResponse = await _client
        .from('drivers')
        .update({
          'location': 'POINT($longitude $latitude)',
          'last_location_update': DateTime.now().toIso8601String(),
        })
        .eq('id', driverId);
    
    if (driverResponse.error != null) {
      throw Exception(driverResponse.error!.message);
    }
    
    // Get active delivery for this driver
    final deliveryResponse = await _client
        .from('deliveries')
        .select('id')
        .eq('driver_id', driverId)
        .eq('status', 'on_route')
        .maybeSingle();
    
    if (deliveryResponse.error != null) {
      throw Exception(deliveryResponse.error!.message);
    }
    
    if (deliveryResponse.data != null) {
      final deliveryId = deliveryResponse.data!['id'] as String;
      
      // Add location update for the delivery
      final locationResponse = await _client
          .from('location_updates')
          .insert({
            'delivery_id': deliveryId,
            'driver_id': driverId,
            'location': 'POINT($longitude $latitude)',
            'speed': speed,
            'heading': heading,
            'timestamp': DateTime.now().toIso8601String(),
          });
      
      if (locationResponse.error != null) {
        throw Exception(locationResponse.error!.message);
      }
    }
  }
  
  // Real-time subscriptions
  RealtimeChannel subscribeToDeliveryUpdates(String deliveryId, Function(Map<String, dynamic>) onUpdate) {
    return _client.channel("delivery:$deliveryId")
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'deliveries',
          filter: 'id=eq.$deliveryId',
          callback: (payload) {
            onUpdate(payload.newRecord as Map<String, dynamic>);
          },
        )
        .subscribe();
  }
  
  RealtimeChannel subscribeToDriverDeliveries(String driverId, Function(List<Map<String, dynamic>>) onUpdate) {
    return _client.channel("driver_deliveries:$driverId")
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'deliveries',
          filter: 'driver_id=eq.$driverId',
          callback: (payload) {
            // Refresh deliveries list when changes occur
            getDeliveriesForDriver(driverId).then(onUpdate);
          },
        )
        .subscribe();
  }
}