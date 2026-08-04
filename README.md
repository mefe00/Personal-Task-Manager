# 🚀 Personal ERP & Task Manager

A modern, high-performance **Personal ERP and Advanced Task Manager** designed for engineers managing hardware (PCB), firmware, and web projects. Built with a sleek glassmorphic UI, dark/light mode, and buttery-smooth animations.

![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white)
![Recharts](https://img.shields.io/badge/Recharts-22b8cf?style=for-the-badge&logo=recharts&logoColor=white)

---

## ✨ Key Features

### 🗂️ Infinite Nested Task Engine
- **Unlimited task depth** using the Adjacency List pattern (`parent_id` → `tasks.id`)
- Recursive `TaskItem` component with smooth Framer Motion expand/collapse animations
- Cascade completion — check a parent to optionally complete all sub-tasks
- Inline sub-task creation, due date & time slot scheduling
- **Inbox / Daily / Weekly / Monthly** views with smart date filtering

### 📊 Dashboard Analytics
- Task density bar chart (last 7 days) with Recharts
- Task status donut chart (completed vs pending)
- Stat cards: Active Projects, Completed This Week (vs last week), Total Tasks, Due Today
- **Today's Agenda** — tasks due today, ordered by time slot

### 🔐 Authentication & Security
- Email/Password auth via **Supabase Auth**
- Row Level Security (RLS) on all tables — users can only access their own data
- Protected routes with loading states
- Auto-profile creation on signup (database trigger)

### 📁 Project Management
- Full CRUD for projects (name, description, GitHub repo URL, status)
- **Dedicated Project Details page** (`/projects/:projectId`) with project-specific tasks
- Clickable glassmorphic project cards
- **"Publish to Portfolio"** webhook button for completed projects

### ⚙️ Settings & Preferences
- Profile management (full name, avatar URL)
- Dark/Light theme toggle (persisted to localStorage)
- Global toast notifications (react-hot-toast)

### 📧 Email Notifications (Setup Ready)
- `cron_notifications_setup.sql` — pg_cron + Edge Function template for daily email summaries
- Resend API integration guide included

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite 8 |
| **Styling** | Tailwind CSS 3 (glassmorphic, neon accents) |
| **Animations** | Framer Motion |
| **Icons** | Lucide React |
| **Routing** | React Router DOM v6 |
| **Charts** | Recharts |
| **Backend** | Supabase (PostgreSQL, Auth, RLS, Edge Functions, pg_cron) |
| **Deployment** | Netlify (Frontend) & Supabase (Backend) |

---

## 📁 Project Structure

```
/src
  /assets          # Static assets
  /components
    /auth          # ProtectedRoute
    /tasks         # TaskItem (recursive)
    /ui            # Sidebar, Header, Modal
  /contexts        # AuthContext, ThemeContext
  /hooks           # useProjects, useTasks
  /layouts         # MainLayout
  /lib             # supabaseClient, utils (buildTaskTree, etc.)
  /pages           # Dashboard, Projects, ProjectDetails, TaskView, Settings, Login, Register
```

---

## 🚀 Local Setup / Installation

### Prerequisites
- Node.js 18+ and npm
- A [Supabase](https://supabase.com) account (free tier is fine)

### Step 1: Clone & Install

```bash
git clone https://github.com/mefe00/personal-task-manager.git
cd personal-task-manager
npm install
```

### Step 2: Create Your Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and create a new project
2. Once created, open **SQL Editor** in the Supabase Dashboard
3. Copy the **entire contents** of `supabase_schema.sql` and paste it into the SQL Editor
4. Click **Run** — this creates:
   - `profiles` table (with auto-profile trigger on signup)
   - `projects` table
   - `tasks` table (infinite nesting via `parent_id` with `ON DELETE CASCADE`)
   - Row Level Security policies on all tables

### Step 3: Configure Environment Variables

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

### Step 4: Enable Email Auth

1. In Supabase Dashboard → **Authentication → Providers**
2. Ensure **Email** provider is enabled
3. Optionally disable "Confirm email" for faster local testing

### Step 5: Run the App

```bash
npm run dev
```

Open **http://localhost:5173** — register a new account and start managing your projects and tasks!

---

## 📧 Setting Up Email Notifications (Optional)

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