import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility function to merge Tailwind CSS classes conditionally.
 * Combines clsx (conditional classes) with tailwind-merge (conflict resolution).
 *
 * @param  {...any} inputs - Class names or condition objects
 * @returns {string} - Merged class string
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Build a hierarchical task tree from a flat array of tasks.
 * Uses the Adjacency List pattern (parent_id references id in the same table).
 *
 * @param {Array} tasks - Flat array of task objects with { id, parent_id, ... }
 * @returns {Array} - Tree structure where each task has a `children` array
 */
export function buildTaskTree(tasks) {
  // Create a map for O(1) lookups
  const taskMap = new Map()
  const roots = []

  // First pass: initialize each task with an empty children array
  tasks.forEach((task) => {
    taskMap.set(task.id, { ...task, children: [] })
  })

  // Second pass: attach children to parents, or push to roots if no parent
  taskMap.forEach((task) => {
    if (task.parent_id && taskMap.has(task.parent_id)) {
      taskMap.get(task.parent_id).children.push(task)
    } else {
      roots.push(task)
    }
  })

  return roots
}

/**
 * Recursively collect all descendant IDs of a task (for cascade completion).
 *
 * @param {Object} task - Task node with children array
 * @returns {Array} - Array of all descendant task IDs
 */
export function collectDescendantIds(task) {
  const ids = []
  const stack = [...task.children]

  while (stack.length > 0) {
    const current = stack.pop()
    ids.push(current.id)
    stack.push(...current.children)
  }

  return ids
}

/**
 * Filter a task tree by date range (inclusive).
 * Keeps parent tasks that match, and prunes children that don't match.
 *
 * @param {Array} tree - Task tree from buildTaskTree
 * @param {Date} startDate - Start of range (inclusive)
 * @param {Date} endDate - End of range (inclusive)
 * @returns {Array} - Filtered tree
 */
export function filterTreeByDateRange(tree, startDate, endDate) {
  return tree
    .map((task) => {
      // Recursively filter children first
      const filteredChildren = filterTreeByDateRange(task.children, startDate, endDate)

      // Check if this task's due_date falls within range
      const inRange = task.due_date && isDateInRange(task.due_date, startDate, endDate)

      // Keep task if it's in range OR has matching children
      if (inRange || filteredChildren.length > 0) {
        return { ...task, children: filteredChildren }
      }
      return null
    })
    .filter(Boolean)
}

/**
 * Check if a date string (YYYY-MM-DD) falls within a date range.
 *
 * @param {string} dateStr - Date string from Supabase
 * @param {Date} startDate - Start of range (inclusive)
 * @param {Date} endDate - End of range (inclusive)
 * @returns {boolean}
 */
export function isDateInRange(dateStr, startDate, endDate) {
  if (!dateStr) return false
  const date = new Date(dateStr + 'T00:00:00')
  const start = new Date(startDate)
  start.setHours(0, 0, 0, 0)
  const end = new Date(endDate)
  end.setHours(23, 59, 59, 999)
  return date >= start && date <= end
}

/**
 * Get date range for a given view period.
 *
 * @param {'daily'|'weekly'|'monthly'} period - The period type
 * @param {Date} [now] - Reference date (defaults to today)
 * @returns {{ start: Date, end: Date }} - Inclusive date range
 */
export function getDateRange(period, now = new Date()) {
  const start = new Date(now)
  const end = new Date(now)

  switch (period) {
    case 'daily':
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
      break
    case 'weekly': {
      // Start from Monday
      const day = start.getDay() // 0=Sun, 1=Mon...
      const diff = start.getDate() - day + (day === 0 ? -6 : 1) // Monday
      start.setDate(diff)
      start.setHours(0, 0, 0, 0)
      end.setDate(start.getDate() + 6)
      end.setHours(23, 59, 59, 999)
      break
    }
    case 'monthly':
      start.setDate(1)
      start.setHours(0, 0, 0, 0)
      end.setMonth(end.getMonth() + 1, 0) // Last day of month
      end.setHours(23, 59, 59, 999)
      break
    default:
      break
  }

  return { start, end }
}

export default cn