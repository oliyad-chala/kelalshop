import { Context } from "grammy";

export interface BotContext extends Context {
    isAdmin: boolean;
    adminRole?: 'admin' | 'staff';
}
