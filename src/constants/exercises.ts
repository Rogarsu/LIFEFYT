// Exercise bank — re-exported from exerciseBank/
// All exercises are organized by muscle group in src/constants/exerciseBank/
export { EXERCISES } from './exerciseBank/index'

import type { EquipmentType, EquipmentTag } from '../types'

/**
 * Which equipment tags are available for each equipment type.
 * Used by scoreExercise() to filter out exercises the user can't do.
 */
export const EQUIPMENT_AVAILABILITY: Record<EquipmentType, EquipmentTag[]> = {
  full_gym: [
    'barbell', 'dumbbell', 'machine', 'cable', 'bench',
    'pullup_bar', 'bodyweight', 'kettlebell', 'bands', 'fitball',
  ],
  home_gym: [
    'dumbbell', 'bands', 'bench', 'pullup_bar',
    'bodyweight', 'kettlebell', 'fitball',
  ],
  bodyweight: ['bodyweight', 'pullup_bar'],
}
