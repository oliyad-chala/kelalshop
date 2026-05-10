'use client'

import { useState } from 'react'
import { submitVerification } from '@/lib/actions/verification'
import { Card, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'

/**
 * Uploads the file directly from the browser to Supabase Storage.
 * This bypasses Vercel's serverless body-size limits (which would reject
 * large files sent through a Server Action).
 */
async function uploadIdToStorage(file: File, userId: string): Promise<string> {
  const supabase = createClient()
  const fileExt = file.name.split('.').pop()
  const path = `${userId}/${crypto.randomUUID()}.${fileExt}`

  const { error } = await supabase.storage
    .from('id-documents')
    .upload(path, file, { contentType: file.type, upsert: true })

  if (error) throw new Error(`Upload failed: ${error.message}`)
  return path
}

export function VerificationForm({
  defaultPhone,
  isRejected,
  userId,
}: {
  defaultPhone: string
  isRejected: boolean
  userId: string
}) {
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreview(url)
    } else {
      setSelectedFile(null)
      setPreview(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const formEl = e.currentTarget

      // Validate locally before uploading
      if (!selectedFile) {
        setError('Please upload an ID document.')
        setLoading(false)
        return
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('ID document exceeds the 5 MB size limit.')
        setLoading(false)
        return
      }

      const phone = (formEl.querySelector('[name="phone"]') as HTMLInputElement)?.value?.trim()
      if (!phone) {
        setError('Please enter your phone number.')
        setLoading(false)
        return
      }

      const agreedCheckbox = formEl.querySelector('[name="agreed_to_terms"]') as HTMLInputElement
      if (!agreedCheckbox?.checked) {
        setError('You must agree to the Seller Contract before submitting.')
        setLoading(false)
        return
      }

      // Step 1: Upload file directly from the browser → Supabase Storage
      // This bypasses Vercel's 4.5 MB serverless body limit
      const storagePath = await uploadIdToStorage(selectedFile, userId)

      // Step 2: Pass only the path + form data to the server action
      const formData = new FormData()
      formData.set('storage_path', storagePath)
      formData.set('phone', phone)
      formData.set('agreed_to_terms', 'true')

      await submitVerification(formData)
      // submitVerification calls redirect() which throws — caught below
    } catch (err: any) {
      // Next.js redirect throws a special error — don't show it as a user error
      const msg: string = err?.message ?? ''
      if (
        msg === 'NEXT_REDIRECT' ||
        msg.includes('NEXT_REDIRECT') ||
        err?.digest?.startsWith('NEXT_REDIRECT')
      ) {
        // This is a successful redirect — do nothing, page will navigate away
        return
      }
      setError(msg || 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm font-medium">
          {error}
        </div>
      )}
      
      {isRejected && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm font-medium flex gap-3">
          <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Your previous submission was rejected. Please ensure the document is clear, readable, and valid, then resubmit.
        </div>
      )}

      {/* Step 1: ID Document */}
      <Card>
        <CardHeader
          title="Step 1 — Upload Government ID"
          subtitle="Upload a clear scan or photo of your Kebele ID or Passport."
        />
        
        {preview ? (
          <div className="w-full relative rounded-2xl overflow-hidden border-2 border-slate-200 group">
            <img src={preview} alt="ID Preview" className="w-full h-auto object-cover max-h-[400px]" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-white font-medium bg-black/60 px-4 py-2 rounded-lg cursor-pointer">
                Change Image
              </span>
            </div>
            <input
              type="file"
              accept="image/*,.pdf"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleImageChange}
            />
          </div>
        ) : (
          <div className="w-full h-48 border-2 border-dashed border-slate-200 bg-slate-50 rounded-2xl flex flex-col items-center justify-center relative hover:bg-slate-100 transition-colors group cursor-pointer">
            <svg className="w-10 h-10 text-slate-300 mb-3 group-hover:text-amber-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span className="text-sm font-medium text-navy-900 mb-1">Click to browse file</span>
            <span className="text-xs text-slate-500">JPG, PNG or PDF — max 5 MB</span>
            <input
              type="file"
              accept="image/*,.pdf"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleImageChange}
            />
          </div>
        )}
      </Card>

      {/* Step 2: Phone Number */}
      <Card>
        <CardHeader
          title="Step 2 — Phone Number"
          subtitle="Enter the phone number buyers can reach you on for order coordination."
        />
        <Input
          label="Phone Number"
          name="phone"
          type="tel"
          placeholder="+251 9XX XXX XXXX"
          defaultValue={defaultPhone}
          required
        />
      </Card>

      {/* Step 3: Seller Agreement */}
      <Card>
        <CardHeader
          title="Step 3 — Seller Agreement"
          subtitle="Read and accept the KelalShop Seller Contract before submitting."
        />
        <div className="space-y-3 text-sm text-slate-700 bg-slate-50 rounded-xl p-5 border border-slate-200 mb-5">
          <p className="font-semibold text-navy-900">By submitting, I agree to:</p>
          <ul className="space-y-2 ml-1">
            {[
              { icon: '🚫', text: 'No fake or counterfeit products — I will only list genuine items.' },
              { icon: '💰', text: 'Honest pricing — I will not engage in price manipulation or hidden fees.' },
              { icon: '🚚', text: 'Timely delivery — I will ship orders within the agreed timeframe.' },
              { icon: '🔒', text: 'Escrow compliance — I understand payment is held until the buyer confirms delivery.' },
              { icon: '⚖️', text: 'Platform rules — Violations may result in account suspension or a permanent ban.' },
            ].map(({ icon, text }) => (
              <li key={text} className="flex items-start gap-2">
                <span className="text-base mt-0.5 shrink-0">{icon}</span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            name="agreed_to_terms"
            value="true"
            required
            className="mt-0.5 w-4 h-4 accent-amber-500 cursor-pointer"
          />
          <span className="text-sm text-slate-700 group-hover:text-navy-900 transition-colors leading-relaxed">
            I have read and agree to the KelalShop Seller Contract. I understand that violating these terms may result in my account being{' '}
            <span className="font-semibold text-red-600">Banned</span>.
          </span>
        </label>
      </Card>

      {/* Privacy note */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 text-sm text-blue-800">
        <svg className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        We use industry-standard encryption to protect your data. Your ID is used solely for verification and is never shared publicly.
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" variant="primary" size="lg" disabled={loading}>
          {loading ? 'Uploading & Submitting...' : 'Submit for Verification'}
        </Button>
      </div>
    </form>
  )
}
