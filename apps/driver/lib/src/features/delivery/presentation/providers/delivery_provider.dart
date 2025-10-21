import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../core/services/supabase_service.dart';

part 'delivery_provider.g.dart';

@riverpod
class DeliveryProvider extends _$DeliveryProvider {
  @override
  List<Map<String, dynamic>> build() {
    _loadDeliveries();
    return [];
  }
  
  Future<void> _loadDeliveries() async {
    try {
      final supabaseService = ref.read(supabaseServiceProvider);
      final user = supabaseService.currentUser;
      
      if (user != null) {
        final deliveries = await supabaseService.getDeliveriesForDriver(user.id);
        state = deliveries;
        
        // Set up real-time updates
        supabaseService.subscribeToDriverDeliveries(user.id, (updatedDeliveries) {
          state = updatedDeliveries;
        });
      }
    } catch (e) {
      print('Error loading deliveries: $e');
    }
  }
  
  Future<void> refreshDeliveries() async {
    await _loadDeliveries();
  }
  
  Future<void> updateDeliveryStatus(String deliveryId, String status) async {
    try {
      final supabaseService = ref.read(supabaseServiceProvider);
      await supabaseService.updateDeliveryStatus(deliveryId, status);
      
      // Show notification for status update
      await _showStatusNotification(status, deliveryId);
      
      // Refresh deliveries
      await refreshDeliveries();
    } catch (e) {
      throw Exception('Failed to update delivery status: $e');
    }
  }
  
  Future<void> assignDeliveryByTrackingCode(String trackingCode) async {
    try {
      final supabaseService = ref.read(supabaseServiceProvider);
      final user = supabaseService.currentUser;
      
      if (user == null) {
        throw Exception('User not authenticated');
      }
      
      // Get delivery by tracking code
      final delivery = await supabaseService.getDeliveryByTrackingCode(trackingCode);
      if (delivery == null) {
        throw Exception('Delivery not found');
      }
      
      if (delivery['driver_id'] != null) {
        throw Exception('Delivery already assigned to another driver');
      }
      
      // Assign delivery to current driver
      await supabaseService.assignDeliveryToDriver(delivery['id'], user.id);
      
      // Show notification
      await _showStatusNotification('assigned', delivery['id']);
      
      // Refresh deliveries
      await refreshDeliveries();
    } catch (e) {
      throw Exception('Failed to assign delivery: $e');
    }
  }
  
  Future<void> _showStatusNotification(String status, String deliveryId) async {
    // This would use the notification service
    print('Delivery $deliveryId status updated to: $status');
  }
  
  List<Map<String, dynamic>> get deliveriesByStatus {
    final groupedDeliveries = <String, List<Map<String, dynamic>>>{};
    
    for (final delivery in state) {
      final status = delivery['status'] as String;
      if (!groupedDeliveries.containsKey(status)) {
        groupedDeliveries[status] = [];
      }
      groupedDeliveries[status]!.add(delivery);
    }
    
    return state;
  }
  
  List<Map<String, dynamic>> get pendingDeliveries => 
      state.where((d) => d['status'] == 'assigned').toList();
  
  List<Map<String, dynamic>> get activeDeliveries => 
      state.where((d) => d['status'] == 'on_route').toList();
  
  List<Map<String, dynamic>> get completedDeliveries => 
      state.where((d) => d['status'] == 'delivered').toList();
}