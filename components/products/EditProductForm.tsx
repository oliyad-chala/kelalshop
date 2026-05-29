'use client'

import { useActionState, useState, useRef, useEffect } from 'react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Input, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import type { ActionState } from '@/types/app.types'

interface EditProductFormProps {
  categories: { id: string; name: string }[]
  initialData: any
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>
}

const MAX_IMAGES = 3
const MAX_MB = 5
const MAX_BYTES = MAX_MB * 1024 * 1024

const initialState = { error: '', success: '' }

export function EditProductForm({ categories, initialData, action }: EditProductFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState)
  
  // Use existing images if available
  const existingImageUrls = initialData.product_images?.sort((a: any, b: any) => a.sort_order - b.sort_order).map((img: any) => img.url) || []
  
  const [previews, setPreviews] = useState<string[]>(existingImageUrls)
  const [fileError, setFileError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>(initialData.category_id || '')
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
              }, 'image/jpeg', 0.7)
            }
            img.onerror = () => reject(new Error('Invalid image'))
          }
          reader.onerror = () => reject(new Error('File read failed'))
        })
      }))

      const totalSize = compressedFiles.reduce((sum, f) => sum + f.size, 0)
      if (totalSize > 1000000) {
        setFileError("Total image size is too large. Please select fewer or smaller photos.")
        e.target.value = ''
        return
      }

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

  return (
    <form action={formAction} className="space-y-8 fade-in">
      {state?.error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 text-sm">{state.error}</div>
      )}
      {state?.success && (
        <div className="p-4 bg-green-50 text-green-700 rounded-xl border border-green-100 text-sm">{state.success}</div>
      )}

      {/* ── Product Details ─────────────────────────────────────── */}
      <Card>
        <CardHeader title="Product Details" subtitle="Edit the information buyers will see." />
        <div className="space-y-6">
          <Input
            label="Product Name"
            name="name"
            defaultValue={initialData.name}
            placeholder="e.g. Wireless Noise-Cancelling Headphones"
            required
          />

          <div className="grid sm:grid-cols-2 gap-6">
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
                  defaultValue={initialData.price}
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
              <Select
                id="category"
                name="category_id"
                required
                value={selectedCategory}
                onChange={val => setSelectedCategory(val)}
                options={[
                  { value: "", label: "Select a category...", disabled: true },
                  ...categories.map(cat => ({ value: cat.id, label: cat.name }))
                ]}
              />
            </div>
          </div>

          {isOther && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <Input
                label='Custom Product Name (required for "Other" category)'
                name="custom_name"
                defaultValue={initialData.name}
                placeholder="e.g. Handmade Leather Wallet"
                required
              />
            </div>
          )}

          <Textarea
            label="Description"
            name="description"
            defaultValue={initialData.description}
            placeholder="Describe the product, its condition, source, and any other relevant details."
            rows={5}
            required
          />

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="location" className="text-sm font-medium text-navy-900">
                Product Origin / Location
              </label>
              <input
                id="location"
                name="location"
                type="text"
                defaultValue={initialData.location || ''}
                placeholder="e.g. Dubai, UAE or Addis Ababa"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-navy-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="stock" className="text-sm font-medium text-navy-900">Stock Quantity</label>
              <input
                id="stock"
                name="stock"
                type="number"
                min="0"
                defaultValue={initialData.stock}
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
            const attrs = initialData.attributes || {}

            if (!isClothing && !isElectronics) return null

            return (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <h4 className="text-sm font-bold text-navy-900 mb-4">Specifications</h4>
                
                {isClothing && (
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Select name="attr_Type" defaultValue={attrs.Type || ""} required options={[
                      { value: "", label: "Select Type", disabled: true },
                      { value: "Apparel", label: "Apparel" },
                      { value: "Shoes", label: "Shoes" },
                      { value: "Accessories", label: "Accessories" }
                    ]} />
                    <input name="attr_Brand" defaultValue={attrs.Brand || ""} type="text" placeholder="Brand" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" />
                    <input name="attr_Size" defaultValue={attrs.Size || ""} type="text" placeholder="Size (e.g. M, 42, US 9)" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" />
                    <input name="attr_Color" defaultValue={attrs.Color || ""} type="text" placeholder="Color" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" />
                    <input name="attr_Material" defaultValue={attrs.Material || ""} type="text" placeholder="Material (e.g. Cotton, Leather)" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" />
                    <Select name="attr_Condition" defaultValue={attrs.Condition || ""} options={[
                      { value: "", label: "Condition", disabled: true },
                      { value: "New", label: "New" },
                      { value: "Like New", label: "Like New" },
                      { value: "Used", label: "Used" }
                    ]} />
                  </div>
                )}

                {isElectronics && (
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Select name="attr_Type" defaultValue={attrs.Type || ""} required options={[
                      { value: "", label: "Select Type", disabled: true },
                      { value: "Phone", label: "Phone" },
                      { value: "Computer", label: "Computer" },
                      { value: "Accessory", label: "Accessory" }
                    ]} />
                    <input name="attr_Brand" defaultValue={attrs.Brand || ""} type="text" placeholder="Brand (e.g. Apple, Samsung)" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" />
                    <input name="attr_Storage" defaultValue={attrs.Storage || ""} type="text" placeholder="Storage (e.g. 128GB)" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" />
                    <input name="attr_Color" defaultValue={attrs.Color || ""} type="text" placeholder="Color" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" />
                    <Select name="attr_Condition" defaultValue={attrs.Condition || ""} options={[
                      { value: "", label: "Condition", disabled: true },
                      { value: "New", label: "New" },
                      { value: "Used (Good)", label: "Used (Good)" },
                      { value: "Used (Fair)", label: "Used (Fair)" }
                    ]} />
                    <Select name="attr_Screen Cracked" defaultValue={attrs['Screen Cracked'] || ""} options={[
                      { value: "", label: "Screen Cracked?", disabled: true },
                      { value: "No", label: "No" },
                      { value: "Yes", label: "Yes" }
                    ]} />
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
          subtitle={`Upload up to ${MAX_IMAGES} photos. Max ${MAX_MB} MB each. Uploading new photos will replace the existing ones.`}
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
          Save Changes
        </Button>
      </div>
    </form>
  )
}
