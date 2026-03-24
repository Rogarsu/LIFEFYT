import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence }      from 'framer-motion'
import { useRoutineStore }              from '../../store/routine'
import { useSessionStore }              from '../../store/session'
import { useAuthStore }                 from '../../store/auth'
import { useProgramStore }              from '../../store/program'
import { getThisWeekSessions, getActiveRoutine } from '../../lib/database'
import { ExerciseDetailModal }          from './ExerciseDetailModal'
import { METHOD_PARAMS, METHOD_COLORS, METHOD_BG, resolveExerciseId, sessionToDayIndex } from '../../lib/programEngine'
import { SPLIT_NAMES }                  from '../../lib/weightEngine'
import { EXERCISES }                    from '../../constants/exercises'
import type { WorkoutExercise, WorkoutDay, SessionExercise, ExerciseSlot, GeneratedRoutine } from '../../types'

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
        'flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl border-2 transition-all duration-250 cursor-pointer relative',
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

// ─── ProgramView ──────────────────────────────────────────────────────────────
function ProgramView() {
  const { program, advancing, advance } = useProgramStore()
  const [shownBlock,   setShownBlock]   = useState<number | null>(null)
  const [shownSession, setShownSession] = useState<number | null>(null)

  const exerciseMap = useMemo(
    () => new Map(EXERCISES.map(e => [e.id, e])),
    [],
  )

  if (!program) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <p className="text-white/30 text-sm">No hay programa activo.</p>
      </div>
    )
  }

  const sessionsPerBlock  = program.daysPerWeek * 4
  const activeBlockNum    = shownBlock ?? program.currentBlock
  const block             = program.blocks.find(b => b.blockNumber === activeBlockNum) ?? program.blocks[0]
  const isCurrentBlock    = block?.blockNumber === program.currentBlock
  const activeSession     = shownSession ?? (isCurrentBlock ? program.currentSession : 1)
  const params            = block ? METHOD_PARAMS[block.method] : null
  const isLastBlock       = program.currentBlock >= program.blocks.length
  const isBlockDone       = program.currentSession >= sessionsPerBlock
  const isViewingCurrent  = isCurrentBlock && activeSession === program.currentSession
  const nextBlockMethod   = program.blocks.find(b => b.blockNumber === program.currentBlock + 1)?.method
  const nextBlockLabel    = nextBlockMethod ? METHOD_PARAMS[nextBlockMethod].label : null

  const completedInBlock  = program.completedSessions.filter(cs => cs.b === (block?.blockNumber ?? 0)).length
  const sessionPct        = Math.round((completedInBlock / sessionsPerBlock) * 100)

  function isDone(blockNum: number, sessionNum: number) {
    return program.completedSessions.some(cs => cs.b === blockNum && cs.s === sessionNum)
  }

  function handleBlockSelect(bn: number) {
    setShownBlock(bn)
    setShownSession(bn === program!.currentBlock ? program!.currentSession : 1)
  }

  async function handleAdvance() {
    const movedBlock = await advance()
    if (movedBlock) {
      setShownBlock(null)
      setShownSession(null)
    } else {
      setShownSession(null)
    }
  }

  const activeDayIndex = sessionToDayIndex(activeSession, program.daysPerWeek)
  const activeDay      = block?.days[activeDayIndex] ?? block?.days[0]

  // Debug
  console.log('[ProgramView]', {
    daysPerWeek: program.daysPerWeek,
    currentSession: program.currentSession,
    activeSession,
    activeBlockNum,
    blockDaysCount: block?.days?.length,
    activeDayIndex,
    activeDaySlots: activeDay?.slots?.length,
    firstPool: activeDay?.slots?.[0]?.exercisePool,
    firstResolvedId: activeDay?.slots?.[0]
      ? resolveExerciseId(activeDay.slots[0].exercisePool, block!.blockNumber, activeSession, sessionsPerBlock)
      : null,
    exerciseMapSize: exerciseMap.size,
  })

  return (
    <div className="px-5 pt-4 pb-36">

      {/* Block chips */}
      <div className="glass rounded-2xl p-4 mb-4">
        <p className="text-xs text-white/40 font-bold uppercase tracking-wider mb-3">
          Programa · {program.durationMonths} {program.durationMonths === 1 ? 'mes' : 'meses'}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          {program.blocks.map(b => {
            const isCurrent = b.blockNumber === program.currentBlock
            const isPast    = b.blockNumber < program.currentBlock
            const isShown   = b.blockNumber === activeBlockNum
            const mp        = METHOD_PARAMS[b.method]
            return (
              <motion.button
                key={b.blockNumber}
                whileTap={{ scale: 0.93 }}
                onClick={() => handleBlockSelect(b.blockNumber)}
                className={[
                  'flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all',
                  isShown  ? 'bg-brand-500/20 border-brand-500/60 text-white'
                  : isPast ? 'border-green-500/30 bg-green-500/8 text-green-500/60'
                  :          'border-white/10 bg-white/5 text-white/40',
                ].join(' ')}
              >
                {isPast && !isShown && (
                  <svg className="w-3 h-3 text-green-500/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {isCurrent && !isShown && <span className="w-1.5 h-1.5 rounded-full bg-brand-400 inline-block" />}
                <span>B{b.blockNumber}</span>
                <span className="opacity-60">{mp.label}</span>
              </motion.button>
            )
          })}
        </div>
      </div>

      {block && params && (
        <AnimatePresence mode="wait">
          <motion.div
            key={block.blockNumber}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {/* Block banner + progress */}
            <div className={`rounded-2xl border px-4 py-3 mb-4 ${METHOD_BG[block.method]}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-white/40 mb-0.5">
                    Bloque {block.blockNumber} · {sessionsPerBlock} sesiones
                  </p>
                  <p className={`text-lg font-black ${METHOD_COLORS[block.method]}`}>{params.label}</p>
                  <p className="text-white/40 text-xs mt-0.5">{params.description}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-white/70 text-sm font-black tabular-nums">{params.sets} × {params.reps}</p>
                  <p className="text-white/30 text-xs">{params.rest}s descanso</p>
                  {block.method === 'deload' && <p className="text-white/30 text-xs mt-0.5">Tempo {params.tempo}</p>}
                </div>
              </div>
              {isCurrentBlock && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-white/55 text-xs font-bold">
                      {completedInBlock} / {sessionsPerBlock} sesiones completadas
                    </span>
                    <span className="text-white/30 text-[10px]">{sessionPct}%</span>
                  </div>
                  <div className="h-1.5 bg-dark-600 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${sessionPct}%` }}
                      transition={{ duration: 0.5 }}
                      className="h-full bg-gradient-to-r from-brand-500 to-electric-400 rounded-full"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Session grid */}
            <div className="glass rounded-2xl p-4 mb-4">
              <p className="text-xs text-white/40 font-bold uppercase tracking-wider mb-3">Sesiones</p>
              <div
                className="grid gap-2"
                style={{ gridTemplateColumns: `repeat(${program.daysPerWeek}, minmax(0, 1fr))` }}
              >
                {Array.from({ length: sessionsPerBlock }, (_, i) => {
                  const sn      = i + 1
                  const done    = isDone(block.blockNumber, sn)
                  const isCurr  = isCurrentBlock && sn === program.currentSession
                  const isShown = sn === activeSession
                  return (
                    <motion.button
                      key={sn}
                      whileTap={{ scale: 0.88 }}
                      onClick={() => setShownSession(sn)}
                      className={[
                        'relative flex flex-col items-center justify-center py-2 rounded-xl border text-xs font-black transition-all',
                        isShown && done   ? 'bg-green-500/20 border-green-500/60 text-green-300'
                        : isShown         ? 'bg-brand-500/20 border-brand-500/60 text-white'
                        : done            ? 'border-green-500/30 bg-green-500/8 text-green-500/70'
                        : isCurr          ? 'border-brand-400/50 bg-brand-500/10 text-brand-400'
                        :                   'border-white/8 bg-white/3 text-white/25',
                      ].join(' ')}
                    >
                      {done && !isShown ? (
                        <svg className="w-3.5 h-3.5 text-green-500/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span>{String(sn).padStart(2, '0')}</span>
                      )}
                      {isCurr && !isShown && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-brand-400 border-2 border-dark-900" />
                      )}
                    </motion.button>
                  )
                })}
              </div>
            </div>

            {/* Session detail */}
            {activeDay && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${block.blockNumber}-${activeSession}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                >
                  {/* Session header */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-white font-black text-base leading-tight">{activeDay.name}</p>
                      <p className="text-white/35 text-xs mt-0.5">{activeDay.focus}</p>
                    </div>
                    <span className={[
                      'text-xs font-bold px-2.5 py-1 rounded-lg',
                      isDone(block.blockNumber, activeSession)
                        ? 'bg-green-500/15 text-green-400'
                        : isViewingCurrent
                        ? 'bg-brand-500/15 text-brand-400'
                        : 'bg-white/5 text-white/30',
                    ].join(' ')}>
                      Sesión {String(activeSession).padStart(2, '0')}
                    </span>
                  </div>

                  {/* Exercises grouped by muscle */}
                  <div className="glass rounded-2xl overflow-hidden mb-4">
                    {(() => {
                      const grouped: { label: string; slots: ExerciseSlot[] }[] = []
                      activeDay.slots.forEach(slot => {
                        const last = grouped[grouped.length - 1]
                        if (last && last.label === slot.label) {
                          last.slots.push(slot)
                        } else {
                          grouped.push({ label: slot.label, slots: [slot] })
                        }
                      })
                      return grouped.map((group, gi) => (
                        <div key={gi} className={gi > 0 ? 'border-t border-white/8' : ''}>
                          {/* Muscle group header */}
                          <div className="px-4 pt-3 pb-1.5 flex items-center gap-2">
                            <svg className="w-2.5 h-2.5 text-brand-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                            <span className="text-[11px] font-black text-white/55 uppercase tracking-wider">{group.label}</span>
                          </div>
                          {group.slots.map((slot, si) => {
                            const exId = resolveExerciseId(slot.exercisePool, block.blockNumber, activeSession, sessionsPerBlock)
                            const ex   = exId ? exerciseMap.get(exId) : undefined
                            return (
                              <div key={si} className="flex items-center gap-3 px-4 py-2.5 border-t border-white/4">
                                {ex ? (
                                  <>
                                    <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0">
                                      <img src={ex.image} alt={ex.nameEs} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-white/85 text-sm font-semibold truncate">{ex.nameEs}</p>
                                      <p className="text-white/30 text-xs truncate">{ex.primaryMuscles.join(' · ')}</p>
                                    </div>
                                  </>
                                ) : (
                                  <div className="flex-1">
                                    <p className="text-white/40 text-sm">{slot.label}</p>
                                  </div>
                                )}
                                <div className="flex-shrink-0 text-right">
                                  <p className="text-white/65 text-xs font-black tabular-nums">{params.sets}×{params.reps}</p>
                                  <p className="text-white/25 text-[10px]">{params.rest}s</p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ))
                    })()}
                  </div>

                  {/* Advance button — only for current session */}
                  {isViewingCurrent && !isLastBlock && (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      disabled={advancing}
                      onClick={handleAdvance}
                      className={[
                        'w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all',
                        advancing
                          ? 'bg-white/5 border border-white/10 text-white/30 cursor-not-allowed'
                          : isBlockDone
                          ? 'bg-gradient-to-r from-brand-500 to-electric-400 text-white shadow-glow-sm-red'
                          : 'bg-dark-700 border border-white/10 text-white/70 hover:border-white/20',
                      ].join(' ')}
                    >
                      {advancing ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Guardando...
                        </>
                      ) : isBlockDone ? (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                          Completar bloque → {nextBlockLabel ?? `Bloque ${program.currentBlock + 1}`}
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                          Completar sesión → {program.currentSession + 1}
                        </>
                      )}
                    </motion.button>
                  )}

                  {/* Program complete */}
                  {isViewingCurrent && isLastBlock && isBlockDone && (
                    <div className="glass rounded-2xl p-5 text-center">
                      <p className="text-brand-400 font-black text-base mb-1">Programa completado</p>
                      <p className="text-white/40 text-sm">Has terminado todos los bloques. ¡Excelente trabajo!</p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}

// ─── RoutinePage ──────────────────────────────────────────────────────────────
export function RoutinePage({ onStartSession, refreshKey }: RoutinePageProps) {
  const { routine, loading: routineLoading, setRoutine, setLoading: setRoutineLoading } = useRoutineStore()
  const { startSession } = useSessionStore()
  const { user }         = useAuthStore()

  const [view,         setView]         = useState<'week' | 'program'>('week')
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

  // Self-load routine if not yet in store (e.g. user navigates here directly)
  useEffect(() => {
    if (!user || routine || routineLoading) return
    setRoutineLoading(true)
    getActiveRoutine(user.id).then(({ data }) => {
      if (data?.routine_data) {
        setRoutine(data.routine_data as GeneratedRoutine)
      } else {
        setRoutineLoading(false)
      }
    })
  }, [user])

  const handleStartWorkout = (day: WorkoutDay) => {
    startSession(day)
    onStartSession?.()
  }

  // Most recent session per dayNumber this week
  const completedMap = new Map<number, WeekSession>()
  weekSessions.forEach(s => {
    if (!completedMap.has(s.day_number)) completedMap.set(s.day_number, s)
  })

  if (routineLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-dark-900">
        <div className="w-12 h-12 rounded-full border-2 border-brand-500/30 border-t-brand-500 animate-spin" />
        <p className="text-white/30 text-xs font-semibold mt-4 tracking-widest uppercase">Cargando rutina...</p>
      </div>
    )
  }

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

      {/* View toggle */}
      <div className="px-5 pt-4 pb-0">
        <div className="flex gap-1 glass rounded-xl p-1">
          {(['week', 'program'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={[
                'flex-1 py-2 rounded-lg text-xs font-bold transition-all',
                view === v ? 'bg-brand-500 text-white shadow-glow-sm-red' : 'text-white/40 hover:text-white',
              ].join(' ')}
            >
              {v === 'week' ? 'Esta semana' : 'Mi programa'}
            </button>
          ))}
        </div>
      </div>

      {/* Program view */}
      {view === 'program' && (
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <ProgramView />
        </div>
      )}

      {/* Day selector — week view only */}
      {view === 'week' && (
        <div className="px-5 pt-4 pb-2">
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${routine.weekDays.length}, minmax(0, 1fr))` }}>
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
      )}

      {/* Day content — week view only */}
      {view === 'week' && (
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
      )}

      {/* Exercise detail modal — week view only */}
      {view === 'week' && (
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
      )}
    </div>
  )
}
