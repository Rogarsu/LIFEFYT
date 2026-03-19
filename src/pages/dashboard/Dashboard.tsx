import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore }    from '../../store/auth'
import { useRoutineStore } from '../../store/routine'
import { getActiveRoutine, getThisWeekSessions } from '../../lib/database'
import { SPLIT_NAMES }     from '../../lib/weightEngine'
import type { GeneratedRoutine } from '../../types'

interface Props {
  onGoToRoutine: () => void
  refreshKey?:   number
}

const AREA_NAMES: Record<string, string> = {
  upperBody: 'Tren Superior',
  lowerBody: 'Tren Inferior',
  core:      'Core',
}

const EXP_SHORT: Record<string, string> = {
  beginner:     'Inicio',
  intermediate: 'Medio',
  advanced:     'Avanzado',
}

export function Dashboard({ onGoToRoutine, refreshKey }: Props) {
  const { user }                    = useAuthStore()
  const { routine, setRoutine, setLoading } = useRoutineStore()
  const [completedDays, setCompletedDays] = useState<Set<number>>(new Set())

  // Load routine from Supabase on mount
  useEffect(() => {
    if (!user || routine) return
    setLoading(true)
    getActiveRoutine(user.id).then(({ data }) => {
      if (data?.routine_data) {
        setRoutine(data.routine_data as GeneratedRoutine)
      } else {
        setLoading(false)
      }
    })
  }, [user])

  // Load completed days this week — re-runs when a session is saved (refreshKey changes)
  useEffect(() => {
    if (!user) return
    getThisWeekSessions(user.id).then(({ data }) => {
      if (data) {
        setCompletedDays(new Set(data.map((s: { day_number: number }) => s.day_number)))
      }
    })
  }, [user, refreshKey])

  const wm = routine?.weightMap
  const todayIdx    = new Date().getDay()
  const adjustedIdx = todayIdx === 0 ? 6 : todayIdx - 1
  const todayDay    = routine?.weekDays[adjustedIdx % (routine?.weekDays.length ?? 1)]
  const todayDone   = todayDay ? completedDays.has(todayDay.dayNumber) : false

  return (
    <div className="flex flex-col min-h-dvh bg-dark-900 safe-top">
      {/* Header */}
      <div className="relative h-56 flex-shrink-0 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=85&fit=crop"
          alt="Dashboard"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-dark-900/40 via-dark-900/30 to-dark-900" />
        <div className="absolute inset-0 bg-hero-glow" />

        <div className="absolute bottom-0 inset-x-0 px-5 pb-5">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-xs font-bold text-brand-400 uppercase tracking-widest">
              Bienvenido{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}
            </p>
            <h1 className="text-3xl font-black text-white leading-tight mt-0.5">
              Tu Dashboard
            </h1>
            {wm && (
              <p className="text-white/40 text-sm mt-0.5">{SPLIT_NAMES[wm.suggestedSplit]}</p>
            )}
          </motion.div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-36">

        {/* Today's workout card */}
        {todayDay && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-5 mb-5"
          >
            <p className="text-xs text-white/40 font-bold uppercase tracking-wider mb-3">
              Entrenamiento de hoy
            </p>
            <motion.div
              whileTap={{ scale: 0.98 }}
              onClick={onGoToRoutine}
              className={[
                'relative overflow-hidden rounded-2xl border cursor-pointer transition-colors',
                todayDone ? 'border-green-500/40' : 'border-brand-500/30',
              ].join(' ')}
            >
              <div className="relative h-36 overflow-hidden">
                <img
                  src={todayDay.exercises[0]?.exercise.image ?? ''}
                  alt={todayDay.name}
                  className={['w-full h-full object-cover transition-all', todayDone ? 'brightness-75' : ''].join(' ')}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-dark-900/90 via-dark-900/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-900/80 to-transparent" />
                {/* Green overlay when done */}
                {todayDone && <div className="absolute inset-0 bg-green-500/10" />}
              </div>
              <div className="absolute inset-0 px-5 flex flex-col justify-end pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={[
                    'px-2.5 py-0.5 rounded-full text-xs font-bold w-fit',
                    todayDone ? 'bg-green-500/20 text-green-400' : 'glass text-brand-400',
                  ].join(' ')}>
                    {todayDay.focus}
                  </span>
                  {todayDone && (
                    <span className="flex items-center gap-1 text-green-400 text-xs font-black">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Completado hoy
                    </span>
                  )}
                </div>
                <h3 className="text-white font-black text-xl">{todayDay.name}</h3>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-white/50 text-xs">{todayDay.exercises.length} ejercicios</span>
                  <span className="text-white/20 text-xs">·</span>
                  <span className="text-white/50 text-xs">~{todayDay.totalTime} min</span>
                </div>
              </div>
              {/* Badge */}
              <div className={[
                'absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center',
                todayDone
                  ? 'bg-green-500 shadow-[0_0_16px_rgba(34,197,94,0.5)]'
                  : 'bg-brand-500 shadow-glow-sm-red',
              ].join(' ')}>
                {todayDone ? (
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Quick stats */}
        {wm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="grid grid-cols-3 gap-3 mb-5"
          >
            {[
              { label: 'Días/sem',   value: `${wm.daysPerWeek}` },
              { label: 'Min/sesión', value: `${wm.sessionDuration}` },
              { label: 'Nivel',      value: EXP_SHORT[wm.experience] },
            ].map(s => (
              <div key={s.label} className="glass rounded-2xl p-4 text-center">
                <p className="text-2xl font-black text-brand-400">{s.value}</p>
                <p className="text-white/35 text-xs mt-1 font-medium">{s.label}</p>
              </div>
            ))}
          </motion.div>
        )}

        {/* Focus areas */}
        {wm && wm.muscleGroups && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-5"
          >
            <p className="text-xs text-white/40 font-bold uppercase tracking-wider mb-3">
              Áreas prioritarias
            </p>
            <div className="flex gap-2">
              {(Object.entries(wm.muscleGroups) as [string, number][])
                .filter(([, v]) => v > 0)
                .sort((a, b) => b[1] - a[1])
                .map(([area, weight], idx) => (
                  <div
                    key={area}
                    className={[
                      'flex-1 glass rounded-xl p-3 border',
                      idx === 0 ? 'border-brand-500/40' : 'border-white/8',
                    ].join(' ')}
                  >
                    <p className={`text-xs font-bold ${idx === 0 ? 'text-brand-400' : 'text-white/35'}`}>
                      #{idx + 1}
                    </p>
                    <p className="text-white/75 text-sm font-semibold mt-0.5 leading-tight">
                      {AREA_NAMES[area]}
                    </p>
                    <div className="mt-1.5 h-1 bg-dark-600 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-brand-500 to-electric-400 rounded-full"
                        style={{ width: `${(weight / 3) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              }
            </div>
          </motion.div>
        )}

        {/* Weekly overview mini */}
        {routine && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mb-5"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-white/40 font-bold uppercase tracking-wider">Semana</p>
              <button onClick={onGoToRoutine} className="text-brand-400 text-xs font-bold hover:text-brand-300 transition-colors">
                Ver todo →
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {routine.weekDays.map((day, i) => {
                const isToday = i === adjustedIdx % routine.weekDays.length
                const isDone  = completedDays.has(day.dayNumber)
                return (
                  <motion.div
                    key={i}
                    whileTap={{ scale: 0.92 }}
                    onClick={onGoToRoutine}
                    className={[
                      'flex-shrink-0 w-16 py-3 rounded-xl border text-center cursor-pointer transition-all relative',
                      isToday && isDone ? 'border-green-500/60 bg-green-500/12'
                      : isToday         ? 'border-brand-500/60 bg-brand-500/15'
                      : isDone          ? 'border-green-500/35 bg-green-500/8'
                      :                   'border-white/8 bg-dark-700/40',
                    ].join(' ')}
                  >
                    {isDone && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    <p className={`text-xs font-bold ${isToday && isDone ? 'text-green-400' : isToday ? 'text-brand-400' : isDone ? 'text-green-500/60' : 'text-white/25'}`}>
                      Día
                    </p>
                    <p className={`text-xl font-black ${isDone ? 'text-white' : isToday ? 'text-white' : 'text-white/40'}`}>
                      {day.dayNumber}
                    </p>
                    <p className={`text-[9px] font-medium mt-0.5 ${isDone ? 'text-green-500/50' : 'text-white/25'}`}>
                      {isDone ? '✓' : `${day.exercises.length} ej.`}
                    </p>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Coming soon */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          {[
            {
              title: 'Registrar Sesión',
              desc:  'Apunta tus pesos y reps de hoy.',
              image: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=500&q=75&fit=crop',
            },
            {
              title: 'Mi Progreso',
              desc:  'Visualiza tu evolución semana a semana.',
              image: 'https://images.unsplash.com/photo-1550345332-09e3ac987658?w=500&q=75&fit=crop',
            },
          ].map((panel) => (
            <div key={panel.title} className="relative overflow-hidden rounded-2xl border border-white/8 opacity-55">
              <div className="h-20 relative overflow-hidden">
                <img src={panel.image} alt={panel.title} className="w-full h-full object-cover grayscale-[60%]" />
                <div className="absolute inset-0 bg-gradient-to-r from-dark-900/90 to-dark-900/40" />
                <div className="absolute inset-0 px-4 flex flex-col justify-center">
                  <h3 className="text-white/65 font-bold text-sm">{panel.title}</h3>
                  <p className="text-white/30 text-xs mt-0.5">{panel.desc}</p>
                </div>
                <div className="absolute top-3 right-3 glass px-2.5 py-1 rounded-full">
                  <span className="text-xs text-white/35 font-semibold">Próximamente</span>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
