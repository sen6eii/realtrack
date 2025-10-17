import { useState, useEffect } from 'react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { DeliveryCard } from '@/components/DeliveryCard'
import { CreateDeliveryModal } from '@/components/CreateDeliveryModal'
import { Map } from '@/components/Map'
import { StatusBadge } from '@/components/StatusBadge'
import { useDeliveryStore } from '@/store/delivery'
import { useAuthStore } from '@/store/auth'
import { deliveryService } from '@/lib/services'
import { formatRelativeTime, generateTrackingLink } from '@/utils/helpers'
import { 
  MagnifyingGlassIcon, 
  PlusIcon, 
  MapPinIcon,
  PhoneIcon,
  UserIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function DashboardPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null)
  
  const { user, business } = useAuthStore()
  const { 
    deliveries, 
    drivers, 
    selectedDelivery: storeSelectedDelivery,
    setSelectedDelivery: setStoreSelectedDelivery,
    setDeliveries, 
    setDrivers,
    setLoading,
    setError
  } = useDeliveryStore()

  // Load data on component mount
  useEffect(() => {
    if (business?.id) {
      loadDashboardData()
    }
  }, [business?.id])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [deliveriesData, driversData] = await Promise.all([
        deliveryService.getDeliveries(business!.id),
        deliveryService.driverService.getDrivers(business!.id),
      ])

      setDeliveries(deliveriesData)
      setDrivers(driversData)
    } catch (error: any) {
      toast.error(error.message || 'Failed to load dashboard data')
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeliverySelect = async (delivery: any) => {
    try {
      const deliveryDetails = await deliveryService.getDelivery(delivery.id)
      setStoreSelectedDelivery(deliveryDetails)
      setSelectedDelivery(deliveryDetails)
    } catch (error: any) {
      toast.error(error.message || 'Failed to load delivery details')
    }
  }

  const handleStatusUpdate = async (deliveryId: string, status: string) => {
    try {
      await deliveryService.updateStatus(deliveryId, status as any)
      toast.success('Delivery status updated successfully')
      loadDashboardData() // Refresh data
    } catch (error: any) {
      toast.error(error.message || 'Failed to update delivery status')
    }
  }

  const handleDriverAssign = async (deliveryId: string, driverId: string) => {
    try {
      await deliveryService.assignDriver(deliveryId, driverId)
      toast.success('Driver assigned successfully')
      loadDashboardData() // Refresh data
    } catch (error: any) {
      toast.error(error.message || 'Failed to assign driver')
    }
  }

  // Filter deliveries
  const filteredDeliveries = deliveries.filter(delivery => {
    const matchesSearch = 
      delivery.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.delivery_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.tracking_code.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || delivery.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Get map markers for active deliveries
  const mapMarkers = deliveries
    .filter(d => d.status === 'on_route' && d.driver?.location)
    .map(delivery => ({
      id: delivery.id,
      coordinates: JSON.parse(delivery.driver!.location!).coordinates as [number, number],
      popup: `
        <div class="p-2">
          <div class="font-medium">${delivery.customer_name}</div>
          <div class="text-sm text-gray-600">${delivery.tracking_code}</div>
          <div class="text-sm text-gray-600">${delivery.driver!.name}</div>
        </div>
      `,
      color: delivery.status === 'on_route' ? '#8b5cf6' : '#6b7280'
    }))

  const activeDeliveries = deliveries.filter(d => 
    ['assigned', 'on_route'].includes(d.status)
  )

  const todayDeliveries = deliveries.filter(d => 
    new Date(d.created_at).toDateString() === new Date().toDateString()
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {business?.name} Dashboard
              </h1>
              <p className="text-gray-600">
                Manage your deliveries and track drivers in real-time
              </p>
            </div>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <PlusIcon className="h-4 w-4 mr-2" />
              New Delivery
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardBody className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MapPinIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Active Deliveries</p>
                  <p className="text-2xl font-bold text-gray-900">{activeDeliveries.length}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <div className="text-2xl">📦</div>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Today's Deliveries</p>
                  <p className="text-2xl font-bold text-gray-900">{todayDeliveries.length}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <UserIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Active Drivers</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {drivers.filter(d => d.is_active).length}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <div className="text-2xl">📊</div>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Deliveries</p>
                  <p className="text-2xl font-bold text-gray-900">{deliveries.length}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Deliveries List */}
          <div>
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-medium text-gray-900">Recent Deliveries</h2>
                  <div className="flex space-x-2">
                    <div className="relative">
                      <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-2.5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="assigned">Assigned</option>
                      <option value="on_route">On Route</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {filteredDeliveries.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-gray-400 mb-2">📦</div>
                      <p className="text-gray-500">No deliveries found</p>
                    </div>
                  ) : (
                    filteredDeliveries.slice(0, 10).map((delivery) => (
                      <DeliveryCard
                        key={delivery.id}
                        delivery={delivery}
                        onSelect={handleDeliverySelect}
                        isSelected={selectedDelivery?.id === delivery.id}
                      />
                    ))
                  )}
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Live Map & Delivery Details */}
          <div className="space-y-6">
            {/* Live Map */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-medium text-gray-900">Live Driver Tracking</h2>
              </CardHeader>
              <CardBody className="p-0">
                {process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ? (
                  <Map
                    accessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
                    height="300px"
                    markers={mapMarkers}
                  />
                ) : (
                  <div className="h-[300px] bg-gray-100 flex items-center justify-center">
                    <p className="text-gray-500">Map requires Mapbox access token</p>
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Selected Delivery Details */}
            {selectedDelivery && (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-medium text-gray-900">Delivery Details</h2>
                    <StatusBadge status={selectedDelivery.status} />
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {selectedDelivery.customer_name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Tracking: {selectedDelivery.tracking_code}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <MapPinIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <span>{selectedDelivery.delivery_address}</span>
                      </div>
                      {selectedDelivery.customer_phone && (
                        <div className="flex items-center text-sm">
                          <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                          <span>{selectedDelivery.customer_phone}</span>
                        </div>
                      )}
                    </div>

                    {selectedDelivery.driver && (
                      <div className="p-3 bg-gray-50 rounded-md">
                        <p className="text-sm font-medium text-gray-900">
                          Driver: {selectedDelivery.driver.name}
                        </p>
                        {selectedDelivery.driver.vehicle_type && (
                          <p className="text-sm text-gray-600">
                            Vehicle: {selectedDelivery.driver.vehicle_type}
                          </p>
                        )}
                      </div>
                    )}

                    {selectedDelivery.notes && (
                      <div className="p-3 bg-yellow-50 rounded-md">
                        <p className="text-sm text-gray-700">{selectedDelivery.notes}</p>
                      </div>
                    )}

                    <div className="flex space-x-2 pt-4 border-t">
                      {selectedDelivery.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(selectedDelivery.id, 'assigned')}
                        >
                          Mark Assigned
                        </Button>
                      )}
                      {selectedDelivery.status === 'assigned' && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(selectedDelivery.id, 'on_route')}
                        >
                          Start Delivery
                        </Button>
                      )}
                      {selectedDelivery.status === 'on_route' && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(selectedDelivery.id, 'delivered')}
                        >
                          Mark Delivered
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            generateTrackingLink(selectedDelivery.tracking_code)
                          )
                          toast.success('Tracking link copied to clipboard!')
                        }}
                      >
                        Copy Tracking Link
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Create Delivery Modal */}
      <CreateDeliveryModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        businessId={business!.id}
      />
    </div>
  )
}