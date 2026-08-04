PHASE 3: INFINITE NESTED TASK ENGINE (THE CORE)

Objective

Build the most complex part of the app: The infinite depth nested task system using the Adjacency List database structure.

Step 1: Data Fetching Strategy for Nested Tasks

Create a hook /src/hooks/useTasks.js.

Fetch tasks from the tasks table. To build the tree structure efficiently on the frontend, fetch ALL tasks for the current user and use a utility function in /src/lib/utils.js (e.g., buildTaskTree) to convert the flat array into a hierarchical tree based on parent_id and id.

Step 2: The Recursive Task Component

Create /src/components/tasks/TaskItem.jsx.

This component MUST call itself recursively to render its children (Sub-tasks).

Features of a single TaskItem:

A checkbox to toggle completion status (update Supabase).

The Task Title.

A "calendar" icon button to set due_date and time_slot.

A "+" button to add a sub-task. When clicked, it opens an inline input field to type a new sub-task which will have its parent_id set to this task's id.

Use Framer Motion (AnimatePresence and motion.div) to smoothly expand/collapse the sub-task lists.

Step 3: Global Task View

Build /pages/TaskView.jsx.

Provide tabs/filters: "Daily", "Weekly", "Monthly".

Filter the buildTaskTree output based on the due_date of the parent tasks.

Ensure checking a parent task optionally asks "Mark all sub-tasks as complete?".

Step 4: Generate the AI Report

Generate AI_REPORT_PHASE_3.md detailing how the recursive component works, how state is managed without excessive re-rendering, and instructions for the user to test adding deep sub-tasks.