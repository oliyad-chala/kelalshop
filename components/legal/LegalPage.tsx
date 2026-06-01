import Link from 'next/link'
import type { LegalSection } from '@/lib/content/legal'
import { LEGAL_LAST_UPDATED } from '@/lib/content/legal'

type Props = {
  title: string
  intro?: string
  sections: LegalSection[]
}

export function LegalPage({ title, intro, sections }: Props) {
  return (
    <main className="flex-1 bg-slate-50 py-10 sm:py-14">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-amber-600 mb-6 transition-colors"
        >
          ← Back to home
        </Link>

        <article className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-10">
          <header className="mb-8 pb-6 border-b border-slate-100">
            <h1 className="text-2xl sm:text-3xl font-bold text-navy-900 tracking-tight">{title}</h1>
            <p className="text-sm text-slate-500 mt-2">Last updated: {LEGAL_LAST_UPDATED}</p>
            {intro && <p className="text-slate-600 mt-4 leading-relaxed">{intro}</p>}
          </header>

          <div className="space-y-8">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-lg font-semibold text-navy-900 mb-3">{section.title}</h2>
                {section.paragraphs.map((p, i) => (
                  <p key={i} className="text-slate-600 text-sm sm:text-base leading-relaxed mb-3 last:mb-0">
                    {p}
                  </p>
                ))}
                {section.list && (
                  <ul className="mt-3 space-y-2 list-disc list-inside text-slate-600 text-sm sm:text-base">
                    {section.list.map((item) => (
                      <li key={item} className="leading-relaxed">
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </article>
      </div>
    </main>
  )
}
