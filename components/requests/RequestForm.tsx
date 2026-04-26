'use client'

import { useActionState, useState } from 'react'
import { createRequest } from '@/lib/actions/requests'
import { Card, CardHeader } from '@/components/ui/Card'
import { Input, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface RequestFormProps {
  categories: { id: string; name: string }[]
  verifiedSellers?: { id: string; name: string }[]
  shopperId?: string // Optional specific shopper to request from directly via URL
}

const initialState = {
  error: '',
}

export function RequestForm({ categories, verifiedSellers = [], shopperId }: RequestFormProps) {
  const [state, formAction, pending] = useActionState(createRequest, initialState)
  
  // To handle the "Other" category logic
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const isOtherCategory = categories.find(c => c.id === selectedCategory)?.name.toLowerCase() === 'other'

  return (
    <form action={formAction} className="space-y-6 fade-in">
      {state?.error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 text-sm">
          {state.error}
        </div>
      )}

      <Card>
        <CardHeader title="What do you want to buy?" subtitle="Provide details so shoppers can give you accurate quotes." />
        
        <div className="space-y-5">
          
          <div className="flex flex-col gap-1.5">
            <label htmlFor="target_shopper" className="text-sm font-medium text-navy-900">
               Target Seller (Optional)
            </label>
            <select
               id="target_shopper"
               name="shopper_id"
               defaultValue={shopperId || ""}
               className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 appearance-none"
            >
               <option value="">Broadcast to All Verified Sellers</option>
               {verifiedSellers.map((seller) => (
                  <option key={seller.id} value={seller.id}>{seller.name}</option>
               ))}
            </select>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
             <div className="flex flex-col gap-1.5">
                  <label htmlFor="category_id" className="text-sm font-medium text-navy-900">
                     Category <span className="text-red-500">*</span>
                  </label>
                  <select
                     id="category_id"
                     name="category_id"
                     required
                     defaultValue=""
                     onChange={(e) => setSelectedCategory(e.target.value)}
                     className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 appearance-none"
                  >
                     <option value="" disabled>Select a category...</option>
                     {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                     ))}
                  </select>
             </div>

             <div className="flex flex-col gap-1.5">
                 <label htmlFor="budget" className="text-sm font-medium text-navy-900">
                   Max Budget (ETB) - Optional
                 </label>
                 <div className="relative">
                   <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium tracking-wider">
                     ETB
                   </span>
                   <input
                     id="budget"
                     name="budget"
                     type="number"
                     min="0"
                     step="100"
                     className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 pl-12 text-sm text-navy-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                     placeholder="0"
                   />
                 </div>
               </div>
          </div>

          {/* Conditional Product Name Input if "Other" is selected */}
          {isOtherCategory ? (
            <Input 
              label="Product Name" 
              name="title" 
              placeholder="e.g. Need iPhone 15 Pro Max from Dubai" 
              required 
            />
          ) : (
            <Input 
              label="Title" 
              name="title" 
              placeholder="e.g. Need iPhone 15 Pro Max from Dubai" 
              required 
            />
          )}

          <Textarea 
            label="Details & Specifications" 
            name="description" 
            placeholder="Color, size, exact model number, preferred source country, etc."
            rows={5} 
            required
          />

          <Input
            label="Product Link (Optional)"
            name="source_url"
            type="url"
            placeholder="https://amazon.com/..."
            hint="If you found it online, paste the link here."
          />
        </div>
      </Card>

      <div className="flex justify-end gap-3">
         <Button type="button" variant="outline" onClick={() => window.history.back()}>
            Cancel
         </Button>
         <Button type="submit" variant="primary" loading={pending} size="lg">
            Post Request
         </Button>
      </div>
    </form>
  )
}
