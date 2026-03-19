import { useState, useEffect }     from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRoutineStore }         from '../../store/routine'
import { useSessionStore }         from '../../store/session'
import { useAuthStore }            from '../../store/auth'
import { getThisWeekSessions }     from '../../lib/database'
import { ExerciseDetailModal }     from './ExerciseDetailModal'
import { SPLIT_NAMES }             from '../../lib/weightEngine'
import type { WorkoutExercise, WorkoutDay, SessionExercise } from '../../types'

interface RoutinePageProps {
  onStartSession?: () => void
  refreshKey?:     number
}

interface WeekSession {
  id:               string
  day_number:       number
  day_name:         string
  started_at:       string
  duration_minutes: number
  total_sets:       number
  total_volume:     number
  exercises:        SessionExercise[]
}

const FOCUS_COLORS: Record<string, string> = {
  'Tren Superior':                'from-brand-500/30 to-brand-900/20',
  'Tren Inferior':                'from-electric-500/30 to-electric-900/20',
  'Core':                         'from-yellow-500/30 to-yellow-900/20',
  'Tren Inferior y Core':         'from-purple-500/30 to-purple-900/20',
  'Pecho, Hombros, Tríceps':      'from-brand-500/30 to-brand-900/20',
  'Espalda, Bíceps':              'from-electric-500/30 to-electric-900/20',
  'Cuádriceps, Isquios, Glúteos': 'from-green-500/30 to-green-900/20',
  'Piernas y Core':               'from-purple-500/30 to-purple-900/20',
  'Cuerpo Completo':              'from-orange-500/30 to-orange-900/20',
}

