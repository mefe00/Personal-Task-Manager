import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../ui/Modal'
import RichTextEditor from '../ui/RichTextEditor'
import { cn } from '../../lib/utils'

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: 'bg-neon-green/20 text-neon-green' },
  { value: 'medium', label: 'Medium', color: 'bg-amber-500/20 text-amber-600 dark:text-amber-400' },
  { value: 'high', label: 'High', color: 'bg-red-500/20 text-red-500' },
]

/**
 * TaskEditorModal - Reusable create/edit modal for tasks.
 * Supports title, rich-text description (Tiptap), priority (Low/Medium/High),
 * comma-separated tags, due date, and time slot.
 */
export default function TaskEditorModal({
  isOpen,
  onClose,
  mode = 'create',
  task = null,
  projectId = null,
  parentId = null,
  onCreate,
  onUpdate,
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [tags, setTags] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [timeSlot, setTimeSlot] = useState('')
  const [kanbanStatus, setKanbanStatus] = useState('todo')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Reset the form whenever the modal opens or the target task changes
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (isOpen) {
      setTitle(task?.title || '')
      setDescription(task?.description || '')
      setPriority(task?.priority || 'medium')
      setTags((task?.tags || []).join(', '))
      setDueDate(task?.due_date || '')
      setTimeSlot(task?.time_slot || '')
      setKanbanStatus(task?.kanban_status || 'todo')
      setError('')
    }
  }, [isOpen, task])
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('Task title is required')
      return
    }

    const payload = {
      title: title.trim(),
      description: description || null,
      priority,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      due_date: dueDate || null,
      time_slot: timeSlot || null,
      kanban_status: kanbanStatus,
    }

    setSaving(true)
    const result =
      mode === 'edit' && task
        ? await onUpdate(task.id, payload)
        : await onCreate({ ...payload, project_id: projectId, parent_id: parentId })
    setSaving(false)

    if (result?.error) {
      const msg = result.error?.message || result.error || 'Something went wrong'
      setError(msg)
      toast.error('Failed to save task')
      return
    }

    toast.success(mode === 'edit' ? 'Task updated!' : 'Task created!')
    onClose()
  }

  // Tags and Kanban board status are only relevant for tasks that belong
  // to a project. They are hidden for standalone (non-project) tasks.
  const isProjectTask = mode === 'edit' ? Boolean(task?.project_id) : Boolean(projectId)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mode === 'edit' ? 'Edit Task' : 'New Task'}>
      <form onSubmit={handleSubmit} className="flex flex-col max-h-[78vh]">
        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-500/10 text-red-500 text-sm">{error}</div>
        )}

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to be done?"
            className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-white/10 border border-white/30 dark:border-white/20 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-neon-purple/50 transition-all"
          />
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Priority
          </label>
          <div className="grid grid-cols-3 gap-2">
            {PRIORITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPriority(opt.value)}
                className={cn(
                  'px-3 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all border',
                  priority === opt.value
                    ? cn(opt.color, 'border-transparent shadow-neon')
                    : 'bg-white/40 dark:bg-white/5 border-white/30 dark:border-white/20 text-slate-600 dark:text-slate-300'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tags - project tasks only */}
        {isProjectTask && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Tags
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Design, Bug, Urgent (comma separated)"
              className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-white/10 border border-white/30 dark:border-white/20 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-neon-purple/50 transition-all"
            />
          </div>
        )}

        {/* Due date & time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-3 rounded-xl bg-white/50 dark:bg-white/10 border border-white/30 dark:border-white/20 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neon-purple/50 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Time Slot
            </label>
            <input
              type="time"
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              className="w-full px-3 py-3 rounded-xl bg-white/50 dark:bg-white/10 border border-white/30 dark:border-white/20 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neon-purple/50 transition-all"
            />
          </div>
        </div>

        {/* Kanban status (project tasks, edit only) */}
        {isProjectTask && mode === 'edit' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Board Status
            </label>
            <select
              value={kanbanStatus}
              onChange={(e) => setKanbanStatus(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-white/10 border border-white/30 dark:border-white/20 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neon-purple/50 transition-all"
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>
        )}

        {/* Description (rich text) */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Description
          </label>
          <RichTextEditor value={description} onChange={setDescription} />
        </div>
        </div>

        {/* Sticky footer - always visible while content scrolls */}
        <div className="shrink-0 sticky bottom-0 -mx-6 -mb-6 px-6 py-4 mt-4 border-t border-white/20 dark:border-white/10 bg-glass-light dark:bg-glass-dark backdrop-blur-xl">
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-white/50 dark:bg-white/10 border border-white/30 dark:border-white/20 text-slate-700 dark:text-slate-300 font-medium transition-all"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={saving}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-neon-purple to-neon-pink text-white font-semibold shadow-neon transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </span>
              ) : (
                mode === 'edit' ? 'Save Changes' : 'Create Task'
              )}
            </motion.button>
          </div>
        </div>
      </form>
    </Modal>
  )
}

