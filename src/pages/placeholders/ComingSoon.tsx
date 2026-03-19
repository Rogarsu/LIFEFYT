import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../../store/auth'

interface Props {
  title:    string
  subtitle: string
  image:    string
}

export function ComingSoon({ title, subtitle, image }: Props) {
  const { signOut, user } = useAuthStore()
  const [confirming, setConfirming] = useState(false)
  const [loading,    setLoading]    = useState(false)

  const handleSignOut = async () => {
    setLoading(true)
    await signOut()
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-dark-900 px-6 safe-top safe-bottom">
      <div className="absolute inset-0">
        <img src={image} alt="" className="w-full h-full object-cover opacity-10" />
        <div className="absolute inset-0 bg-dark-900/70" />
      </div>

      <div className="relative text-center w-full max-w-xs">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="w-20 h-20 rounded-3xl glass border border-white/10 flex items-center justify-center mx-auto mb-6"
        >
          <svg className="w-10 h-10 text-white/20" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
          </svg>
        </motion.div>

        <h2 className="text-2xl font-black text-white mb-2">{title}</h2>
        <p className="text-white/40 text-sm leading-relaxed">{subtitle}</p>

        <div className="mt-4 glass px-4 py-2 rounded-full inline-block mb-10">
          <span className="text-brand-400 text-xs font-bold">Próximamente</span>
        </div>

        {/* User info */}
        {user?.email && (
          <div className="glass rounded-2xl px-4 py-3 mb-4 text-left">
            <p className="text-white/30 text-xs font-semibold uppercase tracking-wider mb-0.5">Cuenta</p>
            <p className="text-white/70 text-sm font-medium truncate">{user.email}</p>
          </div>
        )}

        {/* Sign out button */}
        {!confirming ? (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setConfirming(true)}
            className="w-full py-4 rounded-2xl border border-white/10 text-white/40 font-bold text-sm hover:text-white/70 hover:border-white/20 transition-all"
          >
            Cerrar sesión
          </motion.button>
        ) : (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-4 border border-white/10"
            >
              <p className="text-white font-bold text-sm mb-3">¿Cerrar sesión?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirming(false)}
                  className="flex-1 py-3 rounded-xl bg-dark-600 text-white/60 font-bold text-sm hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSignOut}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 font-bold text-sm hover:bg-red-500/30 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saliendo…' : 'Confirmar'}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