// ─── DayCard ──────────────────────────────────────────────────────────────────
function DayCard({ day, isActive, isCompleted, onClick }: {
  day: WorkoutDay; isActive: boolean; isCompleted: boolean; onClick: () => void
}) {
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={[
        'flex-shrink-0 w-20 flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl border-2 transition-all duration-250 cursor-pointer relative',
        isActive && isCompleted ? 'border-green-500/80 bg-green-500/15 shadow-[0_0_20px_rgba(34,197,94,0.3)]'
        : isActive              ? 'border-brand-500/80 bg-brand-500/15 shadow-glow-sm-red'
        : isCompleted           ? 'border-green-500/40 bg-green-500/8'
        :                         'border-white/10 bg-dark-700/50 hover:border-white/20',
      ].join(' ')}
    >
      {isCompleted && (
        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
      <span className={`text-xs font-bold ${isActive && isCompleted ? 'text-green-400' : isActive ? 'text-brand-400' : isCompleted ? 'text-green-500/70' : 'text-white/40'}`}>
        Día
      </span>
      <span className={`text-2xl font-black tabular-nums ${isActive || isCompleted ? 'text-white' : 'text-white/60'}`}>
        {day.dayNumber}
      </span>
      <span className={`text-[10px] font-semibold text-center leading-tight ${isCompleted ? 'text-green-500/60' : isActive ? 'text-white/60' : 'text-white/25'}`}>
        {isCompleted ? '✓ Hecho' : `~${day.totalTime}min`}
      </span>
    </motion.div>
  )
}

// ─── ExerciseRow ──────────────────────────────────────────────────────────────
function ExerciseRow({ we, index, onClick }: { we: WorkoutExercise; index: number; onClick: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      onClick={onClick}
      className="flex items-center gap-4 glass rounded-2xl p-3 cursor-pointer hover:bg-white/5 active:scale-[0.98] transition-all"
    >
      <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
        <img src={we.exercise.image} alt={we.exercise.nameEs} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900/60 to-transparent" />
        <div className="absolute bottom-1 inset-x-0 text-center">
          <span className="text-white/60 text-[9px] font-bold">{we.exercise.type === 'compound' ? 'Comp.' : 'Isol.'}</span>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-sm leading-tight truncate">{we.exercise.nameEs}</p>
        <p className="text-white/40 text-xs mt-0.5 truncate">{we.exercise.primaryMuscles.join(', ')}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-brand-400 font-black text-sm tabular-nums">{we.sets}×{we.reps}</p>
        <p className="text-white/25 text-xs">{we.rest}s</p>
      </div>
    </motion.div>
  )
}

// ─── CompletedDayView ─────────────────────────────────────────────────────────
function CompletedDayView({ session, day, onRepeat }: {
  session: WeekSession; day: WorkoutDay; onRepeat: () => void
}) {
  const date    = new Date(session.started_at)
  const dateStr = date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
  const timeStr = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      {/* Header */}
      <div className="py-4 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-green-400 text-xs font-black uppercase tracking-wider">Completado esta semana</span>
          </div>
          <h2 className="text-white font-black text-xl">{day.name}</h2>
          <p className="text-white/35 text-xs mt-0.5 capitalize">{dateStr} · {timeStr}</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onRepeat}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-brand-500/40 text-brand-400 text-xs font-bold hover:bg-brand-500/10 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          Repetir
        </motion.button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {[
          { v: `${session.duration_minutes}`, u: 'min',    l: 'Duración'    },
          { v: `${session.total_sets}`,        u: 'series', l: 'Completadas' },
          { v: `${Math.round(session.total_volume)}`, u: 'kg', l: 'Volumen' },
        ].map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.08 + i * 0.06 }}
            className="glass rounded-2xl px-3 py-3 text-center"
          >
            <p className="text-green-400 font-black text-xl tabular-nums leading-none">{s.v}</p>
            <p className="text-white/30 text-[10px] font-semibold mt-0.5">{s.u}</p>
            <p className="text-white/20 text-[9px] mt-1">{s.l}</p>
          </motion.div>
        ))}
      </div>

      {/* Exercises performed */}
      <p className="text-xs text-white/40 font-bold uppercase tracking-wider mb-3">Ejercicios realizados</p>
      <div className="flex flex-col gap-3">
        {session.exercises.map((ex, ei) => {
          const done = ex.sets.filter(s => s.completed)
          if (!done.length) return null
          return (
            <motion.div
              key={ex.exerciseId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + ei * 0.05 }}
              className="glass rounded-2xl overflow-hidden"
            >
              <div className="flex items-center gap-3 p-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                  <img src={ex.image} alt={ex.exerciseName} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm truncate">{ex.exerciseName}</p>
                  <p className="text-white/30 text-xs">{done.length}/{ex.sets.length} series · obj. {ex.targetReps} reps</p>
                </div>
              </div>
              <div className="border-t border-white/5 px-3 py-2.5 flex gap-2 flex-wrap">
                {ex.sets.map((s, si) => (
                  <div
                    key={si}
                    className={[
                      'px-3 py-1.5 rounded-xl text-xs font-bold tabular-nums',
                      s.completed
                        ? 'bg-green-500/15 border border-green-500/30 text-green-400'
                        : 'bg-dark-600/50 border border-white/5 text-white/20 line-through',
                    ].join(' ')}
                  >
                    {s.completed
                      ? (s.weightKg === 0 || s.weightKg === null
                          ? `PC×${s.actualReps}`
                          : `${s.weightKg}kg×${s.actualReps}`)
                      : `S${si + 1}`}
                  </div>
                ))}
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

// ─── RoutinePage ──────────────────────────────────────────────────────────────
export function RoutinePage({ onStartSession, refreshKey }: RoutinePageProps) {
  const { routine }      = useRoutineStore()
  const { startSession } = useSessionStore()
  const { user }         = useAuthStore()

  const [activeDay,    setActiveDay]    = useState(0)
  const [selectedEx,   setSelectedEx]   = useState<{ ex: WorkoutExercise; idx: number } | null>(null)
  const [weekSessions, setWeekSessions] = useState<WeekSession[]>([])

  // Re-runs when a session is saved (refreshKey changes)
  useEffect(() => {
    if (!user) return
    getThisWeekSessions(user.id).then(({ data }) => {
      if (data) setWeekSessions(data as WeekSession[])
    })
  }, [user, refreshKey])

  const handleStartWorkout = (day: WorkoutDay) => {
    startSession(day)
    onStartSession?.()
  }

  // Most recent session per dayNumber this week
  const completedMap = new Map<number, WeekSession>()
  weekSessions.forEach(s => {
    if (!completedMap.has(s.day_number)) completedMap.set(s.day_number, s)
  })

  if (!routine) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-dark-900 px-6">
        <div className="w-20 h-20 rounded-3xl glass flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-white font-black text-xl mb-2">Sin rutina activa</h3>
        <p className="text-white/40 text-sm text-center leading-relaxed">
          Completa el onboarding para generar tu rutina personalizada.
        </p>
      </div>
    )
  }

  const currentDay    = routine.weekDays[activeDay]
  const gradientClass = FOCUS_COLORS[currentDay?.focus] ?? 'from-brand-500/20 to-dark-900'
  const completedSess = currentDay ? completedMap.get(currentDay.dayNumber) : undefined

  return (
    <div className="flex flex-col min-h-screen bg-dark-900 safe-top">
      {/* Header */}
      <div className={`relative overflow-hidden bg-gradient-to-br ${gradientClass} pt-6 pb-5 px-5`}>
        {currentDay?.exercises[0] && (
          <div className="absolute inset-0 opacity-15">
            <img src={currentDay.exercises[0].exercise.image} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-dark-900/60" />
          </div>
        )}
        <div className="relative">
          <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">{SPLIT_NAMES[routine.split]}</p>
          <h1 className="text-2xl font-black text-white leading-tight">Mi Rutina</h1>
          <div className="flex gap-4 mt-3">
            {[
              { v: routine.weekDays.length,                        l: 'días/semana'    },
              { v: routine.weekDays[0]?.exercises.length ?? 0,     l: 'ejercicios/día' },
              { v: `~${routine.weekDays[0]?.totalTime ?? 0}`,      l: 'min/sesión'     },
            ].map(s => (
              <div key={s.l}>
                <span className="text-brand-400 font-black text-lg">{s.v}</span>
                <span className="text-white/30 text-xs font-medium ml-1">{s.l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Day selector */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
          {routine.weekDays.map((day, i) => (
            <DayCard
              key={i}
              day={day}
              isActive={activeDay === i}
              isCompleted={completedMap.has(day.dayNumber)}
              onClick={() => setActiveDay(i)}
            />
          ))}
        </div>
      </div>

      {/* Day content */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-36">
        <AnimatePresence mode="wait">
          {currentDay && (
            <motion.div
              key={`${activeDay}-${completedSess?.id ?? 'plan'}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.22 }}
            >
              {completedSess ? (
                <CompletedDayView
                  session={completedSess}
                  day={currentDay}
                  onRepeat={() => handleStartWorkout(currentDay)}
                />
              ) : (
                <>
                  {/* Day header with Iniciar */}
                  <div className="py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-white font-black text-xl">{currentDay.name}</h2>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="glass px-2.5 py-1 rounded-full text-xs font-semibold text-white/60">
                            {currentDay.focus}
                          </span>
                          <span className="text-white/30 text-xs">
                            {currentDay.exercises.length} ej · ~{currentDay.totalTime} min
                          </span>
                        </div>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleStartWorkout(currentDay)}
                        className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl
                                   bg-gradient-to-r from-brand-500 to-brand-600 text-white text-sm font-black
                                   shadow-glow-sm-red hover:shadow-glow-red transition-all"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        Iniciar
                      </motion.button>
                    </div>
                  </div>

                  {/* Volume breakdown */}
                  <div className="glass rounded-2xl p-4 mb-4">
                    <p className="text-xs text-white/40 font-bold uppercase tracking-wider mb-3">Distribución de volumen</p>
                    <div className="space-y-2">
                      {Object.entries(
                        currentDay.exercises.reduce((acc, we) => {
                          const muscle = we.exercise.primaryMuscles[0] ?? 'other'
                          acc[muscle] = (acc[muscle] ?? 0) + parseInt(we.sets.split('-')[0])
                          return acc
                        }, {} as Record<string, number>)
                      )
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 5)
                        .map(([muscle, sets]) => {
                          const maxSets = currentDay.exercises.reduce((a, we) => Math.max(a, parseInt(we.sets.split('-')[0])), 0)
                          const pct = Math.round((sets / maxSets) * 100)
                          return (
                            <div key={muscle} className="flex items-center gap-3">
                              <p className="text-white/50 text-xs font-semibold w-24 capitalize truncate">{muscle}</p>
                              <div className="flex-1 h-1.5 bg-dark-600 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.2, duration: 0.5 }}
                                  className="h-full bg-gradient-to-r from-brand-500 to-electric-400 rounded-full"
                                />
                              </div>
                              <p className="text-white/30 text-xs tabular-nums w-8 text-right">{sets} ser</p>
                            </div>
                          )
                        })}
                    </div>
                  </div>

                  {/* Exercise list */}
                  <div className="flex flex-col gap-3">
                    {currentDay.exercises.map((we, i) => (
                      <ExerciseRow key={we.exercise.id} we={we} index={i} onClick={() => setSelectedEx({ ex: we, idx: i })} />
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedEx && (
          <ExerciseDetailModal
            key={selectedEx.ex.exercise.id}
            workoutExercise={selectedEx.ex}
            index={selectedEx.idx}
            total={currentDay?.exercises.length ?? 0}
            onClose={() => setSelectedEx(null)}
            onPrev={selectedEx.idx > 0 ? () => setSelectedEx({ ex: currentDay!.exercises[selectedEx.idx - 1], idx: selectedEx.idx - 1 }) : undefined}
            onNext={selectedEx.idx < (currentDay?.exercises.length ?? 0) - 1 ? () => setSelectedEx({ ex: currentDay!.exercises[selectedEx.idx + 1], idx: selectedEx.idx + 1 }) : undefined}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
