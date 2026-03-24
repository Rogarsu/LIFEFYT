import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore }    from '../../store/auth'
import { useRoutineStore } from '../../store/routine'
import { getProfile, updateProfile, getRecentSessions } from '../../lib/database'
import { SPLIT_NAMES } from '../../lib/weightEngine'

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

function bmi(weightKg: number, heightCm: number) {
  if (!weightKg || !heightCm) return null
  const h = heightCm / 100
  return (weightKg / (h * h)).toFixed(1)
}

function bmiLabel(b: string | null) {
  if (!b) return null
  const n = parseFloat(b)
  if (n < 18.5) return { text: 'Bajo peso',       color: 'text-blue-400'    }
  if (n < 25)   return { text: 'Peso normal',      color: 'text-green-400'   }
  if (n < 30)   return { text: 'Sobrepeso',        color: 'text-yellow-400'  }
  return              { text: 'Obesidad',           color: 'text-red-400'     }
}

// ─── Avatar initials ──────────────────────────────────────────────────────────
function Avatar({ name, size = 'lg' }: { name?: string; size?: 'sm' | 'lg' }) {
  const initials = name
    ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?'
  const cls = size === 'lg'
    ? 'w-20 h-20 text-2xl'
    : 'w-10 h-10 text-sm'
  return (
    <div className={`${cls} rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-glow-red flex-shrink-0`}>
      <span className="text-white font-black">{initials}</span>
    </div>
  )
}

// ─── Editable field ───────────────────────────────────────────────────────────
function Field({
  label, value, onChange, type = 'text', unit, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void
  type?: string; unit?: string; placeholder?: string
}) {
  return (
    <div>
      <p className="text-xs text-white/30 font-semibold mb-1.5">{label}</p>
      <div className="relative">
        <input
          type={type}
          inputMode={type === 'number' ? 'decimal' : undefined}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder ?? label}
          className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-semibold
                     focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 placeholder:text-white/20"
        />
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 text-xs font-semibold">{unit}</span>
        )}
      </div>
    </div>
  )
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs text-white/40 font-black uppercase tracking-widest mb-3">{children}</p>
  )
}

