PHASE 1: INITIAL SETUP, ARCHITECTURE, AND SUPABASE SCHEMA

Objective

Initialize the React (Vite) project, configure the file structure, set up Tailwind CSS, and provide the exact SQL commands to build the Supabase database schema.

Step 1: Initialize the Project (Frontend)

Initialize a React project using Vite. Use JavaScript + SWC or TypeScript.

Install the following dependencies:

tailwindcss, postcss, autoprefixer

@supabase/supabase-js

framer-motion

lucide-react

react-router-dom

clsx, tailwind-merge

Configure tailwind.config.js to support a modern UI (add custom colors if necessary, e.g., neon accents for a young/dynamic feel).

Step 2: Establish Folder Structure

Create the following folder structure inside /src:

/src
  /assets
  /components
    /auth
    /dashboard
    /projects
    /tasks
    /ui       (for reusable buttons, inputs, modals)
  /contexts   (AuthContext, ThemeContext)
  /hooks      (useSupabase, useTasks, etc.)
  /layouts    (MainLayout, AuthLayout)
  /pages      (Dashboard, Projects, TaskView, Settings)
  /lib        (supabaseClient.js, utils.js)


Step 3: Set up Supabase Client

Create /src/lib/supabaseClient.js (or .ts) and initialize the Supabase client using environment variables:
VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.

Step 4: Database Schema Creation (Provide SQL)

Do NOT try to run these SQL commands yourself. Instead, create a file named supabase_schema.sql in the root directory containing the following PostgreSQL script so the human user can copy/paste it into the Supabase SQL Editor.

Requirements for the SQL Script:

profiles table: id (uuid, references auth.users), full_name (text), avatar_url (text), updated_at.

projects table: id (uuid), user_id (references profiles), name (text), description (text), status (text: 'active', 'completed', 'archived'), github_repo_url (text), created_at.

tasks table (CRITICAL):

id (uuid, primary key)

user_id (uuid, references profiles)

project_id (uuid, references projects, nullable)

parent_id (uuid, references tasks(id) ON DELETE CASCADE)

title (text, required)

description (text)

status (boolean, default false)

due_date (date, nullable)

time_slot (time, nullable)

created_at (timestamp)

Row Level Security (RLS): Write RLS policies for all 3 tables ensuring users can ONLY SELECT, INSERT, UPDATE, DELETE their own rows (user_id = auth.uid()). Note: For profiles, it's id = auth.uid(). Create a trigger to automatically create a profile when a new auth user is registered.

Step 5: Wrap up Phase 1

Ensure the base React app can run without errors and has a dummy "Hello World - Phase 1 Complete" screen configured in App.jsx with React Router ready for the next phase.

Step 6: Generate the AI Report

Generate the AI_REPORT_PHASE_1.md file explicitly telling the user:

To run npm install and npm run dev.

To copy the contents of supabase_schema.sql and run it in their Supabase SQL Editor.

The exact .env variables they need to set up.