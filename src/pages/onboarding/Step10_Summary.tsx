import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useOnboardingStore } from '../../store/onboarding'
import { useAuthStore } from '../../store/auth'
import { buildWeightMap, generateRoutine, SPLIT_NAMES } from '../../lib/weightEngine'
import { saveUserGoal, saveRoutine, markOnboardingComplete, updateProfile } from '../../lib/database'
import type { GeneratedRoutine } from '../../types'

interface Props {
  onFinish: () => void
}

const AREA_NAMES: Record<string, string> = {
  upperBody: 'Tren Superior',
  lowerBody: 'Tren Inferior',
  core:      'Core',
}

const EXP_NAMES: Record<string, string> = {
  beginner:     'Principiante',
  intermediate: 'Intermedio',
  advanced:     'Avanzado',
}

const EQ_NAMES: Record<string, string> = {
  full_gym:   'Gimnasio Completo',
  home_gym:   'Gimnasio en Casa',
  bodyweight: 'Peso Corporal',
}

export function Step10_Summary({ onFinish }: Props) {
  const state      = useOnboardingStore()
  const { user, refreshProfile } = useAuthStore()
  const [routine, setRoutine]   = useState<GeneratedRoutine | null>(null)
  const [generating, setGenerating] = useState(true)
  const [saving, setSaving]         = useState(false)
  const [activeDay, setActiveDay]   = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const weightMap = buildWeightMap(state)
        state.setWeightMap(weightMap)
        const generated = generateRoutine(weightMap)
        setRoutine(generated)
      } catch (e) {
        console.error('Error generating routine:', e)
      } finally {
        setGenerating(false)
      }
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  const [saveError, setSaveError] = useState<string | null>(null)

  const handleFinish = async () => {
    if (!user || !routine) { onFinish(); return }
    setSaving(true)
    setSaveError(null)

    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT')), 15000)
    )

    const save = async () => {
      // 1. Profile basics
      if (state.profile.fullName) {
        const profileUpdates: Record<string, unknown> = {
          full_name: state.profile.fullName,
          age:       state.profile.age     || null,
          weight_kg: state.profile.weightKg || null,
          height_cm: state.profile.heightCm || null,
        }
        if (state.profile.gender) {
          profileUpdates.gender = state.profile.gender as string
        }
        console.log('[Onboarding] Saving profile...')
        const { error: profileError } = await updateProfile(user.id, profileUpdates)
        if (profileError) console.error('[Onboarding] Profile save failed:', profileError)
        else console.log('[Onboarding] Profile saved.')
      }

      // 2. Goal
      console.log('[Onboarding] Saving goal...')
      const { data: goalData, error: goalError } = await saveUserGoal(user.id, state)
      if (goalError) console.error('[Onboarding] Goal save failed:', goalError)
      else console.log('[Onboarding] Goal saved:', goalData?.id)

      // 3. Routine
      if (goalData) {
        console.log('[Onboarding] Saving routine...')
        const { error: routineError } = await saveRoutine(user.id, goalData.id, routine)
        if (routineError) console.error('[Onboarding] Routine save failed:', routineError)
        else console.log('[Onboarding] Routine saved.')
      }

      // 4. Mark complete
      console.log('[Onboarding] Marking onboarding complete...')
      await markOnboardingComplete(user.id)
      console.log('[Onboarding] Done. Refreshing profile...')

      // 5. Refresh auth
      await refreshProfile()
      console.log('[Onboarding] Profile refreshed.')
    }

    try {
      await Promise.race([save(), timeout])
      setSaving(false)
      onFinish()
    } catch (e) {
      const msg = e instanceof Error && e.message === 'TIMEOUT'
        ? 'La conexión tardó demasiado. Revisa tu internet e inténtalo de nuevo.'
        : 'Hubo un error al guardar. Inténtalo de nuevo.'
      console.error('[Onboarding] Save failed:', e)
      setSaving(false)
      setSaveError(msg)
    }
  }

  if (generating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh bg-dark-900 px-6">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-hero-glow opacity-60" />
        </div>

        <div className="relative text-center">
          {/* Pulsing orb */}
          <div className="relative w-32 h-32 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full bg-brand-500/20 animate-ping" />
            <div className="absolute inset-3 rounded-full bg-brand-500/30 animate-pulse" />
            <div className="absolute inset-6 rounded-full bg-brand-500 flex items-center justify-center">
              <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          </div>

          <h2 className="text-2xl font-black text-white mb-3">
            Analizando tu perfil...
          </h2>
          <p className="text-white/50 text-base max-w-xs mx-auto leading-relaxed">
            El algoritmo está calculando los pesos y generando tu rutina perfecta.
          </p>

          <div className="mt-8 flex flex-col gap-2 text-left max-w-xs mx-auto">
            {[
              'Calculando pesos de grupos musculares...',
              'Evaluando ejercicios compatibles...',
              'Optimizando volumen e intensidad...',
              'Construyendo tu rutina personalizada...',
            ].map((text, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.4 }}
                className="flex items-center gap-2.5"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0" />
                <p className="text-white/40 text-sm">{text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!routine) return null

  const { weightMap } = routine
  const priorityColor = ['text-brand-400', 'text-yellow-400', 'text-electric-400']

  return (
    <div className="flex flex-col min-h-dvh bg-dark-900 safe-top safe-bottom">
      {/* Hero */}
      <div className="relative h-56 overflow-hidden flex-shrink-0">
        <img
          src="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&q=85&fit=crop"
          alt="Routine"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-dark-900/50 to-dark-900" />
        <div className="absolute inset-0 bg-hero-glow" />

        <div className="absolute bottom-0 inset-x-0 px-5 pb-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-xs font-bold text-brand-400 uppercase tracking-widest mb-1">
              Tu rutina está lista
            </p>
            <h1 className="text-3xl font-black text-white leading-tight">
              {SPLIT_NAMES[routine.split]}
            </h1>
          </motion.div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-24">
        {/* Weight map summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-4 mb-6 mt-4"
        >
          <p className="text-xs text-white/40 font-bold uppercase tracking-wider mb-3">
            Tu perfil de entrenamiento
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-white/30 mb-1">Nivel</p>
              <p className="text-white font-bold text-sm">{EXP_NAMES[weightMap.experience]}</p>
            </div>
            <div>
              <p className="text-xs text-white/30 mb-1">Equipo</p>
              <p className="text-white font-bold text-sm">{EQ_NAMES[weightMap.equipment]}</p>
            </div>
            <div>
              <p className="text-xs text-white/30 mb-1">Días / semana</p>
              <p className="text-white font-bold text-sm">{weightMap.daysPerWeek} días</p>
            </div>
            <div>
              <p className="text-xs text-white/30 mb-1">Duración</p>
              <p className="text-white font-bold text-sm">{weightMap.sessionDuration} min</p>
            </div>
          </div>

          {/* Priority areas */}
          {state.selectedAreas.length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/8">
              <p className="text-xs text-white/30 mb-2">Áreas por prioridad</p>
              <div className="flex gap-2 flex-wrap">
                {state.selectedAreas.map((area, idx) => (
                  <span
                    key={area}
                    className={`px-2.5 py-1 rounded-full text-xs font-bold glass ${priorityColor[idx] ?? 'text-white'}`}
                  >
                    #{idx + 1} {AREA_NAMES[area]}
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Week overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <p className="text-xs text-white/40 font-bold uppercase tracking-wider mb-3">
            Plan Semanal
          </p>

          {/* Day selector */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-4">
            {routine.weekDays.map((day, i) => (
              <button
                key={i}
                onClick={() => setActiveDay(i)}
                className={[
                  'flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200',
                  activeDay === i
                    ? 'bg-brand-500 text-white shadow-glow-sm-red'
                    : 'glass text-white/50 hover:text-white',
                ].join(' ')}
              >
                Día {day.dayNumber}
              </button>
            ))}
          </div>

          {/* Active day */}
          <AnimatePresence mode="wait">
            {routine.weekDays[activeDay] && (
              <motion.div
                key={activeDay}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                {/* Day header */}
                <div className="glass-dark rounded-2xl overflow-hidden mb-3">
                  <div className="relative h-24 overflow-hidden">
                    <img
                      src={routine.weekDays[activeDay].exercises[0]?.exercise.image ?? ''}
                      alt={routine.weekDays[activeDay].focus}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-dark-900/90 to-dark-900/40" />
                    <div className="absolute inset-0 px-4 flex flex-col justify-center">
                      <h3 className="text-white font-black text-lg">{routine.weekDays[activeDay].name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="glass px-2.5 py-0.5 rounded-full text-xs text-brand-400 font-semibold">
                          {routine.weekDays[activeDay].focus}
                        </span>
                        <span className="text-white/40 text-xs">
                          ~{routine.weekDays[activeDay].totalTime} min
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Exercises list */}
                  <div className="divide-y divide-white/5">
                    {routine.weekDays[activeDay].exercises.map((ex, j) => (
                      <motion.div
                        key={ex.exercise.id}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: j * 0.05 }}
                        className="flex items-center gap-3 p-3"
                      >
                        {/* Exercise thumbnail */}
                        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                          <img
                            src={ex.exercise.image}
                            alt={ex.exercise.nameEs}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold text-sm truncate">
                            {ex.exercise.nameEs}
                          </p>
                          <p className="text-white/40 text-xs mt-0.5">
                            {ex.exercise.primaryMuscles.join(', ')}
                          </p>
                        </div>

                        {/* Sets × Reps */}
                        <div className="flex-shrink-0 text-right">
                          <p className="text-brand-400 font-black text-sm tabular-nums">
                            {ex.sets} × {ex.reps}
                          </p>
                          <p className="text-white/30 text-xs">{ex.rest}s descanso</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Bottom CTA — fixed */}
      <div className="fixed bottom-0 inset-x-0 px-5 pb-6 pt-4 bg-gradient-to-t from-dark-900 to-transparent">
        {saveError && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 px-4 py-3 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 text-sm text-center leading-snug"
          >
            {saveError}
          </motion.div>
        )}
        <motion.button
          whileHover={!saving ? { scale: 1.02 } : {}}
          whileTap={!saving ? { scale: 0.97 } : {}}
          onClick={handleFinish}
          disabled={saving}
          className="btn-primary w-full text-lg py-5"
        >
          {saving ? (
            <span className="flex items-center gap-2 justify-center">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Guardando rutina...
            </span>
          ) : saveError ? 'Reintentar' : 'Empezar mi entrenamiento'}
        </motion.button>
      </div>
    </div>
  )
}
