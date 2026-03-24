import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { UserProgram } from '../types'
import { advanceSession } from '../lib/database'

interface ProgramState {
  program:   UserProgram | null
  loading:   boolean
  advancing: boolean
}

interface ProgramActions {
  setProgram:  (p: UserProgram | null) => void
  setLoading:  (v: boolean) => void
  clear:       () => void
  /** Marks current session complete and advances. Returns true if block advanced. */
  advance: () => Promise<boolean>
}

export const useProgramStore = create<ProgramState & ProgramActions>()(
  devtools(
    (set, get) => ({
      program:   null,
      loading:   false,
      advancing: false,

      setProgram: (program) => set({ program, loading: false }),
      setLoading: (loading) => set({ loading }),
      clear:      () => set({ program: null, loading: false, advancing: false }),

      advance: async () => {
        const { program } = get()
        if (!program?.id) return false

        const sessionsPerBlock = program.daysPerWeek * 4
        set({ advancing: true })

        const { error, nextBlock, nextSession, advancedBlock, completedSessions } =
          await advanceSession(
            program.id,
            program.currentBlock,
            program.currentSession,
            sessionsPerBlock,
          )

        if (!error) {
          set({
            program: {
              ...program,
              currentBlock:      nextBlock,
              currentSession:    nextSession,
              completedSessions,
            },
            advancing: false,
          })
          return advancedBlock
        }

        console.error('[advance]', error)
        set({ advancing: false })
        return false
      },
    }),
    { name: 'lifefyt-program' },
  ),
)
