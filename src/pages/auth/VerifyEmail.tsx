import { motion } from 'framer-motion'
import { useAuthStore } from '../../store/auth'

export function VerifyEmail() {
  const { user } = useAuthStore()

  return (
    <div className="relative flex flex-col items-center justify-center min-h-dvh bg-dark-900 px-6 safe-top safe-bottom">
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80&fit=crop"
          alt=""
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-dark-900/80" />
      </div>

      <div className="relative text-center max-w-sm">
        {/* Animated envelope */}
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-glow-red"
        >
          <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="text-3xl font-black text-white mb-3">
            Revisa tu email
          </h1>
          <p className="text-white/50 text-base leading-relaxed mb-2">
            Te enviamos un enlace de confirmación a:
          </p>
          <p className="text-brand-400 font-bold text-lg mb-6">
            {user?.email}
          </p>
          <p className="text-white/30 text-sm leading-relaxed">
            Abre el email y haz clic en el enlace para activar tu cuenta. Revisa también la carpeta de spam.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
