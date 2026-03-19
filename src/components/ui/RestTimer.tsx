import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

interface RestTimerProps {
  seconds:   number
  onDone:    () => void
  onDismiss: () => void
}

export function RestTimer({ seconds, onDone, onDismiss }: RestTimerProps) {
  const [remaining, setRemaining] = useState(seconds)
  const [active,    setActive]    = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!active) return
    intervalRef.current = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          clearInterval(intervalRef.current!)
          onDone()
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current!)
  }, [active])

  const toggle = () => setActive(a => !a)
  const skip   = () => { clearInterval(intervalRef.current!); onDone() }

  const progress = remaining / seconds
  const r = 54
  const circumference = 2 * Math.PI * r
  const dash = circumference * progress

  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-dark-900/80 backdrop-blur-md"
      onClick={onDismiss}
    >
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md bg-dark-800 rounded-t-3xl p-8 pb-12 border-t border-white/10"
      >
        {/* Handle */}
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-8" />

        <h3 className="text-white/50 text-sm font-bold uppercase tracking-widest text-center mb-6">
          Tiempo de descanso
        </h3>

        {/* Circular progress */}
        <div className="relative w-40 h-40 mx-auto mb-8">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            {/* Track */}
            <circle
              cx="60" cy="60" r={r}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="8"
            />
            {/* Progress */}
            <motion.circle
              cx="60" cy="60" r={r}
              fill="none"
              stroke="url(#timerGradient)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - dash}
              animate={{ strokeDashoffset: circumference - dash }}
              transition={{ duration: 0.5 }}
            />
            <defs>
              <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor="#ff3120" />
                <stop offset="100%" stopColor="#06d5f0" />
              </linearGradient>
            </defs>
          </svg>

          {/* Time display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-black text-white tabular-nums">
              {mins > 0 ? `${mins}:${String(secs).padStart(2, '0')}` : secs}
            </span>
            <span className="text-white/30 text-xs font-semibold mt-1">
              {mins > 0 ? 'min' : 'seg'}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-3">
          <button
            onClick={toggle}
            className="flex-1 btn-secondary py-4"
          >
            {active ? 'Pausar' : 'Reanudar'}
          </button>
          <button
            onClick={skip}
            className="flex-1 btn-primary py-4"
          >
            Saltar descanso
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
