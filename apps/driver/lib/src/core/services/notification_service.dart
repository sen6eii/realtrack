import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'notification_service.g.dart';

@riverpod
class NotificationService extends _$NotificationService {
  static bool _isInitialized = false;
  
  @override
  bool build() => false;
  
  static Future<void> initialize() async {
    if (_isInitialized) return;
    
    // Initialize notification service here
    // This would integrate with Firebase Cloud Messaging or similar
    
    _isInitialized = true;
  }
  
  static Future<void> showDeliveryNotification({
    required String title,
    required String body,
    String? payload,
  }) async {
    // Implementation would show local notification
    print('Notification: $title - $body');
  }
  
  static Future<void> showLocationUpdateNotification() async {
    await showDeliveryNotification(
      title: 'Location Update',
      body: 'Your location has been updated',
    );
  }
  
  static Future<void> showDeliveryStatusNotification({
    required String status,
    required String trackingCode,
  }) async {
    String title, body;
    
    switch (status) {
      case 'assigned':
        title = 'New Delivery Assigned';
        body = 'Delivery $trackingCode has been assigned to you';
        break;
      case 'on_route':
        title = 'Delivery Started';
        body = 'You are now on route for delivery $trackingCode';
        break;
      case 'delivered':
        title = 'Delivery Completed';
        body = 'Delivery $trackingCode has been marked as delivered';
        break;
      default:
        title = 'Delivery Update';
        body = 'Delivery $trackingCode status: $status';
    }
    
    await showDeliveryNotification(
      title: title,
      body: body,
      payload: trackingCode,
    );
  }
}