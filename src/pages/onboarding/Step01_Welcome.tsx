import { motion } from 'framer-motion'

interface Props {
  onStart: () => void
}

export function Step01_Welcome({ onStart }: Props) {
  return (
    <div className="relative flex flex-col min-h-dvh overflow-hidden">
      {/* Full-bleed background */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=900&q=90&fit=crop"
          alt="Fitness"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-dark-900/60 via-dark-900/50 to-dark-900" />
        <div className="absolute inset-0 bg-hero-glow" />
      </div>

      {/* Content */}
      <div className="relative flex flex-col min-h-dvh px-6 safe-top safe-bottom">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y:   0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="pt-16 text-center"
        >
          <span className="text-5xl font-black tracking-tighter">
            <span className="text-gradient-fire">LIFE</span>
            <span className="text-white">FYT</span>
          </span>
          <p className="text-white/40 text-xs tracking-[0.3em] uppercase mt-1 font-semibold">
            Tu mejor versión
          </p>
        </motion.div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Hero text */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y:  0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="pb-10"
        >
          <h1 className="text-4xl font-black text-white leading-[1.1] tracking-tight text-balance">
            El entrenamiento que
            <br />
            <span className="text-gradient-red">realmente funciona</span>
          </h1>
          <p className="text-white/55 text-base mt-4 leading-relaxed">
            Rutinas 100% personalizadas basadas en tus metas, tu nivel y tu estilo de vida.
            Sin plantillas genéricas.
          </p>

          {/* Stats row */}
          <div className="flex gap-6 mt-8 mb-10">
            {[
              { value: '100%', label: 'Personalizado' },
              { value: '4+',   label: 'Categorías de meta' },
              { value: '∞',    label: 'Combinaciones' },
            ].map(s => (
              <div key={s.label} className="flex-1 text-center">
                <p className="text-2xl font-black text-brand-400">{s.value}</p>
                <p className="text-white/40 text-xs mt-0.5 font-medium">{s.label}</p>
              </div>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onStart}
            className="btn-primary w-full text-lg py-5"
          >
            Comenzar mi transformación
          </motion.button>

          <p className="text-center text-white/25 text-xs mt-4">
            Gratuito durante el beta · Sin tarjeta
          </p>
        </motion.div>
      </div>
    </div>
  )
}
