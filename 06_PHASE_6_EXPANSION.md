# PHASE 6: UI OVERHAUL, TIME TRACKING, AND ADVANCED PROJECT/TASK UX

## Objective
Transform the app from a niche tool into a generalized, highly professional Personal ERP. This includes shifting the color theme to Blue, decoupling project tasks from the daily agenda, adding a stopwatch/time tracker, adding image uploads, and adding dynamic progress rings.

## Step 1: Theme Shift & Generalization (Req 1 & 7)
1. **Color Theme:** Change the primary application theme (Tailwind config, UI components, gradients, hover states) from Purple/Neon to a professional, modern **Blue/Indigo** palette (e.g., Slate + Blue or Indigo accents). Keep the glassmorphic feel.
2. **Generalization:** Search the entire codebase for specific niche terms like "PCB", "Firmware", "Hardware", or "Embedded Systems". Replace them with general terms (e.g., "Software, Design, Marketing, Web") or remove them entirely. Make the app suitable for ANY professional.

## Step 2: Database & Storage Preparation (Req 6 & 5)
*Note to AI:* Since you cannot run SQL directly, you MUST generate a file named `phase6_sql_updates.sql` containing:
1. Commands to create Supabase Storage Buckets: `avatars` (for user profiles) and `project_covers` (for project images). Include public access policies for reading, and auth policies for uploading.
2. `ALTER TABLE projects ADD COLUMN cover_image_url TEXT;`
3. A new table `time_logs` (id, user_id, duration_seconds, logged_date) with RLS policies so users can track their daily worked hours.

## Step 3: Project Upgrades (Req 2, 6, 8)
1. **Status Update:** Update project statuses to: `active`, `on_hold` (inactive/paused), and `completed`. Update UI badges and filters to reflect this.
2. **Project Images:** In the Create/Edit Project modal, add a file input to upload a cover image to the `project_covers` bucket. Display this image on the Project Card and Project Details header.
3. **Dynamic Progress Ring:** In `ProjectDetails.jsx`, add a circular progress chart (using Recharts PieChart or a custom SVG circle). It must calculate `(completed tasks / total tasks) * 100` dynamically. As users add/check tasks, the ring must animate and update its percentage in real-time.

## Step 4: The "Add to Today" Task Workflow (Req 3 & 4)
1. **Decouple from Daily:** When creating a task INSIDE a project (`ProjectDetails.jsx`), its `due_date` should default to `null`. It belongs to the project, not a specific day.
2. **"Add to Today" Action:** Next to tasks in the Project view, add a quick action button (e.g., a "Sun" icon or "Add to Today" button). When clicked, it sets that task's `due_date` to `today's date`. This will automatically make it appear in the global `TaskView` -> `Daily` tab. 
3. **Clearable Dates:** In the Task Calendar picker, add a "Clear Date" button. Setting a task's date to `null` should remove it from the Daily/Weekly views (pushing it back to just the Project or Inbox).
4. **Global State Sync:** Ensure that updating a task or project name/description instantly updates the state globally without requiring a hard refresh.

## Step 5: Stopwatch & Monthly Analytics (Req 5)
1. **The Stopwatch:** Add a floating widget or a section in the Dashboard with a Stopwatch (00:00:00). It needs Play, Pause, and Stop/Save buttons.
2. **Save Time:** When stopped, save the elapsed time to the new `time_logs` table for the current date.
3. **Monthly Chart:** In the Dashboard, add a new Recharts Bar Chart showing "Hours Worked per Day" for the current month, pulling data from the `time_logs` table.

## Step 6: Profile Pictures (Req 6)
1. Update `Settings.jsx` to allow users to upload an image to the `avatars` bucket.
2. Update the `avatar_url` in the `profiles` table.
3. Ensure the Sidebar/Header globally reflects the new uploaded profile picture instead of just initials.

## Step 7: Rewrite README
Completely rewrite the `README.md`. Make it highly professional, generalized (no personal info), highlighting the new Blue theme, Time Tracking, and advanced task logic. Include setup instructions for the new Storage Buckets and SQL.