// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  created_at: string
}

// ─── Onboarding ───────────────────────────────────────────────────────────────
export type GoalCategory = 'body_composition' | 'performance' | 'health' | 'lifestyle'

export type BodyCompositionGoal =
  | 'hypertrophy'
  | 'weight_loss'
  | 'toning'
  | 'maintenance'
  | 'weight_gain'
  | 'recomposition'

export type MuscleArea = 'upperBody' | 'lowerBody' | 'core'

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced'

export type EquipmentType = 'full_gym' | 'home_gym' | 'bodyweight'

export type DaysPerWeek = 3 | 4 | 5 | 6

export type SessionDuration = 45 | 60 | 90

export type TrainingSplit =
  | 'full_body'
  | 'upper_lower'
  | 'push_pull_legs'
  | 'upper_lower_core'
  | 'bro_split'

// ─── Weight Map ───────────────────────────────────────────────────────────────
// Each answer the user gives contributes weights to this map.
// The routine generator uses this map to score and select exercises.

export interface MuscleGroupWeights {
  upperBody: number  // 0–3
  lowerBody: number  // 0–3
  core: number       // 0–3
}

export interface UpperBodyDetailWeights {
  chest: number
  back: number
  shoulders: number
  biceps: number
  triceps: number
  forearms: number
}

export interface LowerBodyDetailWeights {
  quads: number
  hamstrings: number
  glutes: number
  calves: number
}

export interface CoreDetailWeights {
  abs: number
  obliques: number
  lowerBack: number
}

export interface UserWeightMap {
  // Primary focus areas (0 = not selected, 1 = tertiary, 2 = secondary, 3 = primary)
  muscleGroups: MuscleGroupWeights

  // Detailed breakdown inside each area
  upperBodyDetails: UpperBodyDetailWeights
  lowerBodyDetails: LowerBodyDetailWeights
  coreDetails:      CoreDetailWeights

  // Training parameters
  experience:      ExperienceLevel
  equipment:       EquipmentType
  daysPerWeek:     DaysPerWeek
  sessionDuration: SessionDuration

  // Derived
  suggestedSplit: TrainingSplit

  // Multipliers derived from experience
  volumeMultiplier:    number  // 0.7 | 1.0 | 1.3
  intensityMultiplier: number  // 0.8 | 1.0 | 1.2
  restSeconds:         number  // 90 | 75 | 60

  // Injuries / notes
  injuries?: string
  priorExperience?: string
}

// ─── Onboarding State ─────────────────────────────────────────────────────────
export interface OnboardingProfile {
  fullName: string
  age: number
  gender: 'male' | 'female' | 'other' | ''
  weightKg: number
  heightCm: number
}

export interface OnboardingState {
  step: number
  totalSteps: number
  goalCategory: GoalCategory | null
  bodyGoal: BodyCompositionGoal | null
  profile: OnboardingProfile
  // Priority order: index 0 = highest priority
  selectedAreas: MuscleArea[]
  // Specific muscles chosen within each area
  upperBodyFocus: (keyof UpperBodyDetailWeights)[]
  lowerBodyFocus: (keyof LowerBodyDetailWeights)[]
  coreFocus:      (keyof CoreDetailWeights)[]
  experience:     ExperienceLevel | null
  equipment:      EquipmentType | null
  daysPerWeek:    DaysPerWeek | null
  sessionDuration: SessionDuration | null
  injuries: string
  weightMap: UserWeightMap | null
}

// ─── Exercises ────────────────────────────────────────────────────────────────
export type MuscleGroupArea = 'upperBody' | 'lowerBody' | 'core'

export type EquipmentTag =
  | 'barbell'
  | 'dumbbell'
  | 'bodyweight'
  | 'machine'
  | 'cable'
  | 'kettlebell'
  | 'pullup_bar'
  | 'bench'
  | 'bands'
  | 'fitball'
  | 'trx'
  | 'rings'

/** Where the exercise can be performed */
export type TrainingLocation = 'gym' | 'home' | 'bodyweight'

