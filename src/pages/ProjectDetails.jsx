import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, ArrowLeft, FolderKanban, GitBranch, ExternalLink, Plus, ListTodo, LayoutList, LayoutGrid, StickyNote, Unlink, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { useProjects } from '../hooks/useProjects'
import { useTasks } from '../hooks/useTasks'
import { useNotes } from '../hooks/useNotes'
import { useTeam } from '../hooks/useTeam'
import { useAuth } from '../contexts/AuthContext'
import TaskItem from '../components/tasks/TaskItem'
import TaskEditorModal from '../components/tasks/TaskEditorModal'
import KanbanBoard from '../components/tasks/KanbanBoard'
import TeamTab from '../components/projects/TeamTab'
import TeamPalette from '../components/projects/TeamPalette'
import { buildTaskTree, collectDescendantIds, cn } from '../lib/utils'

/**
 * ProjectDetails - Dedicated project view with project-specific tasks.
 * Route: /projects/:projectId
 *
 * - Top: Project info (name, description, status, GitHub link, Back button)
 * - Bottom: Task Engine filtered strictly for this project_id
 * - "New Task" input creates root tasks WITH the current project_id
 */
export default function ProjectDetails() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { projects, loading: projectsLoading } = useProjects()
  const { tasks, loading: tasksLoading, createTask, updateTask, toggleTask, toggleTaskCascade, deleteTask } = useTasks()
  const { notes: projectNotes, loading: notesLoading, detachNote } = useNotes({ projectId })
  const { user } = useAuth()

  // View mode: 'list' | 'kanban' | 'team'
  const [view, setView] = useState('list')
  // Task editor modal (create / edit)
  const [creating, setCreating] = useState(false)
  const [editingTask, setEditingTask] = useState(null)

  // IMPORTANT: `project` and `projectTasks` must be declared BEFORE the
  // useTeam() call and the isAdmin check below. Consuming them earlier hits
  // the temporal dead zone and throws a ReferenceError at render time.
  const project = useMemo(
    () => projects.find((p) => p.id === projectId) || null,
    [projects, projectId]
  )

  const projectTasks = useMemo(
    () => tasks.filter((t) => t.project_id === projectId),
    [tasks, projectId]
  )

  const {
    members: teamMembers,
    assignments,
    dependencies,
    inviteByEmail,
    removeMember,
    assignUser,
    unassignUser,
    addDependency,
    removeDependency,
    searchUsers,
  } = useTeam(projectId, projectTasks)

  // The project owner is the admin (projects.user_id holds the owner id).
  const isAdmin = user?.id === project?.user_id

  // Build the task tree for this project only
  const projectTree = useMemo(() => buildTaskTree(projectTasks), [projectTasks])

  // Overdue tasks: they have a past due_date and are not completed yet.
  const overdueTasks = useMemo(() => {
    const now = new Date()
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')}`
    return projectTasks.filter((t) => !t.status && t.due_date && t.due_date < todayStr)
  }, [projectTasks])

  // Notify the project admin (once per project visit) when overdue work exists.
  const notifiedProjectRef = useRef(null)
  useEffect(() => {
    if (!isAdmin || overdueTasks.length === 0) return
    if (notifiedProjectRef.current === projectId) return
    notifiedProjectRef.current = projectId
    toast.error(
      `${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''} need attention`,
      { duration: 6000 }
    )
  }, [isAdmin, overdueTasks.length, projectId])

  // Dynamic progress: (completed tasks / total tasks) * 100
  const totalTasks = projectTasks.length
  const completedTasks = projectTasks.filter((t) => t.status).length
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const loading = projectsLoading || tasksLoading

    /**
   * Open the full Task Editor modal to CREATE a new root task in this project.
   */
  const openCreateModal = () => setCreating(true)
  const closeCreateModal = () => setCreating(false)

  /**
   * Open the Task Editor modal pre-filled for editing an existing task.
   */
  const handleEditTask = (task) => setEditingTask(task)
  const closeEditModal = () => setEditingTask(null)

  /**
   * Move a task across kanban columns (To Do / In Progress / Done).
   */
  const handleUpdateKanbanStatus = async (taskId, status) => {
    const result = await updateTask(taskId, { kanban_status: status })
    if (result?.error) {
      toast.error('Failed to update board status')
    } else {
      toast.success('Task moved!')
    }
  }

  /**
   * Add sub-task inside this project (inherits project_id from parent)
   */
  const handleAddSubTask = async (title, parentId) => {
    const parentTask = tasks.find((t) => t.id === parentId)
    const result = await createTask({
      title,
      parent_id: parentId,
      project_id: parentTask?.project_id || projectId,
    })
    if (result?.error) {
      toast.error(`Failed to add sub-task: ${result.error.message || result.error}`)
    } else {
      toast.success('Sub-task added!')
    }
  }

  /**
   * Handle toggle
   */
  const handleToggle = async (taskId, status) => {
    const result = await toggleTask(taskId, status)
    if (result?.error) {
      toast.error('Failed to update task')
    }
  }

  /**
   * Handle cascade toggle
   */
  const handleToggleCascade = async (taskId, children, status) => {
    const descendantIds = children.flatMap((child) => [
      child.id,
      ...collectDescendantIds(child),
    ])
    const result = await toggleTaskCascade(taskId, descendantIds, status)
    if (result?.error) {
      toast.error('Failed to update tasks')
    } else {
      toast.success(status ? 'All sub-tasks completed!' : 'All sub-tasks reopened')
    }
  }

  /**
   * Handle delete
   */
  const handleDelete = async (taskId) => {
    const result = await deleteTask(taskId)
    if (result?.error) {
      toast.error('Failed to delete task')
    } else {
      toast.success('Task deleted')
    }
  }

  /**
   * Remove a note from this project WITHOUT deleting it.
   * Sets project_id -> null so the note becomes a "General" note and stays
   * visible in the global Notes view.
   */
  const handleDetachNote = async (noteId) => {
    const { error } = await detachNote(noteId)
    if (error) {
      toast.error(`Couldn't remove note from project: ${error.message || error}`)
    } else {
      toast.success('Removed from project — still in your Notes')
    }
  }

  /**
   * Team tab handlers (wired to useTeam + toast feedback).
   */
  const handleInvite = async (email, role) => inviteByEmail(email, role)
  const handleRemoveMember = async (userId) => {
    const { error } = await removeMember(userId)
    if (error) toast.error(`Couldn't remove member: ${error}`)
    else toast.success('Member removed')
  }
  const handleAssign = async (taskId, userId) => {
    const { error } = await assignUser(taskId, userId)
    if (error) toast.error(`Couldn't assign user: ${error}`)
  }
  const handleUnassign = async (taskId, userId) => {
    const { error } = await unassignUser(taskId, userId)
    if (error) toast.error(`Couldn't unassign user: ${error}`)
  }
  const handleAddDependency = async (taskId, dependsOnTaskId) => {
    const { error } = await addDependency(taskId, dependsOnTaskId)
    if (error) toast.error(`Couldn't link task: ${error}`)
    return { error }
  }
  const handleRemoveDependency = async (taskId, dependsOnTaskId) => {
    const { error } = await removeDependency(taskId, dependsOnTaskId)
    if (error) toast.error(`Couldn't unlink task: ${error}`)
    return { error }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-10 h-10 rounded-full border-4 border-neon-purple/30 border-t-neon-purple"
        />
      </div>
    )
  }

  // Project not found
  if (!project) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Project not found
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          The project you're looking for doesn't exist or was deleted.
        </p>
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-neon-purple to-neon-pink text-white font-semibold shadow-neon"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Projects
        </Link>
      </div>
    )
  }

  const statusColors = {
    active: 'bg-neon-green/20 text-neon-green',
    completed: 'bg-neon-cyan/20 text-neon-cyan',
    on_hold: 'bg-amber-500/20 text-amber-500 dark:text-amber-400',
  }

  // Progress ring constants (SVG circle)
  const RING_RADIUS = 52
  const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS
  const ringOffset = RING_CIRCUMFERENCE * (1 - progress / 100)

  return (
    <div>
      {/* Back button */}
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/projects')}
        className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 hover:text-neon-purple dark:hover:text-neon-cyan transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Projects
      </motion.button>

      {/* ===== Project Header ===== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-glass-light dark:bg-glass-dark backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-glass rounded-2xl overflow-hidden mb-8"
      >
        {/* Cover image (if any) */}
        {project.cover_image_url && (
          <div className="h-44 w-full overflow-hidden">
            <img
              src={project.cover_image_url}
              alt={`${project.name} cover`}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex items-center gap-4">
              {/* Project icon / cover thumbnail */}
              {project.cover_image_url ? (
                <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-white/20 dark:border-white/10">
                  <img src={project.cover_image_url} alt="cover" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-purple/20 to-neon-pink/20 text-neon-purple dark:text-neon-cyan">
                  <FolderKanban className="w-8 h-8" />
                </div>
              )}

              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {project.name}
                  </h1>
                  <span
                    className={cn(
                      'px-3 py-1 rounded-full text-xs font-semibold capitalize',
                      statusColors[project.status] || statusColors.active
                    )}
                  >
                    {project.status === 'on_hold' ? 'On Hold' : project.status}
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {project.description || 'No description provided.'}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-2">
              {/* Dynamic Progress Ring */}
              <div className="relative w-32 h-32">
                <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                  {/* Background track */}
                  <circle
                    cx="60"
                    cy="60"
                    r={RING_RADIUS}
                    fill="none"
                    stroke="rgba(148,163,184,0.2)"
                    strokeWidth="10"
                  />
                  {/* Animated progress arc */}
                  <motion.circle
                    cx="60"
                    cy="60"
                    r={RING_RADIUS}
                    fill="none"
                    stroke="url(#progressGradient)"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={RING_CIRCUMFERENCE}
                    initial={{ strokeDashoffset: RING_CIRCUMFERENCE }}
                    animate={{ strokeDashoffset: ringOffset }}
                    transition={{ duration: 0.8, ease: 'easeInOut' }}
                  />
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                  </defs>
                </svg>
                {/* Center percentage */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">{progress}%</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {completedTasks}/{totalTasks}
                  </span>
                </div>
              </div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 -mt-1">
                Complete
              </span>

              {/* GitHub link */}
              {project.github_repo_url && (
                <a
                  href={project.github_repo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/10 text-sm text-neon-purple dark:text-neon-cyan hover:bg-white/60 dark:hover:bg-white/10 transition-colors"
                >
                  <GitBranch className="w-4 h-4" />
                  GitHub Repository
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ===== Tasks Section ===== */}
      <div className="space-y-4">
        {/* Section header: title + view toggle + New Task */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center flex-wrap gap-2">
            Project Tasks
            <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
              ({projectTree.length} root tasks)
            </span>
            {overdueTasks.length > 0 && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/15 text-red-500 text-xs font-semibold"
                title={`${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                {overdueTasks.length} overdue
              </span>
            )}
          </h2>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/10">
              <button
                onClick={() => setView('list')}
                className={cn(
                  'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                  view === 'list'
                    ? 'bg-gradient-to-r from-neon-cyan to-neon-purple text-white shadow-neon'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                )}
              >
                <LayoutList className="w-4 h-4" />
                List
              </button>
              <button
                onClick={() => setView('kanban')}
                className={cn(
                  'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                  view === 'kanban'
                    ? 'bg-gradient-to-r from-neon-cyan to-neon-purple text-white shadow-neon'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                )}
              >
                                <LayoutGrid className="w-4 h-4" />
                Board
              </button>
              <button
                onClick={() => setView('team')}
                className={cn(
                  'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                  view === 'team'
                    ? 'bg-gradient-to-r from-neon-cyan to-neon-purple text-white shadow-neon'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                )}
              >
                <Users className="w-4 h-4" />
                Team
              </button>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-purple text-white font-semibold shadow-neon transition-all"
            >
              <Plus className="w-5 h-5" />
              New Task
            </motion.button>
          </div>
        </div>

        {/* Team / Board / List views */}
        {view === 'team' ? (
          <TeamTab
            members={teamMembers}
            isAdmin={isAdmin}
            currentUser={user?.id}
            onInvite={handleInvite}
            onRemoveMember={handleRemoveMember}
            onSearchUsers={searchUsers}
          />
        ) : (
          <>
            {/* Drag palette: admins drag a member avatar onto a task to assign it */}
            {isAdmin && teamMembers.length > 0 && <TeamPalette members={teamMembers} />}

            {view === 'kanban' ? (
              <KanbanBoard
                tasks={projectTasks}
                onUpdateKanbanStatus={handleUpdateKanbanStatus}
                onEditTask={handleEditTask}
                assignments={assignments}
                dependencies={dependencies}
                members={teamMembers}
                isAdmin={isAdmin}
                onAssign={handleAssign}
                onUnassign={handleUnassign}
              />
            ) : projectTree.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16"
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                  className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-blue-500/10 text-blue-500 mb-6"
                >
                  <ListTodo className="w-10 h-10" />
                </motion.div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  No tasks in this project yet
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  Click "New Task" to add the first task to "{project.name}"
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={openCreateModal}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold shadow-neon"
                >
                  <Plus className="w-5 h-5" />
                  Add First Task
                </motion.button>
              </motion.div>
            ) : (
              /* Project task tree (List view) */
              <div className="space-y-1">
                <AnimatePresence>
                  {projectTree.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      depth={0}
                      onToggle={handleToggle}
                      onToggleCascade={handleToggleCascade}
                      onAddSubTask={handleAddSubTask}
                      onUpdateTask={updateTask}
                      onEditTask={handleEditTask}
                      onDeleteTask={handleDelete}
                      assignments={assignments}
                      dependencies={dependencies}
                      members={teamMembers}
                      isAdmin={isAdmin}
                      onAssign={handleAssign}
                      onUnassign={handleUnassign}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </>
        )}
      </div>

      {/* ===== Project Notes ===== */}
      <div className="mt-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-500/15 text-blue-500">
            <StickyNote className="w-4 h-4" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Project Notes
            <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
              ({projectNotes.length})
            </span>
          </h2>
        </div>

        {notesLoading ? (
          <div className="flex items-center justify-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-8 h-8 rounded-full border-4 border-blue-500/30 border-t-blue-500"
            />
          </div>
        ) : projectNotes.length === 0 ? (
          <div className="text-center py-12 bg-glass-light dark:bg-glass-dark backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-glass rounded-2xl">
            <StickyNote className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              No notes for this project yet. Use the Note button (bottom-right) and
              select this project to add one.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projectNotes.map((note) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-glass-light dark:bg-glass-dark backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-glass rounded-2xl p-4 flex flex-col justify-between gap-3"
              >
                <p className="text-sm text-slate-800 dark:text-slate-100 whitespace-pre-wrap break-words">
                  {note.content}
                </p>
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-medium">
                    {note.projects?.name || project.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {note.created_at
                        ? new Date(note.created_at).toLocaleDateString('en-US')
                        : ''}
                    </span>
                    <button
                      onClick={() => handleDetachNote(note.id)}
                      className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-amber-500 hover:bg-amber-500/10 transition-all"
                      title="Remove from this project (keeps the note in your Notes)"
                      aria-label="Remove note from this project"
                    >
                      <Unlink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ===== Task editor modals (create / edit) ===== */}
            <TaskEditorModal
        isOpen={creating}
        onClose={closeCreateModal}
        mode="create"
        projectId={projectId}
        onCreate={createTask}
        availableTasks={projectTasks.map((t) => ({ id: t.id, title: t.title }))}
      />
      <TaskEditorModal
        isOpen={!!editingTask}
        onClose={closeEditModal}
        mode="edit"
        task={editingTask}
        onUpdate={updateTask}
        availableTasks={projectTasks.map((t) => ({ id: t.id, title: t.title }))}
        existingDependencies={
          editingTask ? (dependencies[editingTask.id] || []).map((d) => d.depends_on_task_id) : []
        }
        onAssignDependency={handleAddDependency}
        onRemoveDependency={handleRemoveDependency}
      />
    </div>
  )
}
