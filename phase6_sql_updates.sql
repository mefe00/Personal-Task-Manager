-- ============================================================
-- PHASE 6: UI OVERHAUL, TIME TRACKING & STORAGE - SQL UPDATES
-- Run this entire script in the Supabase SQL Editor AFTER the
-- base `supabase_schema.sql` has been applied.
-- ============================================================

-- ============================================================
-- 1. STORAGE BUCKETS
--    avatars         -> user profile pictures (public read)
--    project_covers  -> project cover images (public read)
-- ============================================================

-- Create buckets (idempotent: only insert if missing)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('project_covers', 'project_covers', true)
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- PUBLIC READ POLICIES (anyone can view images)
-- ------------------------------------------------------------
create policy "Public read avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Public read project_covers"
  on storage.objects for select
  using (bucket_id = 'project_covers');

-- ------------------------------------------------------------
-- AUTH UPLOAD / UPDATE / DELETE POLICIES
-- Only authenticated users are allowed to upload/update/delete
-- into these buckets.
-- ------------------------------------------------------------
create policy "Authenticated users can upload avatars"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars' and auth.role() = 'authenticated'
  );

create policy "Authenticated users can update avatars"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.role() = 'authenticated')
  with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

create policy "Authenticated users can delete avatars"
  on storage.objects for delete
  using (bucket_id = 'avatars' and auth.role() = 'authenticated');

create policy "Authenticated users can upload project_covers"
  on storage.objects for insert
  with check (
    bucket_id = 'project_covers' and auth.role() = 'authenticated'
  );

create policy "Authenticated users can update project_covers"
  on storage.objects for update
  using (bucket_id = 'project_covers' and auth.role() = 'authenticated')
  with check (bucket_id = 'project_covers' and auth.role() = 'authenticated');

create policy "Authenticated users can delete project_covers"
  on storage.objects for delete
  using (bucket_id = 'project_covers' and auth.role() = 'authenticated');

-- ============================================================
-- 2. PROJECTS - COVER IMAGE COLUMN
-- ============================================================
alter table public.projects
  add column if not exists cover_image_url text;

-- ============================================================
-- 3. PROJECTS - STATUS CONSTRAINT UPDATE (Phase 6)
--    Replace the old archived status with on_hold.
--    New allowed statuses: active, on_hold, completed
-- ============================================================
alter table public.projects
  drop constraint if exists projects_status_check;

alter table public.projects
  add constraint projects_status_check
  check (status in ('active', 'on_hold', 'completed'));

-- ============================================================
-- 4. TIME_LOGS TABLE
--    Tracks daily worked hours (stopwatch saves here).
--    id              -> unique identifier
--    user_id         -> owner (FK -> profiles.id)
--    duration_seconds-> total elapsed seconds logged
--    logged_date     -> the calendar date the time belongs to
--    created_at      -> when the row was recorded
-- ============================================================
create table if not exists public.time_logs (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null references public.profiles (id) on delete cascade,
  duration_seconds  integer not null default 0,
  logged_date       date not null default current_date,
  created_at        timestamptz default now()
);

create index if not exists time_logs_user_id_idx   on public.time_logs (user_id);
create index if not exists time_logs_logged_date_idx on public.time_logs (logged_date);

-- ------------------------------------------------------------
-- ROW LEVEL SECURITY for time_logs
-- ------------------------------------------------------------
alter table public.time_logs enable row level security;

create policy "Users can view own time logs"
  on public.time_logs for select
  using (user_id = auth.uid());

create policy "Users can insert own time logs"
  on public.time_logs for insert
  with check (user_id = auth.uid());

create policy "Users can update own time logs"
  on public.time_logs for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete own time logs"
  on public.time_logs for delete
  using (user_id = auth.uid());

-- ============================================================
-- PHASE 6 SQL UPDATES COMPLETE
-- ============================================================
