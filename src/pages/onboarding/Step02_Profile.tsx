import { useState }            from 'react'
import { motion }              from 'framer-motion'
import { useOnboardingStore }  from '../../store/onboarding'
import { StepWrapper }         from '../../components/ui/StepWrapper'

const GENDER_OPTIONS = [
  {
    value: 'male',
    label: 'Hombre',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80&fit=crop',
  },
  {
    value: 'female',
    label: 'Mujer',
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&q=80&fit=crop',
  },
  {
    value: 'other',
    label: 'Prefiero no decirlo',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&q=80&fit=crop',
  },
]

interface Props { onNext: () => void }

export function Step02_Profile({ onNext }: Props) {
  const { profile, setProfile, nextStep, prevStep } = useOnboardingStore()

  const [name,   setName]   = useState(profile.fullName  || '')
  const [age,    setAge]    = useState(profile.age    > 0 ? String(profile.age)    : '')
  const [weight, setWeight] = useState(profile.weightKg > 0 ? String(profile.weightKg) : '')
  const [height, setHeight] = useState(profile.heightCm > 0 ? String(profile.heightCm) : '')
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>(profile.gender || '')

  const bmi = weight && height
    ? (Number(weight) / Math.pow(Number(height) / 100, 2)).toFixed(1)
    : null

  const bmiLabel = bmi
    ? Number(bmi) < 18.5 ? 'Bajo peso'
    : Number(bmi) < 25   ? 'Normal'
    : Number(bmi) < 30   ? 'Sobrepeso'
    : 'Obesidad'
    : null

  const canContinue =
    name.trim().length >= 2 &&
    Number(age) >= 13 && Number(age) <= 99 &&
    Number(weight) > 0 &&
    Number(height) > 0 &&
    gender !== ''

  const handleContinue = () => {
    setProfile({
      fullName: name.trim(),
      age:      Number(age),
      weightKg: Number(weight),
      heightCm: Number(height),
      gender,
    })
    nextStep()
    onNext()
  }

  return (
    <StepWrapper
      title="Cuéntanos sobre ti"
      subtitle="Personalizaremos tu rutina y calcularemos tu progreso con estos datos."
      onBack={prevStep}
    >
      <div className="flex flex-col gap-5">

        {/* Name */}
        <div>
          <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-2">
            ¿Cómo te llamas?
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Tu nombre"
            className="w-full px-4 py-4 bg-dark-700 border border-white/10 rounded-2xl text-white text-base font-semibold
                       placeholder:text-white/20 focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all"
          />
        </div>

        {/* Age + BMI */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Edad</label>
            <input
              type="number"
              inputMode="numeric"
              value={age}
              onChange={e => setAge(e.target.value)}
              placeholder="25"
              min={13} max={99}
              className="w-full px-4 py-4 bg-dark-700 border border-white/10 rounded-2xl text-white text-base font-semibold
                         placeholder:text-white/20 focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all text-center"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-2">IMC estimado</label>
            <div className={`w-full px-4 py-4 rounded-2xl border text-center ${bmi ? 'bg-dark-700 border-white/10' : 'bg-dark-800 border-white/5'}`}>
              {bmi ? (
                <>
                  <span className="text-white font-black text-lg">{bmi}</span>
                  <span className="text-white/30 text-xs block leading-none mt-0.5">{bmiLabel}</span>
                </>
              ) : (
                <span className="text-white/15 text-sm">—</span>
              )}
            </div>
          </div>
        </div>

        {/* Weight + Height */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Peso (kg)</label>
            <input
              type="number"
              inputMode="decimal"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              placeholder="70"
              min={30} max={250}
              className="w-full px-4 py-4 bg-dark-700 border border-white/10 rounded-2xl text-white text-base font-semibold
                         placeholder:text-white/20 focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all text-center"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Altura (cm)</label>
            <input
              type="number"
              inputMode="numeric"
              value={height}
              onChange={e => setHeight(e.target.value)}
              placeholder="175"
              min={100} max={250}
              className="w-full px-4 py-4 bg-dark-700 border border-white/10 rounded-2xl text-white text-base font-semibold
                         placeholder:text-white/20 focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all text-center"
            />
          </div>
        </div>

        {/* Gender */}
        <div>
          <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Género</label>
          <div className="grid grid-cols-3 gap-2">
            {GENDER_OPTIONS.map(opt => (
              <motion.button
                key={opt.value}
                whileTap={{ scale: 0.96 }}
                onClick={() => setGender(opt.value as 'male' | 'female' | 'other')}
                className={[
                  'relative rounded-2xl overflow-hidden border-2 transition-all duration-200',
                  gender === opt.value
                    ? 'border-brand-500 shadow-glow-sm-red'
                    : 'border-white/10 opacity-60 hover:opacity-80',
                ].join(' ')}
                style={{ aspectRatio: '3/4' }}
              >
                <img src={opt.image} alt={opt.label} className="w-full h-full object-cover" />
                <div className={['absolute inset-0 transition-colors', gender === opt.value ? 'bg-brand-500/20' : 'bg-dark-900/50'].join(' ')} />

                {gender === opt.value && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2 w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center"
                  >
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                )}

                <div className="absolute bottom-0 inset-x-0 px-2 py-2">
                  <p className={`text-center text-xs font-bold leading-tight ${gender === opt.value ? 'text-white' : 'text-white/50'}`}>
                    {opt.label}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* CTA */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleContinue}
          disabled={!canContinue}
          className={[
            'w-full py-5 rounded-2xl font-black text-base transition-all duration-300 mt-2',
            canContinue
              ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-glow-red'
              : 'bg-dark-700 text-white/20 cursor-not-allowed',
          ].join(' ')}
        >
          Continuar
        </motion.button>
      </div>
    </StepWrapper>
  )
}
