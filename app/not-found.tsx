import './globals.css'
import Link from 'next/link'
import { Home, Search, AlertCircle } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-100">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10 text-amber-600" />
        </div>
        <h1 className="text-4xl font-extrabold text-navy-900 mb-2">404</h1>
        <h2 className="text-xl font-bold text-navy-800 mb-4">Page Not Found</h2>
        <p className="text-slate-500 mb-8">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-colors"
          >
            <Home className="w-5 h-5" />
            Go Home
          </Link>
          <Link
            href="/products"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-navy-700 font-semibold rounded-xl transition-colors"
          >
            <Search className="w-5 h-5" />
            Browse Products
          </Link>
        </div>
      </div>
    </div>
  )
}
