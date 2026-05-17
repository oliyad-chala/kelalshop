'use client'

import { useActionState, useState, useRef } from 'react'
import { createProduct } from '@/lib/actions/products'
import { Card, CardHeader } from '@/components/ui/Card'
import { Input, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface ProductFormProps {
  categories: { id: string; name: string }[]
  /** If provided, listing creation is locked until verified */
  isVerified?: boolean
  /** If true, the user has reached their active listing limit, so new ones will be hidden */
  isLimitReached?: boolean
}

const MAX_IMAGES = 3
const MAX_MB = 5
const MAX_BYTES = MAX_MB * 1024 * 1024

const initialState = { error: '', success: '' }

export function ProductForm({ categories, isVerified = true, isLimitReached = false }: ProductFormProps) {
  const [state, formAction, pending] = useActionState(createProduct, initialState)
  const [previews, setPreviews] = useState<string[]>([])
  const [fileError, setFileError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const inputRef = useRef<HTMLInputElement>(null)

  const isOther = categories.find(c => c.id === selectedCategory)?.name === 'Other'

  const handleImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null)
    const files = Array.from(e.target.files ?? [])

    if (files.length > MAX_IMAGES) {
      setFileError(`You can upload a maximum of ${MAX_IMAGES} photos.`)
      e.target.value = ''
      return
    }

    try {
      // Compress images client-side to easily pass the 1MB Next.js limit
      const compressedFiles = await Promise.all(files.map(async (file) => {
        return new Promise<File>((resolve, reject) => {
          const reader = new FileReader()
          reader.readAsDataURL(file)
          reader.onload = (event) => {
            const img = new Image()
            img.src = event.target?.result as string
            img.onload = () => {
              const canvas = document.createElement('canvas')
              let { width, height } = img
              
              // Scale down if larger than 1200px
              if (width > 1200 || height > 1200) {
                if (width > height) {
                  height = Math.round((height * 1200) / width)
                  width = 1200
                } else {
                  width = Math.round((width * 1200) / height)
                  height = 1200
                }
              }
              
              canvas.width = width
              canvas.height = height
              const ctx = canvas.getContext('2d')
              ctx?.drawImage(img, 0, 0, width, height)
              
              canvas.toBlob((blob) => {
                if (blob) {
                  resolve(new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", { type: 'image/jpeg', lastModified: Date.now() }))
                } else {
                  reject(new Error('Compression failed'))
                }
              }, 'image/jpeg', 0.7) // 70% quality compression
            }
            img.onerror = () => reject(new Error('Invalid image'))
          }
          reader.onerror = () => reject(new Error('File read failed'))
        })
      }))

      // Ensure total compressed size is strictly under 1MB to avoid Next.js crash
      const totalSize = compressedFiles.reduce((sum, f) => sum + f.size, 0)
      if (totalSize > 1000000) { // ~1MB
        setFileError("Total image size is too large. Please select fewer or smaller photos.")
        e.target.value = ''
        return
      }

      // Override the input files with the compressed ones
      const dt = new DataTransfer()
      compressedFiles.forEach(f => dt.items.add(f))
      if (inputRef.current) {
        inputRef.current.files = dt.files
      }

      const urls = compressedFiles.map(f => URL.createObjectURL(f))
      setPreviews(urls)

    } catch (err) {
      setFileError("Could not process these photos. Please try standard JPG/PNG formats.")
      e.target.value = ''
    }
  }

  if (!isVerified) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-amber-900 mb-2">Verification Required</h3>
        <p className="text-amber-800/80 text-sm max-w-md mx-auto">
          Listing creation is locked until your identity has been verified by an admin. Complete the verification process to unlock this feature.
        </p>
        <a href="/dashboard/verification" className="inline-block mt-5 px-5 py-2.5 bg-amber-500 text-white rounded-xl font-semibold text-sm hover:bg-amber-600 transition-colors">
          Go to Verification →
        </a>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-8 fade-in">
      {state?.error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 text-sm">{state.error}</div>
      )}
      {state?.success && (
        <div className="p-4 bg-green-50 text-green-700 rounded-xl border border-green-100 text-sm">{state.success}</div>
      )}
      {isLimitReached && !state?.success && (
        <div className="p-4 bg-amber-50 text-amber-800 rounded-xl border border-amber-200 text-sm flex gap-3 items-start">
          <svg className="w-5 h-5 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <strong>Active Limit Reached:</strong> You have reached your Free plan limit of 3 active products. You can still create this listing, but it will be saved as <strong>Hidden</strong>. Upgrade to Pro or hide an older listing to activate it.
          </div>
        </div>
      )}

      {/* ── Product Details ─────────────────────────────────────── */}
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
            {/* Price */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="price" className="text-sm font-medium text-navy-900">
                Price (ETB) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">ETB</span>
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

            {/* Category */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="category" className="text-sm font-medium text-navy-900">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                name="category_id"
                required
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 appearance-none"
              >
                <option value="" disabled>Select a category…</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* "Other" category → mandatory product name field */}
          {isOther && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <Input
                label='Custom Product Name (required for "Other" category)'
                name="custom_name"
                placeholder="e.g. Handmade Leather Wallet"
                required
              />
            </div>
          )}

          <Textarea
            label="Description"
            name="description"
            placeholder="Describe the product, its condition, source, and any other relevant details."
            rows={5}
            required
          />

          <div className="grid sm:grid-cols-2 gap-6">
            {/* Location / Origin */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="location" className="text-sm font-medium text-navy-900">
                Product Origin / Location
              </label>
              <input
                id="location"
                name="location"
                type="text"
                placeholder="e.g. Dubai, UAE or Addis Ababa"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-navy-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
              />
            </div>

            {/* Stock */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="stock" className="text-sm font-medium text-navy-900">Stock Quantity</label>
              <input
                id="stock"
                name="stock"
                type="number"
                min="0"
                defaultValue={1}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
              />
            </div>
          </div>

          {/* ── Dynamic Attributes Section ────────────────────────────── */}
          {(() => {
            const catName = categories.find(c => c.id === selectedCategory)?.name
            if (!catName) return null

            const isClothing = catName === 'Clothing & Fashion'
            const isElectronics = catName === 'Electronics'

            if (!isClothing && !isElectronics) return null

            return (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <h4 className="text-sm font-bold text-navy-900 mb-4">Specifications</h4>
                
                {isClothing && (
                  <div className="grid sm:grid-cols-2 gap-4">
                    <select name="attr_Type" defaultValue="" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" required>
                      <option value="" disabled>Select Type</option>
                      <option value="Apparel">Apparel</option>
                      <option value="Shoes">Shoes</option>
                      <option value="Accessories">Accessories</option>
                    </select>
                    <input name="attr_Brand" type="text" placeholder="Brand" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" />
                    <input name="attr_Size" type="text" placeholder="Size (e.g. M, 42, US 9)" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" />
                    <input name="attr_Color" type="text" placeholder="Color" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" />
                    <input name="attr_Material" type="text" placeholder="Material (e.g. Cotton, Leather)" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" />
                    <select name="attr_Condition" defaultValue="" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm">
                      <option value="" disabled>Condition</option>
                      <option value="New">New</option>
                      <option value="Like New">Like New</option>
                      <option value="Used">Used</option>
                    </select>
                  </div>
                )}

                {isElectronics && (
                  <div className="grid sm:grid-cols-2 gap-4">
                    <select name="attr_Type" defaultValue="" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" required>
                      <option value="" disabled>Select Type</option>
                      <option value="Phone">Phone</option>
                      <option value="Computer">Computer</option>
                      <option value="Accessory">Accessory</option>
                    </select>
                    <input name="attr_Brand" type="text" placeholder="Brand (e.g. Apple, Samsung)" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" />
                    <input name="attr_Storage" type="text" placeholder="Storage (e.g. 128GB)" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" />
                    <input name="attr_Color" type="text" placeholder="Color" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" />
                    <select name="attr_Condition" defaultValue="" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm">
                      <option value="" disabled>Condition</option>
                      <option value="New">New</option>
                      <option value="Used (Good)">Used (Good)</option>
                      <option value="Used (Fair)">Used (Fair)</option>
                    </select>
                    <select name="attr_Screen Cracked" defaultValue="" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm">
                      <option value="" disabled>Screen Cracked?</option>
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      </Card>

      {/* ── Photos ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader
          title="Product Photos"
          subtitle={`Upload up to ${MAX_IMAGES} photos. Max ${MAX_MB} MB each. First photo will be the primary image.`}
        />

        {fileError && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl border border-red-100 text-sm">{fileError}</div>
        )}

        {/* Previews */}
        {previews.length > 0 && (
          <div className="flex gap-3 mb-5 flex-wrap">
            {previews.map((url, i) => (
              <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`preview ${i + 1}`} className="w-full h-full object-cover" />
                {i === 0 && (
                  <span className="absolute bottom-0 left-0 right-0 bg-amber-500/90 text-white text-[9px] font-bold text-center py-0.5">PRIMARY</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Upload zone */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 transition-colors p-8 flex flex-col items-center justify-center gap-2 text-center cursor-pointer"
        >
          <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-sm font-medium text-navy-900">
            {previews.length > 0 ? 'Change photos' : 'Click to browse photos'}
          </span>
          <span className="text-xs text-slate-400">PNG, JPG or WEBP — max {MAX_MB} MB each — up to {MAX_IMAGES} photos</span>
        </button>
        <input
          ref={inputRef}
          type="file"
          name="images"
          accept="image/*"
          multiple
          onChange={handleImages}
          className="hidden"
        />
      </Card>

      {/* ── Actions ─────────────────────────────────────────────── */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => window.history.back()}>Cancel</Button>
        <Button type="submit" variant="primary" loading={pending} disabled={!!fileError}>
          Publish Listing
        </Button>
      </div>
    </form>
  )
}
