'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/Button'
import { ConfirmModal } from '@/components/ui/ConfirmModal'

interface DeleteProductButtonProps {
  productId: string
  onDelete: (id: string) => Promise<void>
  className?: string
  children?: React.ReactNode
}

export function DeleteProductButton({ productId, onDelete, className, children }: DeleteProductButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleConfirm = () => {
    setIsModalOpen(false)
    startTransition(async () => {
      try {
        await onDelete(productId)
      } catch (error) {
        alert('Failed to delete product. Please try again.')
      }
    })
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className={className || "text-slate-500 hover:text-red-600 px-3 py-1.5 h-auto"}
        onClick={() => setIsModalOpen(true)}
        loading={isPending}
        disabled={isPending}
      >
        {children || 'Delete'}
      </Button>

      <ConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirm}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        confirmText="Delete Product"
        variant="danger"
        isLoading={isPending}
      />
    </>
  )
}
