import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { supabase } from '../lib/supabase'
import type { User } from '../types'

export type AuthStatus =
  | 'loading'          // verificando sesión inicial
  | 'unauthenticated'  // no hay sesión
  | 'unverified'       // registrado pero email sin verificar
  | 'needs_onboarding' // autenticado pero sin onboarding
  | 'authenticated'    // autenticado + onboarding completo

interface AuthState {
  user:   User | null
  status: AuthStatus
  error:  string | null
}

interface AuthActions {
  signUp:         (email: string, password: string, fullName: string) => Promise<void>
  signIn:         (email: string, password: string)                   => Promise<void>
  signOut:        ()                                                   => Promise<void>
  init:           ()                                                   => Promise<void>
  setStatus:      (status: AuthStatus)                                => void
  clearError:     ()                                                  => void
  refreshProfile: ()                                                  => Promise<void>
}

export const useAuthStore = create<AuthState & AuthActions>()(
  devtools(
    (set, get) => ({
      user:   null,
      status: 'loading',
      error:  null,

      init: async () => {
        set({ status: 'loading' })
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          await resolveUserStatus(set, session.user)
        } else {
          set({ status: 'unauthenticated' })
        }

        supabase.auth.onAuthStateChange(async (_event, session) => {
          if (session?.user) {
            await resolveUserStatus(set, session.user)
          } else {
            set({ user: null, status: 'unauthenticated' })
          }
        })
      },

      refreshProfile: async () => {
        const { user } = get()
        if (!user) return
        const { data } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single()

        set({
          status: data?.onboarding_completed ? 'authenticated' : 'needs_onboarding',
        })
      },

      signUp: async (email, password, fullName) => {
        set({ error: null })
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        })

        if (error) { set({ error: error.message }); return }

        if (data.session) {
          // Email confirmation disabled in Supabase settings → go straight to onboarding
          set({
            user: {
              id:         data.user!.id,
              email:      data.user!.email ?? '',
              full_name:  fullName,
              created_at: data.user!.created_at,
            },
            status: 'needs_onboarding',
          })
        } else {
          // Email confirmation required
          set({
            user: {
              id:         data.user!.id,
              email:      data.user!.email ?? '',
              full_name:  fullName,
              created_at: data.user!.created_at ?? '',
            },
            status: 'unverified',
          })
        }
      },

      signIn: async (email, password) => {
        set({ error: null })
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) { set({ error: translateError(error.message) }); return }
        if (data.user) await resolveUserStatus(set, data.user)
      },

      signOut: async () => {
        await supabase.auth.signOut()
        set({ user: null, status: 'unauthenticated' })
      },

      setStatus:  (status) => set({ status }),
      clearError: ()       => set({ error: null }),
    }),
    { name: 'lifefyt-auth' },
  ),
)

// ─── Helpers ──────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveUserStatus(set: any, supabaseUser: any) {
  const user: User = {
    id:         supabaseUser.id,
    email:      supabaseUser.email ?? '',
    full_name:  supabaseUser.user_metadata?.full_name,
    created_at: supabaseUser.created_at,
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', supabaseUser.id)
    .single()

  const status: AuthStatus = profile?.onboarding_completed ? 'authenticated' : 'needs_onboarding'
  set({ user, status })
}

function translateError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'Email o contraseña incorrectos'
  if (msg.includes('Email not confirmed'))       return 'Confirma tu email antes de ingresar'
  if (msg.includes('User already registered'))   return 'Este email ya está registrado'
  return msg
}