// ─── ProfilePage ──────────────────────────────────────────────────────────────
export function ProfilePage() {
  const { user, signOut }  = useAuthStore()
  const { routine }        = useRoutineStore()

  // Profile fields
  const [fullName,  setFullName]  = useState('')
  const [age,       setAge]       = useState('')
  const [weightKg,  setWeightKg]  = useState('')
  const [heightCm,  setHeightCm]  = useState('')
  const [gender,    setGender]    = useState('')

  // UI state
  const [editing,     setEditing]     = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [saveOk,      setSaveOk]      = useState(false)
  const [confirming,  setConfirming]  = useState(false)
  const [signingOut,  setSigningOut]  = useState(false)
  const [totalSessions, setTotalSessions] = useState<number | null>(null)

  // Load profile on mount
  useEffect(() => {
    if (!user) return
    getProfile(user.id).then(({ data }) => {
      if (!data) return
      setFullName(data.full_name  ?? '')
      setAge(data.age             ? String(data.age)       : '')
      setWeightKg(data.weight_kg  ? String(data.weight_kg) : '')
      setHeightCm(data.height_cm  ? String(data.height_cm) : '')
      setGender(data.gender       ?? '')
    })
    getRecentSessions(user.id, 100).then(({ data }) => {
      setTotalSessions(data?.length ?? 0)
    })
  }, [user])

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    const updates: Record<string, unknown> = {
      full_name: fullName || null,
      age:       age       ? parseInt(age)        : null,
      weight_kg: weightKg  ? parseFloat(weightKg) : null,
      height_cm: heightCm  ? parseFloat(heightCm) : null,
    }
    if (gender) updates.gender = gender
    await updateProfile(user.id, updates)
    setSaving(false)
    setSaveOk(true)
    setEditing(false)
    setTimeout(() => setSaveOk(false), 2000)
  }

  const handleSignOut = async () => {
    setSigningOut(true)
    await signOut()
  }

  const bmiVal   = bmi(parseFloat(weightKg), parseFloat(heightCm))
  const bmiInfo  = bmiLabel(bmiVal)
  const wm       = routine?.weightMap
  const joinDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
    : null

  return (
    <div className="min-h-screen bg-dark-900 safe-top pb-36">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden px-5 pt-14 pb-8">
        {/* Subtle background glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 via-transparent to-transparent pointer-events-none" />

        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="relative flex items-center gap-4">
          <Avatar name={fullName || user?.full_name} />
          <div className="flex-1 min-w-0">
            <p className="text-brand-400 text-xs font-black uppercase tracking-widest mb-0.5">Mi Perfil</p>
            <h1 className="text-2xl font-black text-white leading-tight truncate">
              {fullName || user?.full_name || 'Usuario'}
            </h1>
            <p className="text-white/35 text-xs mt-0.5 truncate">{user?.email}</p>
            {joinDate && (
              <p className="text-white/20 text-xs mt-0.5">Miembro desde {joinDate}</p>
            )}
          </div>
        </motion.div>
      </div>

      <div className="px-5 space-y-5">

        {/* ── Stats strip ───────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="grid grid-cols-3 gap-2"
        >
          {[
            { v: wm?.daysPerWeek  ?? '—', l: 'días/sem'   },
            { v: totalSessions    ?? '—', l: 'sesiones'   },
            { v: wm ? EXP_NAMES[wm.experience]?.slice(0,5) ?? '—' : '—', l: 'nivel' },
          ].map((s, i) => (
            <div key={i} className="glass rounded-2xl px-3 py-3 text-center">
              <p className="text-brand-400 font-black text-xl tabular-nums leading-none">{s.v}</p>
              <p className="text-white/25 text-[10px] font-semibold mt-1">{s.l}</p>
            </div>
          ))}
        </motion.div>

        {/* ── Personal data ─────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex items-center justify-between mb-3">
            <SectionTitle>Datos personales</SectionTitle>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="text-brand-400 text-xs font-bold hover:text-brand-300 transition-colors"
              >
                Editar
              </button>
            )}
          </div>

          {editing ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-4 space-y-3"
            >
              <Field label="Nombre completo" value={fullName} onChange={setFullName} placeholder="Tu nombre" />

              {/* Gender */}
              <div>
                <p className="text-xs text-white/30 font-semibold mb-1.5">Género</p>
                <div className="flex gap-2">
                  {(['male', 'female', 'other'] as const).map(g => (
                    <button
                      key={g}
                      onClick={() => setGender(g)}
                      className={[
                        'flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all',
                        gender === g
                          ? 'bg-brand-500/20 border-brand-500/50 text-brand-400'
                          : 'border-white/10 text-white/30 hover:text-white/60',
                      ].join(' ')}
                    >
                      {g === 'male' ? 'Hombre' : g === 'female' ? 'Mujer' : 'Otro'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Field label="Edad" value={age}      onChange={setAge}      type="number" unit="años"  placeholder="—" />
                <Field label="Peso" value={weightKg} onChange={setWeightKg} type="number" unit="kg"    placeholder="—" />
                <Field label="Altura" value={heightCm} onChange={setHeightCm} type="number" unit="cm" placeholder="—" />
              </div>

              {/* Live BMI */}
              {bmiVal && bmiInfo && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-dark-600/50">
                  <span className="text-white/30 text-xs">IMC:</span>
                  <span className={`font-black text-sm ${bmiInfo.color}`}>{bmiVal}</span>
                  <span className={`text-xs font-semibold ${bmiInfo.color}`}>{bmiInfo.text}</span>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setEditing(false)}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-white/40 font-bold text-sm hover:text-white/60 transition-colors"
                >
                  Cancelar
                </button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 btn-primary py-3 text-sm disabled:opacity-60"
                >
                  {saving ? 'Guardando…' : 'Guardar'}
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <div className="glass rounded-2xl p-4 space-y-3">
              {/* Read-only rows */}
              {[
                { l: 'Nombre',  v: fullName || '—'                    },
                { l: 'Género',  v: gender === 'male' ? 'Hombre' : gender === 'female' ? 'Mujer' : gender === 'other' ? 'Otro' : '—' },
                { l: 'Edad',    v: age      ? `${age} años`   : '—'   },
                { l: 'Peso',    v: weightKg ? `${weightKg} kg`: '—'   },
                { l: 'Altura',  v: heightCm ? `${heightCm} cm`: '—'   },
              ].map((row, i) => (
                <div key={i} className={i > 0 ? 'border-t border-white/5 pt-3' : ''}>
                  <p className="text-white/30 text-xs">{row.l}</p>
                  <p className="text-white font-semibold text-sm mt-0.5">{row.v}</p>
                </div>
              ))}

              {/* BMI badge */}
              {bmiVal && bmiInfo && (
                <div className="border-t border-white/5 pt-3 flex items-center gap-2">
                  <p className="text-white/30 text-xs">IMC</p>
                  <span className={`font-black text-sm ${bmiInfo.color}`}>{bmiVal}</span>
                  <span className={`text-xs font-semibold ${bmiInfo.color}`}>· {bmiInfo.text}</span>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* ── Save success toast ────────────────────────────────────────────── */}
        <AnimatePresence>
          {saveOk && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-green-500/15 border border-green-500/30 text-green-400 text-sm font-bold"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Perfil actualizado
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Routine summary ───────────────────────────────────────────────── */}
        {wm && routine && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <SectionTitle>Mi rutina activa</SectionTitle>
            <div className="glass rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-brand-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29l-1.43-1.43z"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm">{SPLIT_NAMES[routine.split]}</p>
                  <p className="text-white/35 text-xs mt-0.5">{wm.daysPerWeek} días · {wm.sessionDuration} min/sesión</p>
                </div>
              </div>

              {[
                { l: 'Nivel',     v: EXP_NAMES[wm.experience] },
                { l: 'Equipo',    v: EQ_NAMES[wm.equipment]   },
                { l: 'Días/sem',  v: `${wm.daysPerWeek} días` },
                { l: 'Duración',  v: `${wm.sessionDuration} min` },
              ].map((row, i) => (
                <div key={i} className="border-t border-white/5 pt-3 flex items-center justify-between">
                  <p className="text-white/30 text-xs">{row.l}</p>
                  <p className="text-white font-semibold text-sm">{row.v}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Account ───────────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <SectionTitle>Cuenta</SectionTitle>
          <div className="glass rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5">
              <p className="text-white/30 text-xs">Email</p>
              <p className="text-white font-semibold text-sm mt-0.5 truncate">{user?.email}</p>
            </div>
            {joinDate && (
              <div className="px-4 py-3">
                <p className="text-white/30 text-xs">Miembro desde</p>
                <p className="text-white font-semibold text-sm mt-0.5 capitalize">{joinDate}</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Sign out ──────────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <AnimatePresence mode="wait">
            {!confirming ? (
              <motion.button
                key="signout-btn"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setConfirming(true)}
                className="w-full py-4 rounded-2xl border border-red-500/40 bg-red-500/10 text-red-400 font-bold text-sm hover:bg-red-500/20 transition-all"
              >
                Cerrar sesión
              </motion.button>
            ) : (
              <motion.div
                key="signout-confirm"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="glass rounded-2xl p-4 border border-red-500/20"
              >
                <p className="text-white font-bold text-sm mb-1">¿Cerrar sesión?</p>
                <p className="text-white/35 text-xs mb-4">Tendrás que volver a iniciar sesión la próxima vez.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirming(false)}
                    className="flex-1 py-3 rounded-xl bg-dark-600 text-white/50 font-bold text-sm hover:text-white transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="flex-1 py-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 font-bold text-sm hover:bg-red-500/30 transition-colors disabled:opacity-50"
                  >
                    {signingOut ? 'Saliendo…' : 'Confirmar'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

      </div>
    </div>
  )
}
