PHASE 4: DASHBOARD STATS, NOTIFICATIONS, AND PORTFOLIO WEBHOOK

Objective

Build the Dashboard analytics (visualizing task density), setup instructions for Supabase cron/email notifications, and implement the webhook for the external portfolio.

Step 1: Dashboard Analytics (Recharts)

Install recharts.

In /pages/Dashboard.jsx, build a visual representation of task density.

Calculate: Total active projects, Total tasks completed this week vs last week.

Display a "Today's Agenda" list pulling tasks where due_date is today, ordered by time_slot.

Step 2: Portfolio Webhook Trigger (Edge Function Prep)

We need a way to send project data to the user's external Portfolio when a project is marked as "Completed".

In the Project details view, add a "Publish to Portfolio" button.

When clicked, it should make a POST request to a given Webhook URL (stored in user settings or .env).

Step 3: SQL for Notifications (pg_cron setup)

Since you (the AI) cannot configure Supabase Edge Functions directly, generate a SQL script named cron_notifications_setup.sql for the human.
This SQL should demonstrate how to use pg_cron (if enabled) or webhooks in Supabase to call an external Edge Function every 24 hours to send summary emails.

Step 4: Generate the AI Report

Generate the final AI_REPORT_PHASE_4.md. Congratulate the user on completing the Personal ERP. Summarize how the dashboard calculates data and explain exactly how the user can implement the email sending (e.g., using Resend API inside a Supabase Edge Function).