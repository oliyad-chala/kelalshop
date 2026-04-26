import './admin.css'

/**
 * Thin admin shell — imports the admin design system CSS.
 * Auth logic lives in app/admin/(protected)/layout.tsx.
 * The login page (app/admin/(auth)/login) renders without a sidebar.
 */
export const metadata = {
  title: {
    default: 'Admin Portal | KelalShop',
    template: '%s | KelalShop Admin',
  },
}

export default function AdminShellLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
