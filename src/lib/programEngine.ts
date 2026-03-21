/**
 * Program Engine — LIFEFYT
 *
 * Generates a multi-block periodized program (1–6 months).
 * Each block = 4 weeks. Exercises rotate across blocks via slots.
 */

import type {
  UserWeightMap,
  BodyCompositionGoal,
  TrainingMethod,
  TrainingSplit,
  ExerciseSlot,
  ProgramDay,
  ProgramBlock,
  UserProgram,
  Exercise,
  MuscleArea,
} from '../types'
import { EXERCISES, EQUIPMENT_AVAILABILITY } from '../constants/exercises'

// ─── Block sequences per goal (up to 6 months) ───────────────────────────────
// Index = month number - 1. Take first N entries for N-month program.
const BLOCK_SEQUENCES: Record<BodyCompositionGoal, TrainingMethod[]> = {
  hypertrophy:   ['hypertrophy', 'volume',      'strength',    'deload', 'hypertrophy',  'volume'],
  weight_loss:   ['volume',      'hypertrophy', 'volume',      'deload', 'volume',       'hypertrophy'],
  toning:        ['volume',      'hypertrophy', 'volume',      'deload', 'volume',       'hypertrophy'],
  recomposition: ['hypertrophy', 'strength',    'volume',      'deload', 'hypertrophy',  'strength'],
  weight_gain:   ['hypertrophy', 'strength',    'hypertrophy', 'deload', 'strength',     'hypertrophy'],
  maintenance:   ['hypertrophy', 'volume',      'hypertrophy', 'deload', 'hypertrophy',  'volume'],
}

// ─── Method parameters ────────────────────────────────────────────────────────
interface MethodParams {
  label:       string
  description: string
  sets:        string
  reps:        string
  rest:        number   // seconds
  tempo?:      string
}

export const METHOD_PARAMS: Record<TrainingMethod, MethodParams> = {
  hypertrophy: {
    label:       'Hipertrofia',
    description: 'Máxima ganancia muscular con rango medio de repeticiones.',
    sets: '4', reps: '8-12', rest: 90,
  },
  volume: {
    label:       'Volumen',
    description: 'Alto volumen para densidad muscular y resistencia.',
    sets: '4', reps: '12-15', rest: 60,
  },
  strength: {
    label:       'Fuerza',
    description: 'Cargas máximas para desarrollar fuerza neuronal.',
    sets: '5', reps: '4-6', rest: 180,
  },
  deload: {
    label:       'Deload',
    description: 'Recuperación activa al 60% de intensidad. Clave para el progreso.',
    sets: '3', reps: '10-12', rest: 90, tempo: '3-0-2-0',
  },
}

// ─── Split structure (mirrors weightEngine, adds dayType) ─────────────────────
type DayType = 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'core' | 'full_body'

interface DayTemplate {
  name:    string
  focus:   string
  areas:   MuscleArea[]
  dayType: DayType
}

const SPLIT_STRUCTURE: Record<TrainingSplit, DayTemplate[]> = {
  push_pull_legs: [
    { name: 'Push — Empuje',    focus: 'Pecho, Hombros, Tríceps',      areas: ['upperBody'],            dayType: 'push'      },
    { name: 'Pull — Jalón',     focus: 'Espalda, Bíceps',              areas: ['upperBody'],            dayType: 'pull'      },
    { name: 'Legs — Piernas',   focus: 'Cuádriceps, Isquios, Glúteos', areas: ['lowerBody'],            dayType: 'legs'      },
    { name: 'Push — Empuje B',  focus: 'Pecho, Hombros, Tríceps',      areas: ['upperBody'],            dayType: 'push'      },
    { name: 'Pull — Jalón B',   focus: 'Espalda, Bíceps',              areas: ['upperBody'],            dayType: 'pull'      },
    { name: 'Legs + Core',      focus: 'Piernas y Core',               areas: ['lowerBody', 'core'],    dayType: 'legs'      },
  ],
  full_body: [
    { name: 'Día A — Cuerpo Completo', focus: 'Cuerpo Completo', areas: ['upperBody', 'lowerBody', 'core'], dayType: 'full_body' },
    { name: 'Día B — Cuerpo Completo', focus: 'Cuerpo Completo', areas: ['upperBody', 'lowerBody', 'core'], dayType: 'full_body' },
    { name: 'Día C — Cuerpo Completo', focus: 'Cuerpo Completo', areas: ['upperBody', 'lowerBody', 'core'], dayType: 'full_body' },
  ],
  upper_lower: [
    { name: 'Día A — Tren Superior',    focus: 'Tren Superior',       areas: ['upperBody'],          dayType: 'upper' },
    { name: 'Día B — Tren Inferior',    focus: 'Tren Inferior',       areas: ['lowerBody'],          dayType: 'lower' },
    { name: 'Día C — Tren Superior',    focus: 'Tren Superior',       areas: ['upperBody'],          dayType: 'upper' },
    { name: 'Día D — Inferior + Core',  focus: 'Tren Inferior y Core',areas: ['lowerBody', 'core'],  dayType: 'lower' },
  ],
  upper_lower_core: [
    { name: 'Día A — Tren Superior',    focus: 'Tren Superior',       areas: ['upperBody'],          dayType: 'upper'     },
    { name: 'Día B — Tren Inferior',    focus: 'Tren Inferior',       areas: ['lowerBody'],          dayType: 'lower'     },
    { name: 'Día C — Core Intenso',     focus: 'Core',                areas: ['core'],               dayType: 'core'      },
    { name: 'Día D — Tren Superior',    focus: 'Tren Superior',       areas: ['upperBody'],          dayType: 'upper'     },
    { name: 'Día E — Inferior + Core',  focus: 'Tren Inferior y Core',areas: ['lowerBody', 'core'],  dayType: 'lower'     },
  ],
  bro_split: [
    { name: 'Pecho',           focus: 'Pecho',              areas: ['upperBody'],          dayType: 'push'  },
    { name: 'Espalda',         focus: 'Espalda',            areas: ['upperBody'],          dayType: 'pull'  },
    { name: 'Hombros',         focus: 'Hombros',            areas: ['upperBody'],          dayType: 'upper' },
    { name: 'Brazos',          focus: 'Bíceps y Tríceps',   areas: ['upperBody'],          dayType: 'upper' },
    { name: 'Piernas + Core',  focus: 'Piernas y Core',     areas: ['lowerBody', 'core'],  dayType: 'legs'  },
  ],
}

