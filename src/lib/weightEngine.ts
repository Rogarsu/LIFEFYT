/**
 * Weight Engine — LIFEFYT
 *
 * This is the core algorithm that:
 * 1. Builds a UserWeightMap from all onboarding answers
 * 2. Scores every exercise against that map
 * 3. Selects and structures the optimal routine
 */

import type {
  UserWeightMap,
  OnboardingState,
  TrainingSplit,
  GeneratedRoutine,
  WorkoutDay,
  WorkoutExercise,
  Exercise,
  MuscleArea,
} from '../types'
import { EXERCISES, EQUIPMENT_AVAILABILITY } from '../constants/exercises'

// ─── Step 1: Build WeightMap from onboarding state ────────────────────────────
export function buildWeightMap(state: OnboardingState): UserWeightMap {
  const { selectedAreas, upperBodyFocus, lowerBodyFocus, coreFocus,
          experience, equipment, daysPerWeek, sessionDuration, injuries } = state

  if (!experience || !equipment || !daysPerWeek || !sessionDuration) {
    throw new Error('Onboarding not complete')
  }

  // ── Muscle group weights based on selection priority ──────────────────────
  // Index 0 in selectedAreas = highest priority = weight 3
  // Index 1 = secondary = weight 2
  // Index 2 = tertiary = weight 1
  // Not selected = weight 0
  const areaWeightMap: Record<MuscleArea, number> = {
    upperBody: 0,
    lowerBody: 0,
    core: 0,
  }

  selectedAreas.forEach((area, index) => {
    const weight = 3 - index  // 3, 2, or 1
    areaWeightMap[area] = weight
  })

  // ── Experience multipliers ────────────────────────────────────────────────
  const expMap = {
    beginner:     { volume: 0.7, intensity: 0.8, rest: 120 },
    intermediate: { volume: 1.0, intensity: 1.0, rest: 90  },
    advanced:     { volume: 1.3, intensity: 1.2, rest: 70  },
  }
  const expConfig = expMap[experience]

  // ── Determine training split ──────────────────────────────────────────────
  const suggestedSplit = determineSplit(daysPerWeek, areaWeightMap, selectedAreas)

  // ── Upper body detail weights ─────────────────────────────────────────────
  // Each selected specific muscle gets weight 2; unselected but area selected = weight 0.5
  const upperWeights = { chest: 0, back: 0, shoulders: 0, biceps: 0, triceps: 0, forearms: 0 }
  const lowerWeights = { quads: 0, hamstrings: 0, glutes: 0, calves: 0 }
  const coreWeights  = { abs: 0, obliques: 0, lowerBack: 0 }

  if (areaWeightMap.upperBody > 0) {
    // Set base weight for all upper muscles if area selected
    Object.keys(upperWeights).forEach(k => { upperWeights[k as keyof typeof upperWeights] = 0.5 })
    upperBodyFocus.forEach(muscle => { upperWeights[muscle] = 2 })
  }

  if (areaWeightMap.lowerBody > 0) {
    Object.keys(lowerWeights).forEach(k => { lowerWeights[k as keyof typeof lowerWeights] = 0.5 })
    lowerBodyFocus.forEach(muscle => { lowerWeights[muscle] = 2 })
  }

  if (areaWeightMap.core > 0) {
    Object.keys(coreWeights).forEach(k => { coreWeights[k as keyof typeof coreWeights] = 0.5 })
    coreFocus.forEach(muscle => { coreWeights[muscle] = 2 })
  }

  return {
    muscleGroups:        areaWeightMap,
    upperBodyDetails:    upperWeights,
    lowerBodyDetails:    lowerWeights,
    coreDetails:         coreWeights,
    experience,
    equipment,
    daysPerWeek,
    sessionDuration,
    suggestedSplit,
    volumeMultiplier:    expConfig.volume,
    intensityMultiplier: expConfig.intensity,
    restSeconds:         expConfig.rest,
    injuries,
  }
}

// ─── Step 2: Determine optimal split ─────────────────────────────────────────
function determineSplit(
  days: number,
  _areaWeights: Record<MuscleArea, number>,
  selectedAreas: MuscleArea[],
): TrainingSplit {
  const areaCount = selectedAreas.length

  if (days === 3) return 'full_body'

  if (days === 4) {
    if (areaCount === 1) return 'upper_lower'
    return 'upper_lower'
  }

  if (days === 5) {
    if (areaCount === 3) return 'push_pull_legs'
    if (areaCount === 2 && selectedAreas.includes('core')) return 'upper_lower_core'
    return 'push_pull_legs'
  }

  if (days === 6) return 'push_pull_legs'

  return 'full_body'
}

