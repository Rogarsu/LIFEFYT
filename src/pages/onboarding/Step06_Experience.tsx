import { motion } from 'framer-motion'
import { StepWrapper } from '../../components/ui/StepWrapper'
import { useOnboardingStore } from '../../store/onboarding'
import type { ExperienceLevel } from '../../types'

interface Props {
  onNext: () => void
}

const LEVELS: {
  id:          ExperienceLevel
  title:       string
  subtitle:    string
  description: string
  image:       string
  color:       string
  tags:        string[]
}[] = [
  {
    id:          'beginner',
    title:       'Principiante',
    subtitle:    '0 – 1 año de entrenamiento',
    description: 'Estás comenzando o llevas poco tiempo entrenando. Aprenderás la técnica correcta y construirás una base sólida.',
    image:       'https://images.unsplash.com/photo-1549476464-37392f717541?w=700&q=80&fit=crop',
    color:       '#22c55e',
    tags:        ['Alta ganancia', 'Técnica', 'Fundamentos'],
  },
  {
    id:          'intermediate',
    title:       'Intermedio',
    subtitle:    '1 – 3 años de entrenamiento',
    description: 'Ya tienes buena técnica y conoces los ejercicios básicos. Es hora de aumentar la intensidad.',
    image:       'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=700&q=80&fit=crop',
    color:       '#f59e0b',
    tags:        ['Volumen', 'Progresión', 'Consistencia'],
  },
  {
    id:          'advanced',
    title:       'Avanzado',
    subtitle:    '3+ años de entrenamiento',
    description: 'Tienes dominio de los movimientos y necesitas técnicas avanzadas para seguir progresando.',
    image:       'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=700&q=80&fit=crop',
    color:       '#ff3120',
    tags:        ['Alta intensidad', 'Periodización', 'Técnicas avanzadas'],
  },
]

export function Step06_Experience({ onNext }: Props) {
  const { experience, setExperience, nextStep } = useOnboardingStore()

  const handleSelect = (id: ExperienceLevel) => {
    setExperience(id)
    setTimeout(() => { nextStep(); onNext() }, 300)
  }

  return (
    <StepWrapper
      title="¿Cuál es tu nivel?"
      subtitle="Sé honesto — esto determina el volumen, la intensidad y los ejercicios de tu rutina."
    >
      <div className="flex flex-col gap-4">
        {LEVELS.map((level, i) => (
          <motion.div
            key={level.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1, duration: 0.35 }}
            onClick={() => handleSelect(level.id)}
            className={[
              'relative overflow-hidden rounded-2xl border-2 transition-all duration-300 cursor-pointer active:scale-[0.98]',
              experience === level.id
                ? 'border-brand-500/80 shadow-glow-sm-red'
                : 'border-white/10 hover:border-white/25',
            ].join(' ')}
          >
            <div className="flex">
              {/* Image strip */}
              <div className="w-28 flex-shrink-0 relative overflow-hidden">
                <img
                  src={level.image}
                  alt={level.title}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-dark-800/90" />
              </div>

              {/* Content */}
              <div className="flex-1 p-4 bg-dark-800/80">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest mb-0.5"
                       style={{ color: level.color }}>
                      {level.subtitle}
                    </p>
                    <h3 className="text-white font-black text-xl">{level.title}</h3>
                    <p className="text-white/50 text-sm mt-1.5 leading-relaxed">
                      {level.description}
                    </p>
                  </div>

                  {/* Radio */}
                  <div className={[
                    'w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-300',
                    experience === level.id
                      ? 'border-brand-500 bg-brand-500'
                      : 'border-white/25',
                  ].join(' ')}>
                    {experience === level.id && (
                      <div className="w-2.5 h-2.5 rounded-full bg-white" />
                    )}
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {level.tags.map(tag => (
                    <span key={tag}
                      className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                      style={{ background: `${level.color}20`, color: level.color }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </StepWrapper>
  )
}
