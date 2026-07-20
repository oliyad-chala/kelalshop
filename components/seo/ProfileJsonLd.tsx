interface ProfileJsonLdProps {
  profile: {
    id: string
    full_name: string
    avatar_url?: string
    description?: string
  }
}

export function ProfileJsonLd({ profile }: ProfileJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      '@type': 'Person',
      name: profile.full_name,
      image: profile.avatar_url,
      description: profile.description || `Verified shopper on KelalShop Ethiopia.`,
      jobTitle: 'Importer / Shopper',
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
