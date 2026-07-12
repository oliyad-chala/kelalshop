import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, Calendar, BookOpen, CheckCircle, ChevronRight, Hash, Lightbulb } from 'lucide-react'
import { BLOG_POSTS } from '@/lib/content/blog'
import { SITE_URL } from '@/lib/seo/site'
import ReadingProgressBar from '@/components/blog/ReadingProgressBar'
import ShareButtons from '@/components/blog/ShareButtons'
import NewsletterCTA from '@/components/blog/NewsletterCTA'

interface PageProps {
  params: Promise<{ slug: string }>
}

// Generate static parameters for static generation of all blog articles
export async function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({
    slug: post.slug,
  }))
}

// Dynamic SEO metadata generation
export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const post = BLOG_POSTS.find((p) => p.slug === slug)

  if (!post) {
    return {
      title: 'Article Not Found | KelalShop',
      description: 'The requested blog article could not be found.',
    }
  }

  return {
    title: `${post.title} — KelalShop Blog`,
    description: post.excerpt,
    alternates: {
      canonical: `${SITE_URL}/blog/${post.slug}`,
    },
    openGraph: {
      title: `${post.title} | KelalShop Blog`,
      description: post.excerpt,
      type: 'article',
      url: `${SITE_URL}/blog/${post.slug}`,
      publishedTime: new Date(post.date).toISOString(),
      authors: ['KelalShop Editorial Team'],
      tags: [post.category, 'Ethiopia E-Commerce', 'Importing'],
    },
  }
}

// Helper to create safe anchor ids from headers
const slugify = (text: string) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

