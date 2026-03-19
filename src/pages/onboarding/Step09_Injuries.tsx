import { motion } from 'framer-motion'
import { StepWrapper } from '../../components/ui/StepWrapper'
import { useOnboardingStore } from '../../store/onboarding'

interface Props {
  onNext: () => void
}

const COMMON_ISSUES = [
  'Dolor de espalda baja', 'Rodillas', 'Hombros', 'Muñecas',
  'Cuello', 'Caderas', 'Codos', 'Tobillos',
]

export function Step09_Injuries({ onNext }: Props) {
  const { injuries, setInjuries, nextStep } = useOnboardingStore()

  const handleContinue = () => {
    nextStep()
    onNext()
  }

  const toggleIssue = (issue: string) => {
    if (injuries.includes(issue)) {
      setInjuries(injuries.replace(issue, '').replace(/,\s*/g, ', ').replace(/^,\s*|,\s*$/g, '').trim())
    } else {
      setInjuries(injuries ? `${injuries}, ${issue}` : issue)
    }
  }

  return (
    <StepWrapper
      title="¿Tienes lesiones o limitaciones?"
      subtitle="Esta información nos ayuda a excluir ejercicios que puedan causarte dolor o lesiones."
    >
      {/* Image */}
      <div className="relative h-36 rounded-2xl overflow-hidden mb-6">
        <img
          src="https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=700&q=80&fit=crop"
          alt="Health"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-dark-900/85 to-dark-900/40" />
        <div className="absolute inset-0 flex items-center px-5">
          <p className="text-white font-bold text-base max-w-[60%] leading-snug">
            Tu seguridad es nuestra prioridad número uno.
          </p>
        </div>
      </div>

      {/* Quick chips */}
      <div className="mb-5">
        <p className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-3">
          Problemas comunes (toca para seleccionar)
        </p>
        <div className="flex flex-wrap gap-2">
          {COMMON_ISSUES.map(issue => {
            const selected = injuries.includes(issue)
            return (
              <motion.button
                key={issue}
                whileTap={{ scale: 0.93 }}
                onClick={() => toggleIssue(issue)}
                className={[
                  'px-3.5 py-2 rounded-xl border text-sm font-semibold transition-all duration-200',
                  selected
                    ? 'border-brand-500/70 bg-brand-500/15 text-brand-300'
                    : 'border-white/12 bg-dark-700/50 text-white/55 hover:border-white/25 hover:text-white/80',
                ].join(' ')}
              >
                {issue}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Free text */}
      <div className="mb-6">
        <p className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-2">
          O describe con detalle
        </p>
        <textarea
          value={injuries}
          onChange={e => setInjuries(e.target.value)}
          placeholder="Ej: Tengo dolor crónico en la rodilla derecha al hacer sentadillas profundas..."
          className="input-base resize-none h-28"
          maxLength={300}
        />
        <p className="text-right text-xs text-white/20 mt-1">{injuries.length}/300</p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleContinue}
          className="btn-secondary flex-1"
        >
          No tengo lesiones
        </button>
        <button
          onClick={handleContinue}
          disabled={!injuries.trim()}
          className="btn-primary flex-1 disabled:opacity-40"
        >
          Continuar
        </button>
      </div>
    </StepWrapper>
  )
}
