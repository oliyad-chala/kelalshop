import { clsx } from 'clsx'
import Image from 'next/image'

interface MessageBubbleProps {
  content: string
  imageUrl?: string | null
  timestamp: string
  isOwn: boolean
}

export function MessageBubble({ content, imageUrl, timestamp, isOwn }: MessageBubbleProps) {
  // Simple time formatting hook inside (we use Intl instead of external deps)
  const time = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(new Date(timestamp))

  return (
    <div className={clsx("flex w-full", isOwn ? "justify-end" : "justify-start")}>
      <div className={clsx(
        "max-w-[75%] md:max-w-[65%] rounded-2xl px-4 py-2.5 shadow-sm overflow-hidden",
        isOwn 
          ? "bg-amber-500 text-white rounded-br-none" 
          : "bg-white border border-slate-100 text-navy-900 rounded-bl-none"
      )}>
        {imageUrl && (
           <div className="mb-2 -mx-2 -mt-1 relative h-48 sm:h-64 rounded-xl overflow-hidden bg-slate-100">
             <Image src={imageUrl} alt="Attachment" fill className="object-cover" />
           </div>
        )}
        <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{content}</p>
        <div className={clsx(
          "text-[10px] mt-1 text-right font-medium",
          isOwn ? "text-amber-100" : "text-slate-400"
        )}>
          {time}
        </div>
      </div>
    </div>
  )
}
