import { forwardRef } from 'react'
import { cn } from '@/utils/helpers'

interface InputProps {
  label?: string
  error?: string
  helperText?: string
  type?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
  [key: string]: any
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      type = 'text',
      placeholder,
      required = false,
      disabled = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const inputClasses = cn(
      'block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 sm:text-sm',
      error
        ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
        : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500',
      disabled && 'bg-gray-50 text-gray-500 cursor-not-allowed',
      className
    )

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          className={inputClasses}
          placeholder={placeholder}
          disabled={disabled}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'