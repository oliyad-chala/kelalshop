import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/seo/site'
import { BookOpen } from 'lucide-react'
import { BLOG_POSTS, CATEGORIES } from '@/lib/content/blog'
import BlogClient from './BlogClient'

export const metadata: Metadata = {
  title: 'Blog — Online Shopping Tips & Ethiopian E-Commerce News | KelalShop',
  description:
    'Read the latest articles on online shopping in Ethiopia, import tips, e-commerce trends, and how to get the best deals from AliExpress, Shein, and Amazon delivered to Ethiopia.',
  alternates: {
    canonical: `${SITE_URL}/blog`,
  },
}

// JSON-LD for Blog (ItemList schema helps Google understand the blog listing)
const blogListSchema = {
  '@context': 'https://schema.org',
  '@type': 'Blog',
  name: 'KelalShop Blog',
  description: 'Online shopping tips, Ethiopian e-commerce news, and import guides.',
  url: `${SITE_URL}/blog`,
  publisher: {
    '@type': 'Organization',
    name: 'KelalShop',
    url: SITE_URL,
    logo: { '@type': 'ImageObject', url: `${SITE_URL}/icon.png` },
  },
  blogPost: BLOG_POSTS.map((post) => ({
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    url: `${SITE_URL}/blog/${post.slug}`,
    author: { '@type': 'Organization', name: 'KelalShop' },
  })),
}

export default function BlogPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogListSchema) }}
      />

      <div className="min-h-screen bg-slate-50">
        {/* Hero */}
        <div className="relative bg-gradient-to-br from-navy-900 via-navy-800 to-navy-950 py-20 overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[150%] bg-amber-400 rounded-full blur-[120px]" />
          </div>
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
            <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-400 text-sm font-semibold px-4 py-2 rounded-full mb-6 border border-amber-500/30">
              <BookOpen className="w-4 h-4" />
              KelalShop Blog
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 tracking-tight">
              Online Shopping Tips &{' '}
              <span className="text-amber-400">Ethiopia E-Commerce</span> News
            </h1>
            <p className="text-lg text-navy-300 max-w-2xl mx-auto">
              Guides on how to shop internationally from Ethiopia, import tips, and the latest
              e-commerce trends in the Ethiopian market.
            </p>
          </div>
        </div>

        {/* Interactive list view and category selector */}
        <BlogClient posts={BLOG_POSTS} categories={CATEGORIES} />
      </div>
    </>
  )
}
