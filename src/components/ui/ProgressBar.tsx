interface ProgressBarProps {
  current: number
  total:   number
  className?: string
}

export function ProgressBar({ current, total, className = '' }: ProgressBarProps) {
  const pct = Math.min(100, Math.round((current / total) * 100))

  return (
    <div className={`w-full ${className}`}>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-right text-xs text-white/30 mt-1 font-medium tabular-nums">
        {current} / {total}
      </p>
    </div>
  )
}
