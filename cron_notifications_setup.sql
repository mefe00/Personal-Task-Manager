-- ============================================================
-- CRON NOTIFICATIONS SETUP
-- Personal ERP & Task Manager — Phase 4
--
-- This script sets up scheduled email notifications using:
--   1. pg_cron (if enabled on your Supabase project)
--   2. A Supabase Edge Function that sends emails via Resend
--
-- HOW IT WORKS:
--   Every 24 hours, pg_cron calls your Edge Function URL.
--   The Edge Function queries the database for tasks due today
--   and sends a summary email to the user via Resend.
--
-- PREREQUISITES:
--   1. Enable pg_cron: Supabase Dashboard -> Database -> Extensions -> pg_cron
--   2. Create an Edge Function named "send-daily-summary" (see comments below)
--   3. Set the RESEND_API_KEY secret in your Edge Function
-- ============================================================

-- ============================================================
-- STEP 1: ENABLE pg_cron EXTENSION
-- ============================================================
create extension if not exists pg_cron;

-- ============================================================
-- STEP 2: CREATE A FUNCTION TO CALL THE EDGE FUNCTION
--    This function makes an HTTP POST to your Supabase Edge
--    Function using pg_net (Supabase's async HTTP extension).
-- ============================================================

-- Enable pg_net for HTTP requests from the database
create extension if not exists pg_net;

-- Create a function that triggers the daily summary email
create or replace function public.trigger_daily_summary()
returns void
language plpgsql
security definer
as $$
begin
  -- Call the Edge Function via pg_net
  -- Replace YOUR_PROJECT_REF with your actual Supabase project ref
  perform net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-daily-summary',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'  -- Replace with your service role key
    ),
    body := jsonb_build_object(
      'type', 'daily_summary',
      'scheduled_at', now()
    )::text
  );
end;
$$;

-- ============================================================
-- STEP 3: SCHEDULE THE JOB WITH pg_cron
--    Runs every day at 08:00 (server time)
-- ============================================================

-- Remove existing job if it exists (idempotent)
select cron.unschedule('daily-summary-email') where exists (
  select 1 from cron.job where jobname = 'daily-summary-email'
);

-- Schedule the job to run every day at 08:00
select cron.schedule(
  'daily-summary-email',          -- job name
  '0 8 * * *',                    -- cron expression: every day at 08:00
  'select public.trigger_daily_summary()'
);

-- ============================================================
-- STEP 4: VERIFY THE SCHEDULED JOB
-- ============================================================
-- Run this to see all scheduled jobs:
--   select * from cron.job;
--
-- Run this to see job run history:
--   select * from cron.job_run_details order by start_time desc limit 10;

-- ============================================================
-- OPTIONAL: EDGE FUNCTION TEMPLATE (send-daily-summary)
-- ============================================================
-- Create this file in your Supabase project:
--   supabase/functions/send-daily-summary/index.ts
--
-- ```typescript
-- import { createClient } from 'npm:@supabase/supabase-js'
-- import { Resend } from 'npm:resend'
--
-- const supabase = createClient(
--   Deno.env.get('SUPABASE_URL')!,
--   Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
-- )
--
-- const resend = new Resend(Deno.env.get('RESEND_API_KEY'))
--
-- Deno.serve(async (req) => {
--   // Verify the request is from pg_cron (optional: check Authorization header)
--   const auth = req.headers.get('Authorization')
--   if (auth !== `Bearer ${Deno.env.get('CRON_SECRET')}`) {
--     return new Response('Unauthorized', { status: 401 })
--   }
--
--   // Get all users
--   const { data: users, error: usersError } = await supabase
--     .from('profiles')
--     .select('id, full_name')
--
--   if (usersError) throw usersError
--
--   const today = new Date().toISOString().split('T')[0]
--
--   for (const user of users) {
--     // Get tasks due today for this user
--     const { data: tasks, error: tasksError } = await supabase
--       .from('tasks')
--       .select('title, time_slot, status, due_date')
--       .eq('user_id', user.id)
--       .eq('due_date', today)
--       .order('time_slot', { ascending: true })
--
--     if (tasksError) continue
--
--     if (tasks.length === 0) continue
--
--     // Get user email from auth
--     const { data: authUser } = await supabase.auth.admin.getUserById(user.id)
--     const email = authUser?.user?.email
--     if (!email) continue
--
--     // Build email HTML
--     const taskList = tasks
--       .map((t) => `<li>${t.time_slot ? t.time_slot.slice(0, 5) + ' — ' : ''}${t.title} ${t.status ? '✅' : '⏳'}</li>`)
--       .join('')
--
--     // Send email via Resend
--     await resend.emails.send({
--       from: 'Personal ERP <erp@yourdomain.com>',
--       to: email,
--       subject: `📋 Your Daily Task Summary — ${today}`,
--       html: `
--         <h2>Good ${user.full_name || 'there'}! Here's your agenda for today:</h2>
--         <ul>${taskList}</ul>
--         <p>— Your Personal ERP</p>
--       `,
--     })
--   }
--
--   return new Response(JSON.stringify({ success: true }), {
--     headers: { 'Content-Type': 'application/json' },
--   })
-- })
-- ```
--
-- DEPLOY THE EDGE FUNCTION:
--   supabase functions deploy send-daily-summary
--
-- SET SECRETS:
--   supabase secrets set RESEND_API_KEY=your_resend_api_key
--   supabase secrets set CRON_SECRET=your_cron_secret
--
-- ============================================================
-- ALTERNATIVE: USE A WEBHOOK SERVICE (NO EDGE FUNCTION)
-- ============================================================
-- If you prefer not to use Edge Functions, you can use a
-- service like Make.com, Zapier, or n8n:
--
-- 1. Create a webhook in your automation service
-- 2. Replace the net.http_post URL with your webhook URL
-- 3. The webhook service can query Supabase via REST API
--    and send emails via its built-in email actions
--
-- Example with Make.com:
--   perform net.http_post(
--     url := 'https://hook.make.com/YOUR_WEBHOOK_ID',
--     headers := jsonb_build_object('Content-Type', 'application/json'),
--     body := jsonb_build_object('type', 'daily_summary')::text
--   );
-- ============================================================

-- ============================================================
-- CLEANUP (if you need to remove the job)
-- ============================================================
-- select cron.unschedule('daily-summary-email');