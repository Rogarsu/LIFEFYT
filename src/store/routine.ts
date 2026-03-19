import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { GeneratedRoutine } from '../types'

interface RoutineState {
  routine:  GeneratedRoutine | null
  loading:  boolean
  error:    string | null
}

interface RoutineActions {
  setRoutine: (r: GeneratedRoutine) => void
  setLoading: (v: boolean)          => void
  setError:   (e: string | null)    => void
  clear:      ()                     => void
}

export const useRoutineStore = create<RoutineState & RoutineActions>()(
  devtools(
    (set) => ({
      routine: null,
      loading: false,
      error:   null,

      setRoutine: (routine) => set({ routine, loading: false, error: null }),
      setLoading: (loading) => set({ loading }),
      setError:   (error)   => set({ error, loading: false }),
      clear:      ()        => set({ routine: null, loading: false, error: null }),
    }),
    { name: 'lifefyt-routine' },
  ),
)
