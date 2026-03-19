-- ─────────────────────────────────────────────────────────────────────────────
-- LIFEFYT — Supabase Schema
-- Ejecuta este archivo en el SQL Editor de tu proyecto Supabase
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Profiles ──────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id                    uuid references auth.users on delete cascade primary key,
  full_name             text,
  age                   int,
  gender                text check (gender in ('male', 'female', 'other')),
  weight_kg             float,
  height_cm             float,
  onboarding_completed  boolean default false,
  avatar_url            text,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── User Goals (onboarding answers + weightMap) ───────────────────────────────
create table if not exists public.user_goals (
  id                  uuid default gen_random_uuid() primary key,
  user_id             uuid references public.profiles(id) on delete cascade not null,
  goal_category       text not null,
  body_goal           text,
  selected_areas      text[]  default '{}',
  upper_body_focus    text[]  default '{}',
  lower_body_focus    text[]  default '{}',
  core_focus          text[]  default '{}',
  experience          text,
  equipment           text,
  days_per_week       int,
  session_duration    int,
  injuries            text,
  weight_map          jsonb,
  is_active           boolean default true,
  created_at          timestamptz default now()
);

-- ── Routines ──────────────────────────────────────────────────────────────────
create table if not exists public.routines (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references public.profiles(id) on delete cascade not null,
  goal_id       uuid references public.user_goals(id) on delete cascade,
  routine_data  jsonb not null,
  split         text,
  is_active     boolean default true,
  created_at    timestamptz default now()
);

-- ── Row Level Security ────────────────────────────────────────────────────────
alter table public.profiles    enable row level security;
alter table public.user_goals  enable row level security;
alter table public.routines    enable row level security;

-- Profiles: users can only see/edit their own
create policy "profiles_select" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);

-- User Goals
create policy "goals_select" on public.user_goals for select using (auth.uid() = user_id);
create policy "goals_insert" on public.user_goals for insert with check (auth.uid() = user_id);
create policy "goals_update" on public.user_goals for update using (auth.uid() = user_id);

-- Routines
create policy "routines_select" on public.routines for select using (auth.uid() = user_id);
create policy "routines_insert" on public.routines for insert with check (auth.uid() = user_id);
create policy "routines_update" on public.routines for update using (auth.uid() = user_id);
