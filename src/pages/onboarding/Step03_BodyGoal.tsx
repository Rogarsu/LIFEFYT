import { motion } from 'framer-motion'
import { StepWrapper } from '../../components/ui/StepWrapper'
import { useOnboardingStore } from '../../store/onboarding'
import { BODY_COMPOSITION_GOALS } from '../../constants/goals'
import type { BodyCompositionGoal } from '../../types'

interface Props {
  onNext: () => void
}

export function Step03_BodyGoal({ onNext }: Props) {
  const { bodyGoal, setBodyGoal, nextStep } = useOnboardingStore()

  const handleSelect = (id: BodyCompositionGoal, available: boolean) => {
    if (!available) return
    setBodyGoal(id)
    setTimeout(() => { nextStep(); onNext() }, 300)
  }

  return (
    <StepWrapper
      title="¿Qué quieres lograr?"
      subtitle="Selecciona tu objetivo específico dentro de composición corporal."
    >
      <div className="grid grid-cols-2 gap-3">
        {BODY_COMPOSITION_GOALS.map((goal, i) => (
          <motion.div
            key={goal.id}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.07, duration: 0.3 }}
            onClick={() => handleSelect(goal.id, goal.available)}
            className={[
              'relative overflow-hidden rounded-2xl border-2 transition-all duration-300',
              goal.available ? 'cursor-pointer active:scale-[0.97]' : 'cursor-not-allowed',
              bodyGoal === goal.id
                ? 'border-brand-500/80 shadow-glow-sm-red'
                : goal.available
                  ? 'border-white/10 hover:border-white/25'
                  : 'border-white/5 opacity-50',
              // Featured item spans full width
              i === 0 ? 'col-span-2' : '',
            ].join(' ')}
          >
            {/* Image */}
            <div className={`relative overflow-hidden ${i === 0 ? 'h-48' : 'h-32'}`}>
              <img
                src={goal.image}
                alt={goal.title}
                loading="lazy"
                className="w-full h-full object-cover"
                style={{ filter: !goal.available ? 'grayscale(60%)' : 'none' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/20 to-transparent" />

              {/* Tags (only on featured) */}
              {i === 0 && goal.tags && (
                <div className="absolute top-3 left-3 flex gap-1.5">
                  {goal.tags.map(tag => (
                    <span key={tag} className="glass px-2.5 py-0.5 rounded-full text-xs font-bold text-brand-400">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Selected indicator */}
              {bodyGoal === goal.id && (
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center shadow-glow-sm-red">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}

              {/* Locked */}
              {!goal.available && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white/30" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                  </svg>
                </div>
              )}
            </div>

            {/* Text */}
            <div className="p-3 bg-dark-800/90">
              <p className="text-[10px] font-bold text-brand-400/80 uppercase tracking-wider">{goal.subtitle}</p>
              <h4 className={`text-white font-bold leading-tight mt-0.5 ${i === 0 ? 'text-base' : 'text-sm'}`}>
                {goal.title}
              </h4>
              {i === 0 && (
                <p className="text-white/45 text-xs mt-1 leading-relaxed">{goal.description}</p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </StepWrapper>
  )
}
