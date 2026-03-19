-- ─────────────────────────────────────────────────────────────────────────────
-- LIFEFYT — Sessions Schema
-- Ejecuta esto en Supabase SQL Editor (después del schema.sql principal)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Workout Sessions ──────────────────────────────────────────────────────────
create table if not exists public.workout_sessions (
  id               uuid default gen_random_uuid() primary key,
  user_id          uuid references public.profiles(id) on delete cascade not null,
  routine_id       uuid references public.routines(id) on delete set null,
  day_number       int,
  day_name         text,
  focus            text,
  started_at       timestamptz not null,
  completed_at     timestamptz,
  duration_minutes int,
  exercises        jsonb not null default '[]',
  total_sets       int default 0,
  total_volume     float default 0,
  notes            text,
  created_at       timestamptz default now()
);

-- ── Personal Records ──────────────────────────────────────────────────────────
create table if not exists public.personal_records (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references public.profiles(id) on delete cascade not null,
  exercise_id   text not null,
  exercise_name text not null,
  weight_kg     float not null,
  reps          int not null,
  volume        float not null,
  session_id    uuid references public.workout_sessions(id) on delete cascade,
  achieved_at   timestamptz not null,
  created_at    timestamptz default now(),
  unique (user_id, exercise_id)
);

-- ── RLS ───────────────────────────────────────────────────────────────────────
alter table public.workout_sessions enable row level security;
alter table public.personal_records enable row level security;

create policy "sessions_select" on public.workout_sessions for select using (auth.uid() = user_id);
create policy "sessions_insert" on public.workout_sessions for insert with check (auth.uid() = user_id);
create policy "sessions_update" on public.workout_sessions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "pr_select" on public.personal_records for select using (auth.uid() = user_id);
create policy "pr_insert" on public.personal_records for insert with check (auth.uid() = user_id);
create policy "pr_update" on public.personal_records for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