export default async function BlogDetailPage({ params }: PageProps) {
  const { slug } = await params
  const post = BLOG_POSTS.find((p) => p.slug === slug)

  if (!post) {
    notFound()
  }

  // Find related articles (same category first, excluding current, capped at 3)
  let related = BLOG_POSTS.filter((p) => p.slug !== slug && p.category === post.category)
  if (related.length < 3) {
    const others = BLOG_POSTS.filter((p) => p.slug !== slug && p.category !== post.category)
    related = [...related, ...others].slice(0, 3)
  } else {
    related = related.slice(0, 3)
  }

  // Article structured schema for search engines
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    author: {
      '@type': 'Organization',
      name: 'KelalShop Editorial Team',
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'KelalShop',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/icon.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/blog/${post.slug}`,
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <ReadingProgressBar />

      <div className="min-h-screen bg-slate-50 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Back Navigation & Breadcrumbs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-amber-500 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Blog
            </Link>
            
            <nav className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
              <Link href="/" className="hover:text-slate-600">Home</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link href="/blog" className="hover:text-slate-600">Blog</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-slate-600 truncate max-w-[200px]">{post.category}</span>
            </nav>
          </div>

          {/* Main Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left: Article Content */}
            <article className="lg:col-span-8 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-10">
              {/* Category and Read Info */}
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${post.categoryColor}`}>
                  {post.category}
                </span>
                
                <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {post.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {post.readTime}
                  </span>
                </div>
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-navy-900 mb-6 leading-tight tracking-tight">
                {post.title}
              </h1>

              {/* Divider */}
              <hr className="border-slate-100 mb-8" />

              {/* Intro Paragraph */}
              <p className="text-lg text-slate-600 leading-relaxed font-medium mb-8 bg-slate-50/50 p-5 rounded-2xl border-l-4 border-amber-400">
                {post.introduction}
              </p>

              {/* Dynamic Body Sections */}
              <div className="space-y-10">
                {post.sections.map((section, idx) => {
                  const sectionId = slugify(section.heading)
                  return (
                    <section key={idx} className="scroll-mt-24">
                      <h2 
                        id={sectionId} 
                        className="text-xl sm:text-2xl font-bold text-navy-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2 group"
                      >
                        <Hash className="w-5 h-5 text-amber-500/50 group-hover:text-amber-500 transition-colors" />
                        {section.heading}
                      </h2>

                      {/* Content block */}
                      {Array.isArray(section.content) ? (
                        <div className="space-y-4">
                          {section.content.map((pText, pIdx) => (
                            <p key={pIdx} className="text-slate-600 leading-relaxed text-sm md:text-base">
                              {pText}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-600 leading-relaxed text-sm md:text-base">
                          {section.content}
                        </p>
                      )}

                      {/* Step lists if applicable */}
                      {section.isStepList && section.list && (
                        <ol className="space-y-4 my-6 list-none pl-0">
                          {section.list.map((item, itemIdx) => (
                            <li 
                              key={itemIdx} 
                              className="flex gap-4 p-5 bg-slate-50/30 border border-slate-100 rounded-2xl shadow-2xs hover:shadow-xs transition-all hover:bg-slate-50/60"
                            >
                              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 text-amber-600 font-bold flex items-center justify-center text-sm shadow-2xs">
                                {itemIdx + 1}
                              </span>
                              <p className="text-slate-600 text-sm md:text-base leading-relaxed mt-0.5">
                                {item}
                              </p>
                            </li>
                          ))}
                        </ol>
                      )}

                      {/* Local Custom Tips */}
                      {section.tip && (
                        <div className="my-6 p-5 bg-amber-50/40 border-l-4 border-amber-500 rounded-r-2xl text-amber-900 text-sm md:text-base flex gap-3.5 shadow-2xs">
                          <div className="flex-shrink-0 text-amber-500 mt-1">
                            <Lightbulb className="w-5 h-5" />
                          </div>
                          <div>
                            <strong className="font-bold block text-amber-950 mb-0.5">KelalShop Expert Tip</strong>
                            <p className="text-amber-800 leading-relaxed text-sm md:text-base">{section.tip}</p>
                          </div>
                        </div>
                      )}
                    </section>
                  )
                })}
              </div>

              {/* Conclusion */}
              <div className="mt-12 pt-8 border-t border-slate-100">
                <h2 className="text-lg font-bold text-navy-900 mb-3">Conclusion</h2>
                <p className="text-slate-600 leading-relaxed text-sm md:text-base">
                  {post.conclusion}
                </p>
              </div>

              {/* Author footer */}
              <div className="mt-12 flex items-center gap-4 p-5 rounded-2xl bg-slate-50/50 border border-slate-100">
                <div className="w-10 h-10 rounded-full bg-navy-900 flex items-center justify-center text-amber-400 font-bold text-sm">
                  KS
                </div>
                <div>
                  <h4 className="font-bold text-sm text-navy-900">KelalShop Editorial Team</h4>
                  <p className="text-xs text-slate-400">Written and fact-checked by our importing and logistics experts.</p>
                </div>
              </div>
            </article>

            {/* Right: Sticky Sidebar */}
            <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
              
              {/* Table of Contents */}
              <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                <h3 className="text-sm font-bold text-navy-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-500" />
                  Table of Contents
                </h3>
                <nav className="space-y-2.5">
                  {post.sections.map((section, idx) => {
                    const sectionId = slugify(section.heading)
                    return (
                      <a
                        key={idx}
                        href={`#${sectionId}`}
                        className="block text-xs md:text-sm text-slate-500 hover:text-amber-500 hover:translate-x-1 transition-all leading-snug truncate"
                      >
                        {idx + 1}. {section.heading}
                      </a>
                    )
                  })}
                </nav>
              </div>

              {/* Key Takeaways Card */}
              <div className="bg-slate-900 text-white rounded-3xl p-6 relative overflow-hidden shadow-sm border border-slate-800">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-400 via-navy-900 to-navy-950" />
                <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-4 flex items-center gap-2 relative z-10">
                  <CheckCircle className="w-4.5 h-4.5 text-amber-400" />
                  Key Takeaways
                </h3>
                <ul className="space-y-3 relative z-10 pl-0 list-none my-0">
                  {post.keyTakeaways.map((item, idx) => (
                    <li key={idx} className="flex gap-2.5 items-start text-navy-100 text-xs md:text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-1.5" />
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Share & Actions */}
              <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider">
                  Share Article
                </h3>
                <ShareButtons />
              </div>

            </aside>
          </div>

          {/* Related Articles Section */}
          <section className="mt-20 mb-12">
            <h2 className="text-lg md:text-xl font-bold text-navy-900 mb-6 flex items-center gap-2">
              <span className="w-4 h-0.5 bg-amber-500 inline-block" />
              Related Articles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map((p) => (
                <Link
                  key={p.slug}
                  href={`/blog/${p.slug}`}
                  className="group bg-white rounded-3xl p-6 border border-slate-100 hover:shadow-md hover:border-amber-200 transition-all flex flex-col justify-between"
                >
                  <div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mb-3 ${p.categoryColor}`}>
                      {p.category}
                    </span>
                    <h3 className="text-sm md:text-base font-bold text-navy-900 group-hover:text-amber-500 transition-colors line-clamp-2 leading-snug">
                      {p.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed mt-2">{p.excerpt}</p>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-slate-400 text-[10px] font-medium">
                    <span>{p.date}</span>
                    <span className="text-amber-500 font-semibold flex items-center gap-1 group-hover:gap-1.5 transition-all">
                      Read <ArrowLeft className="w-3 h-3 rotate-180" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Bottom Newsletter block */}
          <div className="mt-12">
            <NewsletterCTA 
              title="Never Miss a Shopping Tip" 
              description="Get our latest importing guides, platform comparisons, and custom regulations updates sent weekly to your inbox." 
            />
          </div>
        </div>
      </div>
    </>
  )
}
