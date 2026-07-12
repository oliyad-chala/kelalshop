'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { 
  MessageSquare, Send, Search, User, Mail, Phone, 
  MapPin, Calendar, Shield, ShoppingBag, Star, Ban, 
  CheckCircle2, XCircle, AlertCircle, Loader2, ArrowRight
} from 'lucide-react'
import { 
  getUserDetailedSupportInfo, 
  getConversationMessages, 
  replyToUser, 
  suspendUser 
} from './actions'

interface Partner {
  id: string
  full_name: string | null
  role: string | null
  avatar_url: string | null
}

interface Conversation {
  partner: Partner
  lastMessage: {
    content: string
    created_at: string
    is_read: boolean
  }
  unreadCount: number
}

interface Message {
  id: string
  sender_id: string
  recipient_id: string
  content: string
  created_at: string
  is_read: boolean
}

interface PersonStats {
  buyerOrdersCount: number
  shopperOrdersCount: number
  productsCount: number
  reviewCount: number
  avgRating: string
}

interface PersonInfo {
  profile: {
    id: string
    full_name: string | null
    avatar_url: string | null
    location: string | null
    phone: string | null
    role: string
    trust_score: number
    created_at: string
    is_suspended: boolean
    requires_verification: boolean
  }
  email: string | null
  emailConfirmed: boolean
  lastSignIn: string | null
  shopperProfile: {
    business_name: string | null
    bio: string | null
    verification_status: string
    delivery_time_days: number
    min_order_amount: number
    subscription_plan: string
  } | null
  stats: PersonStats
}

