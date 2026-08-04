PHASE 2: AUTHENTICATION, LAYOUT, AND PROJECT MANAGEMENT

Objective

Implement Supabase Authentication, create the main application layout with a sidebar navigation, and build the CRUD functionality for Projects.

Step 1: Auth Provider & Context

Create /src/contexts/AuthContext.jsx.

Implement state for user and session.

Listen to Supabase auth state changes (onAuthStateChange).

Wrap the application with AuthProvider in main.jsx.

Step 2: Login and Register Pages

Build a sleek, glassmorphic UI for /pages/Login and /pages/Register.

Use standard Email/Password authentication via Supabase.

Protect the main application routes using a <ProtectedRoute> component.

Step 3: Main Layout (Dashboard Shell)

Build /layouts/MainLayout.jsx.

Create a responsive Sidebar (/components/ui/Sidebar) containing links to: Dashboard, Projects, Tasks, Settings.

Create a Top Header (/components/ui/Header) showing user avatar/name and a logout button.

Use Framer Motion for smooth page transitions between routes.

Step 4: Projects Management (CRUD)

Build /pages/Projects.jsx.

Fetch projects from the projects table using a custom hook (useProjects).

Build a Modal component to "Create New Project" (Needs: Name, Description, GitHub Repo URL).

Display projects as modern cards. Hovering over a card should show a subtle Framer Motion animation.

Step 5: Generate the AI Report

Generate the AI_REPORT_PHASE_2.md file explaining the routing structure, how to test the Auth flow, and how the Protected Routes are configured.