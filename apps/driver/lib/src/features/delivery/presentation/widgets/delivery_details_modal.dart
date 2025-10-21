import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

class DeliveryDetailsModal extends StatelessWidget {
  final Map<String, dynamic> delivery;
  final Function(String) onStatusUpdate;

  const DeliveryDetailsModal({
    super.key,
    required this.delivery,
    required this.onStatusUpdate,
  });

  @override
  Widget build(BuildContext context) {
    final status = delivery['status'] as String;
    final customerName = delivery['customer_name'] as String;
    final customerPhone = delivery['customer_phone'] as String?;
    final deliveryAddress = delivery['delivery_address'] as String;
    final trackingCode = delivery['tracking_code'] as String;
    final notes = delivery['notes'] as String?;
    final createdAt = DateTime.parse(delivery['created_at'] as String);
    final estimatedDeliveryTime = delivery['estimated_delivery_time'] as String?;

    return Container(
      height: MediaQuery.of(context).size.height * 0.9,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(20),
          topRight: Radius.circular(20),
        ),
      ),
      child: Column(
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: const BoxDecoration(
              border: Border(bottom: BorderSide(color: Colors.grey, width: 0.2)),
            ),
            child: Row(
              children: [
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close),
                ),
                const Expanded(
                  child: Text(
                    'Delivery Details',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
                const SizedBox(width: 48), // Balance the close button
              ],
            ),
          ),
          
          // Content
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Status Badge
                  Row(
                    children: [
                      _buildStatusBadge(status),
                      const Spacer(),
                      Text(
                        'Tracking Code',
                        style: TextStyle(
                          color: Colors.grey[600],
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    trackingCode,
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 24),
                  
                  // Customer Information
                  _buildSectionHeader('Customer Information'),
                  const SizedBox(height: 12),
                  _buildInfoRow(Icons.person, customerName),
                  if (customerPhone != null) ...[
                    const SizedBox(height: 8),
                    _buildPhoneRow(Icons.phone, customerPhone),
                  ],
                  const SizedBox(height: 24),
                  
                  // Delivery Address
                  _buildSectionHeader('Delivery Address'),
                  const SizedBox(height: 12),
                  _buildInfoRow(Icons.location_on, deliveryAddress),
                  const SizedBox(height: 24),
                  
                  // Notes
                  if (notes != null && notes.isNotEmpty) ...[
                    _buildSectionHeader('Notes'),
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.grey[100],
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        notes,
                        style: TextStyle(
                          color: Colors.grey[700],
                          fontSize: 14,
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],
                  
                  // Timing Information
                  _buildSectionHeader('Timing'),
                  const SizedBox(height: 12),
                  _buildInfoRow(
                    Icons.access_time,
                    'Created: ${_formatDateTime(createdAt)}',
                  ),
                  if (estimatedDeliveryTime != null) ...[
                    const SizedBox(height: 8),
                    _buildInfoRow(
                      Icons.schedule,
                      'Estimated: ${_formatDateTime(DateTime.parse(estimatedDeliveryTime))}',
                    ),
                  ],
                  const SizedBox(height: 32),
                  
                  // Action Buttons
                  if (status == 'assigned' || status == 'on_route')
                    _buildActionButtons(context, status),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.bold,
        color: Color(0xFF1E40AF),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String text) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(
          icon,
          size: 20,
          color: Colors.grey[600],
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            text,
            style: TextStyle(
              color: Colors.grey[700],
              fontSize: 14,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPhoneRow(IconData icon, String phone) {
    return InkWell(
      onTap: () => _launchPhoneUrl('tel:$phone'),
      child: Row(
        children: [
          Icon(
            icon,
            size: 20,
            color: Colors.blue,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              phone,
              style: const TextStyle(
                color: Colors.blue,
                fontSize: 14,
                decoration: TextDecoration.underline,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color color;
    String label;
    
    switch (status) {
      case 'assigned':
        color = Colors.orange;
        label = 'Assigned';
        break;
      case 'on_route':
        color = Colors.blue;
        label = 'On Route';
        break;
      case 'delivered':
        color = Colors.green;
        label = 'Delivered';
        break;
      case 'cancelled':
        color = Colors.red;
        label = 'Cancelled';
        break;
      default:
        color = Colors.grey;
        label = 'Unknown';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.w600,
          fontSize: 14,
        ),
      ),
    );
  }

  Widget _buildActionButtons(BuildContext context, String status) {
    if (status == 'assigned') {
      return SizedBox(
        width: double.infinity,
        child: ElevatedButton(
          onPressed: () {
            Navigator.pop(context);
            onStatusUpdate('on_route');
          },
          style: ElevatedButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: 16),
          ),
          child: const Text(
            'Start Delivery',
            style: TextStyle(fontSize: 16),
          ),
        ),
      );
    } else if (status == 'on_route') {
      return Column(
        children: [
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
                onStatusUpdate('delivered');
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.green,
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: const Text(
                'Mark as Delivered',
                style: TextStyle(fontSize: 16),
              ),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: () {
                Navigator.pop(context);
                // Navigate to map view
              },
              child: const Text(
                'View on Map',
                style: TextStyle(fontSize: 16),
              ),
            ),
          ),
        ],
      );
    }
    
    return const SizedBox.shrink();
  }

  String _formatDateTime(DateTime dateTime) {
    return '${dateTime.day}/${dateTime.month}/${dateTime.year} ${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}';
  }

  Future<void> _launchPhoneUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }
}