// ─── How many exercises per session ──────────────────────────────────────────
function getExerciseCount(sessionDuration: number, experience: string): number {
  const counts: Record<number, Record<string, number>> = {
    45: { beginner: 4, intermediate: 5, advanced: 5 },
    60: { beginner: 5, intermediate: 6, advanced: 7 },
    90: { beginner: 6, intermediate: 8, advanced: 10 },
  }
  return counts[sessionDuration]?.[experience] ?? 5
}

// ─── Score a single exercise against the weight map ──────────────────────────
function scoreExercise(exercise: Exercise, map: UserWeightMap): number {
  const available = EQUIPMENT_AVAILABILITY[map.equipment] ?? []
  if (!exercise.equipment.some(eq => available.includes(eq))) return 0

  const diffLevel = { beginner: 1, intermediate: 2, advanced: 3 }
  const userLevel = diffLevel[map.experience]
  if (exercise.difficulty > userLevel + 1) return 0

  let score = (map.muscleGroups[exercise.muscleGroup] ?? 0) * 10

  // Detail bonus
  const allMuscles = [...exercise.primaryMuscles, ...exercise.secondaryMuscles]
  allMuscles.forEach(muscle => {
    if (muscle in map.upperBodyDetails)
      score += (map.upperBodyDetails[muscle as keyof typeof map.upperBodyDetails] ?? 0) * 3
    if (muscle in map.lowerBodyDetails)
      score += (map.lowerBodyDetails[muscle as keyof typeof map.lowerBodyDetails] ?? 0) * 3
    if (muscle in map.coreDetails)
      score += (map.coreDetails[muscle as keyof typeof map.coreDetails] ?? 0) * 3
  })

  score *= exercise.compoundBonus
  if (exercise.difficulty === userLevel) score *= 1.2

  return Math.round(score * 100) / 100
}

// ─── Build exercise slots for one day ────────────────────────────────────────
// Pool size: how many alternative exercises per slot (for rotation across blocks)
const POOL_SIZE = 5

function buildDaySlots(
  dayTemplate: DayTemplate,
  map: UserWeightMap,
  exerciseCount: number,
): ExerciseSlot[] {
  // Build day-specific weight map (boost areas that aren't selected but needed today)
  const dayMap = { ...map, muscleGroups: { ...map.muscleGroups } }
  dayTemplate.areas.forEach(area => {
    if (dayMap.muscleGroups[area] === 0) dayMap.muscleGroups[area] = 1
  })

  // Filter pool to this day's areas
  const pool = EXERCISES.filter(ex => dayTemplate.areas.includes(ex.muscleGroup))

  // Score and sort
  const scored = pool
    .map(ex => ({ ex, score: scoreExercise(ex, dayMap) }))
    .filter(e => e.score > 0)
    .sort((a, b) => b.score - a.score)

  // Select primary exercises (one per muscle group, max 2 per group)
  // — same algorithm as weightEngine selectTopExercises
  const muscleCount: Record<string, number> = {}
  const selected: typeof scored = []

  for (const item of scored) {
    if (selected.length >= exerciseCount) break
    const primary = item.ex.primaryMuscles[0] ?? 'unknown'
    muscleCount[primary] = (muscleCount[primary] ?? 0) + 1
    if (muscleCount[primary] <= 2) selected.push(item)
  }

  // For each selected exercise, build its rotation pool:
  // alternatives = same primaryMuscle[0] + same type, ordered by score
  return selected.map((item, slotIdx) => {
    const { ex } = item
    const primaryMuscle = ex.primaryMuscles[0] ?? 'unknown'
    const exerciseType  = ex.type

    const peers = scored
      .filter(e =>
        e.ex.id !== ex.id &&
        e.ex.primaryMuscles[0] === primaryMuscle &&
        e.ex.type === exerciseType,
      )
      .slice(0, POOL_SIZE - 1)
      .map(e => e.ex.id)

    return {
      slotId:       `d${slotIdx + 1}_slot${slotIdx}_${primaryMuscle.replace(/\s+/g, '_')}`,
      label:        primaryMuscle,
      exercisePool: [ex.id, ...peers],
      currentIdx:   0,
    }
  })
}

