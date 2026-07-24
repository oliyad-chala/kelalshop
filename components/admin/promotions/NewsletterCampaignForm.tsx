'use client'

import { useState, useEffect, useTransition, useRef } from 'react'
import {
  saveCampaign,
  sendCampaignAction,
  getCampaigns,
  deleteCampaign
} from '@/lib/actions/newsletter-campaign'
import { Loader2, Mail, CheckCircle, AlertTriangle, Image as ImageIcon, Trash2, Edit2, Play, Plus, RefreshCw } from 'lucide-react'

interface Campaign {
  id: string
  subject: string
  content: string
  target_audience: string
  status: string
  sent_count: number
  failed_count: number
  image_url: string | null
  created_at: string
  sent_at: string | null
}

export function NewsletterCampaignForm() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  
  const [target, setTarget] = useState<'newsletter_subscribers' | 'registered_users'>('newsletter_subscribers')
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [feedback, setFeedback] = useState('')
  const [isPending, startTransition] = useTransition()
  const [isLoadingList, setIsLoadingList] = useState(true)

  // Load campaigns list
  const loadList = async () => {
    setIsLoadingList(true)
    const data = await getCampaigns()
    setCampaigns(data as any)
    setIsLoadingList(false)
  }

  useEffect(() => {
    loadList()
  }, [])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
      setExistingImageUrl(null)
    }
  }

  const clearImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setExistingImageUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const resetForm = () => {
    setActiveId(null)
    setSubject('')
    setContent('')
    setTarget('newsletter_subscribers')
    clearImage()
    setStatus('idle')
    setFeedback('')
  }

  const handleSaveDraft = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!subject.trim() || !content.trim()) {
      setStatus('error')
      setFeedback('Subject and content are required.')
      return null
    }

    setStatus('idle')
    setFeedback('')

    return new Promise<Campaign | null>((resolve) => {
      startTransition(async () => {
        const formData = new FormData()
        if (activeId) formData.append('id', activeId)
        formData.append('subject', subject)
        formData.append('content', content)
        formData.append('target_audience', target)
        if (imageFile) {
          formData.append('image', imageFile)
        }
        if (existingImageUrl) {
          formData.append('existing_image_url', existingImageUrl)
        }

        const res = await saveCampaign(formData)
        if (res.error) {
          setStatus('error')
          setFeedback(res.error)
          resolve(null)
        } else {
          setStatus('success')
          setFeedback(activeId ? 'Campaign updated successfully!' : 'Campaign saved as draft.')
          resetForm()
          await loadList()
          resolve(res.campaign as any)
        }
      })
    })
  }

  const handleSendNow = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!confirm('Are you sure you want to send this email marketing campaign to all selected recipients?')) return

    // 1. Save first to capture any edits
    const savedCampaign = await handleSaveDraft()
    if (!savedCampaign) return

    // 2. Trigger send action
    startTransition(async () => {
      setStatus('idle')
      setFeedback('Sending campaign. Please do not close this window...')
      
      const res = await sendCampaignAction(savedCampaign.id)
      if (res.error) {
        setStatus('error')
        setFeedback(res.error)
      } else {
        setStatus('success')
        const details = res.campaign as any
        setFeedback(`Campaign sent successfully! (Sent: ${details.sent_count}, Failed: ${details.failed_count})`)
        await loadList()
      }
    })
  }

  const editCampaign = (campaign: Campaign) => {
    setActiveId(campaign.id)
    setSubject(campaign.subject)
    setContent(campaign.content)
    setTarget(campaign.target_audience as any)
    setExistingImageUrl(campaign.image_url)
    setImagePreview(campaign.image_url)
    setImageFile(null)
    setStatus('idle')
    setFeedback('')
  }

  const triggerSendExisting = async (campaign: Campaign) => {
    if (!confirm(`Are you sure you want to dispatch "${campaign.subject}" now?`)) return
    startTransition(async () => {
      setStatus('idle')
      setFeedback(`Sending "${campaign.subject}" campaign...`)
      const res = await sendCampaignAction(campaign.id)
      if (res.error) {
        setStatus('error')
        setFeedback(res.error)
      } else {
        setStatus('success')
        const details = res.campaign as any
        setFeedback(`Campaign sent successfully! (Sent: ${details.sent_count}, Failed: ${details.failed_count})`)
        await loadList()
      }
    })
  }

  const deleteCampaignDraft = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign draft?')) return
    const res = await deleteCampaign(id)
    if (res.error) {
      alert(res.error)
    } else {
      if (activeId === id) resetForm()
      await loadList()
    }
  }

  return (
    <div className="space-y-6">
      {/* Upper Grid: Creator Form & Live Preview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }} className="lg:grid-cols-3">
        {/* The Form */}
        <div className="lg:col-span-2 space-y-4 admin-card" style={{ padding: '1.5rem', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              {activeId ? '✍️ Edit Campaign' : '✨ Compose New Campaign'}
            </h3>
            {activeId && (
              <button type="button" onClick={resetForm} className="admin-btn admin-btn-secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}>
                <Plus className="w-3 h-3 inline mr-1" /> New
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }} className="sm:grid-cols-2">
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.35rem' }}>
                Target Audience
              </label>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value as any)}
                className="admin-input w-full"
                disabled={isPending}
                style={{
                  padding: '0.6rem 0.8rem',
                  borderRadius: '8px',
                  border: '1px solid var(--color-admin-border)',
                  background: 'var(--color-admin-surface)',
                  color: 'var(--color-text-primary)',
                  fontSize: '0.85rem'
                }}
              >
                <option value="newsletter_subscribers">📬 All Newsletter Subscribers</option>
                <option value="registered_users">👥 All Registered Users (Marketplace)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.35rem' }}>
                Campaign Subject
              </label>
              <input
                type="text"
                placeholder="e.g. Special Holiday Offers!"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="admin-input w-full"
                required
                disabled={isPending}
                style={{
                  padding: '0.6rem 0.8rem',
                  borderRadius: '8px',
                  border: '1px solid var(--color-admin-border)',
                  background: 'var(--color-admin-surface)',
                  color: 'var(--color-text-primary)',
                  fontSize: '0.85rem'
                }}
              />
            </div>
          </div>

          {/* Banner Image Upload */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.35rem' }}>
              Header Banner Image (Optional)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                ref={fileInputRef}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isPending}
                className="admin-btn admin-btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}
              >
                <ImageIcon className="w-4 h-4" />
                <span>Upload Banner</span>
              </button>
              
              {imagePreview && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                  <button
                    type="button"
                    onClick={clearImage}
                    className="text-red-500 hover:text-red-700 transition-colors"
                    title="Remove image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.35rem' }}>
              Message Content (HTML allowed)
            </label>
            <textarea
              rows={6}
              placeholder="Write your email body. Markdown or plain paragraphs will format automatically."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="admin-input w-full"
              required
              disabled={isPending}
              style={{
                padding: '0.8rem',
                borderRadius: '8px',
                border: '1px solid var(--color-admin-border)',
                background: 'var(--color-admin-surface)',
                color: 'var(--color-text-primary)',
                fontSize: '0.85rem',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', paddingTop: '0.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => handleSaveDraft()}
                disabled={isPending}
                className="admin-btn admin-btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <span>Save Draft</span>
              </button>
              <button
                type="button"
                onClick={handleSendNow}
                disabled={isPending}
                className="admin-btn admin-btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    <span>Save & Send Now</span>
                  </>
                )}
              </button>
            </div>

            {status === 'success' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-success)', fontSize: '0.85rem', fontWeight: 600 }}>
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{feedback}</span>
              </div>
            )}

            {status === 'error' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-danger)', fontSize: '0.85rem', fontWeight: 600 }}>
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{feedback}</span>
              </div>
            )}
          </div>
        </div>

        {/* Live Email Preview Panel */}
        <div className="admin-card" style={{ padding: '1.5rem', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            ✉️ Live Email Preview
          </h3>
          <div style={{ flex: 1, border: '1px solid #f1f5f9', borderRadius: '12px', padding: '16px', background: '#fff', fontSize: '0.85rem', color: '#334155', boxShadow: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.02)' }}>
            <div style={{ paddingBottom: '12px', borderBottom: '1px solid #f1f5f9', marginBottom: '16px' }}>
              <span style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>Kelal<span style={{ color: '#f59e0b' }}>Shop</span></span>
            </div>
            
            {imagePreview && (
              <div style={{ marginBottom: '16px' }}>
                <img
                  src={imagePreview}
                  alt="Email Header"
                  style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px' }}
                />
              </div>
            )}

            <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '8px', fontSize: '0.95rem' }}>
              {subject || '[Enter Campaign Subject]'}
            </div>
            
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5', minHeight: '100px' }}>
              {content || '[Compose your content to preview formatting here...]'}
            </div>
            
            <div style={{ marginTop: '24px', paddingTop: '12px', borderTop: '1px solid #f1f5f9', fontSize: '10px', color: '#94a3b8', textAlign: 'center' }}>
              Addis Ababa, Ethiopia · © {new Date().getFullYear()} KelalShop
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Logs and Dashboard */}
      <div className="admin-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>📊 Past Campaigns & Logs</h3>
          <button type="button" onClick={loadList} disabled={isLoadingList} className="admin-btn admin-btn-secondary" style={{ padding: '0.4rem 0.7rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}>
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingList ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {isLoadingList ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : campaigns.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
            <h4 style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.35rem' }}>No campaigns found</h4>
            <p style={{ fontSize: '0.85rem' }}>Your created draft and sent marketing campaigns will appear here.</p>
          </div>
        ) : (
          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--color-admin-border)' }}>
                  <th style={{ padding: '0.75rem' }}>Subject</th>
                  <th style={{ padding: '0.75rem' }}>Audience</th>
                  <th style={{ padding: '0.75rem' }}>Status</th>
                  <th style={{ padding: '0.75rem' }}>Stats (Sent/Failed)</th>
                  <th style={{ padding: '0.75rem' }}>Date Created</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((camp) => (
                  <tr key={camp.id} style={{ borderBottom: '1px solid var(--color-admin-border)' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>{camp.subject}</td>
                    <td style={{ padding: '0.75rem', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                      {camp.target_audience === 'newsletter_subscribers' ? '📬 Newsletter Subscribers' : '👥 Registered Users'}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          background:
                            camp.status === 'sent'
                              ? '#dcfce7'
                              : camp.status === 'sending'
                              ? '#fef9c3'
                              : camp.status === 'failed'
                              ? '#fee2e2'
                              : '#f1f5f9',
                          color:
                            camp.status === 'sent'
                              ? '#15803d'
                              : camp.status === 'sending'
                              ? '#854d0e'
                              : camp.status === 'failed'
                              ? '#b91c1c'
                              : '#475569',
                        }}
                      >
                        {camp.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>
                      {camp.status === 'sent' || camp.status === 'failed' ? (
                        <span className="text-emerald-600">{camp.sent_count}</span>
                      ) : (
                        '-'
                      )}
                      {(camp.failed_count ?? 0) > 0 && (
                        <span className="text-red-500 ml-1.5" style={{ fontSize: '0.75rem' }}>
                          ({camp.failed_count} failed)
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                      {new Date(camp.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        {camp.status === 'draft' && (
                          <>
                            <button
                              type="button"
                              onClick={() => editCampaign(camp)}
                              className="text-amber-600 hover:text-amber-800 transition-colors p-1"
                              title="Edit Draft"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => triggerSendExisting(camp)}
                              className="text-emerald-600 hover:text-emerald-800 transition-colors p-1"
                              title="Send Campaign Now"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => deleteCampaignDraft(camp.id)}
                          className="text-red-500 hover:text-red-700 transition-colors p-1"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
