import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '../../store/auth'

// ─── Schemas ──────────────────────────────────────────────────────────────────
const loginSchema = z.object({
  email:    z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

const registerSchema = z.object({
  fullName: z.string().min(2, 'Ingresa tu nombre'),
  email:    z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  confirm:  z.string(),
}).refine(d => d.password === d.confirm, {
  message: 'Las contraseñas no coinciden',
  path:    ['confirm'],
})

type LoginForm    = z.infer<typeof loginSchema>
type RegisterForm = z.infer<typeof registerSchema>

// ─── Shared input component ───────────────────────────────────────────────────
function Field({
  label, error, type = 'text', placeholder, registration,
}: {
  label:        string
  error?:       string
  type?:        string
  placeholder:  string
  registration: Record<string, unknown>
}) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'

  return (
    <div>
      <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          type={isPassword ? (show ? 'text' : 'password') : type}
          placeholder={placeholder}
          className={[
            'input-base',
            error ? 'border-red-500/60 focus:border-red-500/80 focus:ring-red-500/20' : '',
          ].join(' ')}
          {...registration}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
          >
            {show ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        )}
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-400 text-xs mt-1.5 font-medium"
        >
          {error}
        </motion.p>
      )}
    </div>
  )
}

// ─── Login Form ───────────────────────────────────────────────────────────────
function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const { signIn, status, error, clearError } = useAuthStore()
  const loading = status === 'loading'

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    clearError()
    await signIn(data.email, data.password)
  }

  return (
    <motion.div
      key="login"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="text-2xl font-black text-white mb-1">Bienvenido de vuelta</h2>
      <p className="text-white/40 text-sm mb-8">Ingresa a tu cuenta para continuar</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field
          label="Email"
          type="email"
          placeholder="tu@email.com"
          error={errors.email?.message}
          registration={register('email')}
        />
        <Field
          label="Contraseña"
          type="password"
          placeholder="••••••••"
          error={errors.password?.message}
          registration={register('password')}
        />

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass border border-red-500/30 rounded-xl p-3"
          >
            <p className="text-red-400 text-sm">{error}</p>
          </motion.div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full mt-2"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Ingresando...
            </span>
          ) : 'Ingresar'}
        </button>
      </form>

      <p className="text-center text-white/30 text-sm mt-6">
        ¿No tienes cuenta?{' '}
        <button onClick={onSwitch} className="text-brand-400 font-bold hover:text-brand-300 transition-colors">
          Regístrate
        </button>
      </p>
    </motion.div>
  )
}

// ─── Register Form ────────────────────────────────────────────────────────────
function RegisterForm({ onSwitch }: { onSwitch: () => void }) {
  const { signUp, status, error, clearError } = useAuthStore()
  const loading = status === 'loading'

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterForm) => {
    clearError()
    await signUp(data.email, data.password, data.fullName)
  }

  return (
    <motion.div
      key="register"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="text-2xl font-black text-white mb-1">Crea tu cuenta</h2>
      <p className="text-white/40 text-sm mb-8">Es gratis durante el beta</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field
          label="Nombre completo"
          placeholder="Tu nombre"
          error={errors.fullName?.message}
          registration={register('fullName')}
        />
        <Field
          label="Email"
          type="email"
          placeholder="tu@email.com"
          error={errors.email?.message}
          registration={register('email')}
        />
        <Field
          label="Contraseña"
          type="password"
          placeholder="Mínimo 8 caracteres"
          error={errors.password?.message}
          registration={register('password')}
        />
        <Field
          label="Confirmar contraseña"
          type="password"
          placeholder="Repite tu contraseña"
          error={errors.confirm?.message}
          registration={register('confirm')}
        />

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass border border-red-500/30 rounded-xl p-3"
          >
            <p className="text-red-400 text-sm">{error}</p>
          </motion.div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full mt-2"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Creando cuenta...
            </span>
          ) : 'Crear cuenta gratis'}
        </button>
      </form>

      <p className="text-center text-white/30 text-sm mt-6">
        ¿Ya tienes cuenta?{' '}
        <button onClick={onSwitch} className="text-brand-400 font-bold hover:text-brand-300 transition-colors">
          Ingresar
        </button>
      </p>
    </motion.div>
  )
}

// ─── Auth Page ────────────────────────────────────────────────────────────────
export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('register')
  const { clearError } = useAuthStore()

  const toggle = () => {
    clearError()
    setMode(m => m === 'login' ? 'register' : 'login')
  }

  return (
    <div className="relative flex flex-col min-h-screen overflow-hidden">
      {/* Full background */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=900&q=85&fit=crop"
          alt="Auth background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-dark-900/70 via-dark-900/60 to-dark-900" />
        <div className="absolute inset-0 bg-hero-glow opacity-70" />
      </div>

      <div className="relative flex flex-col min-h-screen safe-top safe-bottom">
        {/* Top logo */}
        <div className="flex items-center justify-center pt-14 pb-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <span className="text-4xl font-black tracking-tighter">
              <span className="text-gradient-fire">LIFE</span>
              <span className="text-white">FYT</span>
            </span>
          </motion.div>
        </div>

        {/* Floating stats */}
        <div className="flex justify-center gap-4 px-6 mb-6">
          {[
            { value: '100%', label: 'Personalizado' },
            { value: 'Beta', label: 'Gratuito' },
            { value: '∞',    label: 'Rutinas' },
          ].map(s => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass px-4 py-2 rounded-2xl text-center"
            >
              <p className="text-brand-400 font-black text-lg">{s.value}</p>
              <p className="text-white/30 text-[10px] font-semibold">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Form card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.45 }}
          className="glass-dark rounded-t-3xl px-6 pt-8 pb-10 mx-0"
        >
          {/* Tab switcher */}
          <div className="flex bg-dark-700/60 rounded-2xl p-1 mb-8">
            {(['register', 'login'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => { clearError(); setMode(tab) }}
                className={[
                  'flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-250',
                  mode === tab
                    ? 'bg-brand-500 text-white shadow-glow-sm-red'
                    : 'text-white/40 hover:text-white/70',
                ].join(' ')}
              >
                {tab === 'register' ? 'Crear cuenta' : 'Ingresar'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {mode === 'login'
              ? <LoginForm    key="login"    onSwitch={toggle} />
              : <RegisterForm key="register" onSwitch={toggle} />
            }
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
