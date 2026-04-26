import { redirect } from 'next/navigation'

/**
 * /admin root — immediately redirects to the dashboard.
 * The admin layout handles auth; this page just provides a sensible default route.
 */
export default function AdminRootPage() {
  redirect('/admin/dashboard')
}
