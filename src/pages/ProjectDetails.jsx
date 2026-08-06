import { useMemo, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, FolderKanban, GitBranch, ExternalLink, Plus, ListTodo, LayoutList, LayoutGrid } from 'lucide-react'
import toast from 'react-hot-toast'
import { useProjects } from '../hooks/useProjects'
import { useTasks } from '../hooks/useTasks'
import TaskItem from '../components/tasks/TaskItem'
import TaskEditorModal from '../components/tasks/TaskEditorModal'
import KanbanBoard from '../components/tasks/KanbanBoard'
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

  // View mode: 'list' | 'kanban'
  const [view, setView] = useState('list')
  // Task editor modal (create / edit)
  const [creating, setCreating] = useState(false)
  const [editingTask, setEditingTask] = useState(null)

  // Find the current project from the fetched projects
  const project = useMemo(
    () => projects.find((p) => p.id === projectId) || null,
    [projects, projectId]
  )

  // Filter tasks strictly for this project_id
  const projectTasks = useMemo(
    () => tasks.filter((t) => t.project_id === projectId),
    [tasks, projectId]
  )

  // Build the task tree for this project only
  const projectTree = useMemo(() => buildTaskTree(projectTasks), [projectTasks])

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
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Project Tasks
            <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
              ({projectTree.length} root tasks)
            </span>
          </h2>

          <div className="flex items-center gap-2">
            {/* View toggle (List | Board) */}
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

        {/* Empty state / Board / List */}
        {projectTree.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-neon-cyan/10 text-neon-cyan mb-6"
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
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-purple text-white font-semibold shadow-neon"
            >
              <Plus className="w-5 h-5" />
              Add First Task
            </motion.button>
          </motion.div>
        ) : view === 'kanban' ? (
          <KanbanBoard
            tasks={projectTasks}
            onUpdateKanbanStatus={handleUpdateKanbanStatus}
            onEditTask={handleEditTask}
          />
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
                />
              ))}
            </AnimatePresence>
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
      />
      <TaskEditorModal
        isOpen={!!editingTask}
        onClose={closeEditModal}
        mode="edit"
        task={editingTask}
        onUpdate={updateTask}
      />
    </div>
  )
}
