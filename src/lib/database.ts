/**
 * Database operations — LIFEFYT
 * All Supabase queries go through here
 */
import { supabase } from './supabase'
import type { OnboardingState, GeneratedRoutine, CompletedSession } from '../types'

// ─── Profiles ─────────────────────────────────────────────────────────────────
export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return { data, error }
}

export async function updateProfile(userId: string, updates: Record<string, unknown>) {
  // upsert so it works whether or not the trigger already created the row
  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      { id: userId, ...updates, updated_at: new Date().toISOString() },
      { onConflict: 'id' }
    )
    .select()
    .single()
  if (error) console.error('[updateProfile]', error)
  return { data, error }
}

export async function markOnboardingComplete(userId: string) {
  return updateProfile(userId, { onboarding_completed: true })
}

// ─── User Goals ───────────────────────────────────────────────────────────────
export async function saveUserGoal(userId: string, state: OnboardingState) {
  // Deactivate previous goals
  await supabase
    .from('user_goals')
    .update({ is_active: false })
    .eq('user_id', userId)

  const { data, error } = await supabase
    .from('user_goals')
    .insert({
      user_id:          userId,
      goal_category:    state.goalCategory,
      body_goal:        state.bodyGoal,
      selected_areas:   state.selectedAreas,
      upper_body_focus: state.upperBodyFocus,
      lower_body_focus: state.lowerBodyFocus,
      core_focus:       state.coreFocus,
      experience:       state.experience,
      equipment:        state.equipment,
      days_per_week:    state.daysPerWeek,
      session_duration: state.sessionDuration,
      injuries:         state.injuries,
      weight_map:       state.weightMap,
      is_active:        true,
    })
    .select()
    .single()

  return { data, error }
}

export async function getActiveGoal(userId: string) {
  const { data, error } = await supabase
    .from('user_goals')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  return { data, error }
}

// ─── Routines ─────────────────────────────────────────────────────────────────
export async function saveRoutine(
  userId: string,
  goalId: string,
  routine: GeneratedRoutine,
) {
  // Deactivate previous routines
  await supabase
    .from('routines')
    .update({ is_active: false })
    .eq('user_id', userId)

  const { data, error } = await supabase
    .from('routines')
    .insert({
      user_id:      userId,
      goal_id:      goalId,
      routine_data: routine,
      split:        routine.split,
      is_active:    true,
    })
    .select()
    .single()

  return { data, error }
}

export async function getActiveRoutine(userId: string) {
  const { data, error } = await supabase
    .from('routines')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  return { data, error }
}

// ─── Sessions ─────────────────────────────────────────────────────────────────
export async function saveSession(userId: string, session: CompletedSession) {
  const { data, error } = await supabase
    .from('workout_sessions')
    .insert({
      id:               session.id,
      user_id:          userId,
      routine_id:       session.routineId ?? null,
      day_number:       session.dayNumber,
      day_name:         session.dayName,
      focus:            session.dayName,
      started_at:       session.startedAt,
      completed_at:     session.completedAt,
      duration_minutes: session.durationMinutes,
      exercises:        session.exercises,
      total_sets:       session.totalSetsLogged,
      total_volume:     session.totalVolume,
    })
    .select()
    .single()

  if (!error && data) {
    // Upsert personal records for each set
    await updatePersonalRecords(userId, session)
  }

  return { data, error }
}

async function updatePersonalRecords(userId: string, session: CompletedSession) {
  // Group by exercise and find the best set (highest volume) per exercise this session
  for (const ex of session.exercises) {
    const completedSets = ex.sets.filter(
      s => s.completed && s.actualReps != null && s.weightKg !== null
    )
    if (!completedSets.length) continue

    // Best set = highest volume (weight × reps). weight=0 means bodyweight.
    const bestSet = completedSets.reduce((best, s) => {
      const vol = (s.weightKg ?? 0) * (s.actualReps ?? 0)
      const bestVol = (best.weightKg ?? 0) * (best.actualReps ?? 0)
      return vol > bestVol ? s : best
    })

    const volume = (bestSet.weightKg ?? 0) * (bestSet.actualReps ?? 0)

    // Only update PR if this session's best beats the stored PR
    const { data: existing } = await supabase
      .from('personal_records')
      .select('volume')
      .eq('user_id', userId)
      .eq('exercise_id', ex.exerciseId)
      .maybeSingle()   // no error when row doesn't exist

    if (!existing || volume > existing.volume) {
      const { error } = await supabase.from('personal_records').upsert({
        user_id:       userId,
        exercise_id:   ex.exerciseId,
        exercise_name: ex.exerciseName,
        weight_kg:     bestSet.weightKg ?? 0,
        reps:          bestSet.actualReps ?? 0,
        volume,
        session_id:    session.id,
        achieved_at:   session.completedAt,
      }, { onConflict: 'user_id,exercise_id' })
      if (error) console.error('[PR upsert]', ex.exerciseName, error)
    }
  }
}

/** Sessions from the last 7 days with full exercise data — used to mark completed days */
export async function getThisWeekSessions(userId: string) {
  const since = new Date()
  since.setDate(since.getDate() - 7)
  const { data, error } = await supabase
    .from('workout_sessions')
    .select('id, day_number, day_name, started_at, duration_minutes, total_sets, total_volume, exercises')
    .eq('user_id', userId)
    .gte('started_at', since.toISOString())
    .order('started_at', { ascending: false })
  return { data, error }
}

export async function getRecentSessions(userId: string, limit = 10) {
  const { data, error } = await supabase
    .from('workout_sessions')
    .select('id, day_name, focus, started_at, duration_minutes, total_sets, total_volume')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(limit)
  return { data, error }
}

export async function getLastSessionForDay(userId: string, dayNumber: number) {
  const { data, error } = await supabase
    .from('workout_sessions')
    .select('exercises')
    .eq('user_id', userId)
    .eq('day_number', dayNumber)
    .order('started_at', { ascending: false })
    .limit(1)
    .single()
  return { data, error }
}

export async function getPersonalRecords(userId: string) {
  const { data, error } = await supabase
    .from('personal_records')
    .select('*')
    .eq('user_id', userId)
    .order('achieved_at', { ascending: false })
  return { data, error }
}

// ─── Exercises ────────────────────────────────────────────────────────────────
/** Fetch all exercises from Supabase (public, no auth required) */
export async function getExercises() {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .order('muscle_group', { ascending: true })
  return { data, error }
}

/** Fetch exercises filtered by muscle_target (for program block generation) */
export async function getExercisesByTarget(muscleTarget: string) {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('muscle_target', muscleTarget)
  return { data, error }
}

/** Fetch exercises filtered by equipment availability */
export async function getExercisesByEquipment(equipment: string[]) {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .overlaps('equipment', equipment)
  return { data, error }
}

// ─── User Programs ────────────────────────────────────────────────────────────
export async function saveUserProgram(
  userId: string,
  program: {
    duration_months: number
    start_date: string
    training_method: string
    goal: string
    experience: string
    days_per_week: number
    equipment: string
  }
) {
  // Deactivate previous programs
  await supabase
    .from('user_programs')
    .update({ is_active: false })
    .eq('user_id', userId)

  const { data, error } = await supabase
    .from('user_programs')
    .insert({ user_id: userId, ...program, is_active: true })
    .select()
    .single()
  return { data, error }
}

export async function getActiveProgram(userId: string) {
  const { data, error } = await supabase
    .from('user_programs')
    .select('*, program_blocks(*)')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return { data, error }
}
