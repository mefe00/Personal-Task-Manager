# Planning - Personal Task Manager

A modern, professional Personal Task Manager and Project Management application. It combines an infinite nested task engine, Kanban boards, rich-text task descriptions, time tracking, a media tracker, and live dashboard feeds in a calm Blue/Slate glassmorphic interface with dark and light modes.

## Overview

Planning is built for professionals who need a single, focused workspace to manage projects, tasks, reading lists, and daily time across one account. The application runs entirely on Supabase for authentication, storage, and a relational PostgreSQL backend, while the frontend is a fast React + Vite single-page application.

## Features

### Navigation and Layout
- Apple-style floating, glassmorphic, pill-shaped top navigation bar centered at the top of the screen.
- Links to Dashboard, Projects, Tasks, Media, and Settings, with a theme toggle, user account menu, and sign out control.
- Professional Blue and Slate color palette; all legacy purple and neon accents have been removed.

### Task Engine
- Infinite nested tasks using the Adjacency List pattern (`parent_id` referencing `tasks.id`) with recursive rendering.
- Cascade completion with the option to complete an entire sub-tree.
- Inbox, Daily, Weekly, and Monthly views with smart date filtering.
- Inbox view hides completed tasks and project tasks, and sorts the newest entries first.
- Contextual task editor: Tags and Kanban board status fields are hidden for standalone (non-project) tasks.
- Quick read-only description viewer to inspect a task's rich-text description without entering edit mode.
- Drag-and-drop Kanban board (Todo / In Progress / Done) per project, with priority flags and tag badges.
- Task dependencies with "Blocked by" chips, a red Overdue badge on past-due tasks, and an admin notification.

### Profile and Settings
- Dedicated Profile page (`/profile`) for the public identity: bio, social links, and completed projects, reached from the avatar menu.
- Settings holds private system configuration only: account details, profile photo, appearance, and the Theme Studio.

### Dynamic Themes
- Theme Studio in Settings offers five Blue/Slate background presets: Classic Slate, Sunrise, Clear Daylight, Dusk, and Midnight Blue.
- Optional time-of-day matching rotates the background automatically for the current hour, re-evaluated once a minute.
- Optional custom background image layered over the gradient; only http(s) URLs are accepted, and the value is validated before use.
- Preferences persist per user in the `user_preferences` table; the resolved background is published as CSS variables so every surface stays consistent.

### Collaboration
- Team tab per project with a secure, RPC-backed user search (match by email or full name) and Admin/Member roles.
- Task assignment by dragging a member avatar from the palette onto a task, or via the assign popover; assignee avatars render below tasks in both List and Board views.
- Overdue monitoring: past-due tasks show a red badge, the project header shows an overdue counter, and the project admin receives an in-app notification.
- Quick Notes scratchpad with instant localStorage persistence, "Send to Project" delivery into the `project_notes` table, and a global Notes page for every captured note.

### Rich-Text Descriptions
- Notion-style rich-text editor powered by Tiptap for task descriptions.
- Supports headings, bullet and ordered lists, code blocks, bold, and italic.

### Time Tracking
- Integrated time tracker card on the Dashboard.
- Live timer with play, pause, and stop-to-save controls; entries persist to the `time_logs` table.
- Monthly hours-worked bar chart on the Dashboard.

### Dashboard Feeds
- Current weather for the user's location using the free Open-Meteo API via the browser Geolocation API.
- A live Tech & World News vertical feed aggregated from top-tier sources (BBC, Reuters, Ars Technica, Daily Sabah, and more) via no-key public endpoints.
- Each news item carries a dynamically assigned category badge (Quantum, AI, Space, Turkey, Geopolitics, Science, Technology, Business, Economy, or General) derived from the headline and content.
- The feed renders in a clean vertical scrolling container with a minimalist custom scrollbar; loading, permission-denied, and error states are handled gracefully.

### Media Tracker
- A dedicated page to track Books to read, Movies to watch, and other media.
- Add, filter, mark-as-completed, and remove entries persisted to the `media_tracker` table.

### Authentication and Security
- Email/password authentication via Supabase Auth.
- Row Level Security (RLS) on all tables; users only access their own data.
- Protected routes with loading states and automatic profile creation on signup.

## Architecture

The application uses a single Supabase project for the entire backend:

- Authentication and user profiles (`profiles`).
- Projects and nested tasks with RLS-safe ownership (`user_id`).
- Time logging (`time_logs`).
- Media tracking (`media_tracker`).
- Storage buckets for user avatars and project cover images.

The frontend fetches data through small, focused custom hooks (`useProjects`, `useTasks`, `useTimeLogs`, `useMediaTracker`) and keeps local state synchronized with Supabase after every mutation.

## Tech Stack

| Layer            | Technology                                       |
|------------------|--------------------------------------------------|
| Frontend         | React 18, Vite                                    |
| Styling          | Tailwind CSS 3 (glassmorphic, Blue/Slate palette) |
| Animations       | Framer Motion                                     |
| Icons            | Lucide React                                      |
| Routing          | React Router DOM v6                               |
| Charts           | Recharts                                          |
| Drag & Drop      | @hello-pangea/dnd                                 |
| Rich Text        | Tiptap (@tiptap/react + StarterKit)               |
| Backend          | Supabase (PostgreSQL, Auth, Storage, RLS)         |
| Deployment       | Netlify (Frontend) and Supabase (Backend)         |

