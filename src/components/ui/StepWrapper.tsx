import { motion } from 'framer-motion'
import { ProgressBar } from './ProgressBar'
import { useOnboardingStore } from '../../store/onboarding'

interface StepWrapperProps {
  title:       string
  subtitle?:   string
  children:    React.ReactNode
  onBack?:     () => void
  className?:  string
}

const variants = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: -40 },
}

export function StepWrapper({ title, subtitle, children, onBack, className = '' }: StepWrapperProps) {
  const { step, totalSteps, prevStep } = useOnboardingStore()

  const handleBack = onBack ?? prevStep

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`flex flex-col min-h-dvh bg-dark-900 safe-top safe-bottom ${className}`}
    >
      {/* Header */}
      <div className="flex items-center gap-4 px-5 pt-5 pb-4">
        {step > 1 && (
          <button
            onClick={handleBack}
            className="w-10 h-10 rounded-xl glass flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all flex-shrink-0"
            aria-label="Volver"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <div className="flex-1">
          <ProgressBar current={step} total={totalSteps} />
        </div>
      </div>

      {/* Title area */}
      <div className="px-5 pb-6">
        <h1 className="text-2xl font-black text-white leading-tight tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-white/50 text-sm mt-1.5 leading-relaxed">{subtitle}</p>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-8">
        {children}
      </div>
    </motion.div>
  )
}
