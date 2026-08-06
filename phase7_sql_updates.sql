-- ============================================================
-- PHASE 7: KANBAN BOARDS, TAGS/PRIORITY & RICH TEXT - SQL UPDATES
-- Run this entire script in the Supabase SQL Editor AFTER the
-- base `supabase_schema.sql` and `phase6_sql_updates.sql`.
-- ============================================================

-- ============================================================
-- TASKS TABLE - NEW COLUMNS (Phase 7)
-- ============================================================

-- 1. KANBAN STATUS
--    Valid values: 'todo', 'in_progress', 'done'
alter table public.tasks
  add column if not exists kanban_status text default 'todo';

alter table public.tasks
  drop constraint if exists tasks_kanban_status_check;

alter table public.tasks
  add constraint tasks_kanban_status_check
  check (kanban_status in ('todo', 'in_progress', 'done'));

-- 2. PRIORITY
--    Valid values: 'low', 'medium', 'high'
alter table public.tasks
  add column if not exists priority text default 'medium';

alter table public.tasks
  drop constraint if exists tasks_priority_check;

alter table public.tasks
  add constraint tasks_priority_check
  check (priority in ('low', 'medium', 'high'));

-- 3. TAGS
--    An array of text strings for colorful labels (e.g. {"Design","Bug","Urgent"})
alter table public.tasks
  add column if not exists tags text[] default '{}';

-- Backfill any existing rows with the defaults (safety for older data)
update public.tasks
   set kanban_status = 'todo'
 where kanban_status is null;

update public.tasks
   set priority = 'medium'
 where priority is null;

update public.tasks
   set tags = '{}'
 where tags is null;

-- ============================================================
-- PHASE 7 SQL UPDATES COMPLETE
-- ============================================================