// ─── Build day templates (shared across all blocks) ──────────────────────────
function buildDayTemplates(map: UserWeightMap): Array<DayTemplate & { slots: ExerciseSlot[] }> {
  const structure   = SPLIT_STRUCTURE[map.suggestedSplit].slice(0, map.daysPerWeek)
  const exCount     = getExerciseCount(map.sessionDuration, map.experience)

  return structure.map(dayTemplate => ({
    ...dayTemplate,
    slots: buildDaySlots(dayTemplate, map, exCount),
  }))
}

// ─── Build a single block ─────────────────────────────────────────────────────
function buildBlock(
  blockNumber:   number,
  method:        TrainingMethod,
  dayTemplates:  Array<DayTemplate & { slots: ExerciseSlot[] }>,
): ProgramBlock {
  const params    = METHOD_PARAMS[method]
  const isDeload  = method === 'deload'

  const days: ProgramDay[] = dayTemplates.map((dayTemplate, dayIdx) => ({
    dayNumber: dayIdx + 1,
    name:      dayTemplate.name,
    focus:     dayTemplate.focus,
    // Rotate: each block uses the next exercise in each slot's pool
    slots: dayTemplate.slots.map(slot => ({
      ...slot,
      currentIdx: (blockNumber - 1) % slot.exercisePool.length,
    })),
  }))

  return {
    blockNumber,
    weeks:        4,
    method,
    isDeload,
    label:        `Bloque ${blockNumber} — ${params.label}`,
    setsOverride: params.sets,
    repsOverride: params.reps,
    restOverride: params.rest,
    tempo:        params.tempo,
    days,
  }
}

// ─── Main export: generate full program ──────────────────────────────────────
export function generateProgram(
  map:            UserWeightMap,
  durationMonths: number,
  goal:           BodyCompositionGoal,
): UserProgram {
  const sequence    = BLOCK_SEQUENCES[goal].slice(0, durationMonths)
  const dayTemplates = buildDayTemplates(map)

  const blocks: ProgramBlock[] = sequence.map((method, i) =>
    buildBlock(i + 1, method, dayTemplates),
  )

  return {
    durationMonths,
    startDate:    new Date().toISOString().split('T')[0],
    currentBlock: 1,
    currentWeek:  1,
    goal,
    experience:   map.experience,
    equipment:    map.equipment,
    daysPerWeek:  map.daysPerWeek,
    weightMap:    map,
    blocks,
  }
}

// ─── Helper: get the active WorkoutDay for the current block ─────────────────
// Returns exercises resolved from slot pools, with method overrides applied
export function getActiveBlockDay(
  program: UserProgram,
  dayIndex: number,
): { name: string; focus: string; exercises: Array<{ exerciseId: string; sets: string; reps: string; rest: number }> } | null {
  const block = program.blocks.find(b => b.blockNumber === program.currentBlock)
  const day   = block?.days[dayIndex]
  if (!block || !day) return null

  const exercises = day.slots
    .map(slot => {
      const exerciseId = slot.exercisePool[slot.currentIdx] ?? slot.exercisePool[0]
      if (!exerciseId) return null
      const ex = EXERCISES.find(e => e.id === exerciseId)
      if (!ex) return null
      return {
        exerciseId,
        sets: block.setsOverride ?? ex.sets[program.experience],
        reps: block.repsOverride ?? ex.reps[program.experience],
        rest: block.restOverride ?? ex.rest[program.experience],
      }
    })
    .filter((e): e is NonNullable<typeof e> => e !== null)

  return { name: day.name, focus: day.focus, exercises }
}

// ─── Helper: advance to next block ───────────────────────────────────────────
export function advanceBlock(program: UserProgram): UserProgram {
  const next = program.currentBlock + 1
  if (next > program.blocks.length) return program  // already at end
  return { ...program, currentBlock: next, currentWeek: 1 }
}

// ─── Display helpers ─────────────────────────────────────────────────────────
export const METHOD_COLORS: Record<TrainingMethod, string> = {
  hypertrophy: 'text-brand-400',
  volume:      'text-electric-400',
  strength:    'text-yellow-400',
  deload:      'text-white/50',
}

export const METHOD_BG: Record<TrainingMethod, string> = {
  hypertrophy: 'bg-brand-500/15 border-brand-500/30',
  volume:      'bg-electric-500/15 border-electric-500/30',
  strength:    'bg-yellow-500/15 border-yellow-500/30',
  deload:      'bg-white/5 border-white/10',
}
