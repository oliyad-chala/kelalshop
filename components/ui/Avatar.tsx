import Image from 'next/image'
import { clsx } from 'clsx'
import { getInitials } from '@/lib/utils/formatters'

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface AvatarProps {
  src?: string | null
  name?: string | null
  size?: AvatarSize
  className?: string
}

const sizes: Record<AvatarSize, { container: string; text: string; px: number }> = {
  xs: { container: 'w-6 h-6', text: 'text-xs', px: 24 },
  sm: { container: 'w-8 h-8', text: 'text-xs', px: 32 },
  md: { container: 'w-10 h-10', text: 'text-sm', px: 40 },
  lg: { container: 'w-14 h-14', text: 'text-base', px: 56 },
  xl: { container: 'w-20 h-20', text: 'text-xl', px: 80 },
}

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const { container, text, px } = sizes[size]
  const initials = name ? getInitials(name) : '?'

  return (
    <div
      className={clsx(
        'relative rounded-full overflow-hidden shrink-0 ring-2 ring-white',
        container,
        className
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={name ?? 'Avatar'}
          fill
          className="object-cover"
          sizes={`${px}px`}
        />
      ) : (
        <div
          className={clsx(
            'w-full h-full flex items-center justify-center font-semibold',
            'bg-gradient-to-br from-navy-700 to-navy-900 text-amber-400',
            text
          )}
        >
          {initials}
        </div>
      )}
    </div>
  )
}
