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

### Rich-Text Descriptions
- Notion-style rich-text editor powered by Tiptap for task descriptions.
- Supports headings, bullet and ordered lists, code blocks, bold, and italic.

### Time Tracking
- Integrated time tracker card on the Dashboard.
- Live timer with play, pause, and stop-to-save controls; entries persist to the `time_logs` table.
- Monthly hours-worked bar chart on the Dashboard.

### Dashboard Feeds
- Current weather for the user's location using the free Open-Meteo API via the browser Geolocation API.
- A live Tech & World News carousel fetched from a free, no-key public endpoint.
- Loading, permission-denied, and error states are handled gracefully for both feeds.

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
    /tasks         # TaskItem, TaskEditorModal, KanbanBoard
    /ui            # TopNav, Modal, RichTextEditor, Stopwatch
  /contexts        # Auth and Theme providers
  /hooks           # Data hooks (projects, tasks, time logs, media)
  /layouts         # MainLayout (top navigation shell)
  /lib             # supabase client, utilities
  /pages           # Dashboard, Projects, ProjectDetails, TaskView, MediaTracker, Settings
```

## Getting Started

### Prerequisites
- Node.js (18 or later)
- A Supabase project

### Database Setup
Run the SQL scripts in the Supabase SQL Editor in order:

1. `supabase_schema.sql` - base schema (profiles, projects, tasks) with RLS policies.
2. `phase6_sql_updates.sql` - storage buckets, cover images, and the `time_logs` table.
3. `phase7_sql_updates.sql` - Kanban status, priority, and tags columns on tasks.
4. `phase8_sql_updates.sql` - the `media_tracker` table with RLS policies.

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
