'use client'

import { useActionState, useState } from 'react'
import { createProduct } from '@/lib/actions/products'
import { Card, CardHeader } from '@/components/ui/Card'
import { Input, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface ProductFormProps {
  categories: { id: string; name: string }[]
}

const initialState = {
  error: '',
}

export function ProductForm({ categories }: ProductFormProps) {
  const [state, formAction, pending] = useActionState(createProduct, initialState)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImagePreview(URL.createObjectURL(file))
    } else {
      setImagePreview(null)
    }
  }

  return (
    <form action={formAction} className="space-y-8 fade-in">
      {state?.error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 text-sm">
          {state.error}
        </div>
      )}

      <Card>
        <CardHeader title="Product Details" subtitle="Add the information buyers will see." />
        
        <div className="space-y-6">
          <Input 
            label="Product Name" 
            name="name" 
            placeholder="e.g. Wireless Noise-Cancelling Headphones" 
            required 
          />

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="price" className="text-sm font-medium text-navy-900">
                Price (ETB) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium tracking-wider">
                  ETB
                </span>
                <input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 pl-12 text-sm text-navy-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
               <label htmlFor="category" className="text-sm font-medium text-navy-900">
                  Category <span className="text-red-500">*</span>
               </label>
               <select
                  id="category"
                  name="category_id"
                  required
                  defaultValue=""
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 appearance-none"
               >
                  <option value="" disabled>Select a category...</option>
                  {categories.map((cat) => (
                     <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
               </select>
            </div>
          </div>

          <Textarea 
            label="Description" 
            name="description" 
            placeholder="Describe the product, its condition, and any other relevant details."
            rows={5} 
            required
          />
        </div>
      </Card>

      <Card>
        <CardHeader title="Product Image" subtitle="Upload a clear photo of the product." />
        
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="w-full sm:w-48 aspect-square rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden relative group">
            {imagePreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center p-4">
                <svg className="w-8 h-8 text-slate-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs text-slate-400">No image selected</span>
              </div>
            )}
            
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-white text-sm font-medium">Click to upload</span>
            </div>
               
            <input 
              type="file" 
              name="image" 
              accept="image/*" 
              onChange={handleImageChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
          
          <div className="flex-1 space-y-2">
            <h4 className="text-sm font-medium text-navy-900">Upload Requirement</h4>
            <p className="text-sm text-slate-500">
               Please ensure the image is clear and accurately represents the product. 
               PNG, JPG, or WEBP. Max size 5MB.
            </p>
          </div>
        </div>
      </Card>

      <div className="flex justify-end gap-3">
         <Button type="button" variant="outline" onClick={() => window.history.back()}>
            Cancel
         </Button>
         <Button type="submit" variant="primary" loading={pending}>
            Publish Listing
         </Button>
      </div>
    </form>
  )
}
