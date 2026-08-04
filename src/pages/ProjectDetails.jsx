import { useMemo, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, FolderKanban, GitBranch, ExternalLink, Plus, Loader2, ListTodo } from 'lucide-react'
import toast from 'react-hot-toast'
import { useProjects } from '../hooks/useProjects'
import { useTasks } from '../hooks/useTasks'
import TaskItem from '../components/tasks/TaskItem'
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

  const [addingTask, setAddingTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [submitting, setSubmitting] = useState(false)

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

  const loading = projectsLoading || tasksLoading

  /**
   * Create a new root task INSIDE this project.
   * CRITICAL: Must include project_id so it belongs to this project.
   */
  const handleCreateTask = async (e) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) {
      toast.error('Task title cannot be empty')
      return
    }

    setSubmitting(true)
    try {
      const result = await createTask({
        title: newTaskTitle.trim(),
        project_id: projectId,
      })

      if (result?.error) {
        toast.error(`Failed to create task: ${result.error.message || result.error}`)
        return
      }

      toast.success('Task added to project!')
      setNewTaskTitle('')
      setAddingTask(false)
    } catch (err) {
      console.error('Error creating project task:', err)
      toast.error('Failed to create task')
    } finally {
      setSubmitting(false)
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
    archived: 'bg-slate-500/20 text-slate-500 dark:text-slate-400',
  }

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
        className="bg-glass-light dark:bg-glass-dark backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-glass rounded-2xl p-6 mb-8"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Project icon */}
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-neon-purple/20 to-neon-pink/20 text-neon-purple dark:text-neon-cyan">
              <FolderKanban className="w-7 h-7" />
            </div>

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
                  {project.status}
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {project.description || 'No description provided.'}
              </p>
            </div>
          </div>

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
      </motion.div>

      {/* ===== Tasks Section ===== */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Project Tasks
          <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
            ({projectTree.length} root tasks)
          </span>
        </h2>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setAddingTask(!addingTask)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-purple text-white font-semibold shadow-neon transition-all"
        >
          <Plus className="w-5 h-5" />
          New Task
        </motion.button>
      </div>

      {/* Inline add task (with project_id) */}
      <AnimatePresence>
        {addingTask && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleCreateTask}
            className="overflow-hidden mb-4"
          >
            <div className="flex items-center gap-2 p-3 rounded-xl bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/10">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder={`Add task to "${project.name}"...`}
                autoFocus
                className="flex-1 px-3 py-2 rounded-lg bg-white/50 dark:bg-white/10 border border-white/30 dark:border-white/20 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-neon-purple/50"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={submitting || !newTaskTitle.trim()}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-neon-cyan to-neon-purple text-white text-sm font-medium disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Add'
                )}
              </motion.button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Empty state */}
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
            onClick={() => setAddingTask(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-purple text-white font-semibold shadow-neon"
          >
            <Plus className="w-5 h-5" />
            Add First Task
          </motion.button>
        </motion.div>
      ) : (
        /* Project task tree */
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
                onDeleteTask={handleDelete}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}