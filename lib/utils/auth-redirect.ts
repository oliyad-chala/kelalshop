/** Safe same-origin path from ?redirectTo= or legacy ?redirect= */
export function getSafeRedirectPath(
  params: Pick<URLSearchParams, 'get'>
): string | null {
  const raw = params.get('redirectTo') ?? params.get('redirect')
  if (raw && raw.startsWith('/') && !raw.startsWith('//')) return raw
  return null
}

export function redirectQueryString(params: Pick<URLSearchParams, 'get'>): string {
  const path = getSafeRedirectPath(params)
  return path ? `?redirectTo=${encodeURIComponent(path)}` : ''
}
