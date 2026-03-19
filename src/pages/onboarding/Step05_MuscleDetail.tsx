import { motion } from 'framer-motion'
import { StepWrapper } from '../../components/ui/StepWrapper'
import { useOnboardingStore } from '../../store/onboarding'
import type { UpperBodyDetailWeights, LowerBodyDetailWeights, CoreDetailWeights } from '../../types'

interface Props {
  onNext: () => void
}

const UPPER_MUSCLES: { id: keyof UpperBodyDetailWeights; label: string; image: string }[] = [
  { id: 'chest',     label: 'Pecho',     image: 'https://images.unsplash.com/photo-1534368420009-621bfab424a8?w=400&q=75&fit=crop' },
  { id: 'back',      label: 'Espalda',   image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&q=75&fit=crop' },
  { id: 'shoulders', label: 'Hombros',   image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&q=75&fit=crop' },
  { id: 'biceps',    label: 'Bíceps',    image: 'https://images.unsplash.com/photo-1583454155184-870a1f63aebc?w=400&q=75&fit=crop' },
  { id: 'triceps',   label: 'Tríceps',   image: 'https://images.unsplash.com/photo-1516481157630-05bc0aeb8b19?w=400&q=75&fit=crop' },
  { id: 'forearms',  label: 'Antebrazos', image: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a78?w=400&q=75&fit=crop' },
]

const LOWER_MUSCLES: { id: keyof LowerBodyDetailWeights; label: string; image: string }[] = [
  { id: 'quads',      label: 'Cuádriceps',     image: 'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=400&q=75&fit=crop' },
  { id: 'hamstrings', label: 'Isquiotibiales', image: 'https://images.unsplash.com/photo-1581009137042-c552e485697a?w=400&q=75&fit=crop' },
  { id: 'glutes',     label: 'Glúteos',        image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&q=75&fit=crop' },
  { id: 'calves',     label: 'Pantorrillas',   image: 'https://images.unsplash.com/photo-1520334363367-7e01bc1bd2e4?w=400&q=75&fit=crop' },
]

const CORE_MUSCLES: { id: keyof CoreDetailWeights; label: string; image: string }[] = [
  { id: 'abs',       label: 'Abdominales', image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&q=75&fit=crop' },
  { id: 'obliques',  label: 'Oblicuos',    image: 'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=400&q=75&fit=crop' },
  { id: 'lowerBack', label: 'Lumbar',      image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=75&fit=crop' },
]

function MuscleGrid<T extends string>({
  title,
  muscles,
  selected,
  onToggle,
  delay = 0,
}: {
  title: string
  muscles: { id: T; label: string; image: string }[]
  selected: T[]
  onToggle: (id: T) => void
  delay?: number
}) {
  return (
    <div className="mb-8">
      <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-3">{title}</h3>
      <div className="grid grid-cols-3 gap-2.5">
        {muscles.map((m, i) => {
          const isSelected = selected.includes(m.id)
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: delay + i * 0.05, duration: 0.3 }}
              onClick={() => onToggle(m.id)}
              className={[
                'relative overflow-hidden rounded-xl border-2 transition-all duration-250 cursor-pointer active:scale-95',
                isSelected
                  ? 'border-brand-500/80 shadow-glow-sm-red'
                  : 'border-white/8 hover:border-white/20',
              ].join(' ')}
            >
              <div className="aspect-square overflow-hidden">
                <img
                  src={m.image}
                  alt={m.label}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-900/90 to-transparent" />
              </div>

              {/* Check */}
              {isSelected && (
                <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}

              <div className="absolute bottom-0 inset-x-0 p-2">
                <p className={`text-center text-xs font-bold leading-tight ${isSelected ? 'text-white' : 'text-white/65'}`}>
                  {m.label}
                </p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

export function Step05_MuscleDetail({ onNext }: Props) {
  const {
    selectedAreas,
    upperBodyFocus, toggleUpperBodyFocus,
    lowerBodyFocus, toggleLowerBodyFocus,
    coreFocus,      toggleCoreFocus,
    nextStep,
  } = useOnboardingStore()

  const hasUpper = selectedAreas.includes('upperBody')
  const hasLower = selectedAreas.includes('lowerBody')
  const hasCore  = selectedAreas.includes('core')

  const totalSelected = upperBodyFocus.length + lowerBodyFocus.length + coreFocus.length

  const handleContinue = () => {
    nextStep()
    onNext()
  }

  return (
    <StepWrapper
      title="¿Cuáles son tus músculos prioritarios?"
      subtitle="Selecciona los músculos específicos que más quieres desarrollar. Puedes elegir varios."
    >
      {hasUpper && (
        <MuscleGrid
          title="Tren Superior"
          muscles={UPPER_MUSCLES}
          selected={upperBodyFocus}
          onToggle={toggleUpperBodyFocus}
          delay={0}
        />
      )}

      {hasLower && (
        <MuscleGrid
          title="Tren Inferior"
          muscles={LOWER_MUSCLES}
          selected={lowerBodyFocus}
          onToggle={toggleLowerBodyFocus}
          delay={0.1}
        />
      )}

      {hasCore && (
        <MuscleGrid
          title="Core"
          muscles={CORE_MUSCLES}
          selected={coreFocus}
          onToggle={toggleCoreFocus}
          delay={0.2}
        />
      )}

      {/* Info note */}
      <div className="glass rounded-2xl p-4 mb-6">
        <p className="text-white/40 text-xs leading-relaxed">
          Los músculos seleccionados recibirán más volumen y ejercicios de aislamiento en tu rutina. Si no seleccionas ninguno, el algoritmo distribuirá equitativamente según tus áreas prioritarias.
        </p>
      </div>

      <button
        onClick={handleContinue}
        className="btn-primary w-full"
      >
        {totalSelected > 0
          ? `Continuar con ${totalSelected} músculo${totalSelected > 1 ? 's' : ''} seleccionado${totalSelected > 1 ? 's' : ''}`
          : 'Continuar sin especificar'}
      </button>
    </StepWrapper>
  )
}
