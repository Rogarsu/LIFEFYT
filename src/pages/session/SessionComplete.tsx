import { motion } from 'framer-motion'

interface Props {
  dayName:          string
  durationMinutes:  number
  totalSets:        number
  totalVolume:      number
  onContinue:       () => void
}

export function SessionComplete({ dayName, durationMinutes, totalSets, totalVolume, onContinue }: Props) {
  const stats = [
    { label: 'Duración',  value: `${durationMinutes}`, unit: 'min'  },
    { label: 'Series',    value: `${totalSets}`,        unit: 'totales' },
    { label: 'Volumen',   value: `${totalVolume.toLocaleString()}`, unit: 'kg' },
  ]

  return (
    <div className="fixed inset-0 z-40 max-w-md mx-auto bg-dark-900 flex flex-col items-center justify-center px-6 safe-top safe-bottom">
      {/* Background glow */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&q=80&fit=crop"
          alt=""
          className="w-full h-full object-cover opacity-15"
        />
        <div className="absolute inset-0 bg-dark-900/80" />
        <div className="absolute inset-0 bg-hero-glow" />
      </div>

      <div className="relative text-center w-full">
        {/* Trophy animation */}
        <motion.div
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
          className="w-28 h-28 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-glow-red"
        >
          <svg className="w-14 h-14 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/>
          </svg>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-brand-400 text-xs font-black uppercase tracking-widest mb-2">
            ¡Entrenamiento completado!
          </p>
          <h1 className="text-3xl font-black text-white mb-1 leading-tight">{dayName}</h1>
          <p className="text-white/40 text-sm mb-8">Excelente trabajo. Sigue así.</p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="grid grid-cols-3 gap-3 mb-8"
        >
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="glass rounded-2xl p-4"
            >
              <p className="text-3xl font-black text-brand-400 tabular-nums">{s.value}</p>
              <p className="text-white/30 text-xs font-bold mt-0.5">{s.unit}</p>
              <p className="text-white/20 text-[10px] mt-0.5">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Motivational message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="glass rounded-2xl p-4 mb-8 text-left"
        >
          <p className="text-white/60 text-sm leading-relaxed">
            Cada sesión completada es un paso más hacia tu meta.
            El músculo crece durante el descanso — asegúrate de dormir bien y comer suficiente proteína hoy.
          </p>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          whileTap={{ scale: 0.97 }}
          onClick={onContinue}
          className="btn-primary w-full py-5 text-lg"
        >
          Ver mi rutina
        </motion.button>
      </div>
    </div>
  )
}
