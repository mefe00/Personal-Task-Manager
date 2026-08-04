-- ============================================================
-- PERSONAL ERP & TASK MANAGER - SUPABASE DATABASE SCHEMA
-- Phase 1: Initial Schema
-- Run this entire script in the Supabase SQL Editor
-- ============================================================

-- ============================================================
-- EXTENSIONS
-- ============================================================
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. PROFILES TABLE
--    Mirrors auth.users and stores user profile info
-- ============================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  avatar_url  text,
  updated_at  timestamptz default now()
);

-- Automatically update updated_at on row changes
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();

-- Auto-create a profile row whenever a new auth user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ============================================================
-- 2. PROJECTS TABLE
-- ============================================================
create table if not exists public.projects (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles (id) on delete cascade,
  name            text not null,
  description     text,
  status          text not null default 'active'
                  check (status in ('active', 'completed', 'archived')),
  github_repo_url text,
  created_at      timestamptz default now()
);

create index if not exists projects_user_id_idx on public.projects (user_id);

-- ============================================================
-- 3. TASKS TABLE (CRITICAL)
--    Infinite nesting via Adjacency List pattern:
--    parent_id references tasks(id) with ON DELETE CASCADE
-- ============================================================
create table if not exists public.tasks (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  project_id  uuid references public.projects (id) on delete set null,
  parent_id   uuid references public.tasks (id) on delete cascade,
  title       text not null,
  description text,
  status      boolean not null default false,
  due_date    date,
  time_slot   time,
  created_at  timestamptz default now()
);

-- Indexes for fast queries on nesting and ownership
create index if not exists tasks_user_id_idx    on public.tasks (user_id);
create index if not exists tasks_project_id_idx on public.tasks (project_id);
create index if not exists tasks_parent_id_idx  on public.tasks (parent_id);

-- ============================================================
-- 4. ROW LEVEL SECURITY (RLS)
--    Users can only access rows where user_id = auth.uid()
--    (For profiles: id = auth.uid())
-- ============================================================

-- Enable RLS on all tables
alter table public.profiles  enable row level security;
alter table public.projects  enable row level security;
alter table public.tasks     enable row level security;

-- -------- PROFILES POLICIES --------
create policy "Users can view own profile"
  on public.profiles for select
  using (id = auth.uid());

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (id = auth.uid());

create policy "Users can update own profile"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "Users can delete own profile"
  on public.profiles for delete
  using (id = auth.uid());

-- -------- PROJECTS POLICIES --------
create policy "Users can view own projects"
  on public.projects for select
  using (user_id = auth.uid());

create policy "Users can insert own projects"
  on public.projects for insert
  with check (user_id = auth.uid());

create policy "Users can update own projects"
  on public.projects for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete own projects"
  on public.projects for delete
  using (user_id = auth.uid());

-- -------- TASKS POLICIES --------
create policy "Users can view own tasks"
  on public.tasks for select
  using (user_id = auth.uid());

create policy "Users can insert own tasks"
  on public.tasks for insert
  with check (user_id = auth.uid());

create policy "Users can update own tasks"
  on public.tasks for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete own tasks"
  on public.tasks for delete
  using (user_id = auth.uid());

-- ============================================================
-- SCHEMA COMPLETE
-- ============================================================