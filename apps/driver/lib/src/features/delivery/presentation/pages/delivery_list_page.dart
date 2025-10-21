import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/delivery_provider.dart';
import '../widgets/delivery_card.dart';
import '../widgets/qr_scanner_modal.dart';
import '../widgets/delivery_details_modal.dart';

class DeliveryListPage extends ConsumerStatefulWidget {
  const DeliveryListPage({super.key});

  @override
  ConsumerState<DeliveryListPage> createState() => _DeliveryListPageState();
}

class _DeliveryListPageState extends ConsumerState<DeliveryListPage> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final GlobalKey<RefreshIndicatorState> _refreshIndicatorKey = GlobalKey<RefreshIndicatorState>();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final deliveries = ref.watch(deliveryProvider);
    final pendingDeliveries = ref.watch(deliveryProvider.select((p) => p.pendingDeliveries));
    final activeDeliveries = ref.watch(deliveryProvider.select((p) => p.activeDeliveries));
    final completedDeliveries = ref.watch(deliveryProvider.select((p) => p.completedDeliveries));

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Deliveries'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Pending (${0})'),
            Tab(text: 'Active (${0})'),
            Tab(text: 'Completed (${0})'),
          ],
          onTap: (index) {
            setState(() {});
          },
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.qr_code_scanner),
            onPressed: _showQRScanner,
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _refreshDeliveries,
          ),
        ],
      ),
      body: RefreshIndicator(
        key: _refreshIndicatorKey,
        onRefresh: _refreshDeliveries,
        child: TabBarView(
          controller: _tabController,
          children: [
            _buildDeliveryList(pendingDeliveries, 'No pending deliveries'),
            _buildDeliveryList(activeDeliveries, 'No active deliveries'),
            _buildDeliveryList(completedDeliveries, 'No completed deliveries'),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showQRScanner,
        child: const Icon(Icons.qr_code_scanner),
      ),
    );
  }

  Widget _buildDeliveryList(List<Map<String, dynamic>> deliveries, String emptyMessage) {
    if (deliveries.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.local_shipping_outlined,
              size: 64,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              emptyMessage,
              style: TextStyle(
                color: Colors.grey[600],
                fontSize: 16,
              ),
            ),
            const SizedBox(height: 16),
            if (_tabController.index == 0)
              ElevatedButton.icon(
                onPressed: _showQRScanner,
                icon: const Icon(Icons.qr_code_scanner),
                label: const Text('Scan QR Code'),
              ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: deliveries.length,
      itemBuilder: (context, index) {
        final delivery = deliveries[index];
        return DeliveryCard(
          delivery: delivery,
          onTap: () => _showDeliveryDetails(delivery),
          onStatusUpdate: (newStatus) => _updateDeliveryStatus(delivery['id'], newStatus),
        );
      },
    );
  }

  Future<void> _refreshDeliveries() async {
    await ref.read(deliveryProvider.notifier).refreshDeliveries();
  }

  void _showQRScanner() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => QRScannerModal(
        onScanResult: (trackingCode) async {
          Navigator.pop(context);
          await _assignDeliveryByTrackingCode(trackingCode);
        },
      ),
    );
  }

  Future<void> _assignDeliveryByTrackingCode(String trackingCode) async {
    try {
      await ref.read(deliveryProvider.notifier).assignDeliveryByTrackingCode(trackingCode);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Delivery assigned successfully!'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString()),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _showDeliveryDetails(Map<String, dynamic> delivery) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => DeliveryDetailsModal(
        delivery: delivery,
        onStatusUpdate: (newStatus) => _updateDeliveryStatus(delivery['id'], newStatus),
      ),
    );
  }

  Future<void> _updateDeliveryStatus(String deliveryId, String newStatus) async {
    try {
      await ref.read(deliveryProvider.notifier).updateDeliveryStatus(deliveryId, newStatus);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Delivery status updated to: $newStatus'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString()),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }
}