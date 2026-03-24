import { useState } from 'react'
import { motion } from 'framer-motion'
import { useOnboardingStore } from '../../store/onboarding'
import { useAuthStore }       from '../../store/auth'
import { buildWeightMap, generateRoutine } from '../../lib/weightEngine'
import { generateProgram, METHOD_PARAMS, METHOD_COLORS, METHOD_BG } from '../../lib/programEngine'
import {
  saveProgram,
  saveUserGoal,
  saveRoutine,
  markOnboardingComplete,
  updateProfile,
} from '../../lib/database'
import type { TrainingMethod } from '../../types'

interface Props {
  onFinish: () => void
}

const DURATION_OPTIONS = [1, 2, 3, 4, 5, 6] as const

const GOAL_LABELS: Record<string, string> = {
  hypertrophy:   'Hipertrofia',
  weight_loss:   'Pérdida de Peso',
  toning:        'Tonificación',
  recomposition: 'Recomposición',
  weight_gain:   'Ganancia de Masa',
  maintenance:   'Mantenimiento',
}

// Block sequence per goal — mirrors programEngine (for preview only)
const BLOCK_SEQUENCES: Record<string, TrainingMethod[]> = {
  hypertrophy:   ['hypertrophy', 'volume',      'strength',    'deload', 'hypertrophy',  'volume'],
  weight_loss:   ['volume',      'hypertrophy', 'volume',      'deload', 'volume',       'hypertrophy'],
  toning:        ['volume',      'hypertrophy', 'volume',      'deload', 'volume',       'hypertrophy'],
  recomposition: ['hypertrophy', 'strength',    'volume',      'deload', 'hypertrophy',  'strength'],
  weight_gain:   ['hypertrophy', 'strength',    'hypertrophy', 'deload', 'strength',     'hypertrophy'],
  maintenance:   ['hypertrophy', 'volume',      'hypertrophy', 'deload', 'hypertrophy',  'volume'],
}

