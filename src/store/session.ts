import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { ActiveSession, LoggedSet, SessionExercise, WorkoutDay } from '../types'

interface SessionState {
  active: ActiveSession | null
}

interface SessionActions {
  startSession:     (day: WorkoutDay, routineId?: string) => void
  logSet:           (exerciseIdx: number, setIdx: number, data: Partial<LoggedSet>) => void
  completeSet:      (exerciseIdx: number, setIdx: number) => void
  goToExercise:     (idx: number) => void
  goToSet:          (idx: number) => void
  nextSet:          () => void
  nextExercise:     () => void
  endSession:       () => void
}

function buildSessionExercises(day: WorkoutDay): SessionExercise[] {
  return day.exercises.map(we => {
    const totalSets = parseInt(we.sets.split('-')[0]) || 3
    return {
      exerciseId:   we.exercise.id,
      exerciseName: we.exercise.nameEs,
      image:        we.exercise.image,
      targetSets:   we.sets,
      targetReps:   we.reps,
      targetRest:   we.rest,
      sets: Array.from({ length: totalSets }, (_, i) => ({
        setNumber:  i + 1,
        weightKg:   null,
        actualReps: null,
        completed:  false,
        restTaken:  0,
      })),
    }
  })
}

export const useSessionStore = create<SessionState & SessionActions>()(
  devtools(
    (set, get) => ({
      active: null,

      startSession: (day, routineId) => {
        const session: ActiveSession = {
          id:                 crypto.randomUUID(),
          routineId,
          dayNumber:          day.dayNumber,
          dayName:            day.name,
          focus:              day.focus,
          startedAt:          new Date().toISOString(),
          exercises:          buildSessionExercises(day),
          currentExerciseIdx: 0,
          currentSetIdx:      0,
        }
        set({ active: session })
      },

      logSet: (exerciseIdx, setIdx, data) =>
        set(s => {
          if (!s.active) return {}
          const exercises = s.active.exercises.map((ex, ei) => {
            if (ei !== exerciseIdx) return ex
            return {
              ...ex,
              sets: ex.sets.map((st, si) =>
                si === setIdx ? { ...st, ...data } : st
              ),
            }
          })
          return { active: { ...s.active, exercises } }
        }),

      completeSet: (exerciseIdx, setIdx) =>
        set(s => {
          if (!s.active) return {}
          const exercises = s.active.exercises.map((ex, ei) => {
            if (ei !== exerciseIdx) return ex
            return {
              ...ex,
              sets: ex.sets.map((st, si) =>
                si === setIdx ? { ...st, completed: true } : st
              ),
            }
          })
          return { active: { ...s.active, exercises } }
        }),

      goToExercise: (idx) =>
        set(s => s.active ? { active: { ...s.active, currentExerciseIdx: idx, currentSetIdx: 0 } } : {}),

      goToSet: (idx) =>
        set(s => s.active ? { active: { ...s.active, currentSetIdx: idx } } : {}),

      nextSet: () => {
        const { active } = get()
        if (!active) return
        const ex = active.exercises[active.currentExerciseIdx]
        const nextSetIdx = active.currentSetIdx + 1
        if (nextSetIdx < ex.sets.length) {
          set({ active: { ...active, currentSetIdx: nextSetIdx } })
        } else {
          // Move to next exercise
          const nextExIdx = active.currentExerciseIdx + 1
          if (nextExIdx < active.exercises.length) {
            set({ active: { ...active, currentExerciseIdx: nextExIdx, currentSetIdx: 0 } })
          }
        }
      },

      nextExercise: () => {
        const { active } = get()
        if (!active) return
        const nextIdx = active.currentExerciseIdx + 1
        if (nextIdx < active.exercises.length) {
          set({ active: { ...active, currentExerciseIdx: nextIdx, currentSetIdx: 0 } })
        }
      },

      endSession: () => set({ active: null }),
    }),
    { name: 'lifefyt-session' },
  ),
)
