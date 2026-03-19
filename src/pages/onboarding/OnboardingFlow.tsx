import { AnimatePresence } from 'framer-motion'
import { useOnboardingStore } from '../../store/onboarding'
import { Step01_Welcome }     from './Step01_Welcome'
import { Step02_Profile }     from './Step02_Profile'
import { Step02_GoalCategory } from './Step02_GoalCategory'
import { Step03_BodyGoal }    from './Step03_BodyGoal'
import { Step04_MuscleAreas } from './Step04_MuscleAreas'
import { Step05_MuscleDetail } from './Step05_MuscleDetail'
import { Step06_Experience }  from './Step06_Experience'
import { Step07_Equipment }   from './Step07_Equipment'
import { Step08_Schedule }    from './Step08_Schedule'
import { Step09_Injuries }    from './Step09_Injuries'
import { Step10_Summary }     from './Step10_Summary'

interface Props {
  onComplete: () => void
}

export function OnboardingFlow({ onComplete }: Props) {
  const { step, nextStep } = useOnboardingStore()

  const noop = () => {}

  return (
    <div className="bg-dark-900 min-h-dvh">
      <AnimatePresence mode="wait">
        {step === 1  && <Step01_Welcome      key="s1"  onStart={nextStep} />}
        {step === 2  && <Step02_Profile      key="s2"  onNext={noop} />}
        {step === 3  && <Step02_GoalCategory key="s3"  onNext={noop} />}
        {step === 4  && <Step03_BodyGoal     key="s4"  onNext={noop} />}
        {step === 5  && <Step04_MuscleAreas  key="s5"  onNext={noop} />}
        {step === 6  && <Step05_MuscleDetail key="s6"  onNext={noop} />}
        {step === 7  && <Step06_Experience   key="s7"  onNext={noop} />}
        {step === 8  && <Step07_Equipment    key="s8"  onNext={noop} />}
        {step === 9  && <Step08_Schedule     key="s9"  onNext={noop} />}
        {step === 10 && <Step09_Injuries     key="s10" onNext={noop} />}
        {step === 11 && <Step10_Summary      key="s11" onFinish={onComplete} />}
      </AnimatePresence>
    </div>
  )
}
