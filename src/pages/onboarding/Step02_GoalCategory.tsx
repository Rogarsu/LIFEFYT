import { motion } from 'framer-motion'
import { StepWrapper } from '../../components/ui/StepWrapper'
import { useOnboardingStore } from '../../store/onboarding'
import { GOAL_CATEGORIES } from '../../constants/goals'
import type { GoalCategory } from '../../types'

interface Props {
  onNext: () => void
}

export function Step02_GoalCategory({ onNext }: Props) {
  const { goalCategory, setGoalCategory, nextStep } = useOnboardingStore()

  const handleSelect = (id: GoalCategory, available: boolean) => {
    if (!available) return
    setGoalCategory(id)
    setTimeout(() => { nextStep(); onNext() }, 300)
  }

  return (
    <StepWrapper
      title="¿Cuál es tu gran meta?"
      subtitle="Elige la categoría que mejor describe lo que quieres lograr. Las demás estarán disponibles próximamente."
    >
      <div className="flex flex-col gap-4">
        {GOAL_CATEGORIES.map((cat, i) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.35 }}
            onClick={() => handleSelect(cat.id, cat.available)}
            className={[
              'relative overflow-hidden rounded-2xl border-2 transition-all duration-300',
              cat.available ? 'cursor-pointer' : 'cursor-not-allowed',
              goalCategory === cat.id
                ? 'border-brand-500/80 shadow-glow-sm-red'
                : cat.available
                  ? 'border-white/10 hover:border-white/25 active:scale-[0.98]'
                  : 'border-white/5 opacity-55',
            ].join(' ')}
          >
            {/* Background image */}
            <div className="relative h-40 overflow-hidden">
              <img
                src={cat.image}
                alt={cat.title}
                loading="lazy"
                className="w-full h-full object-cover"
                style={{ filter: !cat.available ? 'grayscale(50%)' : 'none' }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-dark-900/85 via-dark-900/40 to-transparent" />

              {/* Text over image */}
              <div className="absolute inset-0 flex flex-col justify-center px-5">
                <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: cat.color }}>
                  {cat.subtitle}
                </p>
                <h3 className="text-white font-black text-xl leading-tight">{cat.title}</h3>
                <p className="text-white/55 text-xs mt-1.5 leading-relaxed max-w-[75%]">
                  {cat.description}
                </p>
              </div>

              {/* Selected indicator */}
              {goalCategory === cat.id && (
                <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center shadow-glow-sm-red">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}

              {/* Locked overlay */}
              {!cat.available && (
                <div className="absolute inset-0 flex items-end justify-end p-3">
                  <div className="glass px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-white/50" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                    </svg>
                    <span className="text-xs text-white/50 font-semibold">Próximamente</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </StepWrapper>
  )
}
