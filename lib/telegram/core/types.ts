import { Context } from 'grammy'

export type TelegramAdminRole = 'admin' | 'staff'

export interface AdminBotContext extends Context {
  isAdmin: boolean
  adminRole?: TelegramAdminRole
  correlationId?: string
}

export interface LinkedTelegramUser {
  profile_id: string
  is_verified: boolean
  chat_id: number
}

export interface CustomerBotContext extends Context {
  linkedUser?: LinkedTelegramUser | null
  correlationId?: string
}
