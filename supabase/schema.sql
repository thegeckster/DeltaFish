-- DeltaFish Database Schema
-- Run this entire script in Supabase SQL Editor (one time setup)

-- 1. Trips table
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date_fished date not null,
  launch_location text not null,
  start_time time not null,
  end_time time not null,
  water_temp_f numeric not null,
  water_clarity_inches numeric not null,
  vegetation_types text[] default '{}',
  vegetation_density text not null,
  areas_fished text[] default '{}',
  lures_used text[] default '{}',
  lures_caught_fish text[] default '{}',
  spawn_observations text default '',
  observational_notes text default '',
  is_tournament boolean default false,
  tournament_placement integer,
  tournament_weight_lbs numeric,
  winning_pattern_notes text
);

-- 2. Fish catches table
create table if not exists public.fish_catches (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references public.trips(id) on delete cascade not null,
  species text default 'Largemouth Bass',
  weight_lbs numeric,
  lure_used text default '',
  notes text
);

-- 3. Trip conditions table (auto-enriched environmental data)
create table if not exists public.trip_conditions (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references public.trips(id) on delete cascade not null,
  weather_hourly jsonb default '[]',
  air_temp_start_f numeric,
  air_temp_end_f numeric,
  wind_speed_avg_mph numeric,
  wind_direction text,
  barometric_pressure_trend text,
  barometric_pressure_start numeric,
  barometric_pressure_end numeric,
  tide_schedule jsonb default '[]',
  tide_stage_dominant text,
  tide_coefficient numeric,
  moon_phase text,
  moon_illumination_pct numeric,
  rainfall_48hr_inches numeric,
  spawn_phase_estimate text
);

-- 4. User settings table
create table if not exists public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  openai_api_key text default '',
  default_launch_location text default '',
  custom_lures text[] default '{}'
);

-- 5. Enable Row Level Security on all tables
alter table public.trips enable row level security;
alter table public.fish_catches enable row level security;
alter table public.trip_conditions enable row level security;
alter table public.user_settings enable row level security;

-- 6. RLS Policies - users can only see/edit their own data
create policy "Users can read own trips" on public.trips
  for select using (auth.uid() = user_id);
create policy "Users can insert own trips" on public.trips
  for insert with check (auth.uid() = user_id);
create policy "Users can update own trips" on public.trips
  for update using (auth.uid() = user_id);
create policy "Users can delete own trips" on public.trips
  for delete using (auth.uid() = user_id);

create policy "Users can read own catches" on public.fish_catches
  for select using (trip_id in (select id from public.trips where user_id = auth.uid()));
create policy "Users can insert own catches" on public.fish_catches
  for insert with check (trip_id in (select id from public.trips where user_id = auth.uid()));
create policy "Users can delete own catches" on public.fish_catches
  for delete using (trip_id in (select id from public.trips where user_id = auth.uid()));

create policy "Users can read own conditions" on public.trip_conditions
  for select using (trip_id in (select id from public.trips where user_id = auth.uid()));
create policy "Users can insert own conditions" on public.trip_conditions
  for insert with check (trip_id in (select id from public.trips where user_id = auth.uid()));

create policy "Users can read own settings" on public.user_settings
  for select using (auth.uid() = user_id);
create policy "Users can insert own settings" on public.user_settings
  for insert with check (auth.uid() = user_id);
create policy "Users can update own settings" on public.user_settings
  for update using (auth.uid() = user_id);