// ─── Step 3: Score each exercise ─────────────────────────────────────────────
export function scoreExercise(exercise: Exercise, map: UserWeightMap): number {
  // Eliminate exercises that require unavailable equipment
  const available = EQUIPMENT_AVAILABILITY[map.equipment] ?? []
  const hasEquipment = exercise.equipment.some(eq => available.includes(eq))
  if (!hasEquipment) return 0

  // Eliminate exercises too advanced for beginner
  const difficultyLevel = { beginner: 1, intermediate: 2, advanced: 3 }
  const userLevel = difficultyLevel[map.experience]
  if (exercise.difficulty > userLevel + 1) return 0  // Allow 1 level above

  // Base score from muscle group priority
  let score = (map.muscleGroups[exercise.muscleGroup] ?? 0) * 10

  // Specific muscle bonuses
  const detailBonus = getDetailBonus(exercise, map)
  score += detailBonus

  // Compound bonus — critical for hypertrophy
  score *= exercise.compoundBonus

  // Experience match bonus
  if (exercise.difficulty === userLevel) score *= 1.2

  return Math.round(score * 100) / 100
}

function getDetailBonus(exercise: Exercise, map: UserWeightMap): number {
  let bonus = 0
  const allMuscles = [...exercise.primaryMuscles, ...exercise.secondaryMuscles]

  allMuscles.forEach(muscle => {
    // Upper body detail bonus
    if (muscle in map.upperBodyDetails) {
      bonus += (map.upperBodyDetails[muscle as keyof typeof map.upperBodyDetails] ?? 0) * 3
    }
    // Lower body detail bonus
    if (muscle in map.lowerBodyDetails) {
      bonus += (map.lowerBodyDetails[muscle as keyof typeof map.lowerBodyDetails] ?? 0) * 3
    }
    // Core detail bonus
    if (muscle in map.coreDetails) {
      bonus += (map.coreDetails[muscle as keyof typeof map.coreDetails] ?? 0) * 3
    }
  })

  return bonus
}

// ─── Step 4: Select exercises per session ────────────────────────────────────
function getExerciseCount(sessionDuration: number, experience: string): number {
  const counts: Record<number, Record<string, number>> = {
    45: { beginner: 4, intermediate: 5, advanced: 5 },
    60: { beginner: 5, intermediate: 6, advanced: 7 },
    90: { beginner: 6, intermediate: 8, advanced: 10 },
  }
  return counts[sessionDuration]?.[experience] ?? 5
}

function selectTopExercises(
  pool: Exercise[],
  map: UserWeightMap,
  count: number,
): WorkoutExercise[] {
  const scored = pool
    .map(ex => ({ exercise: ex, score: scoreExercise(ex, map) }))
    .filter(e => e.score > 0)
    .sort((a, b) => b.score - a.score)

  // Take top N ensuring variety (max 2 exercises per primary muscle)
  const muscleCount: Record<string, number> = {}
  const selected: typeof scored = []

  for (const item of scored) {
    if (selected.length >= count) break
    const primary = item.exercise.primaryMuscles[0] ?? 'unknown'
    muscleCount[primary] = (muscleCount[primary] ?? 0) + 1
    if (muscleCount[primary] <= 2) selected.push(item)
  }

  return selected.map(({ exercise, score }) => ({
    exercise,
    score,
    sets: exercise.sets[map.experience],
    reps: exercise.reps[map.experience],
    rest: exercise.rest[map.experience],
  }))
}

