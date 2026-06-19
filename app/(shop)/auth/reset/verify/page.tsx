import { Suspense } from 'react'
import VerifyResetOtpForm from './VerifyResetOtpForm'
import { AuthBackButton } from '@/components/auth/AuthBackButton'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Verify Password Reset',
  description: 'Enter your 6-digit verification code to reset your password',
}

interface PageProps {
  searchParams: Promise<{ email?: string }>
}

export default async function VerifyPasswordResetPage({ searchParams }: PageProps) {
  const params = await searchParams
  const email = params.email || ''

  return (
    <main className="flex-1 flex flex-col justify-center items-center py-12 px-4 bg-slate-50 relative overflow-hidden min-h-screen">
      {/* Background decorations */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-100 rounded-full blur-[100px] opacity-50" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[100px] opacity-50" />

      <div className="absolute top-4 left-4 z-20">
        <Suspense fallback={null}>
          <AuthBackButton />
        </Suspense>
      </div>

      <div className="w-full max-w-[480px] bg-white rounded-[2rem] p-8 sm:p-10 shadow-2xl shadow-slate-200/50 relative z-10 fade-in border border-slate-100">
        <div className="text-center mb-8">
          <span className="text-3xl font-bold tracking-tight text-navy-900 block mb-6">
            Kelal<span className="text-amber-500">Shop</span>
          </span>
          <h1 className="text-2xl font-semibold text-navy-900 tracking-tight">
            Verify Reset Request
          </h1>
          <p className="text-slate-500 mt-2">
            Enter the code sent to your email to reset your password
          </p>
        </div>

        <Suspense fallback={<div className="h-64 animate-pulse bg-slate-100 rounded-xl" />}>
          <VerifyResetOtpForm email={email} />
        </Suspense>
      </div>
    </main>
  )
}
