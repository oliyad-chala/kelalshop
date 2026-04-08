import Link from 'next/link'
import { LoginForm } from '@/components/auth/LoginForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your KelalShop account',
}

export default function LoginPage() {
  return (
    <main className="flex-1 flex flex-col justify-center items-center p-4 bg-slate-50 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[100px] opacity-50" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-100 rounded-full blur-[100px] opacity-50" />

      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 relative z-10 fade-in border border-slate-100">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <span className="text-3xl font-bold tracking-tight text-navy-900">
              Kelal<span className="text-amber-500">Shop</span>
            </span>
          </Link>
          <h1 className="text-2xl font-semibold text-navy-900 tracking-tight">
            Welcome back
          </h1>
          <p className="text-slate-500 mt-2">
            Sign in to access your dashboard
          </p>
        </div>

        <LoginForm />

        <p className="text-center text-sm text-slate-500 mt-8">
          Don't have an account?{' '}
          <Link href="/auth/signup" className="font-medium text-amber-500 hover:text-amber-600 transition-colors">
            Join for free
          </Link>
        </p>
      </div>
    </main>
  )
}