// ─── Step 5: Build workout days ───────────────────────────────────────────────
const SPLIT_STRUCTURE: Record<TrainingSplit, Array<{ name: string; focus: string; areas: string[] }>> = {
  full_body: [
    { name: 'Día A — Cuerpo Completo', focus: 'Cuerpo Completo', areas: ['upperBody', 'lowerBody', 'core'] },
    { name: 'Día B — Cuerpo Completo', focus: 'Cuerpo Completo', areas: ['upperBody', 'lowerBody', 'core'] },
    { name: 'Día C — Cuerpo Completo', focus: 'Cuerpo Completo', areas: ['upperBody', 'lowerBody', 'core'] },
  ],
  upper_lower: [
    { name: 'Día A — Tren Superior', focus: 'Tren Superior', areas: ['upperBody'] },
    { name: 'Día B — Tren Inferior', focus: 'Tren Inferior', areas: ['lowerBody'] },
    { name: 'Día C — Tren Superior', focus: 'Tren Superior', areas: ['upperBody'] },
    { name: 'Día D — Tren Inferior + Core', focus: 'Tren Inferior y Core', areas: ['lowerBody', 'core'] },
  ],
  upper_lower_core: [
    { name: 'Día A — Tren Superior', focus: 'Tren Superior', areas: ['upperBody'] },
    { name: 'Día B — Tren Inferior', focus: 'Tren Inferior', areas: ['lowerBody'] },
    { name: 'Día C — Core Intenso', focus: 'Core', areas: ['core'] },
    { name: 'Día D — Tren Superior', focus: 'Tren Superior', areas: ['upperBody'] },
    { name: 'Día E — Tren Inferior + Core', focus: 'Tren Inferior y Core', areas: ['lowerBody', 'core'] },
  ],
  push_pull_legs: [
    { name: 'Push — Empuje', focus: 'Pecho, Hombros, Tríceps', areas: ['upperBody'] },
    { name: 'Pull — Jalón', focus: 'Espalda, Bíceps', areas: ['upperBody'] },
    { name: 'Legs — Piernas', focus: 'Cuádriceps, Isquios, Glúteos', areas: ['lowerBody'] },
    { name: 'Push — Empuje B', focus: 'Pecho, Hombros, Tríceps', areas: ['upperBody'] },
    { name: 'Pull — Jalón B', focus: 'Espalda, Bíceps', areas: ['upperBody'] },
    { name: 'Legs + Core', focus: 'Piernas y Core', areas: ['lowerBody', 'core'] },
  ],
  bro_split: [
    { name: 'Pecho', focus: 'Pecho', areas: ['upperBody'] },
    { name: 'Espalda', focus: 'Espalda', areas: ['upperBody'] },
    { name: 'Hombros', focus: 'Hombros', areas: ['upperBody'] },
    { name: 'Brazos', focus: 'Bíceps y Tríceps', areas: ['upperBody'] },
    { name: 'Piernas + Core', focus: 'Piernas y Core', areas: ['lowerBody', 'core'] },
  ],
}

// ─── Step 6: Generate full routine ───────────────────────────────────────────
export function generateRoutine(map: UserWeightMap): GeneratedRoutine {
  const structure = SPLIT_STRUCTURE[map.suggestedSplit]
  const exerciseCount = getExerciseCount(map.sessionDuration, map.experience)

  const weekDays: WorkoutDay[] = structure
    .slice(0, map.daysPerWeek)
    .map((dayDef, index) => {
      // Filter exercise pool for this day's areas
      const pool = EXERCISES.filter(ex => dayDef.areas.includes(ex.muscleGroup))

      // Temporarily boost weights for this day's focus areas
      const dayMap = { ...map, muscleGroups: { ...map.muscleGroups } }
      dayDef.areas.forEach(area => {
        const areaKey = area as keyof typeof map.muscleGroups
        if (dayMap.muscleGroups[areaKey] === 0) {
          dayMap.muscleGroups[areaKey] = 1  // Give minimal weight even if not selected
        }
      })

      const exercises = selectTopExercises(pool, dayMap, exerciseCount)

      // Estimate total time: sets × reps (in time) × rest + warm-up
      const totalTime = exercises.reduce((acc, ex) => {
        const sets = parseInt(ex.sets.split('-')[0]) || 3
        const restMin = ex.rest / 60
        return acc + (sets * restMin) + (sets * 0.75)
      }, 10)  // +10 min warm-up

      return {
        dayNumber: index + 1,
        name:      dayDef.name,
        focus:     dayDef.focus,
        exercises,
        totalTime: Math.round(totalTime),
      }
    })

  return {
    split:       map.suggestedSplit,
    weekDays,
    weightMap:   map,
    generatedAt: new Date().toISOString(),
  }
}

// ─── Split display names ──────────────────────────────────────────────────────
export const SPLIT_NAMES: Record<TrainingSplit, string> = {
  full_body:        'Full Body (3 días)',
  upper_lower:      'Upper / Lower (4 días)',
  upper_lower_core: 'Upper / Lower / Core (5 días)',
  push_pull_legs:   'Push / Pull / Legs (6 días)',
  bro_split:        'Especialización Muscular',
}
