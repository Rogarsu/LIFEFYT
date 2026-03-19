import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSessionStore } from '../../store/session'
import { useAuthStore }    from '../../store/auth'
import { saveSession }     from '../../lib/database'
import { RestTimer }       from '../../components/ui/RestTimer'
import type { CompletedSession } from '../../types'

interface Props {
  onClose:    () => void
  onComplete: () => void
}

// ─── Number input with +/- buttons ────────────────────────────────────────────
function NumberInput({
  value, onChange, step = 1, min = 0, unit, placeholder,
}: {
  value:       number | null
  onChange:    (v: number) => void
  step?:       number
  min?:        number
  unit?:       string
  placeholder: string
}) {
  const display = value ?? ''
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(Math.max(min, (value ?? 0) - step))}
        className="w-10 h-10 rounded-xl bg-dark-600 flex items-center justify-center text-white/60 hover:text-white hover:bg-dark-500 transition-colors active:scale-90"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
        </svg>
      </button>

      <div className="flex-1 relative">
        <input
          type="number"
          inputMode="decimal"
          value={display}
          onChange={e => {
            const v = parseFloat(e.target.value)
            if (!isNaN(v)) onChange(v)
          }}
          placeholder={placeholder}
          className="w-full text-center py-2.5 bg-dark-700 border border-white/10 rounded-xl text-white font-black text-lg
                     focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20"
        />
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-xs font-semibold">
            {unit}
          </span>
        )}
      </div>

      <button
        onClick={() => onChange((value ?? 0) + step)}
        className="w-10 h-10 rounded-xl bg-dark-600 flex items-center justify-center text-white/60 hover:text-white hover:bg-dark-500 transition-colors active:scale-90"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  )
}