## Project Structure

```
/src
  /assets
  /components
    /auth          # Authentication guards
    /dashboard     # Weather and News feed cards
    /projects      # TeamTab, TeamPalette (collaboration)
    /tasks         # TaskItem, TaskEditorModal, KanbanBoard, AssigneeAvatars
    /ui            # TopNav, Modal, RichTextEditor, Stopwatch
  /contexts        # Auth, Theme, Preferences, Stopwatch providers
  /hooks           # Data hooks (projects, tasks, time logs, media, notes, team)
  /layouts         # MainLayout (top navigation shell)
  /lib             # supabase client, utilities
  /pages           # Dashboard, Projects, ProjectDetails, TaskView, MediaTracker, Notes, Profile, Settings
```

## Getting Started

### Prerequisites
- Node.js (18 or later)
- A Supabase project

### Database Setup
The full backend schema is applied with one idempotent script. Open the Supabase SQL Editor and run either:

- `supabase_setup_all.sql` - the complete setup in a single file (recommended), or
- the individual scripts below, in order.

1. `supabase_schema.sql` - base schema (profiles, projects, tasks) with RLS policies.
2. `phase6_sql_updates.sql` - storage buckets, cover images, and the `time_logs` table.
3. `phase7_sql_updates.sql` - Kanban status, priority, and tags columns on tasks.
4. `phase8_sql_updates.sql` - the `media_tracker` table with RLS policies.
5. `task2_sql_updates.sql` - the `project_notes` table used by the Quick Notes scratchpad.
6. `phase9_sql_updates.sql` - collaboration tables (`project_members`, `task_assignments`, `task_dependencies`) and `user_preferences`.
7. `phase9_task4_invite_support.sql` - `profiles.email`, the authenticated profile directory policy, and the secure `search_users` RPC used by the Team tab search bar.

All of these scripts are idempotent: every policy, trigger, table, column, index, and function is created with a guard (`IF NOT EXISTS`, `DROP ... IF EXISTS`, or `CREATE OR REPLACE`), so they can be re-run at any time and will repair a partially applied database without raising `already exists` errors.

The optional scheduled-email setup is separate: `cron_notifications_setup.sql` requires the `pg_cron` and `pg_net` extensions plus a deployed `send-daily-summary` Edge Function, and it needs your project ref and service-role key pasted in before running.

### Applying SQL from the Terminal (optional)
Instead of pasting scripts into the SQL Editor, migrations can be applied with the helper script. Add the connection string (Dashboard -> Project Settings -> Database -> Connection string -> URI) to `.env`, which is gitignored:

```env
SUPABASE_DB_URL=postgresql://postgres.YOUR_PROJECT_REF:YOUR_DB_PASSWORD@aws-0-YOUR_REGION.pooler.supabase.com:5432/postgres
```

Then run:

```bash
./run-supabase-sql.sh supabase_setup_all.sql --verify
```

The script applies the file through `psql` inside a throwaway `postgres:16-alpine` container (no local PostgreSQL client required) and never prints the connection string. Because it is not `VITE_`-prefixed, Vite never exposes it to the browser.

#### Finding the connection string in the Supabase Dashboard

1. Open your project, then click the green **Connect** button in the top bar (or go to **Project Settings -> Database**).
2. Choose **Session pooler** - this string works over IPv4. Use **Direct connection** only if your network supports IPv6.
3. Keep the **URI** tab selected and copy the string. It looks like:

   ```
   postgresql://postgres.<project-ref>:[YOUR-PASSWORD]@aws-0-<region>.pooler.supabase.com:5432/postgres
   ```

4. Replace `[YOUR-PASSWORD]` with your database password. If you do not have it, use **Reset database password** first and copy the generated value (this does not affect the deployed app, which uses the anon key).
5. Paste the completed string after `SUPABASE_DB_URL=` in `.env`.

If the password contains reserved URI characters (`@ : / ? # & %`), percent-encode them (`@` becomes `%40`, `:` becomes `%3A`, `/` becomes `%2F`, `#` becomes `%23`, `?` becomes `%3F`, `&` becomes `%26`, `%` becomes `%25`), or reset the password to letters and numbers only.

### Environment Configuration
Copy `.env.example` to `.env` and fill in your Supabase credentials:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
VITE_PORTFOLIO_WEBHOOK_URL=https://your-webhook-url.com/hook
```

Find these values in the Supabase Dashboard under Settings, then API.

### Enable Email Authentication
In the Supabase Dashboard, go to Authentication and Providers, ensure the Email provider is enabled, and optionally disable email confirmation for local testing.

### Run the Application

```bash
npm install
npm run dev
```

Open http://localhost:5173 and register a new account.

## Deployment (Netlify)

1. Push this repository to GitHub.
2. In Netlify, create a new site from Git and select the repository.
3. Set the build command to `npm run build` and the publish directory to `dist`.
4. Add the environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
5. Deploy.

## License

This project is intended for personal use. You are free to fork and customize it for your own needs.