export type MuscleTarget =
  // Pecho
  | 'chest_upper' | 'chest_mid' | 'chest_lower'
  // Espalda
  | 'back_lats' | 'back_upper' | 'back_mid' | 'back_lower'
  // Hombros
  | 'shoulder_front' | 'shoulder_side' | 'shoulder_rear'
  // Piernas
  | 'quad' | 'hamstring' | 'glute' | 'calf' | 'adductor'
  // Brazos
  | 'bicep' | 'tricep' | 'forearm'
  // Core
  | 'abs' | 'obliques' | 'lower_back'

export interface Exercise {
  id: string
  name: string
  nameEs: string
  muscleGroup: MuscleGroupArea
  muscleTarget: MuscleTarget
  primaryMuscles: string[]
  secondaryMuscles: string[]
  equipment: EquipmentTag[]
  difficulty: 1 | 2 | 3
  type: 'compound' | 'isolation'
  compoundBonus: number  // 1.0–2.0
  image: string          // Unsplash URL
  videoUrl?: string
  instructions: string[]
  sets: { beginner: string; intermediate: string; advanced: string }
  reps: { beginner: string; intermediate: string; advanced: string }
  rest: { beginner: number; intermediate: number; advanced: number }  // seconds
  /** Derived from equipment — populated from Supabase or computed via getTrainingLocation() */
  trainingLocation?: TrainingLocation
}

// ─── Routine ──────────────────────────────────────────────────────────────────
export interface WorkoutExercise {
  exercise:    Exercise
  sets:        string
  reps:        string
  rest:        number
  score:       number
  notes?:      string
}

export interface WorkoutDay {
  dayNumber:   number
  name:        string
  focus:       string
  exercises:   WorkoutExercise[]
  totalTime:   number  // estimated minutes
}

export interface GeneratedRoutine {
  split:        TrainingSplit
  weekDays:     WorkoutDay[]
  weightMap:    UserWeightMap
  generatedAt:  string
}

// ─── Program System ───────────────────────────────────────────────────────────
export type TrainingMethod = 'hypertrophy' | 'volume' | 'strength' | 'deload'

/** One exercise position in a workout day. The pool rotates each block. */
export interface ExerciseSlot {
  slotId:       string    // e.g. 'day1_slot0_chest'
  label:        string    // primary muscle label
  exercisePool: string[]  // ordered exercise IDs — best first
  currentIdx:   number    // index active this block = (blockNumber-1) % pool.length
}

export interface ProgramDay {
  dayNumber: number
  name:      string
  focus:     string
  slots:     ExerciseSlot[]
}

export interface ProgramBlock {
  blockNumber:   number
  weeks:         number          // always 4
  method:        TrainingMethod
  isDeload:      boolean
  label:         string          // 'Bloque 1 — Hipertrofia'
  setsOverride?: string
  repsOverride?: string
  restOverride?: number
  tempo?:        string          // e.g. '3-0-2-0' for TUT blocks
  days:          ProgramDay[]
}

export interface UserProgram {
  id?:               string
  durationMonths:    number
  startDate:         string
  currentBlock:      number
  currentSession:    number                      // stored in DB as current_week
  completedSessions: { b: number; s: number }[]  // stored in DB as completed_sessions
  goal:              BodyCompositionGoal
  experience:        ExperienceLevel
  equipment:         EquipmentType
  daysPerWeek:       DaysPerWeek
  weightMap:         UserWeightMap
  blocks:            ProgramBlock[]
}

// ─── Session Logging ──────────────────────────────────────────────────────────
export interface LoggedSet {
  setNumber:  number
  weightKg:   number | null   // null = bodyweight
  actualReps: number | null
  completed:  boolean
  restTaken:  number          // seconds
}

export interface SessionExercise {
  exerciseId:   string
  exerciseName: string
  image:        string
  targetSets:   string
  targetReps:   string
  targetRest:   number
  sets:         LoggedSet[]
}

export interface ActiveSession {
  id:                  string   // temp uuid before saving
  routineId?:          string
  dayNumber:           number
  dayName:             string
  focus:               string
  startedAt:           string
  exercises:           SessionExercise[]
  currentExerciseIdx:  number
  currentSetIdx:       number
}

export interface CompletedSession {
  id:               string
  userId:           string
  routineId?:       string
  dayNumber:        number
  dayName:          string
  startedAt:        string
  completedAt:      string
  durationMinutes:  number
  exercises:        SessionExercise[]
  totalSetsLogged:  number
  totalVolume:      number   // sum of (weight × reps) across all sets
}
