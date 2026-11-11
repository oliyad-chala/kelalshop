import type { SupabaseClient } from '@supabase/supabase-js'

export interface CatalogSearchOptions {
  query?: string
  category?: string
  minPrice?: number
  maxPrice?: number
  sortBy?: 'price_asc' | 'price_desc' | 'newest'
  limit?: number
}

export interface ProductSearchMatch {
  id: string
  name: string
  price: number
  description: string | null
  category: string | null
  attributes: Record<string, any> | null
  isAvailable: boolean
  stock: number | null
  image: string | null
}

export interface CatalogSearchResult {
  available: ProductSearchMatch[]
  soldOut: ProductSearchMatch[]
}

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'i', 'me', 'my', 'we', 'you', 'your',
  'can', 'could', 'would', 'will', 'do', 'does', 'have', 'has',
  'get', 'give', 'want', 'need', 'buy', 'order', 'show', 'find', 'search', 'list',
  'see', 'look', 'looking', 'for', 'some', 'any', 'all', 'this', 'that', 'these', 'those',
  'product', 'products', 'item', 'items', 'stuff', 'things', 'kelalshop', 'please', 'pls',
  'in', 'on', 'at', 'of', 'to', 'with', 'best', 'good', 'cheap', 'cheapest', 'price',
])

const SYNONYM_GROUPS: string[][] = [
  ['phone', 'mobile', 'smartphone', 'cellphone'],
  ['laptop', 'computer', 'notebook', 'pc', 'macbook'],
  ['shoe', 'shoes', 'sneaker', 'sneakers', 'footwear'],
  ['perfume', 'fragrance', 'scent', 'cologne'],
  ['cloth', 'clothes', 'clothing', 'shirt', 'tshirt', 'dress', 'fashion'],
]

function normalizeText(input: string): string {
  return input.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim()
}

function singularizeToken(token: string): string {
  if (token.length <= 3) return token
  if (token.endsWith('ies') && token.length > 4) return `${token.slice(0, -3)}y`
  if (token.endsWith('es') && /(sh|ch|x|z|s)es$/.test(token)) return token.slice(0, -2)
  if (token.endsWith('s') && !token.endsWith('ss')) return token.slice(0, -1)
  return token
}

function expandTokenVariants(token: string): string[] {
  const variants = new Set<string>([token])
  const singular = singularizeToken(token)
  variants.add(singular)

  for (const group of SYNONYM_GROUPS) {
    if (group.includes(token) || group.includes(singular)) {
      for (const word of group) variants.add(word)
    }
  }
  return Array.from(variants)
}

function extractSearchTokens(rawQuery?: string): string[] {
  if (!rawQuery) return []
  const cleaned = normalizeText(rawQuery)
  if (!cleaned) return []

  const rawTokens = cleaned.split(' ').filter(Boolean)
  const meaningful = rawTokens.filter(t => !STOP_WORDS.has(t))
  return meaningful
}

function scoreProduct(product: any, tokens: string[], categoryFilter?: string): number {
  const nameNorm = normalizeText(product.name || '')
  const nameCompact = nameNorm.replace(/\s+/g, '')
  const descNorm = normalizeText(product.description || '')
  const catNameNorm = normalizeText(product.categories?.name || '')
  const catSlugNorm = normalizeText(product.categories?.slug || '')

  const attrValues = product.attributes && typeof product.attributes === 'object'
    ? Object.values(product.attributes).map(v => normalizeText(String(v ?? ''))).join(' ')
    : ''

  const allCompact = `${nameCompact} ${descNorm.replace(/\s+/g, '')} ${attrValues.replace(/\s+/g, '')}`

  // Category filter check (matches category name/slug OR attributes like Type: "Phone")
  let categoryBonus = 0
  if (categoryFilter) {
    const catTokens = extractSearchTokens(categoryFilter)
    const effectiveCatTokens = catTokens.length > 0 ? catTokens : [normalizeText(categoryFilter)].filter(Boolean)
    const matchedCat = effectiveCatTokens.some(t =>
      expandTokenVariants(t).some(
        v => catNameNorm.includes(v) || catSlugNorm.includes(v) || attrValues.includes(v) || nameNorm.includes(v)
      )
    )
    if (!matchedCat) return 0
    categoryBonus = 2
  }

  // Generic browse query (no specific keyword tokens)
  if (tokens.length === 0) {
    return 1 + categoryBonus
  }

  let matchedTokenCount = 0
  let totalScore = categoryBonus

  for (const token of tokens) {
    const variants = expandTokenVariants(token)
    let tokenScore = 0

    for (const variant of variants) {
      const compactVariant = variant.replace(/\s+/g, '')
      if (nameNorm.includes(variant) || (compactVariant.length >= 3 && nameCompact.includes(compactVariant))) {
        tokenScore = Math.max(tokenScore, variant === token ? 10 : 7)
      }
      if (attrValues.includes(variant)) {
        tokenScore = Math.max(tokenScore, variant === token ? 8 : 6)
      }
      if (catNameNorm.includes(variant) || catSlugNorm.includes(variant)) {
        tokenScore = Math.max(tokenScore, 5)
      }
      if (descNorm.includes(variant) || (compactVariant.length >= 4 && allCompact.includes(compactVariant))) {
        tokenScore = Math.max(tokenScore, 3)
      }
    }

    if (tokenScore > 0) {
      matchedTokenCount++
      totalScore += tokenScore
    }
  }

  // Also check compact phrase across name/attributes (handles e.g. "iphone 17" vs "i phone 17")
  const compactPhrase = tokens.join('')
  if (compactPhrase.length >= 4 && allCompact.includes(compactPhrase)) {
    totalScore += 12
    matchedTokenCount = Math.max(matchedTokenCount, tokens.length)
  }

  if (matchedTokenCount === 0) return 0
  // Prefer products matching ALL tokens over partial token matches
  return totalScore + (matchedTokenCount === tokens.length ? 15 : 0)
}

