import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTimestamp(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatRelativeTime(date: string | Date): string {
  const d = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
}

export function formatTimeRemaining(date: string | Date): string {
  const target = new Date(date)
  const now = new Date()
  const diffMs = target.getTime() - now.getTime()

  if (diffMs <= 0) return 'Overdue'

  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)

  if (diffMins < 60) return `~${diffMins} min${diffMins > 1 ? 's' : ''}`
  if (diffHours < 24) return `~${diffHours} hour${diffHours > 1 ? 's' : ''}`
  
  return formatTimestamp(date)
}

export function getStatusColor(status: string): string {
  const colors = {
    pending: 'yellow',
    assigned: 'blue',
    on_route: 'purple',
    delivered: 'green',
    cancelled: 'red',
  }
  return colors[status as keyof typeof colors] || 'gray'
}

export function getStatusText(status: string): string {
  const texts = {
    pending: 'Preparing',
    assigned: 'Assigned',
    on_route: 'On the way',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  }
  return texts[status as keyof typeof texts] || 'Unknown'
}

export function getStatusIcon(status: string): string {
  const icons = {
    pending: '📦',
    assigned: '🚗',
    on_route: '📍',
    delivered: '✅',
    cancelled: '❌',
  }
  return icons[status as keyof typeof icons] || '📦'
}

export function parseCoordinates(coordinates: string | null): { lat: number; lng: number } | null {
  if (!coordinates) return null
  
  try {
    const parsed = JSON.parse(coordinates)
    return {
      lat: parsed.coordinates[1],
      lng: parsed.coordinates[0],
    }
  } catch {
    return null
  }
}

export function formatPhoneNumber(phone: string | null): string {
  if (!phone) return ''
  
  // Simple phone formatting - adjust based on your needs
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  
  return phone
}

export function shareTrackingLink(trackingCode: string, baseUrl = window.location.origin): Promise<void> {
  const url = `${baseUrl}/track/${trackingCode}`
  
  if (navigator.share) {
    return navigator.share({
      title: 'Track your delivery',
      text: `Track your delivery with code ${trackingCode}`,
      url: url,
    })
  } else {
    // Fallback - copy to clipboard
    return navigator.clipboard.writeText(url).then(() => {
      // Could show a toast notification here
      console.log('Tracking link copied to clipboard')
    })
  }
}

export function validateTrackingCode(code: string): boolean {
  // Tracking codes should be alphanumeric, 4-10 characters
  const trackingCodeRegex = /^[A-Z0-9]{4,10}$/i
  return trackingCodeRegex.test(code)
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}