import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type {
  OnboardingState,
  GoalCategory,
  BodyCompositionGoal,
  MuscleArea,
  ExperienceLevel,
  EquipmentType,
  DaysPerWeek,
  SessionDuration,
  UserWeightMap,
  UpperBodyDetailWeights,
  LowerBodyDetailWeights,
  CoreDetailWeights,
} from '../types'

const TOTAL_STEPS = 12

const initialState: OnboardingState = {
  step:            1,
  totalSteps:      12,
  goalCategory:    null,
  bodyGoal:        null,
  profile:         { fullName: '', age: 0, gender: '', weightKg: 0, heightCm: 0 },
  selectedAreas:   [],
  upperBodyFocus:  [],
  lowerBodyFocus:  [],
  coreFocus:       [],
  experience:      null,
  equipment:       null,
  daysPerWeek:     null,
  sessionDuration: null,
  injuries:        '',
  weightMap:       null,
}

interface OnboardingActions {
  nextStep: () => void
  prevStep: () => void
  goToStep: (step: number) => void
  setGoalCategory: (category: GoalCategory) => void
  setBodyGoal: (goal: BodyCompositionGoal) => void
  setProfile: (profile: Partial<OnboardingState['profile']>) => void
  // Area selection with priority order
  toggleArea: (area: MuscleArea) => void
  moveAreaUp: (area: MuscleArea) => void
  // Specific muscles focus
  toggleUpperBodyFocus: (muscle: keyof UpperBodyDetailWeights) => void
  toggleLowerBodyFocus: (muscle: keyof LowerBodyDetailWeights) => void
  toggleCoreFocus: (muscle: keyof CoreDetailWeights) => void
  setExperience: (level: ExperienceLevel) => void
  setEquipment: (type: EquipmentType) => void
  setDaysPerWeek: (days: DaysPerWeek) => void
  setSessionDuration: (duration: SessionDuration) => void
  setInjuries: (text: string) => void
  setWeightMap: (map: UserWeightMap) => void
  reset: () => void
}

type OnboardingStore = OnboardingState & OnboardingActions

export const useOnboardingStore = create<OnboardingStore>()(
  devtools(
    (set) => ({
      ...initialState,

      nextStep: () => set(s => ({ step: Math.min(s.step + 1, TOTAL_STEPS) })),
      // totalSteps keeps in sync

      prevStep: () => set(s => ({ step: Math.max(s.step - 1, 1) })),
      goToStep: (step) => set({ step }),

      setGoalCategory: (goalCategory) => set({ goalCategory }),
      setBodyGoal:     (bodyGoal) => set({ bodyGoal }),

      setProfile: (profile) =>
        set(s => ({ profile: { ...s.profile, ...profile } })),

      toggleArea: (area) =>
        set(s => {
          const current = s.selectedAreas
          if (current.includes(area)) {
            return { selectedAreas: current.filter(a => a !== area) }
          }
          return { selectedAreas: [...current, area] }
        }),

      moveAreaUp: (area) =>
        set(s => {
          const arr  = [...s.selectedAreas]
          const idx  = arr.indexOf(area)
          if (idx <= 0) return {}
          ;[arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]]
          return { selectedAreas: arr }
        }),

      toggleUpperBodyFocus: (muscle) =>
        set(s => {
          const current = s.upperBodyFocus
          if (current.includes(muscle)) return { upperBodyFocus: current.filter(m => m !== muscle) }
          return { upperBodyFocus: [...current, muscle] }
        }),

      toggleLowerBodyFocus: (muscle) =>
        set(s => {
          const current = s.lowerBodyFocus
          if (current.includes(muscle)) return { lowerBodyFocus: current.filter(m => m !== muscle) }
          return { lowerBodyFocus: [...current, muscle] }
        }),

      toggleCoreFocus: (muscle) =>
        set(s => {
          const current = s.coreFocus
          if (current.includes(muscle)) return { coreFocus: current.filter(m => m !== muscle) }
          return { coreFocus: [...current, muscle] }
        }),

      setExperience:      (experience)      => set({ experience }),
      setEquipment:       (equipment)       => set({ equipment }),
      setDaysPerWeek:     (daysPerWeek)     => set({ daysPerWeek }),
      setSessionDuration: (sessionDuration) => set({ sessionDuration }),
      setInjuries:        (injuries)        => set({ injuries }),
      setWeightMap:       (weightMap)       => set({ weightMap }),

      reset: () => set(initialState),
    }),
    { name: 'lifefyt-onboarding' },
  ),
)
