import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Calendar, Plus, Trash2, Clock, Sun, CalendarX2, Pencil, Flag, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '../../lib/utils'

/**
 * TaskItem - Recursive component for the infinite nested task tree.
 * Renders a single task and recursively renders its children.
 *
 * Features:
 * - Checkbox to toggle completion (with optional cascade)
 * - Expand/collapse sub-tasks with smooth Framer Motion animations
 * - Calendar button to set due_date and time_slot
 * - "+" button to add sub-tasks (inline input)
 * - Delete button
 */
export default function TaskItem({
  task,
  depth = 0,
  onToggle,
  onToggleCascade,
  onAddSubTask,
  onUpdateTask,
  onDeleteTask,
  onEditTask,
}) {
  const [expanded, setExpanded] = useState(true)
  const [addingSubTask, setAddingSubTask] = useState(false)
  const [newSubTaskTitle, setNewSubTaskTitle] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showDescription, setShowDescription] = useState(false)
  const [dueDate, setDueDate] = useState(task.due_date || '')
  const [timeSlot, setTimeSlot] = useState(task.time_slot || '')
  const [updating, setUpdating] = useState(false)

  const hasChildren = task.children && task.children.length > 0

  // Local YYYY-MM-DD string helpers (avoid UTC date mismatches)
  const toLocalDateString = (d) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  const todayStr = toLocalDateString(new Date())
  // Task is "on today" when it has a due_date equal to today
  const isDueToday = Boolean(task.due_date) && task.due_date === todayStr

  /**
   * Handle checkbox toggle - optionally cascade to children
   */
  const handleToggle = async () => {
    const newStatus = !task.status

    if (newStatus && hasChildren) {
      // Ask if user wants to complete all sub-tasks
      const cascade = window.confirm('Mark all sub-tasks as complete?')
      if (cascade) {
        setUpdating(true)
        const result = await onToggleCascade(task.id, task.children, newStatus)
        setUpdating(false)
        if (result?.error) {
          toast.error('Failed to complete sub-tasks')
        } else {
          toast.success('All sub-tasks completed!')
        }
        return
      }
    }

    setUpdating(true)
    const result = await onToggle(task.id, newStatus)
    setUpdating(false)
    if (result?.error) {
      toast.error('Failed to update task')
    } else {
      toast.success(newStatus ? 'Task completed' : 'Task reopened')
    }
  }

  /**
   * Handle adding a new sub-task
   */
  const handleAddSubTask = async (e) => {
    e.preventDefault()

    if (!newSubTaskTitle.trim()) return

    setUpdating(true)
    try {
      await onAddSubTask(newSubTaskTitle.trim(), task.id)
      setNewSubTaskTitle('')
      setAddingSubTask(false)
      setExpanded(true) // Auto-expand to show the new sub-task
    } catch (err) {
      console.error('Error adding sub-task:', err)
    } finally {
      setUpdating(false)
    }
  }

  /**
   * Handle saving due date and time slot
   */
  const handleSaveSchedule = async () => {
    setUpdating(true)
    const result = await onUpdateTask(task.id, {
      due_date: dueDate || null,
      time_slot: timeSlot || null,
    })
    if (result?.error) {
      toast.error('Failed to save schedule')
    } else {
      toast.success('Schedule saved!')
    }
    setShowDatePicker(false)
    setUpdating(false)
  }

  /**
   * "Add to Today" - assign this task to today's date so it shows up
   * in the global Daily view. Works for ANY task via onUpdateTask.
   */
  const handleAddToToday = async (e) => {
    e.stopPropagation()
    setUpdating(true)
    const result = await onUpdateTask(task.id, { due_date: todayStr })
    setUpdating(false)
    if (result?.error) {
      toast.error('Failed to add to today')
    } else {
      toast.success('Added to today')
      setDueDate(todayStr)
      setShowDatePicker(false)
    }
  }

  /**
   * Clear Date - remove the task's due date/time so it disappears from
   * Daily/Weekly/Monthly views and returns to the project/inbox.
   */
  const handleClearDate = async () => {
    setUpdating(true)
    const result = await onUpdateTask(task.id, { due_date: null, time_slot: null })
    if (result?.error) {
      toast.error('Failed to clear date')
    } else {
      toast.success('Date cleared')
      setDueDate('')
      setTimeSlot('')
    }
    setShowDatePicker(false)
    setUpdating(false)
  }

  return (
    <div className="relative">
      {/* Vertical connector line for nested tasks */}
      {depth > 0 && (
        <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-neon-purple/30 to-transparent" />
      )}

      <motion.div
        layout
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'group relative rounded-xl transition-all',
          depth > 0 && 'ml-8'
        )}
      >
        {/* Task row */}
        <div
          className={cn(
            'flex items-center gap-2 px-3 py-2.5 rounded-xl',
            'bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/10',
            'hover:bg-white/60 dark:hover:bg-white/10 transition-colors',
            task.status && 'opacity-60'
          )}
        >
          {/* Expand/collapse chevron */}
          {hasChildren ? (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setExpanded(!expanded)}
              className="p-1 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
              aria-label={expanded ? 'Collapse sub-tasks' : 'Expand sub-tasks'}
            >
              <motion.div
                animate={{ rotate: expanded ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight className="w-4 h-4" />
              </motion.div>
            </motion.button>
          ) : (
            <div className="w-6" />
          )}

          {/* Checkbox */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleToggle}
            disabled={updating}
            className={cn(
              'flex items-center justify-center w-5 h-5 rounded-md border-2 transition-all shrink-0',
              task.status
                ? 'bg-gradient-to-br from-neon-green to-neon-cyan border-transparent'
                : 'border-slate-400 dark:border-slate-500 hover:border-neon-purple dark:hover:border-neon-cyan'
            )}
            aria-label={task.status ? 'Mark as incomplete' : 'Mark as complete'}
          >
            {task.status && (
              <motion.svg
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                viewBox="0 0 24 24"
                className="w-3.5 h-3.5 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </motion.svg>
            )}
          </motion.button>

          {/* Title */}
          <span
            className={cn(
              'flex-1 text-sm font-medium text-slate-800 dark:text-slate-200',
              task.status && 'line-through text-slate-400 dark:text-slate-500'
            )}
          >
            {task.title}
          </span>

          {/* Quick description viewer (read-only) */}
          {task.description && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowDescription((v) => !v)}
              className={cn(
                'p-1.5 rounded-lg transition-colors shrink-0',
                showDescription
                  ? 'text-blue-500 bg-blue-500/10'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-blue-500/10 hover:text-blue-500'
              )}
              aria-label={showDescription ? 'Hide description' : 'Show description'}
              title={showDescription ? 'Hide description' : 'Show description'}
            >
              <Eye className="w-4 h-4" />
            </motion.button>
          )}

          {/* Priority flag (only high/low) */}
          {task.priority === 'high' && (
            <Flag
              className="w-4 h-4 text-red-500 shrink-0"
              aria-label="High priority"
              title="High priority"
            />
          )}
          {task.priority === 'low' && (
            <Flag
              className="w-4 h-4 text-neon-green shrink-0"
              aria-label="Low priority"
              title="Low priority"
            />
          )}

          {/* Tags badges */}
          {(task.tags || []).length > 0 && (
            <div className="flex items-center gap-1 flex-wrap shrink-0">
              {task.tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-md bg-neon-purple/10 text-neon-purple dark:text-neon-cyan text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Due date / time badge */}
          {(task.due_date || task.time_slot) && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-neon-cyan/10 text-neon-cyan text-xs font-medium shrink-0">
              <Clock className="w-3 h-3" />
              {task.due_date && new Date(task.due_date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              {task.time_slot && ` ${task.time_slot.slice(0, 5)}`}
            </span>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Calendar / schedule */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
              aria-label="Set due date"
            >
              <Calendar className="w-4 h-4" />
            </motion.button>

            {/* Today quick action — Add to Today, or Clear if already due today */}
            {isDueToday ? (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleClearDate}
                disabled={updating}
                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-colors disabled:opacity-50"
                aria-label="Clear date (remove from today)"
                title="Clear date"
              >
                <CalendarX2 className="w-4 h-4" />
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleAddToToday}
                disabled={updating}
                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-amber-400/20 hover:text-amber-500 transition-colors disabled:opacity-50"
                aria-label="Add to today"
                title="Add to today"
              >
                <Sun className="w-4 h-4" />
              </motion.button>
            )}

            {/* Edit */}
            {onEditTask && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onEditTask(task)}
                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-blue-500/10 hover:text-blue-500 transition-colors"
                aria-label="Edit task"
                title="Edit task"
              >
                <Pencil className="w-4 h-4" />
              </motion.button>
            )}

            {/* Add sub-task */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setAddingSubTask(!addingSubTask)}
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-neon-purple/10 hover:text-neon-purple dark:hover:text-neon-cyan transition-colors"
              aria-label="Add sub-task"
            >
              <Plus className="w-4 h-4" />
            </motion.button>

            {/* Delete */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                if (window.confirm('Delete this task and all its sub-tasks?')) {
                  onDeleteTask(task.id)
                }
              }}
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-colors"
              aria-label="Delete task"
            >
              <Trash2 className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* Read-only expandable description */}
        <AnimatePresence>
          {showDescription && task.description && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div
                className="mt-2 ml-8 p-3 rounded-xl bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/10 text-sm text-slate-800 dark:text-slate-200 rich-text-editor"
                dangerouslySetInnerHTML={{ __html: task.description }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Inline date/time picker */}
        <AnimatePresence>
          {showDatePicker && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-2 ml-8 p-3 rounded-xl bg-white/50 dark:bg-white/10 border border-white/20 dark:border-white/10 flex items-center gap-2">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-white/50 dark:bg-white/10 border border-white/30 dark:border-white/20 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neon-purple/50"
                />
                <input
                  type="time"
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-white/50 dark:bg-white/10 border border-white/30 dark:border-white/20 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neon-purple/50"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleClearDate}
                  disabled={updating}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/50 dark:bg-white/10 border border-white/30 dark:border-white/20 text-slate-600 dark:text-slate-300 text-sm font-medium disabled:opacity-50"
                  aria-label="Clear date"
                  title="Clear date"
                >
                  <CalendarX2 className="w-4 h-4" />
                  Clear
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSaveSchedule}
                  disabled={updating}
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-neon-purple to-neon-pink text-white text-sm font-medium disabled:opacity-50"
                >
                  Save
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Inline add sub-task input */}
        <AnimatePresence>
          {addingSubTask && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleAddSubTask}
              className="overflow-hidden"
            >
              <div className="mt-2 ml-8 flex items-center gap-2">
                <input
                  type="text"
                  value={newSubTaskTitle}
                  onChange={(e) => setNewSubTaskTitle(e.target.value)}
                  placeholder="Sub-task title..."
                  autoFocus
                  className="flex-1 px-3 py-2 rounded-lg bg-white/50 dark:bg-white/10 border border-white/30 dark:border-white/20 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-neon-purple/50"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={updating || !newSubTaskTitle.trim()}
                  className="px-3 py-2 rounded-lg bg-gradient-to-r from-neon-cyan to-neon-purple text-white text-sm font-medium disabled:opacity-50"
                >
                  Add
                </motion.button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Recursive children rendering with smooth expand/collapse */}
        <AnimatePresence initial={false}>
          {expanded && hasChildren && (
            <motion.div
              key="children"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="mt-1 space-y-1">
                {task.children.map((child) => (
                  <TaskItem
                    key={child.id}
                    task={child}
                    depth={depth + 1}
                    onToggle={onToggle}
                    onToggleCascade={onToggleCascade}
                    onAddSubTask={onAddSubTask}
                    onUpdateTask={onUpdateTask}
                    onDeleteTask={onDeleteTask}
                    onEditTask={onEditTask}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}