export default function SupportInboxClient({
  initialConversations,
  adminUserId
}: {
  initialConversations: Conversation[]
  adminUserId: string
}) {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations)
  const [selectedConvoId, setSelectedConvoId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [personInfo, setPersonInfo] = useState<PersonInfo | null>(null)
  
  // Loading states
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [loadingPerson, setLoadingPerson] = useState(false)
  
  // Form states
  const [replyText, setReplyText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [replyError, setReplyError] = useState('')
  
  // Transitions for server actions
  const [isSuspending, startSuspendTransition] = useTransition()
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Scroll to bottom when messages update
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Fetch conversation messages and person info when a conversation is selected
  const handleSelectConversation = async (userId: string) => {
    setSelectedConvoId(userId)
    setLoadingMessages(true)
    setLoadingPerson(true)
    setReplyError('')
    setReplyText('')

    try {
      // 1. Fetch messages
      const msgRes = await getConversationMessages(userId)
      if ('error' in msgRes) {
        console.error(msgRes.error)
      } else {
        setMessages(msgRes.messages)
      }

      // 2. Fetch user detailed info
      const infoRes = await getUserDetailedSupportInfo(userId)
      if ('error' in infoRes) {
        console.error(infoRes.error)
      } else {
        setPersonInfo(infoRes as unknown as PersonInfo)
      }

      // 3. Mark conversation as read locally
      setConversations(prev => 
        prev.map(c => 
          c.partner.id === userId 
            ? { ...c, unreadCount: 0, lastMessage: { ...c.lastMessage, is_read: true } }
            : c
        )
      )

    } catch (err) {
      console.error('Error loading support details:', err)
    } finally {
      setLoadingMessages(false)
      setLoadingPerson(false)
    }
  }

  // Handle sending a reply message
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedConvoId || !replyText.trim() || isSending) return

    setIsSending(true)
    setReplyError('')

    try {
      const res = await replyToUser(selectedConvoId, replyText)
      
      if (res.error) {
        setReplyError(res.error)
      } else {
        // Optimistic update of messages
        const newMsg: Message = {
          id: Math.random().toString(), // temporary ID
          sender_id: adminUserId,
          recipient_id: selectedConvoId,
          content: replyText.trim(),
          created_at: new Date().toISOString(),
          is_read: false
        }
        setMessages(prev => [...prev, newMsg])
        
        // Update last message in the left conversations sidebar list
        setConversations(prev => 
          prev.map(c => 
            c.partner.id === selectedConvoId
              ? {
                  ...c,
                  lastMessage: {
                    content: replyText.trim(),
                    created_at: new Date().toISOString(),
                    is_read: true
                  }
                }
              : c
          )
        )
        
        setReplyText('')
      }
    } catch (err) {
      setReplyError('Failed to send message. Please try again.')
      console.error(err)
    } finally {
      setIsSending(false)
    }
  }

  // Toggle user suspension
  const handleToggleSuspend = () => {
    if (!personInfo || isSuspending) return
    const userId = personInfo.profile.id
    const currentStatus = personInfo.profile.is_suspended
    
    if (!confirm(`Are you sure you want to ${currentStatus ? 'UNSUSPEND' : 'SUSPEND'} ${personInfo.profile.full_name || 'this user'}?`)) {
      return
    }

    startSuspendTransition(async () => {
      const res = await suspendUser(userId, !currentStatus)
      if (res.error) {
        alert(res.error)
      } else {
        // Update local state
        setPersonInfo(prev => {
          if (!prev) return null
          return {
            ...prev,
            profile: {
              ...prev.profile,
              is_suspended: !currentStatus
            }
          }
        })
      }
    })
  }

  // Filter conversations based on search query
  const filteredConversations = conversations.filter(convo => 
    convo.partner.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    convo.partner.role?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activeConvo = conversations.find(c => c.partner.id === selectedConvoId)

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: selectedConvoId ? '320px 1fr 340px' : '320px 1fr',
      height: '650px',
      background: 'var(--color-admin-surface)',
      border: '1px solid var(--color-admin-border)',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)',
      transition: 'grid-template-columns 0.3s ease'
    }}>
      
      {/* ── SIDEBAR: CONVERSATION LIST ── */}
      <div style={{
        borderRight: '1px solid var(--color-admin-border)',
        display: 'flex',
        flexDirection: 'column',
        background: '#fcfcfd',
        height: '100%'
      }}>
        {/* Search header */}
        <div style={{
          padding: '1.25rem 1rem',
          borderBottom: '1px solid var(--color-admin-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>Customers</span>
            <span style={{ 
              fontSize: '0.75rem', 
              background: 'var(--color-info-bg)', 
              color: 'var(--color-accent-600)',
              padding: '0.2rem 0.5rem',
              borderRadius: '12px',
              fontWeight: 600
            }}>
              {conversations.length} active
            </span>
          </div>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ 
              position: 'absolute', 
              left: '0.75rem', 
              top: '50%', 
              transform: 'translateY(-50%)',
              color: 'var(--color-text-muted)'
            }} />
            <input 
              type="text" 
              placeholder="Search user or role..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem 0.5rem 2.2rem',
                fontSize: '0.82rem',
                border: '1px solid var(--color-admin-border)',
                borderRadius: '8px',
                background: 'var(--color-admin-surface)',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Scrollable list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredConversations.length === 0 ? (
            <div style={{
              padding: '3rem 1.5rem',
              textAlign: 'center',
              color: 'var(--color-text-muted)',
              fontSize: '0.8rem'
            }}>
              {searchQuery ? 'No matching conversations' : 'No support conversations'}
            </div>
          ) : (
            filteredConversations.map((convo) => {
              const isActive = convo.partner.id === selectedConvoId
              const lastMsgText = convo.lastMessage.content.replace(/\[.*?\]\n\n/, '') // Strip subject tags for preview
              
              return (
                <button
                  key={convo.partner.id}
                  onClick={() => handleSelectConversation(convo.partner.id)}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    textAlign: 'left',
                    border: 'none',
                    background: isActive ? 'rgba(95, 99, 242, 0.05)' : 'transparent',
                    borderLeft: isActive ? '3px solid var(--color-accent-500)' : '3px solid transparent',
                    borderBottom: '1px solid var(--color-admin-border)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  className="support-convo-item"
                >
                  {/* Initials Avatar */}
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: convo.partner.role === 'shopper' ? 'var(--color-purple-bg)' : 'var(--color-info-bg)',
                    color: convo.partner.role === 'shopper' ? 'var(--color-purple)' : 'var(--color-info)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    flexShrink: 0,
                    position: 'relative'
                  }}>
                    {convo.partner.full_name?.charAt(0).toUpperCase() || 'U'}
                  </div>

                  {/* Body text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.2rem' }}>
                      <span style={{ 
                        fontWeight: convo.unreadCount > 0 ? 700 : 600, 
                        fontSize: '0.85rem', 
                        color: 'var(--color-text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '120px'
                      }}>
                        {convo.partner.full_name || 'Unnamed User'}
                      </span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>
                        {new Date(convo.lastMessage.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                      <span style={{
                        fontSize: '0.65rem',
                        padding: '0.1rem 0.4rem',
                        borderRadius: '4px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        background: convo.partner.role === 'shopper' ? 'var(--color-purple-bg)' : 'var(--color-info-bg)',
                        color: convo.partner.role === 'shopper' ? 'var(--color-purple)' : 'var(--color-info)'
                      }}>
                        {convo.partner.role}
                      </span>
                    </div>

                    <p style={{
                      margin: 0,
                      fontSize: '0.78rem',
                      color: convo.unreadCount > 0 ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                      fontWeight: convo.unreadCount > 0 ? 600 : 400,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {lastMsgText || 'Start conversation'}
                    </p>
                  </div>

                  {/* Unread badge */}
                  {convo.unreadCount > 0 && (
                    <span style={{
                      alignSelf: 'center',
                      background: 'var(--color-danger)',
                      color: '#fff',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      minWidth: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 0.2rem',
                      flexShrink: 0
                    }}>
                      {convo.unreadCount}
                    </span>
                  )}
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* ── CENTER: CHAT MESSAGE LOG & REPLY EDITOR ── */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#fff'
      }}>
        {selectedConvoId === null ? (
          /* EMPTY STATE */
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '3rem',
            textAlign: 'center',
            background: 'var(--color-admin-bg)'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: '#eef0ff',
              color: 'var(--color-accent-500)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.25rem'
            }}>
              <MessageSquare size={26} />
            </div>
            <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '1.05rem' }}>
              Select a conversation
            </h4>
            <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.85rem', maxWidth: '320px', lineHeight: '1.4' }}>
              Choose a support conversation from the list to view the message history, see user statistics, and send responses.
            </p>
          </div>
        ) : (
          /* ACTIVE CONVERSATION CHAT SCREEN */
          <>
            {/* Chat Pane Header */}
            <div style={{
              padding: '1rem 1.25rem',
              borderBottom: '1px solid var(--color-admin-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#fff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'var(--color-info-bg)',
                  color: 'var(--color-accent-600)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.85rem'
                }}>
                  {activeConvo?.partner.full_name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {activeConvo?.partner.full_name || 'Unnamed User'}
                  </h4>
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>
                    Support desk ticket • {activeConvo?.partner.role}
                  </span>
                </div>
              </div>
            </div>

            {/* Chat logs */}
            <div style={{
              flex: 1,
              padding: '1.25rem',
              overflowY: 'auto',
              background: '#f8fafb',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem'
            }}>
              {loadingMessages ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '0.5rem' }}>
                  <Loader2 className="animate-spin" size={24} color="var(--color-accent-500)" />
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Retrieving message logs...</span>
                </div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.8rem', padding: '2rem' }}>
                  No messages recorded in this conversation.
                </div>
              ) : (
                messages.map((msg) => {
                  const isAdminMsg = msg.sender_id === adminUserId
                  
                  // Format message subject if it has tags (e.g. [General Inquiry])
                  let messageSubject = ''
                  let messageContent = msg.content
                  const subjectMatch = msg.content.match(/^\[(.*?)\]\n\n/)
                  if (subjectMatch) {
                    messageSubject = subjectMatch[1]
                    messageContent = msg.content.slice(subjectMatch[0].length)
                  }

                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isAdminMsg ? 'flex-end' : 'flex-start',
                        maxWidth: '85%',
                        alignSelf: isAdminMsg ? 'flex-end' : 'flex-start'
                      }}
                    >
                      {/* Message Bubble */}
                      <div style={{
                        padding: '0.8rem 1rem',
                        borderRadius: '12px',
                        borderBottomRightRadius: isAdminMsg ? '2px' : '12px',
                        borderBottomLeftRadius: isAdminMsg ? '12px' : '2px',
                        background: isAdminMsg ? 'var(--color-accent-500)' : '#fff',
                        color: isAdminMsg ? '#fff' : 'var(--color-text-primary)',
                        border: isAdminMsg ? 'none' : '1px solid var(--color-admin-border)',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                        fontSize: '0.85rem',
                        lineHeight: '1.45',
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {messageSubject && (
                          <div style={{ 
                            fontWeight: 700, 
                            fontSize: '0.75rem', 
                            color: isAdminMsg ? 'rgba(255,255,255,0.9)' : 'var(--color-accent-600)',
                            borderBottom: `1px solid ${isAdminMsg ? 'rgba(255,255,255,0.2)' : 'var(--color-admin-border)'}`,
                            paddingBottom: '0.25rem',
                            marginBottom: '0.4rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.03em'
                          }}>
                            {messageSubject}
                          </div>
                        )}
                        <div>{messageContent}</div>
                      </div>

                      {/* Message timestamp */}
                      <span style={{
                        fontSize: '0.65rem',
                        color: 'var(--color-text-muted)',
                        marginTop: '0.2rem',
                        padding: '0 0.2rem'
                      }}>
                        {new Date(msg.created_at).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </span>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Input Form */}
            <form onSubmit={handleSendReply} style={{
              padding: '1rem',
              borderTop: '1px solid var(--color-admin-border)',
              background: '#fff',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
                <textarea
                  placeholder="Type a professional response to this customer..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  disabled={loadingMessages || isSending}
                  style={{
                    flex: 1,
                    minHeight: '44px',
                    maxHeight: '120px',
                    height: '44px',
                    padding: '0.65rem 0.85rem',
                    fontSize: '0.85rem',
                    border: '1px solid var(--color-admin-border)',
                    borderRadius: '8px',
                    resize: 'none',
                    outline: 'none',
                    fontFamily: 'inherit',
                    lineHeight: '1.4'
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendReply(e)
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={!replyText.trim() || isSending || loadingMessages}
                  style={{
                    background: replyText.trim() && !isSending ? 'var(--color-accent-500)' : 'var(--color-admin-border)',
                    color: replyText.trim() && !isSending ? '#fff' : 'var(--color-text-muted)',
                    border: 'none',
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: replyText.trim() && !isSending ? 'pointer' : 'default',
                    transition: 'all 0.2s ease',
                    flexShrink: 0
                  }}
                >
                  {isSending ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Send size={16} />
                  )}
                </button>
              </div>
              {replyError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--color-danger)' }}>
                  <AlertCircle size={12} />
                  <span>{replyError}</span>
                </div>
              )}
            </form>
          </>
        )}
      </div>

      {/* ── RIGHT PANE: DETAILED PERSON INFORMATION ── */}
      {selectedConvoId !== null && (
        <div style={{
          borderLeft: '1px solid var(--color-admin-border)',
          display: 'flex',
          flexDirection: 'column',
          background: '#fff',
          height: '100%',
          overflowY: 'auto'
        }}>
          {loadingPerson ? (
            /* Loading view */
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              padding: '2rem',
              gap: '0.75rem'
            }}>
              <Loader2 className="animate-spin" size={24} color="var(--color-accent-500)" />
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Fetching user records...</span>
            </div>
          ) : personInfo ? (
            /* Detailed profile card content */
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* User Avatar & Name Header */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--color-admin-border)' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: personInfo.profile.role === 'shopper' ? 'var(--color-purple-bg)' : 'var(--color-info-bg)',
                  color: personInfo.profile.role === 'shopper' ? 'var(--color-purple)' : 'var(--color-info)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '1.5rem',
                  marginBottom: '0.75rem',
                  border: '2px solid #fff',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                }}>
                  {personInfo.profile.full_name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  {personInfo.profile.full_name || 'Unnamed User'}
                </h3>
                
                {/* Badges Stack */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', justifyContent: 'center', marginTop: '0.25rem' }}>
                  <span style={{
                    fontSize: '0.68rem',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '12px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    background: personInfo.profile.role === 'shopper' ? 'var(--color-purple-bg)' : 'var(--color-info-bg)',
                    color: personInfo.profile.role === 'shopper' ? 'var(--color-purple)' : 'var(--color-info)'
                  }}>
                    {personInfo.profile.role}
                  </span>
                  
                  {personInfo.profile.is_suspended ? (
                    <span style={{
                      fontSize: '0.68rem',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '12px',
                      fontWeight: 600,
                      background: 'var(--color-danger-bg)',
                      color: 'var(--color-danger)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.2rem'
                    }}>
                      <Ban size={10} />
                      Suspended
                    </span>
                  ) : (
                    <span style={{
                      fontSize: '0.68rem',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '12px',
                      fontWeight: 600,
                      background: 'var(--color-success-bg)',
                      color: 'var(--color-success)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.2rem'
                    }}>
                      <CheckCircle2 size={10} />
                      Active
                    </span>
                  )}
                </div>
              </div>

              {/* Contact Information Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>
                  Contact Details
                </h4>
                
                {/* Email row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <Mail size={14} style={{ color: 'var(--color-text-muted)', marginTop: '0.15rem', flexShrink: 0 }} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-primary)', wordBreak: 'break-all', fontWeight: 500 }}>
                      {personInfo.email || 'No email associated'}
                    </div>
                    {personInfo.email && (
                      <span style={{ 
                        fontSize: '0.65rem', 
                        color: personInfo.emailConfirmed ? 'var(--color-success)' : 'var(--color-warning)',
                        fontWeight: 600
                      }}>
                        {personInfo.emailConfirmed ? '✓ Email Confirmed' : '⚠ Email Unconfirmed'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Phone row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Phone size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-primary)' }}>
                    {personInfo.profile.phone || 'Phone number not set'}
                  </span>
                </div>

                {/* Location row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MapPin size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-primary)' }}>
                    {personInfo.profile.location || 'Location not specified'}
                  </span>
                </div>

                {/* Joined Date row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-primary)' }}>
                    Registered: {new Date(personInfo.profile.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              {/* Platform Statistics */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <h4 style={{ margin: '0 0 0.15rem 0', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>
                  Account Stats
                </h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.5rem'
                }}>
                  {/* Stat Card 1: Buyer orders */}
                  <div style={{
                    background: 'var(--color-admin-bg)',
                    padding: '0.65rem',
                    borderRadius: '8px',
                    border: '1px solid var(--color-admin-border)'
                  }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>Buyer Orders</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '0.1rem' }}>
                      {personInfo.stats.buyerOrdersCount}
                    </div>
                  </div>

                  {/* Stat Card 2: Trust score */}
                  <div style={{
                    background: 'var(--color-admin-bg)',
                    padding: '0.65rem',
                    borderRadius: '8px',
                    border: '1px solid var(--color-admin-border)'
                  }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>Trust Score</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-accent-500)', marginTop: '0.1rem' }}>
                      {personInfo.profile.trust_score}
                    </div>
                  </div>

                  {/* Stats if they are shopper */}
                  {personInfo.profile.role === 'shopper' && (
                    <>
                      <div style={{
                        background: 'var(--color-admin-bg)',
                        padding: '0.65rem',
                        borderRadius: '8px',
                        border: '1px solid var(--color-admin-border)'
                      }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>Products</div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '0.1rem' }}>
                          {personInfo.stats.productsCount}
                        </div>
                      </div>

                      <div style={{
                        background: 'var(--color-admin-bg)',
                        padding: '0.65rem',
                        borderRadius: '8px',
                        border: '1px solid var(--color-admin-border)'
                      }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>Rating</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.15rem', marginTop: '0.1rem' }}>
                          <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-warning)' }}>
                            {personInfo.stats.avgRating}
                          </span>
                          <Star size={11} fill="var(--color-warning)" color="var(--color-warning)" />
                          <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>
                            ({personInfo.stats.reviewCount})
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Shopper Profile Details (Conditional) */}
              {personInfo.profile.role === 'shopper' && personInfo.shopperProfile && (
                <div style={{
                  padding: '0.85rem',
                  background: 'var(--color-purple-bg)',
                  borderRadius: '8px',
                  border: '1px solid rgba(161, 85, 232, 0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  <h5 style={{ margin: 0, fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-purple)' }}>
                    Shopper Business Details
                  </h5>
                  
                  {personInfo.shopperProfile.business_name && (
                    <div style={{ fontSize: '0.8rem' }}>
                      <strong style={{ color: 'var(--color-text-primary)' }}>Business Name:</strong>{' '}
                      <span style={{ color: 'var(--color-text-secondary)' }}>{personInfo.shopperProfile.business_name}</span>
                    </div>
                  )}

                  <div style={{ fontSize: '0.8rem' }}>
                    <strong style={{ color: 'var(--color-text-primary)' }}>Moderation:</strong>{' '}
                    <span style={{ 
                      color: personInfo.shopperProfile.verification_status === 'verified' ? 'var(--color-success)' : 'var(--color-warning)',
                      fontWeight: 600,
                      textTransform: 'capitalize'
                    }}>
                      {personInfo.shopperProfile.verification_status}
                    </span>
                  </div>

                  {personInfo.shopperProfile.bio && (
                    <div style={{ fontSize: '0.75rem', borderTop: '1px solid rgba(161, 85, 232, 0.15)', paddingTop: '0.35rem', marginTop: '0.15rem' }}>
                      <strong style={{ color: 'var(--color-text-primary)', display: 'block', marginBottom: '0.1rem' }}>Bio:</strong>
                      <span style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic', lineHeight: '1.3' }}>
                        &ldquo;{personInfo.shopperProfile.bio}&rdquo;
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Moderate Actions Card */}
              <div style={{
                marginTop: '0.5rem',
                borderTop: '1px solid var(--color-admin-border)',
                paddingTop: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem'
              }}>
                <h4 style={{ margin: 0, fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>
                  Moderation Desk
                </h4>
                
                {/* Suspend / Unsuspend user button */}
                <button
                  type="button"
                  onClick={handleToggleSuspend}
                  disabled={isSuspending}
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    borderRadius: '8px',
                    border: '1px solid var(--color-danger)',
                    background: personInfo.profile.is_suspended ? 'var(--color-danger-bg)' : 'transparent',
                    color: 'var(--color-danger)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    cursor: isSuspending ? 'default' : 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {isSuspending ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <Ban size={14} />
                  )}
                  {personInfo.profile.is_suspended ? 'Unsuspend User Account' : 'Suspend User Account'}
                </button>
              </div>

            </div>
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              Could not retrieve user details.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
