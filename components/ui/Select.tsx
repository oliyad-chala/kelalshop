'use client'

import { useState, useRef, useEffect } from 'react'
import { clsx } from 'clsx'

export interface SelectOption {
  value: string
  label: React.ReactNode
  disabled?: boolean
}

export interface SelectProps {
  id?: string
  name?: string
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  className?: string
  required?: boolean
  disabled?: boolean
}

export function Select({
  id,
  name,
  value,
  defaultValue,
  onChange,
  options,
  placeholder = 'Select an option',
  className,
  required,
  disabled
}: SelectProps) {
  const [internalValue, setInternalValue] = useState(value ?? defaultValue ?? '')
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Keep internal state in sync with controlled value
  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value)
    }
  }, [value])

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const selectedOption = options.find(o => o.value === internalValue)

  const handleSelect = (optionValue: string) => {
    if (value === undefined) {
      setInternalValue(optionValue)
    }
    onChange?.(optionValue)
    setIsOpen(false)
  }

  return (
    <div className={clsx('relative', className)} ref={containerRef}>
      {/* Hidden input for native form submission */}
      {name && <input type="hidden" name={name} value={internalValue} required={required} />}
      
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'w-full flex items-center justify-between px-4 py-2.5 bg-white border rounded-xl text-left text-sm transition-all shadow-sm',
          isOpen ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-slate-200 hover:border-slate-300',
          disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'cursor-pointer text-navy-900'
        )}
      >
        <span className={clsx('block truncate', !selectedOption && 'text-slate-400')}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className={clsx('w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-2', isOpen && 'rotate-180')}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-lg shadow-slate-200/50 py-1 max-h-60 overflow-auto animate-in fade-in slide-in-from-top-2 duration-200">
          {options.map((option) => {
            const isSelected = option.value === internalValue
            return (
              <button
                key={option.value}
                type="button"
                disabled={option.disabled}
                onClick={() => !option.disabled && handleSelect(option.value)}
                className={clsx(
                  'w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors',
                  isSelected ? 'bg-amber-50 text-amber-900 font-medium' : 'text-slate-700 hover:bg-slate-50',
                  option.disabled && 'opacity-50 cursor-not-allowed text-slate-400'
                )}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && (
                  <svg className="w-4 h-4 text-amber-600 shrink-0 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
