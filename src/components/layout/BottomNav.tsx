import { motion } from 'framer-motion'

export type NavTab = 'home' | 'routine' | 'progress' | 'profile'

interface Props {
  active:   NavTab
  onChange: (tab: NavTab) => void
}

const TABS: { id: NavTab; label: string; icon: (active: boolean) => React.ReactNode }[] = [
  {
    id:    'home',
    label: 'Inicio',
    icon:  (a) => (
      <svg className={`w-6 h-6 ${a ? 'text-brand-400' : 'text-white/35'}`} fill={a ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={a ? 0 : 2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    id:    'routine',
    label: 'Rutina',
    icon:  (a) => (
      <svg className={`w-6 h-6 ${a ? 'text-brand-400' : 'text-white/35'}`} fill={a ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={a ? 0 : 2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    id:    'progress',
    label: 'Progreso',
    icon:  (a) => (
      <svg className={`w-6 h-6 ${a ? 'text-brand-400' : 'text-white/35'}`} fill={a ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={a ? 0 : 2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id:    'profile',
    label: 'Perfil',
    icon:  (a) => (
      <svg className={`w-6 h-6 ${a ? 'text-brand-400' : 'text-white/35'}`} fill={a ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={a ? 0 : 2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
]

export function BottomNav({ active, onChange }: Props) {
  return (
    <div className="fixed bottom-0 inset-x-0 max-w-md mx-auto z-20" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="mx-3 mb-3 glass-dark rounded-2xl border border-white/8 px-2 py-2">
        <div className="flex items-center justify-around">
          {TABS.map(tab => {
            const isActive = active === tab.id
            return (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.88 }}
                onClick={() => onChange(tab.id)}
                className="relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors"
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-0 bg-brand-500/12 rounded-xl border border-brand-500/20"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative">{tab.icon(isActive)}</span>
                <span className={`relative text-[10px] font-bold transition-colors ${isActive ? 'text-brand-400' : 'text-white/25'}`}>
                  {tab.label}
                </span>
              </motion.button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
