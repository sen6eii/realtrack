import { DeliveryStatus } from '@/types'

interface StatusBadgeProps {
  status: DeliveryStatus
  showIcon?: boolean
  className?: string
}

export function StatusBadge({ status, showIcon = true, className = '' }: StatusBadgeProps) {
  const getStatusClasses = (status: DeliveryStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'assigned':
        return 'bg-blue-100 text-blue-800'
      case 'on_route':
        return 'bg-purple-100 text-purple-800 animate-pulse-slow'
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: DeliveryStatus) => {
    switch (status) {
      case 'pending':
        return 'Preparing'
      case 'assigned':
        return 'Assigned'
      case 'on_route':
        return 'On the way'
      case 'delivered':
        return 'Delivered'
      case 'cancelled':
        return 'Cancelled'
      default:
        return 'Unknown'
    }
  }

  const getStatusIcon = (status: DeliveryStatus) => {
    switch (status) {
      case 'pending':
        return '📦'
      case 'assigned':
        return '🚗'
      case 'on_route':
        return '📍'
      case 'delivered':
        return '✅'
      case 'cancelled':
        return '❌'
      default:
        return '📦'
    }
  }

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusClasses(
        status
      )} ${className}`}
    >
      {showIcon && <span className="mr-1.5">{getStatusIcon(status)}</span>}
      {getStatusText(status)}
    </span>
  )
}