'use client'

import React from 'react'
import { Wrench, Clock, RefreshCcw } from 'lucide-react'

export function MaintenanceView() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 selection:bg-amber-200 selection:text-amber-900">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden text-center p-10 border border-slate-100">
        <div className="mx-auto w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6">
          <Wrench className="w-10 h-10 text-amber-500" />
        </div>
        
        <h1 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">
          We'll be right back!
        </h1>
        
        <p className="text-slate-500 mb-8 leading-relaxed">
          KelalShop is currently undergoing scheduled maintenance to improve your experience. We apologize for any inconvenience.
        </p>
        
        <div className="flex flex-col gap-4 text-sm font-medium text-slate-600">
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center justify-center gap-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 p-3 rounded-lg transition-colors"
          >
            <RefreshCcw className="w-4 h-4" />
            <span>Check Status Again</span>
          </button>
        </div>
      </div>
    </div>
  )
}
