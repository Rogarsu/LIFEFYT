import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RestTimer } from '../../components/ui/RestTimer'
import type { WorkoutExercise } from '../../types'

interface Props {
  workoutExercise: WorkoutExercise
  index:           number
  total:           number
  onClose:         () => void
  onPrev?:         () => void
  onNext?:         () => void
}

const DIFFICULTY_LABEL = ['', 'Principiante', 'Intermedio', 'Avanzado']
const DIFFICULTY_COLOR = ['', 'text-green-400', 'text-yellow-400', 'text-brand-400']
const TYPE_LABEL: Record<string, string> = {
  compound:  'Compuesto',
  isolation: 'Aislamiento',
}

export function ExerciseDetailModal({ workoutExercise, index, total, onClose, onPrev, onNext }: Props) {
  const { exercise, sets, reps, rest } = workoutExercise
  const [showTimer, setShowTimer] = useState(false)
  const [activeSet, setActiveSet] = useState(0)
  const totalSets = parseInt(sets.split('-')[0]) || 3

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-dark-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 35 }}
        className="fixed inset-x-0 bottom-0 z-40 max-w-md mx-auto bg-dark-800 rounded-t-3xl overflow-hidden"
        style={{ maxHeight: '92dvh' }}
      >
        <div className="overflow-y-auto no-scrollbar" style={{ maxHeight: '92dvh' }}>
          {/* Hero image */}
          <div className="relative h-64 flex-shrink-0">
            <img
              src={exercise.image}
              alt={exercise.nameEs}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-dark-800 via-dark-800/20 to-transparent" />

            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-9 h-9 rounded-full glass flex items-center justify-center"
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Nav counter */}
            <div className="absolute top-4 left-4 glass px-3 py-1.5 rounded-full">
              <span className="text-white/70 text-xs font-bold tabular-nums">
                {index + 1} / {total}
              </span>
            </div>

            {/* Bottom info */}
            <div className="absolute bottom-0 inset-x-0 px-5 pb-4">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-xs font-bold uppercase tracking-wider ${DIFFICULTY_COLOR[exercise.difficulty]}`}>
                  {DIFFICULTY_LABEL[exercise.difficulty]}
                </span>
                <span className="text-white/20 text-xs">·</span>
                <span className="text-white/40 text-xs font-semibold">{TYPE_LABEL[exercise.type]}</span>
              </div>
              <h2 className="text-white font-black text-2xl leading-tight">{exercise.nameEs}</h2>
              <p className="text-white/40 text-sm">{exercise.name}</p>
            </div>
          </div>

          <div className="px-5 pb-32">
            {/* Muscles */}
            <div className="mt-5 mb-5">
              <p className="text-xs text-white/40 font-bold uppercase tracking-wider mb-2.5">Músculos</p>
              <div className="flex flex-wrap gap-2">
                {exercise.primaryMuscles.map(m => (
                  <span key={m} className="px-3 py-1 rounded-full bg-brand-500/20 border border-brand-500/30 text-brand-300 text-xs font-bold capitalize">
                    {m}
                  </span>
                ))}
                {exercise.secondaryMuscles.map(m => (
                  <span key={m} className="px-3 py-1 rounded-full glass text-white/50 text-xs font-medium capitalize">
                    {m}
                  </span>
                ))}
              </div>
            </div>

            {/* Sets tracker */}
            <div className="glass rounded-2xl p-4 mb-5">
              <p className="text-xs text-white/40 font-bold uppercase tracking-wider mb-3">
                Series de hoy
              </p>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {Array.from({ length: totalSets }).map((_, i) => (
                  <motion.button
                    key={i}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setActiveSet(i)}
                    className={[
                      'py-3 rounded-xl border-2 flex flex-col items-center gap-0.5 transition-all duration-200',
                      i < activeSet
                        ? 'border-brand-500/60 bg-brand-500/15'
                        : i === activeSet
                          ? 'border-brand-500 bg-brand-500/20 shadow-glow-sm-red'
                          : 'border-white/10 bg-dark-700/50',
                    ].join(' ')}
                  >
                    {i < activeSet ? (
                      <svg className="w-4 h-4 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className={`text-sm font-black ${i === activeSet ? 'text-white' : 'text-white/30'}`}>
                        {i + 1}
                      </span>
                    )}
                    <span className="text-[10px] font-semibold text-white/30">
                      {i < activeSet ? 'Hecho' : i === activeSet ? 'Actual' : 'Pendiente'}
                    </span>
                  </motion.button>
                ))}
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Series', value: sets },
                  { label: 'Reps',   value: reps },
                  { label: 'Descanso', value: `${rest}s` },
                ].map(s => (
                  <div key={s.label} className="bg-dark-700/60 rounded-xl p-3 text-center">
                    <p className="text-brand-400 font-black text-lg tabular-nums">{s.value}</p>
                    <p className="text-white/30 text-[11px] font-semibold">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Instructions */}
            <div className="mb-5">
              <p className="text-xs text-white/40 font-bold uppercase tracking-wider mb-3">
                Instrucciones
              </p>
              <div className="flex flex-col gap-3">
                {exercise.instructions.map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="flex gap-3"
                  >
                    <div className="w-6 h-6 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-brand-400 text-xs font-black">{i + 1}</span>
                    </div>
                    <p className="text-white/70 text-sm leading-relaxed flex-1">{step}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Equipment */}
            <div className="glass rounded-2xl p-4 mb-5">
              <p className="text-xs text-white/40 font-bold uppercase tracking-wider mb-2.5">Equipo</p>
              <div className="flex flex-wrap gap-2">
                {exercise.equipment.map(eq => (
                  <span key={eq} className="glass px-3 py-1 rounded-full text-xs font-semibold text-white/60 capitalize">
                    {eq.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Fixed bottom CTA */}
        <div className="absolute bottom-0 inset-x-0 px-5 pb-8 pt-4 bg-gradient-to-t from-dark-800 to-transparent">
          <div className="flex gap-3">
            {onPrev && (
              <button onClick={onPrev} className="btn-secondary px-5">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <button
              onClick={() => setShowTimer(true)}
              className="btn-primary flex-1"
            >
              Iniciar descanso ({rest}s)
            </button>
            {onNext && (
              <button onClick={onNext} className="btn-secondary px-5">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showTimer && (
          <RestTimer
            seconds={rest}
            onDone={() => {
              setShowTimer(false)
              if (activeSet < totalSets - 1) setActiveSet(s => s + 1)
            }}
            onDismiss={() => setShowTimer(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
