'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Clock, ArrowRight, Tag } from 'lucide-react'
import type { BlogPost } from '@/lib/content/blog'
import NewsletterCTA from '@/components/blog/NewsletterCTA'

interface BlogClientProps {
  posts: BlogPost[]
  categories: string[]
}

export default function BlogClient({ posts, categories }: BlogClientProps) {
  const [selectedCategory, setSelectedCategory] = useState('All')

  // Filter posts based on selected category
  const filteredPosts = selectedCategory === 'All'
    ? posts
    : posts.filter((post) => post.category === selectedCategory)

  const featured = filteredPosts.filter((p) => p.featured)
  const rest = filteredPosts.filter((p) => !p.featured)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2.5 mb-12 justify-center sm:justify-start">
        {categories.map((cat) => {
          const isActive = cat === selectedCategory
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold cursor-pointer transition-all duration-300 transform active:scale-95 ${
                isActive
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20 translate-y-[-1px]'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-amber-400 hover:text-amber-500 hover:shadow-sm'
              }`}
            >
              {cat}
            </button>
          )
        })}
      </div>

      {/* Featured Section */}
      {featured.length > 0 && (
        <section className="mb-16 animate-fadeIn">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <span className="w-4 h-0.5 bg-amber-500 inline-block animate-pulse" />
            Featured Articles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featured.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl hover:border-amber-300 transition-all duration-300 flex flex-col h-full"
              >
                {/* Placeholder graphic */}
                <div className="h-48 bg-gradient-to-br from-navy-800 to-navy-950 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-[-30%] right-[-20%] w-64 h-64 bg-amber-400 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <div className="relative text-center px-6 transition-transform duration-300 group-hover:scale-105">
                    <Tag className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                    <span className="text-white font-bold text-sm tracking-wider uppercase">{post.category}</span>
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-1 justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${post.categoryColor}`}>
                        {post.category}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {post.readTime}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-navy-900 mb-2 group-hover:text-amber-500 transition-colors leading-snug">
                      {post.title}
                    </h3>
                    <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed">{post.excerpt}</p>
                  </div>
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
                    <span className="text-xs text-slate-400">{post.date}</span>
                    <span className="text-amber-500 font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                      Read More <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* All Articles Section */}
      <section className="mb-16">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
          <span className="w-4 h-0.5 bg-amber-500 inline-block" />
          {selectedCategory === 'All' ? 'All Articles' : `${selectedCategory} Articles`}
        </h2>
        
        {rest.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rest.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group bg-white rounded-3xl shadow-sm border border-slate-100 p-6 hover:shadow-xl hover:border-amber-300 transition-all duration-300 flex flex-col h-full justify-between"
              >
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${post.categoryColor}`}>
                      {post.category}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {post.readTime}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-navy-900 mb-2 group-hover:text-amber-500 transition-colors leading-snug">
                    {post.title}
                  </h3>
                  <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed mb-4">{post.excerpt}</p>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
                  <span className="text-xs text-slate-400">{post.date}</span>
                  <span className="text-amber-500 font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                    Read <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm mb-12">
            <Tag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800 mb-1">No other articles</h3>
            <p className="text-slate-500 text-sm">We don't have any additional articles in the {selectedCategory} category right now.</p>
          </div>
        )}
      </section>

      {/* Newsletter CTA Section */}
      <NewsletterCTA />
    </div>
  )
}
