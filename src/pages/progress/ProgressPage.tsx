import { useEffect, useState } from 'react'
import { motion }              from 'framer-motion'
import { useAuthStore }        from '../../store/auth'
import { getRecentSessions, getPersonalRecords } from '../../lib/database'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Session {
  id:               string
  day_name:         string
  focus:            string
  started_at:       string
  duration_minutes: number
  total_sets:       number
  total_volume:     number
}

interface PR {
  exercise_id:   string
  exercise_name: string
  weight_kg:     number
  reps:          number
  volume:        number
  achieved_at:   string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

function formatVolume(v: number) {
  return v >= 1000 ? `${(v / 1000).toFixed(1)}t` : `${Math.round(v)}kg`
}

function dayLabel(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { weekday: 'short' }).slice(0, 3)
}

// ─── Weekly bar chart (SVG) ───────────────────────────────────────────────────
function WeeklyChart({ sessions }: { sessions: Session[] }) {
  // Build last-7-days buckets
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    d.setHours(0, 0, 0, 0)
    return d
  })

  const buckets = days.map(d => {
    const next = new Date(d); next.setDate(d.getDate() + 1)
    const vol = sessions
      .filter(s => {
        const t = new Date(s.started_at)
        return t >= d && t < next
      })
      .reduce((a, s) => a + (s.total_volume || 0), 0)
    return { label: dayLabel(d.toISOString()), vol, date: d }
  })

  const maxVol = Math.max(...buckets.map(b => b.vol), 1)
  const todayIdx = 6
  const HEIGHT = 80

  return (
    <div className="glass rounded-2xl p-4">
      <p className="text-xs text-white/40 font-bold uppercase tracking-wider mb-4">
        Volumen — últimos 7 días
      </p>
      <div className="flex items-end gap-1.5 h-20">
        {buckets.map((b, i) => {
          const pct  = b.vol / maxVol
          const barH = Math.max(pct * HEIGHT, b.vol > 0 ? 6 : 2)
          const isToday = i === todayIdx
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full relative flex flex-col justify-end"
                style={{ height: HEIGHT }}
              >
                {b.vol > 0 && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: barH }}
                    transition={{ delay: i * 0.06, duration: 0.4, ease: 'easeOut' }}
                    className={[
                      'w-full rounded-lg',
                      isToday
                        ? 'bg-gradient-to-t from-brand-600 to-brand-400 shadow-glow-sm-red'
                        : 'bg-dark-400',
                    ].join(' ')}
                  />
                )}
                {b.vol === 0 && (
                  <div className="w-full h-0.5 rounded-full bg-dark-500" />
                )}
              </div>
              <span className={`text-[10px] font-bold ${isToday ? 'text-brand-400' : 'text-white/25'}`}>
                {b.label}
              </span>
            </div>
          )
        })}
      </div>
      {buckets.every(b => b.vol === 0) && (
        <p className="text-center text-white/20 text-xs mt-2">
          Completa tu primer entrenamiento para ver el gráfico
        </p>
      )}
    </div>
  )
}

// ─── Session card ─────────────────────────────────────────────────────────────
function SessionCard({ s, delay }: { s: Session; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="flex items-center gap-4 glass rounded-2xl p-4"
    >
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500/20 to-brand-700/20 border border-brand-500/20 flex flex-col items-center justify-center flex-shrink-0">
        <span className="text-brand-400 font-black text-sm leading-none">
          {new Date(s.started_at).getDate()}
        </span>
        <span className="text-white/30 text-[9px] uppercase leading-none mt-0.5">
          {new Date(s.started_at).toLocaleDateString('es-ES', { month: 'short' })}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-sm truncate">{s.day_name}</p>
        <p className="text-white/40 text-xs">{s.focus}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-white font-bold text-sm tabular-nums">{formatVolume(s.total_volume)}</p>
        <p className="text-white/30 text-xs tabular-nums">{s.duration_minutes}min · {s.total_sets} series</p>
      </div>
    </motion.div>
  )
}

// ─── PR card ──────────────────────────────────────────────────────────────────
function PRCard({ pr, delay }: { pr: PR; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="flex items-center gap-3 glass rounded-2xl px-4 py-3"
    >
      {/* Trophy badge */}
      <div className="w-9 h-9 rounded-xl bg-yellow-500/15 border border-yellow-500/25 flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/>
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-sm leading-tight truncate">{pr.exercise_name}</p>
        <p className="text-white/30 text-xs mt-0.5">{formatDate(pr.achieved_at)}</p>
      </div>

      <div className="text-right flex-shrink-0">
        <p className="text-yellow-400 font-black text-base tabular-nums">
          {pr.weight_kg === 0 ? 'PC' : `${pr.weight_kg}kg`}
          <span className="text-white/40 font-normal text-xs"> × {pr.reps}</span>
        </p>
        <p className="text-white/25 text-[10px] tabular-nums">{Math.round(pr.volume)}kg vol.</p>
      </div>
    </motion.div>
  )
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-16 glass rounded-2xl animate-pulse" style={{ opacity: 1 - i * 0.2 }} />
      ))}
    </div>
  )
}