// ─── Exit confirmation ────────────────────────────────────────────────────────
function ExitDialog({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-dark-900/80 backdrop-blur-md px-6"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass-dark rounded-3xl p-6 w-full max-w-sm border border-white/10"
      >
        <h3 className="text-white font-black text-xl mb-2">¿Abandonar sesión?</h3>
        <p className="text-white/50 text-sm mb-6 leading-relaxed">
          El progreso no guardado se perderá. ¿Seguro que quieres salir?
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel}  className="btn-secondary flex-1">Seguir</button>
          <button onClick={onConfirm} className="flex-1 py-4 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400 font-bold hover:bg-red-500/30 transition-colors">
            Salir
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Main WorkoutSession ──────────────────────────────────────────────────────
export function WorkoutSession({ onClose, onComplete }: Props) {
  const { active, logSet, completeSet, goToExercise, goToSet, nextSet, endSession } = useSessionStore()
  const { user }    = useAuthStore()

  const [showTimer,    setShowTimer]    = useState(false)
  const [showExit,     setShowExit]     = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(60)
  const [elapsed,      setElapsed]      = useState(0)
  const [finishing,    setFinishing]    = useState(false)
  const startRef = useRef(Date.now())

  // Elapsed time counter
  useEffect(() => {
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000)
    return () => clearInterval(id)
  }, [])

  if (!active) return null

  const currentEx  = active.exercises[active.currentExerciseIdx]
  const currentSet = currentEx?.sets[active.currentSetIdx]
  const isLastEx   = active.currentExerciseIdx === active.exercises.length - 1

  const totalSets     = active.exercises.reduce((a, e) => a + e.sets.length, 0)
  const completedSets = active.exercises.reduce((a, e) => a + e.sets.filter(s => s.completed).length, 0)
  const progressPct   = Math.round((completedSets / totalSets) * 100)

  const elapsedMin = Math.floor(elapsed / 60)
  const elapsedSec = elapsed % 60
  const elapsedStr = `${String(elapsedMin).padStart(2, '0')}:${String(elapsedSec).padStart(2, '0')}`

  const handleCompleteSet = () => {
    if (!currentSet) return
    completeSet(active.currentExerciseIdx, active.currentSetIdx)
    setTimerSeconds(currentEx.targetRest)
    setShowTimer(true)
  }

  const handleTimerDone = () => {
    setShowTimer(false)
    nextSet()
  }

  const handleFinish = async () => {
    if (!user || finishing) return
    setFinishing(true)

    const completedAt = new Date().toISOString()
    const durationMinutes = Math.round(elapsed / 60)

    let totalVolume = 0
    let totalSetsLogged = 0

    active.exercises.forEach(ex => {
      ex.sets.forEach(s => {
        if (s.completed) {
          totalSetsLogged++
          if (s.weightKg && s.actualReps) {
            totalVolume += s.weightKg * s.actualReps
          }
        }
      })
    })

    const completed: CompletedSession = {
      id:               active.id,
      userId:           user.id,
      routineId:        undefined,
      dayNumber:        active.dayNumber,
      dayName:          active.dayName,
      startedAt:        active.startedAt,
      completedAt,
      durationMinutes,
      exercises:        active.exercises,
      totalSetsLogged,
      totalVolume:      Math.round(totalVolume),
    }

    // Save with 10s timeout — always proceed to completion screen regardless
    try {
      const timeout = new Promise<void>(resolve => setTimeout(resolve, 10000))
      const result = await Promise.race([
        saveSession(user.id, completed),
        timeout.then(() => null),
      ])
      if (result && result.error) {
        console.error('[WorkoutSession] Supabase error saving session:', result.error)
      } else if (!result) {
        console.warn('[WorkoutSession] Save timed out after 10s')
      } else {
        console.log('[WorkoutSession] Session saved OK:', result.data?.id)
      }
    } catch (e) {
      console.error('[WorkoutSession] Save threw:', e)
    }

    onComplete()   // App reads session data before it's cleared
    endSession()   // then clear state (removes the session overlay)
  }

  return (
    <div className="fixed inset-0 z-30 max-w-md mx-auto bg-dark-900 flex flex-col safe-top safe-bottom">
      {/* ── Top bar ──────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 flex-shrink-0">
        <button
          onClick={() => setShowExit(true)}
          className="w-9 h-9 rounded-xl glass flex items-center justify-center text-white/50 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex-1">
          {/* Progress bar */}
          <div className="h-1.5 bg-dark-600 rounded-full overflow-hidden">
            <motion.div
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.4 }}
              className="h-full bg-gradient-to-r from-brand-500 to-electric-400 rounded-full"
            />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-white/30 text-xs tabular-nums">{completedSets}/{totalSets} series</span>
            <span className="text-white/30 text-xs tabular-nums font-mono">{elapsedStr}</span>
          </div>
        </div>

        {/* Finish button (only when some sets done) */}
        {completedSets > 0 && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            onClick={handleFinish}
            disabled={finishing}
            className="px-3 py-2 rounded-xl bg-brand-500/20 border border-brand-500/40 text-brand-400 text-xs font-bold hover:bg-brand-500/30 transition-colors disabled:opacity-60"
          >
            {finishing ? '...' : 'Finalizar'}
          </motion.button>
        )}
      </div>

      {/* ── Exercise tabs ─────────────────────────────────── */}
      <div className="flex gap-1.5 px-4 pb-3 overflow-x-auto no-scrollbar flex-shrink-0">
        {active.exercises.map((ex, i) => {
          const exDone = ex.sets.filter(s => s.completed).length
          const isActive = i === active.currentExerciseIdx
          return (
            <button
              key={ex.exerciseId}
              onClick={() => goToExercise(i)}
              className={[
                'flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200',
                isActive
                  ? 'bg-brand-500 text-white shadow-glow-sm-red'
                  : exDone === ex.sets.length
                    ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                    : exDone > 0
                      ? 'bg-yellow-500/15 border border-yellow-500/30 text-yellow-400'
                      : 'glass text-white/35 hover:text-white/60',
              ].join(' ')}
            >
              {i + 1}. {ex.exerciseName.split(' ').slice(0, 2).join(' ')}
            </button>
          )
        })}
      </div>

      {/* ── Current exercise ──────────────────────────────── */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-4">
        <AnimatePresence mode="wait">
          {currentEx && (
            <motion.div
              key={currentEx.exerciseId}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
            >
              {/* Exercise image */}
              <div className="relative h-44 rounded-2xl overflow-hidden mb-4">
                <img
                  src={currentEx.image}
                  alt={currentEx.exerciseName}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-900/90 via-dark-900/20 to-transparent" />
                <div className="absolute bottom-0 inset-x-0 px-4 pb-4">
                  <h2 className="text-white font-black text-xl leading-tight">{currentEx.exerciseName}</h2>
                  <p className="text-white/50 text-xs mt-0.5">
                    {currentEx.targetSets} series · {currentEx.targetReps} reps · {currentEx.targetRest}s descanso
                  </p>
                </div>
                {/* Exercise position */}
                <div className="absolute top-3 right-3 glass px-2.5 py-1 rounded-full">
                  <span className="text-white/60 text-xs font-bold tabular-nums">
                    {active.currentExerciseIdx + 1}/{active.exercises.length}
                  </span>
                </div>
              </div>

              {/* ── Sets grid ─────────────────────────────── */}
              <div className="mb-4">
                <p className="text-xs text-white/40 font-bold uppercase tracking-wider mb-3">Series</p>
                <div className="grid gap-2">
                  {currentEx.sets.map((s, si) => {
                    const isCurrentSet = si === active.currentSetIdx
                    const isDone = s.completed
                    return (
                      <motion.div
                        key={si}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: si * 0.04 }}
                        onClick={() => !isDone && goToSet(si)}
                        className={[
                          'rounded-2xl border-2 transition-all duration-250',
                          isDone
                            ? 'border-green-500/40 bg-green-500/8'
                            : isCurrentSet
                              ? 'border-brand-500/70 bg-brand-500/10 shadow-glow-sm-red'
                              : 'border-white/8 bg-dark-700/50 opacity-60',
                        ].join(' ')}
                      >
                        <div className="flex items-center gap-3 px-4 py-3">
                          {/* Set badge */}
                          <div className={[
                            'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0',
                            isDone ? 'bg-green-500/20' : isCurrentSet ? 'bg-brand-500/20' : 'bg-dark-600',
                          ].join(' ')}>
                            {isDone ? (
                              <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <span className={`text-xs font-black ${isCurrentSet ? 'text-brand-400' : 'text-white/30'}`}>{si + 1}</span>
                            )}
                          </div>

                          {/* Target */}
                          <div className="flex-1">
                            <p className="text-white/40 text-xs">Objetivo: {currentEx.targetReps} reps</p>
                            {isDone && s.weightKg != null && s.actualReps != null && (
                              <p className="text-green-400 text-sm font-bold">
                                {s.weightKg === 0 ? 'Peso corp.' : `${s.weightKg} kg`} × {s.actualReps} reps
                              </p>
                            )}
                          </div>

                          {/* Volume for completed */}
                          {isDone && s.weightKg && s.actualReps && (
                            <div className="text-right">
                              <p className="text-white/25 text-xs">{Math.round(s.weightKg * s.actualReps)} kg vol</p>
                            </div>
                          )}
                        </div>

                        {/* Input for current set */}
                        {isCurrentSet && !isDone && (
                          <div className="px-4 pb-4 space-y-3">
                            <div>
                              <p className="text-xs text-white/30 font-semibold mb-1.5">Peso (kg) — 0 = peso corporal</p>
                              <NumberInput
                                value={s.weightKg}
                                onChange={v => logSet(active.currentExerciseIdx, si, { weightKg: v })}
                                step={2.5}
                                unit="kg"
                                placeholder="0"
                              />
                            </div>
                            <div>
                              <p className="text-xs text-white/30 font-semibold mb-1.5">Repeticiones realizadas</p>
                              <NumberInput
                                value={s.actualReps}
                                onChange={v => logSet(active.currentExerciseIdx, si, { actualReps: Math.round(v) })}
                                step={1}
                                min={1}
                                unit="reps"
                                placeholder={currentEx.targetReps.split('-')[0]}
                              />
                            </div>
                            <motion.button
                              whileTap={{ scale: 0.97 }}
                              onClick={handleCompleteSet}
                              className="btn-primary w-full py-4"
                            >
                              {isDone ? '✓ Completada' : `Completar Serie ${si + 1}`}
                            </motion.button>
                          </div>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              </div>

              {/* ── Navigation ────────────────────────────── */}
              {!isLastEx && currentEx.sets.every(s => s.completed) && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => goToExercise(active.currentExerciseIdx + 1)}
                  className="w-full glass border border-electric-500/30 rounded-2xl py-4 text-electric-400 font-bold text-sm hover:bg-electric-500/10 transition-colors"
                >
                  Siguiente ejercicio →
                </motion.button>
              )}

              {isLastEx && currentEx.sets.every(s => s.completed) && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileTap={!finishing ? { scale: 0.97 } : {}}
                  onClick={handleFinish}
                  disabled={finishing}
                  className="btn-primary w-full py-5 text-lg disabled:opacity-70"
                >
                  {finishing ? (
                    <span className="flex items-center gap-2 justify-center">
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Guardando...
                    </span>
                  ) : 'Finalizar entrenamiento'}
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Rest timer */}
      <AnimatePresence>
        {showTimer && (
          <RestTimer
            seconds={timerSeconds}
            onDone={handleTimerDone}
            onDismiss={() => setShowTimer(false)}
          />
        )}
      </AnimatePresence>

      {/* Exit dialog */}
      <AnimatePresence>
        {showExit && (
          <ExitDialog
            onConfirm={() => { endSession(); onClose() }}
            onCancel={() => setShowExit(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
