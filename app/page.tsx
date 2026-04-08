import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatPrice } from '@/lib/utils/formatters'

export default function Home() {
  return (
    <main className="flex-1">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-navy-950 text-white py-20 sm:py-32">
        <div className="absolute inset-0 max-w-7xl mx-auto">
          {/* Abstract background shapes */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/20 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 -left-24 w-72 h-72 bg-blue-500/20 rounded-full blur-[80px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-2xl">
            <Badge variant="amber" className="mb-6">v1.0 Now Live</Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Shop the world, <br />
              <span className="text-amber-400">delivered locally.</span>
            </h1>
            <p className="text-lg sm:text-xl text-navy-200 mb-10 leading-relaxed max-w-xl">
              Connect with verified Ethiopian importers. Buy anything from AliExpress, Shein, or Amazon without international cards or shipping limits.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/products">
                <Button size="lg" variant="primary" className="w-full sm:w-auto h-14 px-8 text-lg">
                  Browse Products
                </Button>
              </Link>
              <Link href="/shoppers">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto h-14 px-8 text-lg bg-white/10 hover:bg-white/20 border border-white/10">
                  Find a Shopper
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-navy-900 mb-4">How KelalShop Works</h2>
            <p className="text-slate-500 text-lg">Your gateway to global products, right here in Ethiopia.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8 text-center">
            {/* Step 1 */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-navy-50 rounded-2xl flex items-center justify-center text-navy-600 mb-6 font-bold text-xl">1</div>
              <h3 className="text-xl font-semibold mb-3">Find or Request</h3>
              <p className="text-slate-500 leading-relaxed">
                Browse listed products or post a link for a specific item you want to buy.
              </p>
            </div>
            {/* Step 2 */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mb-6 font-bold text-xl">2</div>
              <h3 className="text-xl font-semibold mb-3">Pay in Birr</h3>
              <p className="text-slate-500 leading-relaxed">
                Agree on a price with a verified local shopper. Secure payments handled via ETB.
              </p>
            </div>
            {/* Step 3 */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 mb-6 font-bold text-xl">3</div>
              <h3 className="text-xl font-semibold mb-3">Get Delivered</h3>
              <p className="text-slate-500 leading-relaxed">
                Your shopper imports the item and delivers it directly to you. Rate your experience.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Products Section */}
      <section className="py-24 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-bold text-navy-900 mb-2">Trending Imports</h2>
              <p className="text-slate-500">Recently listed by top shoppers</p>
            </div>
            <Link href="/products" className="hidden sm:block text-amber-600 font-medium hover:text-amber-700">
              View all →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Demo static cards since we don't have DB populated yet */}
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} hover padding="none" className="overflow-hidden flex flex-col">
                <div className="aspect-square bg-slate-200 relative">
                  <div className="absolute inset-0 bg-slate-100 animate-pulse" />
                  <Badge className="absolute top-3 right-3 z-10" variant="success">Available</Badge>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="text-sm text-slate-500 mb-1">Electronics</div>
                  <h3 className="font-semibold text-navy-900 mb-3 line-clamp-2">Premium Wireless Headphones Pro</h3>
                  <div className="mt-auto flex items-center justify-between">
                    <span className="font-bold text-lg text-amber-600">{formatPrice(4500)}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          <div className="mt-10 text-center sm:hidden">
            <Link href="/products">
              <Button variant="outline" fullWidth>View all products</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-amber-400 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-white/20 rounded-full blur-3xl" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-navy-950 mb-6">
            Ready to start importing?
          </h2>
          <p className="text-xl text-navy-900/80 mb-10">
            Join thousands of Ethiopians buying globally with KelalShop.
          </p>
          <Link href="/auth/signup">
            <Button size="lg" className="bg-navy-950 text-white hover:bg-navy-900 shadow-xl shadow-navy-900/20 border-0 h-14 px-8 text-lg">
              Create Free Account
            </Button>
          </Link>
        </div>
      </section>
    </main>
  )
}
