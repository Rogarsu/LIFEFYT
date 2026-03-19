import type { GoalCategory, BodyCompositionGoal, MuscleArea } from '../types'

// ─── Goal Categories (4 macro goals) ─────────────────────────────────────────
export const GOAL_CATEGORIES: {
  id: GoalCategory
  title: string
  subtitle: string
  description: string
  image: string
  available: boolean
  color: string
  gradient: string
}[] = [
  {
    id: 'body_composition',
    title: 'Composición Corporal',
    subtitle: 'Cambia tu físico',
    description: 'Gana músculo, pierde grasa y transforma tu cuerpo con rutinas personalizadas al máximo.',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=85&fit=crop',
    available: true,
    color: '#ff3120',
    gradient: 'from-brand-600/80 to-brand-900/60',
  },
  {
    id: 'performance',
    title: 'Rendimiento Físico',
    subtitle: 'Supera tus límites',
    description: 'Fuerza, potencia, velocidad y resistencia. Lleva tu cuerpo a otro nivel.',
    image: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&q=85&fit=crop',
    available: false,
    color: '#06d5f0',
    gradient: 'from-electric-600/80 to-dark-900/60',
  },
  {
    id: 'health',
    title: 'Salud y Bienestar',
    subtitle: 'Vive mejor',
    description: 'Salud cardiovascular, control de enfermedades, postura y longevidad.',
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=85&fit=crop',
    available: false,
    color: '#22c55e',
    gradient: 'from-green-600/80 to-dark-900/60',
  },
  {
    id: 'lifestyle',
    title: 'Estilo de Vida',
    subtitle: 'Disciplina y propósito',
    description: 'Disciplina, rutina, mente-cuerpo, autoestima y socialización.',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=85&fit=crop',
    available: false,
    color: '#a855f7',
    gradient: 'from-purple-600/80 to-dark-900/60',
  },
]

// ─── Body Composition Sub-goals ───────────────────────────────────────────────
export const BODY_COMPOSITION_GOALS: {
  id: BodyCompositionGoal
  title: string
  subtitle: string
  description: string
  image: string
  available: boolean
  tags: string[]
}[] = [
  {
    id: 'hypertrophy',
    title: 'Ganar Masa Muscular',
    subtitle: 'Hipertrofia',
    description: 'Aumenta el tamaño de tus músculos para lograr un físico más voluminoso, definido y poderoso.',
    image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=85&fit=crop',
    available: true,
    tags: ['Músculo', 'Volumen', 'Definición'],
  },
  {
    id: 'weight_loss',
    title: 'Perder Grasa',
    subtitle: 'Definición',
    description: 'Reduce el porcentaje de grasa para verte más delgado, marcado y ligero.',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=85&fit=crop',
    available: false,
    tags: ['Grasa', 'Cardio', 'Marcado'],
  },
  {
    id: 'toning',
    title: 'Tonificar',
    subtitle: 'Perder grasa + músculo firme',
    description: 'Combina pérdida de grasa y ganancia muscular para un físico firme y definido.',
    image: 'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=800&q=85&fit=crop',
    available: false,
    tags: ['Tono', 'Firmeza', 'Balance'],
  },
  {
    id: 'recomposition',
    title: 'Recomposición Corporal',
    subtitle: 'Perder grasa y ganar músculo',
    description: 'El proceso más completo: transforma tu cuerpo simultáneamente.',
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=85&fit=crop',
    available: false,
    tags: ['Transformación', 'Avanzado'],
  },
  {
    id: 'maintenance',
    title: 'Mantenimiento',
    subtitle: 'Conserva tu físico',
    description: 'Mantén tu nivel actual sin ganar grasa ni perder músculo.',
    image: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=800&q=85&fit=crop',
    available: false,
    tags: ['Mantener', 'Rutina'],
  },
  {
    id: 'weight_gain',
    title: 'Ganar Peso',
    subtitle: 'Para ectomorfos',
    description: 'Aumenta tu peso corporal total de forma saludable.',
    image: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&q=85&fit=crop',
    available: false,
    tags: ['Volumen', 'Calorías'],
  },
]

// ─── Muscle Areas ─────────────────────────────────────────────────────────────
export const MUSCLE_AREAS: {
  id: MuscleArea
  title: string
  subtitle: string
  description: string
  image: string
  muscles: string[]
}[] = [
  {
    id: 'upperBody',
    title: 'Tren Superior',
    subtitle: 'Pecho, espalda, hombros, brazos',
    description: 'Construye un torso imponente con pecho ancho, espalda gruesa y brazos definidos.',
    image: 'https://images.unsplash.com/photo-1583454155184-870a1f63aebc?w=800&q=85&fit=crop',
    muscles: ['Pecho', 'Espalda', 'Hombros', 'Bíceps', 'Tríceps'],
  },
  {
    id: 'lowerBody',
    title: 'Tren Inferior',
    subtitle: 'Cuádriceps, isquios, glúteos, pantorrillas',
    description: 'Desarrolla piernas poderosas y glúteos sólidos que soporten todo tu cuerpo.',
    image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&q=85&fit=crop',
    muscles: ['Cuádriceps', 'Isquios', 'Glúteos', 'Pantorrillas'],
  },
  {
    id: 'core',
    title: 'Core',
    subtitle: 'Abdominales, oblicuos, lumbar',
    description: 'El centro de toda tu fuerza. Un core sólido mejora todos tus demás levantamientos.',
    image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=85&fit=crop',
    muscles: ['Abdominales', 'Oblicuos', 'Lumbar'],
  },
]