export function Step11_ProgramSetup({ onFinish }: Props) {
  const state                 = useOnboardingStore()
  const { user, setStatus }   = useAuthStore()
  const [duration, setDuration] = useState<number>(3)
  const [saving, setSaving]     = useState(false)
  const [saveStep, setSaveStep] = useState('')
  const [saveError, setSaveError] = useState<string | null>(null)

  const goal         = state.bodyGoal ?? 'hypertrophy'
  const goalSequence = (BLOCK_SEQUENCES[goal] ?? BLOCK_SEQUENCES.hypertrophy).slice(0, duration)
  const totalWeeks   = duration * 4

  const handleCreate = async () => {
    setSaving(true)
    setSaveError(null)
    setSaveStep('Generando tu programa...')

    try {
      // ── Build data synchronously ───────────────────────────────────────────
      const weightMap = state.weightMap ?? buildWeightMap(state)
      if (!state.weightMap) state.setWeightMap(weightMap)
      const routine = generateRoutine(weightMap)
      const program = generateProgram(weightMap, duration, goal)

      if (!user) { onFinish(); return }

      setSaveStep('Guardando...')

      const profileData: Record<string, unknown> = {
        full_name: state.profile.fullName || null,
        age:       state.profile.age      || null,
        weight_kg: state.profile.weightKg || null,
        height_cm: state.profile.heightCm || null,
      }
      if (state.profile.gender) profileData.gender = state.profile.gender

      // ── Everything in one parallel batch ──────────────────────────────────
      const [, goalResult] = await Promise.all([
        updateProfile(user.id, profileData).catch(e => console.error('[profile]', e)),
        saveUserGoal(user.id, state).catch(e => { console.error('[goal]', e); return { data: null, error: e } }),
        saveProgram(user.id, program).catch(e => console.error('[program]', e)),
        markOnboardingComplete(user.id).catch(e => console.error('[onboarding]', e)),
      ])

      // ── Await routine save before navigating (avoids race with Dashboard fetch) ──
      const goalData = (goalResult as Awaited<ReturnType<typeof saveUserGoal>>)?.data
      if (goalData) {
        await saveRoutine(user.id, goalData.id, routine).catch(e => console.error('[routine]', e))
      }

      // ── Update auth status directly — no extra round trip ─────────────────
      setStatus('authenticated')

      setSaving(false)
      onFinish()

    } catch (e) {
      console.error('[ProgramSetup] Save failed:', e)
      setSaving(false)
      setSaveError('Hubo un error al guardar. Inténtalo de nuevo.')
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-dark-900 safe-top safe-bottom">
      {/* Header */}
      <div className="relative overflow-hidden flex-shrink-0 pt-14 pb-8 px-5">
        <div className="absolute inset-0 bg-hero-glow opacity-50" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <p className="text-xs font-bold text-brand-400 uppercase tracking-widest mb-2">
            Último paso
          </p>
          <h1 className="text-3xl font-black text-white leading-tight mb-2">
            Diseña tu programa
          </h1>
          <p className="text-white/50 text-sm leading-relaxed">
            Elige cuántos meses quieres entrenar. Cada mes es un bloque con método y ejercicios distintos.
          </p>
        </motion.div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-36">

        {/* Goal badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl px-4 py-3 mb-6 flex items-center gap-3"
        >
          <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center flex-shrink-0">
            <div className="w-3 h-3 rounded-full bg-brand-500" />
          </div>
          <div>
            <p className="text-xs text-white/40">Objetivo detectado</p>
            <p className="text-white font-bold text-sm">{GOAL_LABELS[goal] ?? goal}</p>
          </div>
        </motion.div>

        {/* Duration selector */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-6"
        >
          <p className="text-xs text-white/40 font-bold uppercase tracking-wider mb-3">
            Duración del programa
          </p>
          <div className="grid grid-cols-6 gap-2">
            {DURATION_OPTIONS.map(n => (
              <button
                key={n}
                onClick={() => setDuration(n)}
                className={[
                  'flex flex-col items-center py-3 rounded-xl border transition-all duration-200',
                  duration === n
                    ? 'bg-brand-500 border-brand-500 text-white shadow-glow-sm-red'
                    : 'glass border-white/10 text-white/50 hover:text-white',
                ].join(' ')}
              >
                <span className="text-lg font-black leading-none">{n}</span>
                <span className="text-[10px] mt-0.5 opacity-70">{n === 1 ? 'mes' : 'meses'}</span>
              </button>
            ))}
          </div>
          <p className="text-white/30 text-xs mt-2 text-center">
            {totalWeeks} semanas · {duration} {duration === 1 ? 'bloque' : 'bloques'} de 4 semanas
          </p>
        </motion.div>

        {/* Block sequence preview */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <p className="text-xs text-white/40 font-bold uppercase tracking-wider mb-3">
            Secuencia de bloques
          </p>
          <div className="flex flex-col gap-2">
            {goalSequence.map((method, i) => {
              const params = METHOD_PARAMS[method]
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.06 }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${METHOD_BG[method]}`}
                >
                  {/* Block number */}
                  <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-black text-white/60">{i + 1}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold ${METHOD_COLORS[method]}`}>
                      {params.label}
                    </p>
                    <p className="text-xs text-white/40 truncate">{params.description}</p>
                  </div>

                  {/* Sets × Reps */}
                  <div className="flex-shrink-0 text-right">
                    <p className="text-white/70 text-xs font-bold tabular-nums">
                      {params.sets} × {params.reps}
                    </p>
                    <p className="text-white/30 text-[10px]">{params.rest}s desc.</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* What to expect */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-4 mb-4"
        >
          <p className="text-xs text-white/40 font-bold uppercase tracking-wider mb-3">
            Cómo funciona
          </p>
          <div className="flex flex-col gap-2.5">
            {[
              { icon: '🔄', text: 'Los ejercicios rotan cada bloque para evitar adaptación' },
              { icon: '📈', text: 'Cada bloque progresa en intensidad o volumen según el método' },
              { icon: '💤', text: 'Los bloques de Deload son obligatorios para la recuperación' },
              { icon: '🎯', text: 'Al finalizar un bloque, activa el siguiente desde la app' },
            ].map(({ icon, text }, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="text-base leading-none mt-0.5">{icon}</span>
                <p className="text-white/50 text-xs leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom CTA */}
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
          onClick={handleCreate}
          disabled={saving}
          className="btn-primary w-full text-lg py-5"
        >
          {saving ? (
            <span className="flex items-center gap-2 justify-center">
              <svg className="w-5 h-5 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="truncate">{saveStep || 'Creando tu programa...'}</span>
            </span>
          ) : saveError
            ? 'Reintentar'
            : `Crear programa de ${duration} ${duration === 1 ? 'mes' : 'meses'}`
          }
        </motion.button>
      </div>
    </div>
  )
}
