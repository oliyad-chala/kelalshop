export function formatEtb(amount: number): string {
  return `${Math.round(amount).toLocaleString('en-US')} ETB`
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function truncateId(id: string, len = 8): string {
  return id.slice(0, len)
}
