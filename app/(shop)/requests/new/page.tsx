import { redirect } from 'next/navigation'

export default function RedirectToDashboardNewRequest() {
  redirect('/dashboard/requests/new')
}
