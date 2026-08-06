import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ListTodo, Loader2, Inbox } from 'lucide-react'
import toast from 'react-hot-toast'
import { useTasks } from '../hooks/useTasks'
import TaskItem from '../components/tasks/TaskItem'
import TaskEditorModal from '../components/tasks/TaskEditorModal'
import { buildTaskTree, filterTreeByDateRange, getDateRange, collectDescendantIds, cn } from '../lib/utils'

const TABS = [
  { id: 'inbox', label: 'Inbox', icon: Inbox },
  { id: 'daily', label: 'Daily', icon: null },
  { id: 'weekly', label: 'Weekly', icon: null },
  { id: 'monthly', label: 'Monthly', icon: null },
]

/**
 * TaskView - Global task view with Inbox/Daily/Weekly/Monthly tabs.
 * The Inbox tab is the default and shows ALL root tasks including
 * those without a due_date (fixes the "invisible task" bug).
 */
export default function TaskView() {
  const {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    toggleTask,
    toggleTaskCascade,
    deleteTask,
  } = useTasks()

  const [activeTab, setActiveTab] = useState('inbox')
  const [addingRootTask, setAddingRootTask] = useState(false)
  const [newRootTaskTitle, setNewRootTaskTitle] = useState('')
  const [submitting, setSubmitting] = useState(false)
  // Full editor modal (priority / tags / rich-text / board status)
  const [editingTask, setEditingTask] = useState(null)

  // Build the full task tree
  const fullTree = useMemo(() => buildTaskTree(tasks), [tasks])

  // Filter tree based on active tab
  const filteredTree = useMemo(() => {
    if (activeTab === 'inbox') {
      // Inbox shows ALL root tasks, including those with null due_date
      // But we also need to include tasks that have children even if
      // the parent has no due_date (so nested tasks remain accessible)
      return fullTree
    }
    const { start, end } = getDateRange(activeTab)
    return filterTreeByDateRange(fullTree, start, end)
  }, [fullTree, activeTab])

  /**
   * Handle adding a root task
   */
  const handleAddRootTask = async (e) => {
    e.preventDefault()
    if (!newRootTaskTitle.trim()) {
      toast.error('Task title cannot be empty')
      return
    }

    setSubmitting(true)
    try {
      const result = await createTask({ title: newRootTaskTitle.trim() })
      if (result?.error) {
        toast.error(`Failed to create task: ${result.error.message || result.error}`)
        return
      }
      toast.success('Task created successfully!')
      setNewRootTaskTitle('')
      setAddingRootTask(false)
    } catch (err) {
      console.error('Error adding task:', err)
      toast.error('Failed to create task')
    } finally {
      setSubmitting(false)
    }
  }

  /**
   * Handle adding a sub-task
   */
  const handleAddSubTask = async (title, parentId) => {
    const result = await createTask({ title, parent_id: parentId })
    if (result?.error) {
      toast.error(`Failed to add sub-task: ${result.error.message || result.error}`)
    } else {
      toast.success('Sub-task added!')
    }
  }

  /**
    * Open the editor modal for an existing task
    * (priority / tags / board status / rich-text description)
    */
  const handleEditTask = (task) => setEditingTask(task)
  const closeEditor = () => setEditingTask(null)

  /**
   * Handle cascade toggle (parent + all descendants)
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
   * Handle task toggle
   */
  const handleToggle = async (taskId, status) => {
    const result = await toggleTask(taskId, status)
    if (result?.error) {
      toast.error('Failed to update task')
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

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
            Tasks
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Infinite nested task tree
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setAddingRootTask(!addingRootTask)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-neon-purple to-neon-pink text-white font-semibold shadow-neon hover:shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" />
          New Task
        </motion.button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {TABS.map((tab) => (
          <motion.button
            key={tab.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
              activeTab === tab.id
                ? 'bg-gradient-to-r from-neon-purple to-neon-pink text-white shadow-neon'
                : 'bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-white/10'
            )}
          >
            {tab.icon && <tab.icon className="w-4 h-4" />}
            {tab.label}
          </motion.button>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400">
          Failed to load tasks: {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            className="w-10 h-10 rounded-full border-4 border-neon-purple/30 border-t-neon-purple"
          />
        </div>
      )}

      {/* Inline add root task */}
      <AnimatePresence>
        {addingRootTask && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleAddRootTask}
            className="overflow-hidden mb-4"
          >
            <div className="flex items-center gap-2 p-3 rounded-xl bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/10">
              <input
                type="text"
                value={newRootTaskTitle}
                onChange={(e) => setNewRootTaskTitle(e.target.value)}
                placeholder="Task title..."
                autoFocus
                className="flex-1 px-3 py-2 rounded-lg bg-white/50 dark:bg-white/10 border border-white/30 dark:border-white/20 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-neon-purple/50"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={submitting || !newRootTaskTitle.trim()}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-neon-purple to-neon-pink text-white text-sm font-medium disabled:opacity-50"
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
      {!loading && !error && filteredTree.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-neon-pink/10 text-neon-pink mb-6"
          >
            <ListTodo className="w-10 h-10" />
          </motion.div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {tasks.length === 0 ? 'No tasks yet' : `No tasks for ${activeTab} view`}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {tasks.length === 0
              ? 'Create your first task to get started'
              : activeTab === 'inbox'
                ? 'Your inbox is empty'
                : 'Tasks with due dates in this period will appear here'}
          </p>
          {tasks.length === 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setAddingRootTask(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-neon-purple to-neon-pink text-white font-semibold shadow-neon"
            >
              <Plus className="w-5 h-5" />
              Create Task
            </motion.button>
          )}
        </motion.div>
      )}

      {/* Task tree */}
      {!loading && !error && filteredTree.length > 0 && (
        <div className="space-y-1">
          <AnimatePresence>
            {filteredTree.map((task) => (
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
      {/* Task editor modal (edit priority / tags / board / rich text) */}
      <TaskEditorModal
        isOpen={!!editingTask}
        onClose={closeEditor}
        mode="edit"
        task={editingTask}
        onUpdate={updateTask}
      />
    </div>
  )
}