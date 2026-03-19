/**
 * Exercise store — fetches exercises from Supabase and caches locally.
 * Falls back to bundled TypeScript bank if Supabase is unavailable.
 */
import { create } from 'zustand'
import { getExercises } from '../lib/database'
import { EXERCISES as LOCAL_EXERCISES } from '../constants/exerciseBank/index'
import type { Exercise } from '../types'

interface ExerciseStore {
  exercises: Exercise[]
  status: 'idle' | 'loading' | 'ready' | 'error'
  source: 'supabase' | 'local' | null
  fetch: () => Promise<void>
  byTarget: (target: string) => Exercise[]
  byEquipment: (available: string[]) => Exercise[]
}

export const useExerciseStore = create<ExerciseStore>((set, get) => ({
  exercises: [],
  status: 'idle',
  source: null,

  fetch: async () => {
    if (get().status === 'loading' || get().status === 'ready') return
    set({ status: 'loading' })

    const { data, error } = await getExercises()

    if (!error && data && data.length > 0) {
      // Map snake_case Supabase columns → camelCase Exercise interface
      const mapped: Exercise[] = data.map((row: Record<string, unknown>) => ({
        id:               row.id as string,
        name:             row.name as string,
        nameEs:           row.name_es as string,
        muscleGroup:      row.muscle_group as Exercise['muscleGroup'],
        muscleTarget:     row.muscle_target as Exercise['muscleTarget'],
        primaryMuscles:   row.primary_muscles as string[],
        secondaryMuscles: row.secondary_muscles as string[],
        equipment:        row.equipment as Exercise['equipment'],
        difficulty:       row.difficulty as 1 | 2 | 3,
        type:             row.type as 'compound' | 'isolation',
        compoundBonus:    Number(row.compound_bonus),
        image:            row.image as string ?? '',
        instructions:     row.instructions as string[],
        sets: {
          beginner:     row.sets_beginner as string,
          intermediate: row.sets_intermediate as string,
          advanced:     row.sets_advanced as string,
        },
        reps: {
          beginner:     row.reps_beginner as string,
          intermediate: row.reps_intermediate as string,
          advanced:     row.reps_advanced as string,
        },
        rest: {
          beginner:     row.rest_beginner as number,
          intermediate: row.rest_intermediate as number,
          advanced:     row.rest_advanced as number,
        },
      }))
      set({ exercises: mapped, status: 'ready', source: 'supabase' })
    } else {
      // Supabase unavailable or table not yet seeded — use local bank
      console.warn('[exercises] Supabase unavailable, using local bank', error?.message)
      set({ exercises: LOCAL_EXERCISES, status: 'ready', source: 'local' })
    }
  },

  byTarget: (target) =>
    get().exercises.filter(e => e.muscleTarget === target),

  byEquipment: (available) =>
    get().exercises.filter(e =>
      e.equipment.some(eq => available.includes(eq))
    ),
}))
