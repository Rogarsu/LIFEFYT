import { motion } from 'framer-motion'
import { StepWrapper } from '../../components/ui/StepWrapper'
import { useOnboardingStore } from '../../store/onboarding'
import { MUSCLE_AREAS } from '../../constants/goals'

interface Props {
  onNext: () => void
}

const PRIORITY_LABELS = ['Prioridad Alta', 'Prioridad Media', 'Prioridad Baja']
const PRIORITY_COLORS = ['text-brand-400', 'text-yellow-400', 'text-electric-400']

export function Step04_MuscleAreas({ onNext }: Props) {
  const { selectedAreas, toggleArea, nextStep } = useOnboardingStore()

  const handleContinue = () => {
    if (selectedAreas.length === 0) return
    nextStep()
    onNext()
  }

  return (
    <StepWrapper
      title="¿Qué quieres desarrollar?"
      subtitle="Selecciona una o más áreas. El orden importa — arrastra para cambiar prioridad."
    >
      {/* Selection grid */}
      <div className="flex flex-col gap-4 mb-8">
        {MUSCLE_AREAS.map((area, i) => {
          const isSelected = selectedAreas.includes(area.id)
          const priorityIdx = selectedAreas.indexOf(area.id)

          return (
            <motion.div
              key={area.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.35 }}
              onClick={() => toggleArea(area.id)}
              className={[
                'relative overflow-hidden rounded-2xl border-2 transition-all duration-300 cursor-pointer active:scale-[0.98]',
                isSelected
                  ? 'border-brand-500/70 shadow-glow-sm-red'
                  : 'border-white/10 hover:border-white/25',
              ].join(' ')}
            >
              <div className="relative h-40 overflow-hidden">
                <img
                  src={area.image}
                  alt={area.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500"
                  style={{ transform: isSelected ? 'scale(1.05)' : 'scale(1)' }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-dark-900/90 via-dark-900/50 to-dark-900/20" />

                {/* Priority badge */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute top-3 left-3"
                  >
                    <div className="glass px-3 py-1 rounded-full flex items-center gap-1.5">
                      <span className={`text-xs font-black ${PRIORITY_COLORS[priorityIdx] ?? 'text-white'}`}>
                        #{priorityIdx + 1}
                      </span>
                      <span className={`text-xs font-semibold ${PRIORITY_COLORS[priorityIdx] ?? 'text-white'}`}>
                        {PRIORITY_LABELS[priorityIdx] ?? 'Seleccionado'}
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Check */}
                <div className={[
                  'absolute top-3 right-3 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-300',
                  isSelected
                    ? 'bg-brand-500 border-brand-400 shadow-glow-sm-red'
                    : 'border-white/30 bg-white/5',
                ].join(' ')}>
                  {isSelected && (
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>

                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-end p-4">
                  <h3 className="text-white font-black text-xl leading-tight">{area.title}</h3>
                  <p className="text-white/60 text-xs mt-1">{area.subtitle}</p>

                  {/* Muscle chips */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {area.muscles.map(m => (
                      <span key={m} className="glass px-2 py-0.5 rounded-full text-xs text-white/70 font-medium">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Priority order display */}
      {selectedAreas.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 glass rounded-2xl p-4"
        >
          <p className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-3">
            Orden de prioridad
          </p>
          <div className="flex flex-col gap-2">
            {selectedAreas.map((areaId, idx) => {
              const area = MUSCLE_AREAS.find(a => a.id === areaId)!
              return (
                <div key={areaId} className="flex items-center gap-3">
                  <span className={`text-sm font-black w-5 ${PRIORITY_COLORS[idx]}`}>
                    {idx + 1}
                  </span>
                  <div className="flex-1 h-8 rounded-xl bg-dark-600/60 flex items-center px-3">
                    <span className="text-white/80 text-sm font-semibold">{area.title}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {idx > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          // Swap with previous
                          const arr = [...selectedAreas]
                          ;[arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]]
                          useOnboardingStore.setState({ selectedAreas: arr })
                        }}
                        className="w-6 h-6 rounded-lg bg-white/8 hover:bg-white/15 flex items-center justify-center transition-colors"
                      >
                        <svg className="w-3 h-3 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                    )}
                    {idx < selectedAreas.length - 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          const arr = [...selectedAreas]
                          ;[arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]]
                          useOnboardingStore.setState({ selectedAreas: arr })
                        }}
                        className="w-6 h-6 rounded-lg bg-white/8 hover:bg-white/15 flex items-center justify-center transition-colors"
                      >
                        <svg className="w-3 h-3 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          <p className="text-white/25 text-xs mt-3">
            Las áreas con mayor prioridad recibirán más ejercicios en tu rutina.
          </p>
        </motion.div>
      )}

      {/* CTA */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleContinue}
        disabled={selectedAreas.length === 0}
        className="btn-primary w-full"
      >
        Continuar
        {selectedAreas.length > 0 && (
          <span className="ml-1 opacity-70">
            ({selectedAreas.length} seleccionada{selectedAreas.length > 1 ? 's' : ''})
          </span>
        )}
      </motion.button>
    </StepWrapper>
  )
}
