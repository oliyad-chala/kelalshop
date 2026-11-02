import { redirect } from 'next/navigation'

export default function ProductsNewRedirectPage() {
  redirect('/dashboard/listings/new')
}
