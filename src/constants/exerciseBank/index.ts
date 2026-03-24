import { CHEST_EXERCISES }    from './chest'
import { BACK_EXERCISES }      from './back'
import { SHOULDER_EXERCISES }  from './shoulders'
import { LEG_EXERCISES }       from './legs'
import { ARM_EXERCISES }       from './arms'
import { CORE_EXERCISES }      from './core'
import type { Exercise }       from '../../types'

export const EXERCISES: Exercise[] = [
  ...CHEST_EXERCISES,
  ...BACK_EXERCISES,
  ...SHOULDER_EXERCISES,
  ...LEG_EXERCISES,
  ...ARM_EXERCISES,
  ...CORE_EXERCISES,
]

export {
  CHEST_EXERCISES,
  BACK_EXERCISES,
  SHOULDER_EXERCISES,
  LEG_EXERCISES,
  ARM_EXERCISES,
  CORE_EXERCISES,
}
