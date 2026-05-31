'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'

export type ConfirmVariant = 'danger' | 'success' | 'info'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string | React.ReactNode
  confirmText?: string
  cancelText?: string
  variant?: ConfirmVariant
  isLoading?: boolean
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false
}: ConfirmModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen || !mounted) return null

  // Styles based on variant
  const styles = {
    danger: {
      icon: <AlertTriangle className="w-6 h-6 text-red-600" />,
      iconBg: 'bg-red-100',
      buttonBg: 'bg-red-600 hover:bg-red-700',
      buttonFocus: 'focus:ring-red-500',
    },
    success: {
      icon: <CheckCircle2 className="w-6 h-6 text-emerald-600" />,
      iconBg: 'bg-emerald-100',
      buttonBg: 'bg-emerald-600 hover:bg-emerald-700',
      buttonFocus: 'focus:ring-emerald-500',
    },
    info: {
      icon: <Info className="w-6 h-6 text-blue-600" />,
      iconBg: 'bg-blue-100',
      buttonBg: 'bg-blue-600 hover:bg-blue-700',
      buttonFocus: 'focus:ring-blue-500',
    }
  }

  const currentStyle = styles[variant]

  const modalContent = (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-0">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        style={{ animation: 'fadeIn 0.2s ease-out' }}
        onClick={() => !isLoading && onClose()}
      />

      {/* Modal Panel */}
      <div 
        ref={dialogRef}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md overflow-hidden"
        style={{ animation: 'popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header Close Button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start text-center sm:text-left">
            {/* Icon */}
            <div className={`shrink-0 flex items-center justify-center w-12 h-12 rounded-full ${currentStyle.iconBg}`}>
              {currentStyle.icon}
            </div>

            {/* Content */}
            <div className="flex-1">
              <h3 id="modal-title" className="text-lg font-bold text-navy-900 mb-2">
                {title}
              </h3>
              <div className="text-sm text-slate-500 leading-relaxed">
                {message}
              </div>
            </div>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col-reverse sm:flex-row justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all disabled:opacity-70 ${currentStyle.buttonBg} ${currentStyle.buttonFocus}`}
          >
            {isLoading && (
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {confirmText}
          </button>
        </div>
      </div>
      
      {/* Global styles for animations if they don't exist */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn { 
          0% { opacity: 0; transform: scale(0.95) translateY(10px); } 
          100% { opacity: 1; transform: scale(1) translateY(0); } 
        }
      `}} />
    </div>
  )

  return createPortal(modalContent, document.body)
}
