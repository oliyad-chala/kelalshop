import { Mail, Phone, MapPin, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ContactForm } from '@/components/contact/ContactForm'

export const metadata = {
  title: 'Contact Us | KelalShop',
  description: 'Get in touch with the KelalShop team for support, inquiries, or feedback.',
}

export default async function ContactPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isLoggedIn = !!user

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-3xl md:text-5xl font-extrabold text-navy-900 tracking-tight mb-4">
            Get in Touch
          </h1>
          <p className="text-lg text-slate-500">
            Have a question, feedback, or need support? We'd love to hear from you. 
            Fill out the form below or reach us through our contact details.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
          
          {/* Contact Information (Left Column) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 h-full">
              <h2 className="text-2xl font-bold text-navy-900 mb-8">Contact Information</h2>
              
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Email</h3>
                    <p className="text-base font-semibold text-navy-900">support@kelalshop.com</p>
                    <p className="text-sm text-slate-500 mt-1">We aim to reply within 24 hours.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Phone</h3>
                    <p className="text-base font-semibold text-navy-900">+251 911 23 45 67</p>
                    <p className="text-sm text-slate-500 mt-1">Mon-Fri from 9am to 6pm (EAT)</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Office</h3>
                    <p className="text-base font-semibold text-navy-900">Addis Ababa, Ethiopia</p>
                    <p className="text-sm text-slate-500 mt-1">Bole Road, Dembel City Center</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Working Hours</h3>
                    <p className="text-base font-semibold text-navy-900">9:00 AM - 6:00 PM</p>
                    <p className="text-sm text-slate-500 mt-1">Monday through Friday</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form (Right Column) */}
          <div className="lg:col-span-3">
            <ContactForm isLoggedIn={isLoggedIn} />
          </div>

        </div>
      </div>
    </div>
  )
}
