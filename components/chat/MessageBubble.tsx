import { clsx } from 'clsx'

interface MessageBubbleProps {
  content: string
  timestamp: string
  isOwn: boolean
}

export function MessageBubble({ content, timestamp, isOwn }: MessageBubbleProps) {
  // Simple time formatting hook inside (we use Intl instead of external deps)
  const time = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(new Date(timestamp))

  return (
    <div className={clsx("flex w-full", isOwn ? "justify-end" : "justify-start")}>
      <div className={clsx(
        "max-w-[75%] md:max-w-[65%] rounded-2xl px-4 py-2.5 shadow-sm",
        isOwn 
          ? "bg-amber-500 text-white rounded-br-none" 
          : "bg-white border border-slate-100 text-navy-900 rounded-bl-none"
      )}>
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
