import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore }     from './store/auth'
import { useSessionStore }  from './store/session'
import { AuthPage }         from './pages/auth/AuthPage'
import { VerifyEmail }      from './pages/auth/VerifyEmail'
import { OnboardingFlow }   from './pages/onboarding/OnboardingFlow'
import { Dashboard }        from './pages/dashboard/Dashboard'
import { RoutinePage }      from './pages/routine/RoutinePage'
import { WorkoutSession }   from './pages/session/WorkoutSession'
import { SessionComplete }  from './pages/session/SessionComplete'
import { ProgressPage }     from './pages/progress/ProgressPage'
import { ProfilePage }      from './pages/profile/ProfilePage'
import { BottomNav }        from './components/layout/BottomNav'
import type { NavTab }      from './components/layout/BottomNav'

// ─── Loading ──────────────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-dark-900">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full bg-brand-500/20 animate-ping" />
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-glow-red">
          <span className="text-white font-black text-xl tracking-tighter">LF</span>
        </div>
      </div>
      <p className="text-white/20 text-xs font-semibold mt-6 tracking-widest uppercase animate-pulse">
        Cargando...
      </p>
    </div>
  )
}

// ─── Main app with tabs ───────────────────────────────────────────────────────
function MainApp() {
  const [tab, setTab] = useState<NavTab>('home')
  const { active: session, endSession } = useSessionStore()

  // Increments every time a session is saved — triggers re-fetch in Dashboard/RoutinePage
  const [sessionRefreshKey, setSessionRefreshKey] = useState(0)

  // Session completion state
  const [completedSession, setCompletedSession] = useState<{
    dayName: string
    durationMinutes: number
    totalSets: number
    totalVolume: number
  } | null>(null)

  const handleSessionComplete = () => {
    if (!session) return
    const durationMinutes = Math.round(
      (Date.now() - new Date(session.startedAt).getTime()) / 60000
    )
    let totalSets = 0
    let totalVolume = 0
    session.exercises.forEach(ex => {
      ex.sets.forEach(s => {
        if (s.completed) {
          totalSets++
          if (s.weightKg && s.actualReps) totalVolume += s.weightKg * s.actualReps
        }
      })
    })
    setCompletedSession({
      dayName: session.dayName,
      durationMinutes,
      totalSets,
      totalVolume: Math.round(totalVolume),
    })
    setSessionRefreshKey(k => k + 1)
  }

  return (
    <div className="relative">
      {/* Tab content */}
      <AnimatePresence mode="wait">
        {tab === 'home' && (
          <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <Dashboard onGoToRoutine={() => setTab('routine')} refreshKey={sessionRefreshKey} />
          </motion.div>
        )}
        {tab === 'routine' && (
          <motion.div key="routine" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <RoutinePage onStartSession={() => {}} refreshKey={sessionRefreshKey} />
          </motion.div>
        )}
        {tab === 'progress' && (
          <motion.div key="progress" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <ProgressPage />
          </motion.div>
        )}
        {tab === 'profile' && (
          <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <ProfilePage />
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav active={tab} onChange={setTab} />

      {/* Workout session overlay */}
      <AnimatePresence>
        {session && !completedSession && (
          <motion.div
            key="session"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 35 }}
            className="fixed inset-0 z-30"
          >
            <WorkoutSession
              onClose={() => endSession()}
              onComplete={handleSessionComplete}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session complete overlay */}
      <AnimatePresence>
        {completedSession && (
          <motion.div
            key="complete"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <SessionComplete
              dayName={completedSession.dayName}
              durationMinutes={completedSession.durationMinutes}
              totalSets={completedSession.totalSets}
              totalVolume={completedSession.totalVolume}
              onContinue={() => {
                setCompletedSession(null)
                setTab('routine')
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── App root ─────────────────────────────────────────────────────────────────
export default function App() {
  const { status, init } = useAuthStore()

  useEffect(() => { init() }, [init])

  return (
    <div className="max-w-md mx-auto bg-dark-900 min-h-screen overflow-x-hidden w-full">
      <AnimatePresence mode="wait">
        {status === 'loading' && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LoadingScreen />
          </motion.div>
        )}
        {status === 'unauthenticated' && (
          <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AuthPage />
          </motion.div>
        )}
        {status === 'unverified' && (
          <motion.div key="verify" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <VerifyEmail />
          </motion.div>
        )}
        {status === 'needs_onboarding' && (
          <motion.div key="onboarding" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <OnboardingFlow onComplete={() => {}} />
          </motion.div>
        )}
        {status === 'authenticated' && (
          <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <MainApp />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
