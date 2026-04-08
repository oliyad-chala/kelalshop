import Link from 'next/link'
import { SignupForm } from '@/components/auth/SignupForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Join KelalShop as a buyer or shopper',
}

export default function SignupPage() {
  return (
    <main className="flex-1 flex flex-col justify-center items-center py-12 px-4 bg-slate-50 relative overflow-hidden min-h-screen">
      {/* Background decorations */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-100 rounded-full blur-[100px] opacity-50" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[100px] opacity-50" />

      <div className="w-full max-w-[480px] bg-white rounded-[2rem] p-8 sm:p-10 shadow-2xl shadow-slate-200/50 relative z-10 fade-in border border-slate-100">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <span className="text-3xl font-bold tracking-tight text-navy-900">
              Kelal<span className="text-amber-500">Shop</span>
            </span>
          </Link>
          <h1 className="text-2xl font-semibold text-navy-900 tracking-tight">
            Create an account
          </h1>
          <p className="text-slate-500 mt-2">
            Join the premier Ethiopian marketplace
          </p>
        </div>

        <SignupForm />

        <p className="text-center text-sm text-slate-500 mt-8">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-medium text-amber-500 hover:text-amber-600 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
