import { motion } from 'framer-motion'
import { StepWrapper } from '../../components/ui/StepWrapper'
import { useOnboardingStore } from '../../store/onboarding'
import type { DaysPerWeek, SessionDuration } from '../../types'

interface Props {
  onNext: () => void
}

const DAYS: { value: DaysPerWeek; label: string; desc: string }[] = [
  { value: 3, label: '3 días', desc: 'Full Body' },
  { value: 4, label: '4 días', desc: 'Upper/Lower' },
  { value: 5, label: '5 días', desc: 'Push/Pull/Legs+' },
  { value: 6, label: '6 días', desc: 'PPL completo' },
]

const DURATIONS: { value: SessionDuration; label: string; desc: string; icon: string }[] = [
  { value: 45, label: '45 min',  desc: 'Sesión rápida e intensa',     icon: '⚡' },
  { value: 60, label: '1 hora',  desc: 'Balance perfecto',            icon: '🎯' },
  { value: 90, label: '90 min',  desc: 'Sesión completa sin prisa',   icon: '💪' },
]

export function Step08_Schedule({ onNext }: Props) {
  const { daysPerWeek, sessionDuration, setDaysPerWeek, setSessionDuration, nextStep } = useOnboardingStore()

  const handleContinue = () => {
    if (!daysPerWeek || !sessionDuration) return
    nextStep()
    onNext()
  }

  return (
    <StepWrapper
      title="¿Cuánto tiempo tienes?"
      subtitle="Define tu disponibilidad semanal y la duración de cada sesión."
    >
      {/* Days per week */}
      <div className="mb-8">
        <h3 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-4">
          Días por semana
        </h3>

        <div className="relative h-36 rounded-2xl overflow-hidden mb-4">
          <img
            src="https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=700&q=80&fit=crop"
            alt="Schedule"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-dark-900/75" />
          <div className="absolute inset-0 flex items-center justify-center">
            {daysPerWeek ? (
              <div className="text-center">
                <p className="text-6xl font-black text-brand-400">{daysPerWeek}</p>
                <p className="text-white/60 text-sm font-semibold">días a la semana</p>
              </div>
            ) : (
              <p className="text-white/30 text-sm">Selecciona abajo</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {DAYS.map((day, i) => (
            <motion.button
              key={day.value}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              whileTap={{ scale: 0.93 }}
              onClick={() => setDaysPerWeek(day.value)}
              className={[
                'flex flex-col items-center py-3 px-2 rounded-xl border-2 transition-all duration-250',
                daysPerWeek === day.value
                  ? 'border-brand-500/80 bg-brand-500/15 shadow-glow-sm-red'
                  : 'border-white/10 bg-dark-700/50 hover:border-white/20',
              ].join(' ')}
            >
              <span className={`text-xl font-black ${daysPerWeek === day.value ? 'text-brand-400' : 'text-white'}`}>
                {day.value}
              </span>
              <span className="text-white/40 text-[10px] font-semibold mt-0.5">{day.desc}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Session duration */}
      <div className="mb-8">
        <h3 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-4">
          Duración por sesión
        </h3>

        <div className="flex flex-col gap-3">
          {DURATIONS.map((dur, i) => (
            <motion.button
              key={dur.value}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.08 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setSessionDuration(dur.value)}
              className={[
                'flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-250 text-left',
                sessionDuration === dur.value
                  ? 'border-brand-500/80 bg-brand-500/10 shadow-glow-sm-red'
                  : 'border-white/10 bg-dark-700/50 hover:border-white/20',
              ].join(' ')}
            >
              <span className="text-2xl">{dur.icon}</span>
              <div className="flex-1">
                <p className={`font-black text-lg ${sessionDuration === dur.value ? 'text-white' : 'text-white/80'}`}>
                  {dur.label}
                </p>
                <p className="text-white/45 text-sm">{dur.desc}</p>
              </div>
              <div className={[
                'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
                sessionDuration === dur.value ? 'border-brand-500 bg-brand-500' : 'border-white/25',
              ].join(' ')}>
                {sessionDuration === dur.value && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <button
        onClick={handleContinue}
        disabled={!daysPerWeek || !sessionDuration}
        className="btn-primary w-full"
      >
        Continuar
      </button>
    </StepWrapper>
  )
}
