# PHASE 5: UX POLISH, SETTINGS, AND PROJECT-SPECIFIC TASK MANAGEMENT

## Objective
Fix the invisible task bug by adding an Inbox tab, build out the missing Settings page, add global toast notifications, and crucially: create a dedicated Project Details page so users can manage tasks *inside* specific projects.

## Step 1: Fix Task Visibility (The "Inbox" Tab)
**The Problem:** When a user creates a task without a `due_date`, it disappears because `TaskView.jsx` only filters by Daily/Weekly/Monthly.
**The Fix:**
1. In `/pages/TaskView.jsx`, add an "Inbox" or "All Tasks" tab and make it the **default active tab**.
2. This tab MUST display ALL root tasks, specifically including those where `due_date` is `null`.

## Step 2: Complete the Settings Page
**The Problem:** `/pages/Settings.jsx` is a placeholder.
**The Fix:**
1. Build a functional, glassmorphic Settings page.
2. Fetch the current user from the `profiles` table. Allow updating `full_name` and `avatar_url`.
3. Add a theme toggle (Dark/Light).

## Step 3: Dedicated Project Details & Inside-Project Tasks (CRITICAL)
**The Problem:** Projects are just static cards. Users need to click a project and add tasks *inside* it.
**The Fix:**
1. Update `/pages/Projects.jsx`: Make the project cards clickable. When clicked, navigate to a new route `/projects/:projectId`.
2. Create `/pages/ProjectDetails.jsx`: 
   - Top section: Display project name, description, status, and GitHub link. Include a "Back to Projects" button.
   - Bottom section: The Task Engine. Render the recursive `TaskItem` tree here, but **filtered strictly for this specific `project_id`**.
   - Add a "New Task" input specifically on this page. When a root task is created here, it MUST automatically include the current `project_id` so it belongs to this project in the database.

## Step 4: Global Notifications (Toasts)
**The Problem:** Silent UI on success/error.
**The Fix:**
1. Install `react-hot-toast` (or `sonner`).
2. Add success/error toasts across the app (e.g., when a task is created, profile updated, or an error occurs).

## Step 5: Generate the AI Report
Generate `AI_REPORT_PHASE_5.md`. Explain the new `/projects/:projectId` routing, how project-specific tasks are filtered and saved, and how the Inbox UX bug was resolved.
```eof

### Şimdi Ne Yapacaksın?

Dosyayı senin için güncelledim. Şimdi VSCode'a dön ve **Cline'a (Chat kısmına) şu mesajı gönder:**

```text
I have updated the file named 05_PHASE_5_FINAL_POLISH.md because I need a dedicated Project Details view where I can create tasks specifically inside a project. 

Please read the updated 05_PHASE_5_FINAL_POLISH.md carefully. Execute ALL instructions step by step. Pay special attention to Step 3 (Creating the ProjectDetails page and linking tasks to it). Do not stop until you generate the final AI_REPORT_PHASE_5.md.