// ─── ProgressPage ─────────────────────────────────────────────────────────────
export function ProgressPage() {
  const { user } = useAuthStore()

  const [sessions, setSessions] = useState<Session[]>([])
  const [prs,      setPrs]      = useState<PR[]>([])
  const [loading,  setLoading]  = useState(true)
  const [tab,      setTab]      = useState<'sessions' | 'prs'>('sessions')

  useEffect(() => {
    if (!user) return
    Promise.all([
      getRecentSessions(user.id, 20),
      getPersonalRecords(user.id),
    ]).then(([sessRes, prRes]) => {
      setSessions((sessRes.data as Session[]) ?? [])
      setPrs((prRes.data as PR[]) ?? [])
      setLoading(false)
    })
  }, [user])

  // ── Summary stats ────────────────────────────────────────────────────────────
  const totalVol   = sessions.reduce((a, s) => a + (s.total_volume || 0), 0)
  const totalSets  = sessions.reduce((a, s) => a + (s.total_sets  || 0), 0)

  // Streak: consecutive days with at least one session
  const streak = (() => {
    if (!sessions.length) return 0
    const dates = new Set(sessions.map(s => new Date(s.started_at).toDateString()))
    let count = 0
    const d = new Date()
    while (dates.has(d.toDateString())) {
      count++
      d.setDate(d.getDate() - 1)
    }
    return count
  })()

  const summaryStats = [
    { label: 'Sesiones',      value: sessions.length, unit: ''    },
    { label: 'Racha',         value: streak,           unit: 'días' },
    { label: 'Volumen total', value: formatVolume(totalVol), unit: '' },
    { label: 'Series totales', value: totalSets,        unit: ''   },
  ]

  return (
    <div className="min-h-dvh bg-dark-900 safe-top pb-36">
      {/* Header */}
      <div className="px-5 pt-14 pb-4">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-brand-400 text-xs font-black uppercase tracking-widest mb-1">Mi progreso</p>
          <h1 className="text-3xl font-black text-white leading-tight">Historial</h1>
        </motion.div>
      </div>

      <div className="px-5 space-y-4 pb-4">
        {/* Summary stats */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-4 gap-2"
        >
          {summaryStats.map((s, i) => (
            <div key={i} className="glass rounded-2xl px-2 py-3 text-center">
              <p className="text-white font-black text-lg leading-none tabular-nums">{s.value}</p>
              {s.unit && <p className="text-white/30 text-[9px] font-bold mt-0.5">{s.unit}</p>}
              <p className="text-white/25 text-[9px] mt-1 leading-tight">{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Weekly chart */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <WeeklyChart sessions={sessions} />
        </motion.div>

        {/* Tab selector */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex glass rounded-2xl p-1"
        >
          {(['sessions', 'prs'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={[
                'flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200',
                tab === t
                  ? 'bg-brand-500 text-white shadow-glow-sm-red'
                  : 'text-white/40 hover:text-white/60',
              ].join(' ')}
            >
              {t === 'sessions' ? `Sesiones (${sessions.length})` : `Records (${prs.length})`}
            </button>
          ))}
        </motion.div>

        {/* Content */}
        {loading ? (
          <Skeleton />
        ) : tab === 'sessions' ? (
          sessions.length === 0 ? (
            <EmptyState
              image="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80&fit=crop"
              title="Sin sesiones aún"
              subtitle="Completa tu primer entrenamiento para ver tu historial aquí."
            />
          ) : (
            <div className="space-y-2">
              {sessions.map((s, i) => (
                <SessionCard key={s.id} s={s} delay={i * 0.04} />
              ))}
            </div>
          )
        ) : (
          prs.length === 0 ? (
            <EmptyState
              image="https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=600&q=80&fit=crop"
              title="Sin records aún"
              subtitle="Registra pesos en tus series para que el sistema detecte tus PRs automáticamente."
            />
          ) : (
            <div className="space-y-2">
              {prs
                .sort((a, b) => b.volume - a.volume)
                .map((pr, i) => (
                  <PRCard key={pr.exercise_id} pr={pr} delay={i * 0.04} />
                ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ image, title, subtitle }: { image: string; title: string; subtitle: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative rounded-3xl overflow-hidden"
    >
      <img src={image} alt="" className="w-full h-48 object-cover opacity-20" />
      <div className="absolute inset-0 bg-dark-900/60 flex flex-col items-center justify-center text-center px-6">
        <h3 className="text-white font-black text-lg mb-2">{title}</h3>
        <p className="text-white/40 text-sm leading-relaxed">{subtitle}</p>
      </div>
    </motion.div>
  )
}
