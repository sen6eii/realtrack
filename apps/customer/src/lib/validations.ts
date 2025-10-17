import { validateTrackingCode } from '@/utils/helpers'

// Re-export validation functions
export { validateTrackingCode }

// Additional validations
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/
  return phoneRegex.test(phone)
}

export const validateRequired = (value: string): boolean => {
  return value.trim().length > 0
}

export const validateLength = (value: string, min: number, max?: number): boolean => {
  const length = value.trim().length
  if (max) {
    return length >= min && length <= max
  }
  return length >= min
}