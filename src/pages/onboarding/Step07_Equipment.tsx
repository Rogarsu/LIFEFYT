import { motion } from 'framer-motion'
import { StepWrapper } from '../../components/ui/StepWrapper'
import { useOnboardingStore } from '../../store/onboarding'
import type { EquipmentType } from '../../types'

interface Props {
  onNext: () => void
}

const EQUIPMENT: {
  id:          EquipmentType
  title:       string
  subtitle:    string
  description: string
  image:       string
  items:       string[]
}[] = [
  {
    id:          'full_gym',
    title:       'Gimnasio Completo',
    subtitle:    'Acceso total',
    description: 'Tienes acceso a barras, mancuernas, máquinas, poleas y todo el equipo de un gimnasio comercial.',
    image:       'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=700&q=80&fit=crop',
    items:       ['Barras olímpicas', 'Mancuernas', 'Máquinas', 'Poleas', 'Banco'],
  },
  {
    id:          'home_gym',
    title:       'Gimnasio en Casa',
    subtitle:    'Equipo básico',
    description: 'Tienes mancuernas, una barra de dominadas, y quizás un banco o kettlebells en casa.',
    image:       'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=700&q=80&fit=crop',
    items:       ['Mancuernas', 'Barra dominadas', 'Banco (opcional)', 'Kettlebells'],
  },
  {
    id:          'bodyweight',
    title:       'Solo Peso Corporal',
    subtitle:    'Sin equipo',
    description: 'Entrenas usando únicamente tu propio peso. Flexiones, sentadillas, fondos y dominadas.',
    image:       'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=700&q=80&fit=crop',
    items:       ['Flexiones', 'Sentadillas', 'Fondos', 'Dominadas (barra)'],
  },
]

export function Step07_Equipment({ onNext }: Props) {
  const { equipment, setEquipment, nextStep } = useOnboardingStore()

  const handleSelect = (id: EquipmentType) => {
    setEquipment(id)
    setTimeout(() => { nextStep(); onNext() }, 300)
  }

  return (
    <StepWrapper
      title="¿Dónde entrenas?"
      subtitle="Esto determina qué ejercicios incluiremos en tu rutina."
    >
      <div className="flex flex-col gap-4">
        {EQUIPMENT.map((eq, i) => (
          <motion.div
            key={eq.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.35 }}
            onClick={() => handleSelect(eq.id)}
            className={[
              'relative overflow-hidden rounded-2xl border-2 transition-all duration-300 cursor-pointer active:scale-[0.98]',
              equipment === eq.id
                ? 'border-brand-500/80 shadow-glow-sm-red'
                : 'border-white/10 hover:border-white/25',
            ].join(' ')}
          >
            {/* Image */}
            <div className="relative h-36 overflow-hidden">
              <img
                src={eq.image}
                alt={eq.title}
                loading="lazy"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-dark-900/90 via-dark-900/60 to-transparent" />

              {/* Selected */}
              {equipment === eq.id && (
                <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center shadow-glow-sm-red">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}

              <div className="absolute inset-0 flex flex-col justify-center px-5">
                <p className="text-xs font-bold text-brand-400 uppercase tracking-widest mb-1">
                  {eq.subtitle}
                </p>
                <h3 className="text-white font-black text-xl">{eq.title}</h3>
                <p className="text-white/55 text-sm mt-1 max-w-[70%]">{eq.description}</p>
              </div>
            </div>

            {/* Equipment chips */}
            <div className="px-4 py-3 bg-dark-800/90 flex flex-wrap gap-1.5">
              {eq.items.map(item => (
                <span key={item} className="glass px-2.5 py-1 rounded-lg text-xs text-white/60 font-medium">
                  {item}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </StepWrapper>
  )
}
