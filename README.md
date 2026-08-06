# 🚀 Personal ERP & Task Manager

A modern, high-performance **Personal ERP and Advanced Task Manager** built for any professional — software, design, marketing, web, and beyond. It combines project management, an infinite nested task engine, time tracking, and rich analytics in a sleek glassmorphic Blue/Indigo interface with dark/light mode.

![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white)
![Recharts](https://img.shields.io/badge/Recharts-22b8cf?style=for-the-badge&logo=recharts&logoColor=white)

---

## ✨ Key Features

### ⏱️ Time Tracking & Analytics
- **Floating stopwatch widget** (00:00:00) with Play / Pause / Stop-Save
- Saves elapsed time to a `time_logs` table for the current date
- **"Hours Worked per Day"** Recharts bar chart for the current month on the Dashboard

### 🗂️ Infinite Nested Task Engine
- **Unlimited task depth** using the Adjacency List pattern (`parent_id` → `tasks.id`)
- Recursive `TaskItem` component with smooth Framer Motion expand/collapse animations
- Cascade completion — check a parent to optionally complete all sub-tasks
- **Inbox / Daily / Weekly / Monthly** views with smart date filtering
- **"Add to Today"** quick action and **Clear Date** for flexible scheduling

### 🎨 Dynamic Project Management
- Full CRUD for projects with **cover image uploads** (Supabase Storage)
- Statuses: **Active**, **On Hold**, and **Completed** with color-coded badges & filters
- **Animated progress ring** (`completed / total * 100`) on the project details page
- "Publish to Portfolio" webhook for completed projects
- Clickable glassmorphic project cards with cover-image banners

### 🏗️ Kanban Boards & Priority / Tags
- **Trello-style Kanban board** toggle on each project's details page (`List ↔ Board`)
- Drag-and-drop cards between **Todo / In Progress / Done** columns (`@hello-pangea/dnd`) — `kanban_status` syncs instantly to Supabase
- **Priority flags** on tasks: `low` (green), `medium` (amber), `high` (red)
- **Tag badges** (`tags` text array) with comma-separated editing in the task modal
- **TaskEditorModal** for both create and edit flows (title, priority, tags, due date, time slot)

### ✍️ Rich-Text Task Descriptions
- Notion-style rich-text editor powered by **Tiptap** (`@tiptap/react` + StarterKit) for task descriptions
- Supports **headings, bullet/ordered lists, code blocks, bold/italic/underline**, and more
- Descriptions stored in the `description` column and rendered live in the TaskView

### 📊 Dashboard Analytics
- Task density bar chart (last 7 days) with Recharts
- Task status donut chart (completed vs pending)
- Stat cards: Active Projects, Completed This Week (vs last week), Total Tasks, Due Today
- **Today's Agenda** — tasks due today, ordered by time slot
- **Monthly Hours Worked** bar chart powered by the time tracker
### 🔐 Authentication & Security
- Email/Password auth via **Supabase Auth**
- Row Level Security (RLS) on all tables — users can only access their own data
- Protected routes with loading states
- Auto-profile creation on signup (database trigger)

### 👤 Profiles
- **Profile picture upload** to the `avatars` bucket, reflected in the header globally
- Full name & avatar management in Settings
- Dark/Light theme toggle (persisted to localStorage)
- Global toast notifications (react-hot-toast)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite 8 |
| **Styling** | Tailwind CSS 3 (glassmorphic, Blue/Indigo accents) |
| **Animations** | Framer Motion |
| **Icons** | Lucide React |
| **Routing** | React Router DOM v6 |
| **Charts** | Recharts |
| **Backend** | Supabase (PostgreSQL, Auth, Storage, RLS, Edge Functions, pg_cron) |
| **Animations** | Framer Motion |
| **Drag & Drop** | @hello-pangea/dnd |
| **Rich Text** | Tiptap (@tiptap/react + StarterKit) |
| **Deployment** | Netlify (Frontend) & Supabase (Backend) |

---

## 📁 Project Structure

```
/src
  /assets          # Static assets
  /components
    /auth          # ProtectedRoute
    /tasks         # TaskItem (recursive)
    /ui            # Sidebar, Header, Modal, Stopwatch
  /contexts        # AuthContext, ThemeContext
  /hooks           # useProjects, useTasks, useTimeLogs
  /layouts         # MainLayout
  /lib             # supabaseClient, utils (buildTaskTree, etc.)
  /pages           # Dashboard, Projects, ProjectDetails, TaskView, Settings, Login, Register
```

---

## 🚀 Getting Started

### Step 1: Clone & Install

```bash
git clone https://github.com/mefe00/personal-task-manager.git
cd personal-task-manager
npm install
```

### Step 2: Create Your Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and create a new project
2. Open the **SQL Editor** in the Supabase Dashboard
3. Copy the **entire contents** of `supabase_schema.sql` and paste it into the SQL Editor, then click **Run**. This creates:
   - `profiles` table (with auto-profile trigger on signup)
   - `projects` table
   - `tasks` table (infinite nesting via `parent_id` with `ON DELETE CASCADE`)
   - `time_logs` table
   - Row Level Security (RLS) policies on all tables

### Step 3: Set Up Storage Buckets & Phase 6 Updates

Run the contents of **`phase6_sql_updates.sql`** in the Supabase SQL Editor. This:

- Creates the **`avatars`** and **`project_covers`** public storage buckets
- Adds upload policies for authenticated users and public read access
- Adds `cover_image_url` to the `projects` table
- Updates the project status constraint to `active` / `on_hold` / `completed`
- Creates the **`time_logs`** table with full RLS policies

> **Note:** You can also create the buckets manually in Dashboard → Storage → New Bucket (set **Public**), then apply the storage policies from `phase6_sql_updates.sql`.

### Step 3b: Enable Kanban Boards, Priority & Tags (Phase 7)

Run the contents of **`phase7_sql_updates.sql`** in the Supabase SQL Editor. This adds three new columns to the `tasks` table and backfills existing rows:

- `kanban_status` (`TEXT DEFAULT 'todo'`) with a `CHECK` constraint (`todo`, `in_progress`, `done`)
- `priority` (`TEXT DEFAULT 'medium'`) with a `CHECK` constraint (`low`, `medium`, `high`)
- `tags` (`TEXT[] DEFAULT '{}'`)

> ⚠️ Bu SQL çalıştırılmalı; aksi takdirde Kanban tahtası, öncelik ve etiket özellikleri backend'de çalışmaz.

### Step 4: Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Then fill in your values:

```env
# ============================================================
# SUPABASE ENVIRONMENT VARIABLES
# ============================================================

# Your Supabase project URL (Dashboard -> Settings -> API)
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co

# Your Supabase anon/public key (Dashboard -> Settings -> API)
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

# ============================================================
# PORTFOLIO WEBHOOK (Optional)
# URL that receives POST requests when a project is published
# to your external portfolio.
# ============================================================
VITE_PORTFOLIO_WEBHOOK_URL=https://your-portfolio-webhook-url.com/hook
```

**Where to find these values:**
1. Open your Supabase Dashboard
2. Go to **Settings → API**
3. Copy the **Project URL** → `VITE_SUPABASE_URL`
4. Copy the **anon public** key → `VITE_SUPABASE_ANON_KEY`

### Step 5: Enable Email Auth

1. In Supabase Dashboard → **Authentication → Providers**
2. Ensure **Email** provider is enabled
3. Optionally disable "Confirm email" for faster local testing

### Step 6: Run the App

```bash
npm run dev
```

Open **http://localhost:5173**, register a new account, and start managing your projects, tasks, and time!

---

## 📧 Email Notifications (Optional)

1. Enable **pg_cron** in Supabase Dashboard → Database → Extensions
2. Create an Edge Function:
   ```bash
   supabase functions new send-daily-summary
   ```
3. Copy the template from `cron_notifications_setup.sql` into `supabase/functions/send-daily-summary/index.ts`
4. Set secrets:
   ```bash
   supabase secrets set RESEND_API_KEY=your_resend_api_key
   supabase secrets set CRON_SECRET=your_cron_secret
   ```
5. Deploy:
   ```bash
   supabase functions deploy send-daily-summary
   ```
6. Run the SQL from `cron_notifications_setup.sql` in the Supabase SQL Editor

---

## 🌐 Deployment (Netlify)

1. Push this repo to GitHub
2. In Netlify: **New Site from Git** → select this repo
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Add environment variables in Netlify Dashboard → Site Settings → Environment:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_PORTFOLIO_WEBHOOK_URL` (optional)
5. Deploy! 🎉

---

## 📄 License

This project is for personal use. Feel free to fork and customize for your own needs.

---

## 🙏 Acknowledgements

Built with ❤️ using React, Vite, Tailwind CSS, Supabase, Framer Motion, and Recharts.

