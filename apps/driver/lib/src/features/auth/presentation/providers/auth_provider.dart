import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/services/supabase_service.dart';

part 'auth_provider.g.dart';

@riverpod
class AuthProvider extends _$AuthProvider {
  @override
  User? build() {
    final supabaseService = ref.read(supabaseServiceProvider);
    return supabaseService.currentUser;
  }
  
  Future<void> signIn(String email, String password) async {
    try {
      final supabaseService = ref.read(supabaseServiceProvider);
      await supabaseService.signInWithEmail(email, password);
    } catch (e) {
      throw Exception('Failed to sign in: $e');
    }
  }
  
  Future<void> signUp(String email, String password, {
    required String name,
    required String phone,
    required String vehicleType,
    required String licensePlate,
  }) async {
    try {
      final supabaseService = ref.read(supabaseServiceProvider);
      
      // First create the user account
      final response = await supabaseService.signUpWithEmail(
        email, 
        password,
        metadata: {
          'name': name,
          'user_type': 'driver',
        },
      );
      
      // Then create the driver profile
      if (response.user != null) {
        await _createDriverProfile(response.user!.id, name, email, phone, vehicleType, licensePlate);
      }
    } catch (e) {
      throw Exception('Failed to sign up: $e');
    }
  }
  
  Future<void> _createDriverProfile(
    String userId,
    String name,
    String email,
    String phone,
    String vehicleType,
    String licensePlate,
  ) async {
    try {
      final supabaseService = ref.read(supabaseServiceProvider);
      
      // For now, we'll create the driver profile without a business_id
      // In a real implementation, this would be handled by an admin or business invitation
      final response = await supabaseService.client
          .from('drivers')
          .insert({
            'id': userId,
            'business_id': 'temp-business-id', // This would be set by business admin
            'name': name,
            'email': email,
            'phone': phone,
            'vehicle_type': vehicleType,
            'license_plate': licensePlate,
            'is_active': false, // Will be activated by business admin
          });
      
      if (response.error != null) {
        throw Exception(response.error!.message);
      }
    } catch (e) {
      throw Exception('Failed to create driver profile: $e');
    }
  }
  
  Future<void> signOut() async {
    try {
      final supabaseService = ref.read(supabaseServiceProvider);
      await supabaseService.signOut();
    } catch (e) {
      throw Exception('Failed to sign out: $e');
    }
  }
  
  Stream<AuthState> get authStateStream {
    final supabaseService = ref.read(supabaseServiceProvider);
    return supabaseService.authStateStream;
  }
}