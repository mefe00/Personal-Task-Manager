# PHASE 7: KANBAN BOARDS, TAGS/PRIORITY, AND RICH TEXT DESCRIPTIONS

## Objective
Implement three major premium features: A Trello-style Kanban board for projects, a robust Tags and Priority system for tasks, and Notion-style rich-text editing for task descriptions.

## Step 1: Database Updates (SQL)
*Note to AI:* You MUST generate a file named `phase7_sql_updates.sql` containing the following changes for the `tasks` table:
1. `ALTER TABLE tasks ADD COLUMN kanban_status TEXT DEFAULT 'todo';` (Valid values: 'todo', 'in_progress', 'done').
2. `ALTER TABLE tasks ADD COLUMN priority TEXT DEFAULT 'medium';` (Valid values: 'low', 'medium', 'high').
3. `ALTER TABLE tasks ADD COLUMN tags TEXT[] DEFAULT '{}';` (An array of text strings for colorful labels).

## Step 2: Install New Dependencies
Use your terminal tool to install these required packages:
1. Drag and Drop for Kanban: `npm install @hello-pangea/dnd`
2. Rich Text Editor (Notion style): `npm install @tiptap/react @tiptap/pm @tiptap/starter-kit`

## Step 3: Feature B - Tags & Priority System
1. **Priority:** In the Task creation/edit modal, add a select dropdown for Priority (Low: Green flag, Medium: Yellow/Blue flag, High: Red flag). Display a small flag icon on `TaskItem.jsx` if priority is high or low.
2. **Tags:** Allow users to add comma-separated tags when creating/editing a task (e.g., "Design, Bug, Urgent"). Convert these to an array and save them to the `tags` column. Display tags as small, colored glassmorphic badges on `TaskItem.jsx`.

## Step 4: Feature D - Rich Text Descriptions (Notion-style)
1. Create a new reusable component: `/src/components/ui/RichTextEditor.jsx` using `tiptap`. It should support bold, italic, bullet lists, and code blocks.
2. Update the Task Edit/Details view. Replace the plain `textarea` for the `description` with this new `RichTextEditor`. When a user clicks to view a task's details, they should see beautifully formatted text.

## Step 5: Feature A - Kanban Board (Trello-style)
1. Update `/pages/ProjectDetails.jsx`. Add a toggle switch at the top right of the task section: **[ List View | Kanban Board ]**.
2. **List View:** The existing recursive `TaskItem` tree.
3. **Kanban Board:** Create a new component `/src/components/tasks/KanbanBoard.jsx`. 
   - Render 3 columns: "To Do", "In Progress", "Done".
   - Filter the project's root tasks into these columns based on their `kanban_status`.
   - Implement `@hello-pangea/dnd` so users can drag a task card from "To Do" and drop it into "In Progress". When dropped, instantly update the `kanban_status` in Supabase and the local state.
4. The Kanban task cards should display the task title, priority flag, tags, and the "Sun" (Add to Today) icon.

## Step 6: Generate AI Report
Generate `AI_REPORT_PHASE_7.md` summarizing how the drag-and-drop state is managed, how Tiptap was integrated, and confirming the new database columns.
```eof

### Şimdi Cline'a (Ajan'a) Ne Söyleyeceksin?

Dosyayı kaydedip kapattıktan sonra, Cline sohbetini sıfırla (veya yeni bir chat aç) ve aşağıdaki promptu gönder. 

*(Önceki fazda öğrendiğimiz gibi, ajan takılmasın diye ona SQL dosyasını anında oluşturmasını kesin bir dille söylüyoruz)*:

```text
Hey Cline, we are moving to Phase 7! This is a massive premium update. 

I have created the `07_PHASE_7_KANBAN_TAGS_RICH_TEXT.md` file. Please read it carefully using your file reading tool.

CRITICAL INSTRUCTION: Once you read the file, DO NOT loop or read it again. Immediately execute Step 1 by generating the `phase7_sql_updates.sql` file so I can run it in Supabase. 

After you generate the SQL file, pause and let me know. Once I run the SQL, I will tell you to continue with Steps 2 through 6 (installing dependencies, building the Tags/Priority UI, Tiptap Rich Text, and the Drag-and-Drop Kanban Board). 

Let's do this! Generate the SQL file now!