function toProductMatch(p: any): ProductSearchMatch {
  const images = Array.isArray(p.product_images) ? p.product_images : []
  const primaryImg = images.find((i: any) => i.is_primary)?.url || images[0]?.url || null
  return {
    id: p.id,
    name: p.name,
    price: Number(p.price),
    description: p.description ?? null,
    category: p.categories?.name ?? null,
    attributes: p.attributes ?? null,
    isAvailable: p.is_available !== false && (p.stock === null || p.stock > 0),
    stock: p.stock ?? null,
    image: primaryImg,
  }
}

/**
 * Searches approved KelalShop products across name, JSONB attributes,
 * categories, and description, returning both in-stock and sold-out matches.
 */
export async function searchCatalogProducts(
  supabase: SupabaseClient<any>,
  options: CatalogSearchOptions
): Promise<CatalogSearchResult> {
  const limit = options.limit ?? 3

  let dbQuery = supabase
    .from('products')
    .select('id, name, description, price, stock, is_available, approval_status, attributes, created_at, categories(id, name, slug), product_images(url, is_primary)')
    .eq('approval_status', 'approved')

  if (typeof options.minPrice === 'number' && !Number.isNaN(options.minPrice)) {
    dbQuery = dbQuery.gte('price', options.minPrice)
  }
  if (typeof options.maxPrice === 'number' && !Number.isNaN(options.maxPrice)) {
    dbQuery = dbQuery.lte('price', options.maxPrice)
  }

  if (options.sortBy === 'price_asc') {
    dbQuery = dbQuery.order('price', { ascending: true })
  } else if (options.sortBy === 'price_desc') {
    dbQuery = dbQuery.order('price', { ascending: false })
  } else {
    dbQuery = dbQuery.order('created_at', { ascending: false })
  }

  const { data, error } = await dbQuery.limit(200)
  if (error || !data) {
    if (error) console.error('[searchCatalogProducts] Query error:', error.message)
    return { available: [], soldOut: [] }
  }

  const tokens = extractSearchTokens(options.query)
  const hasExplicitSort = options.sortBy === 'price_asc' || options.sortBy === 'price_desc'

  const scored = data
    .map((p: any, idx: number) => ({
      product: p,
      score: scoreProduct(p, tokens, options.category),
      idx,
    }))
    .filter(item => item.score > 0)

  if (!hasExplicitSort) {
    scored.sort((a, b) => b.score - a.score || a.idx - b.idx)
  }

  const available: ProductSearchMatch[] = []
  const soldOut: ProductSearchMatch[] = []

  for (const item of scored) {
    const mapped = toProductMatch(item.product)
    if (mapped.isAvailable) {
      if (available.length < limit) available.push(mapped)
    } else if (soldOut.length < limit) {
      soldOut.push(mapped)
    }
  }

  return { available, soldOut }
}

/**
 * Builds a PostgREST `.or()` filter expression across product name,
 * description, and common JSONB attributes for paginated website search.
 */
export function buildPostgrestProductSearchOr(rawTerm: string): string | null {
  const safe = rawTerm.replace(/[(),'"\\]/g, ' ').replace(/\s+/g, ' ').trim()
  if (!safe) return null

  const normalized = singularizeToken(safe.toLowerCase())
  const terms = normalized && normalized !== safe.toLowerCase() ? [safe, normalized] : [safe]

  const clauses: string[] = []
  for (const term of terms) {
    clauses.push(
      `name.ilike.%${term}%`,
      `description.ilike.%${term}%`,
      `attributes->>Type.ilike.%${term}%`,
      `attributes->>Brand.ilike.%${term}%`,
      `attributes->>Model.ilike.%${term}%`
    )
  }
  return clauses.join(',')
}
