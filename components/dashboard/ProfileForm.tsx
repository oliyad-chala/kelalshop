'use client'

import { useActionState, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader } from '@/components/ui/Card'
import { Input, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { updateProfile, uploadAvatar, convertToSeller, signOutForUpgrade } from '@/lib/actions/profile'
import Image from 'next/image'

const initialState = {
  error: '',
  success: '',
}

export function ProfileForm({ user }: { user: any }) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(updateProfile, initialState)
  const [avatarState, avatarFormAction, avatarPending] = useActionState(uploadAvatar, initialState)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [converting, setConverting] = useState(false)
  const [convertState, setConvertState] = useState<{ error?: string; success?: string }>({})

  async function confirmUpgrade() {
    setConverting(true)
    setConvertState({})
    const res = await convertToSeller()
    if (res.error) {
      setConvertState({ error: res.error })
      setConverting(false)
      setShowConfirmModal(false)
    } else {
      setConvertState({ success: res.success })
      setShowConfirmModal(false)
      // Automatically log out and redirect to login page
      await signOutForUpgrade()
    }
  }

  const isShopper = user.role === 'shopper'
  const isBuyer = user.role === 'buyer'

  // shopper_profiles can come back as an object or array depending on Supabase join
  const shopperProfile = Array.isArray(user.shopper_profiles)
    ? user.shopper_profiles[0]
    : user.shopper_profiles

  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar_url || null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const avatarFormRef = useRef<HTMLFormElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
    // Auto-submit avatar form
    setTimeout(() => avatarFormRef.current?.requestSubmit(), 100)
  }

  return (
    <div className="space-y-8 fade-in">
      {/* Avatar upload feedback */}
      {avatarState?.error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 text-sm">
          {avatarState.error}
        </div>
      )}
      {avatarState?.success && (
        <div className="p-4 bg-green-50 text-green-700 rounded-xl border border-green-100 text-sm">
          {avatarState.success}
        </div>
      )}

      {/* Main profile form feedback */}
      {state?.error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 text-sm">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="p-4 bg-green-50 text-green-700 rounded-xl border border-green-100 text-sm">
          {state.success}
        </div>
      )}

      {/* ── Avatar upload form (separate, auto-submits on file pick) ── */}
      <form ref={avatarFormRef} action={avatarFormAction}>
        <input
          ref={fileInputRef}
          type="file"
          name="avatar"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFileChange}
        />
      </form>

      {/* ── Main profile form ── */}
      <form action={formAction} className="space-y-8">
        {/* Personal Information */}
        <Card>
          <CardHeader title="Personal Information" subtitle="Update your basic profile details." />

          <div className="flex flex-col sm:flex-row gap-8 mb-8">
            {/* Avatar section */}
            <div className="flex flex-col gap-3 items-center shrink-0">
              <div className="relative">
                {avatarPreview ? (
                  <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-white relative">
                    <Image
                      src={avatarPreview}
                      alt={user.full_name ?? 'Avatar'}
                      fill
                      className="object-cover"
                      sizes="80px"
                      unoptimized={avatarPreview.startsWith('data:')}
                    />
                  </div>
                ) : (
                  <Avatar src={null} name={user.full_name} size="xl" />
                )}
                {avatarPending && (
                  <div className="absolute inset-0 rounded-full bg-white/70 flex items-center justify-center">
                    <svg className="w-5 h-5 animate-spin text-amber-500" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                type="button"
                className="text-xs"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarPending}
              >
                {avatarPending ? 'Uploading…' : 'Change Avatar'}
              </Button>
              <p className="text-xs text-slate-400 text-center">JPG, PNG, WebP · Max 2 MB</p>
            </div>

            {/* Fields */}
            <div className="flex-1 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  name="full_name"
                  defaultValue={user.full_name || ''}
                  required
                />
                <Input
                  label="Email"
                  defaultValue={user.email}
                  disabled
                  hint="Email cannot be changed."
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="Phone Number"
                  name="phone"
                  defaultValue={user.phone || ''}
                  placeholder="+251 911 234 567"
                />
                <Input
                  label="Location"
                  name="location"
                  defaultValue={user.location || ''}
                  placeholder="Addis Ababa, Bole"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* ── Shopper-specific section ── */}
        {isShopper && (
          <Card>
            <CardHeader title="Seller Profile" subtitle="Public information displayed to buyers." />
            <div className="space-y-4">
              <Input
                label="Business Name (Optional)"
                name="business_name"
                defaultValue={shopperProfile?.business_name || ''}
                placeholder="Your Store Name"
              />
              <Textarea
                label="Bio / About Me"
                name="bio"
                defaultValue={shopperProfile?.bio || ''}
                placeholder="Tell buyers about what you import, your experience, and your average delivery times."
                rows={4}
              />
              <Input
                label="Typical Delivery Time (days)"
                name="delivery_time_days"
                type="number"
                defaultValue={shopperProfile?.delivery_time_days ?? 14}
                placeholder="14"
                hint="How many days on average does your delivery take?"
              />
            </div>
          </Card>
        )}

        {/* ── Buyer-specific section ── */}
        {isBuyer && (
          <>
            <Card>
              <CardHeader title="Buyer Preferences" subtitle="Additional info to help sellers serve you better." />
              <div className="space-y-4">
                <p className="text-sm text-slate-500">
                  Your location set above will be shared with sellers for delivery estimates. Make sure it's accurate so sellers can quote shipping correctly.
                </p>
                <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <svg className="w-5 h-5 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm text-amber-800">
                    Location is set in <strong>Personal Information</strong> above.
                  </span>
                </div>
              </div>
            </Card>

            <Card className="border border-indigo-100 bg-indigo-50/50">
              <CardHeader title="💡 Become a Seller" subtitle="Want to start selling your own products on KelalShop?" />
              <div className="space-y-4 p-6 pt-0">
                {convertState.error && (
                  <div className="p-3 bg-red-100 border border-red-200 text-red-700 text-xs rounded-lg">
                    {convertState.error}
                  </div>
                )}
                {convertState.success && (
                  <div className="p-3 bg-green-100 border border-green-200 text-green-700 text-xs rounded-lg">
                    {convertState.success}
                  </div>
                )}
                <p className="text-sm text-indigo-950 leading-relaxed">
                  You can convert your account into a Seller (Shopper) account. This will allow you to create product listings, manage stock, and receive orders from buyers in Ethiopia.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="border-indigo-200 text-indigo-700 hover:bg-indigo-100 bg-white cursor-pointer"
                  onClick={() => setShowConfirmModal(true)}
                  loading={converting}
                  disabled={converting}
                >
                  Upgrade to Seller Account
                </Button>
              </div>
            </Card>

            {/* Custom Confirmation Modal */}
            {showConfirmModal && (
              <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300 p-4">
                <div 
                  className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-100 p-6 flex flex-col transform transition-transform duration-300 scale-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="text-navy-900 font-bold text-lg mb-2">Upgrade to Seller Account</h3>
                  <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                    Are you sure you want to upgrade your account to a Seller account? This will grant you access to listings management, stock control, and seller tools.
                  </p>
                  <div className="flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="cursor-pointer"
                      onClick={() => setShowConfirmModal(false)}
                      disabled={converting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      className="cursor-pointer"
                      onClick={confirmUpgrade}
                      loading={converting}
                      disabled={converting}
                    >
                      Confirm Upgrade
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <div className="flex justify-end">
          <Button type="submit" variant="primary" loading={pending} size="lg">
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  )
}
