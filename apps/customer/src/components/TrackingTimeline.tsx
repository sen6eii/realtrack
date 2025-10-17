import { DeliveryStatus } from '@/types'
import { formatTimestamp, formatTimeRemaining, getStatusText, getStatusIcon } from '@/utils/helpers'

interface TrackingTimelineProps {
  status: DeliveryStatus
  createdAt: string
  estimatedDeliveryTime?: string | null
  actualDeliveryTime?: string | null
  className?: string
}

export function TrackingTimeline({ 
  status, 
  createdAt, 
  estimatedDeliveryTime, 
  actualDeliveryTime,
  className = '' 
}: TrackingTimelineProps) {
  const timelineSteps = [
    {
      id: 'created',
      label: 'Order Placed',
      time: formatTimestamp(createdAt),
      completed: true,
      active: false,
      icon: '📋',
    },
    {
      id: 'assigned',
      label: 'Driver Assigned',
      time: status === 'pending' ? 'Pending' : 'Completed',
      completed: ['assigned', 'on_route', 'delivered'].includes(status),
      active: status === 'assigned',
      icon: '🚗',
    },
    {
      id: 'on_route',
      label: 'Out for Delivery',
      time: status === 'on_route' ? 'In progress' : 
            status === 'delivered' ? 'Completed' : 'Pending',
      completed: ['on_route', 'delivered'].includes(status),
      active: status === 'on_route',
      icon: '📍',
    },
    {
      id: 'delivered',
      label: 'Delivered',
      time: actualDeliveryTime 
        ? formatTimestamp(actualDeliveryTime)
        : estimatedDeliveryTime 
          ? `ETA: ${formatTimeRemaining(estimatedDeliveryTime)}`
          : 'Pending',
      completed: status === 'delivered',
      active: status === 'delivered',
      icon: '✅',
    },
  ]

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Delivery Progress</h3>
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{getStatusIcon(status)}</span>
          <span className="text-sm font-medium text-gray-600">
            {getStatusText(status)}
          </span>
        </div>
      </div>

      <div className="relative">
        {timelineSteps.map((step, index) => (
          <div key={step.id} className="tracking-step">
            <div className={`tracking-dot ${
              step.completed 
                ? 'completed' 
                : step.active 
                  ? 'active' 
                  : 'pending'
            }`}>
              <span className="text-sm">{step.icon}</span>
            </div>
            
            <div className="ml-4 pb-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`font-medium ${
                    step.completed 
                      ? 'text-gray-900' 
                      : step.active 
                        ? 'text-primary-600' 
                        : 'text-gray-500'
                  }`}>
                    {step.label}
                  </p>
                  <p className={`text-sm ${
                    step.completed 
                      ? 'text-gray-600' 
                      : step.active 
                        ? 'text-primary-500' 
                        : 'text-gray-400'
                  }`}>
                    {step.time}
                  </p>
                </div>
                
                {step.active && (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-primary-600 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-primary-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-primary-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                )}
              </div>
              
              {step.id === 'on_route' && step.active && (
                <div className="mt-2 p-3 bg-blue-50 rounded-md">
                  <p className="text-sm text-blue-800">
                    Your driver is on the way with your package!
                  </p>
                </div>
              )}
              
              {step.id === 'delivered' && step.completed && (
                <div className="mt-2 p-3 bg-green-50 rounded-md">
                  <p className="text-sm text-green-800">
                    Package has been successfully delivered!
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}