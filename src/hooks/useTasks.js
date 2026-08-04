import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'

/**
 * useTasks - Custom hook for the infinite nested task system.
 * Fetches ALL tasks for the current user and provides CRUD operations.
 * The tree structure is built on the frontend using buildTaskTree (Adjacency List).
 */
export function useTasks() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch all tasks on mount / user change
  useEffect(() => {
    let isMounted = true

    async function loadTasks() {
      if (!user) {
        if (isMounted) setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (!isMounted) return

      if (error) {
        setError(error.message)
      } else {
        setTasks(data || [])
      }

      setLoading(false)
    }

    loadTasks()

    return () => {
      isMounted = false
    }
  }, [user])

  /**
   * Create a new task (root or sub-task).
   * @param {Object} params - { title, parent_id, project_id, due_date, time_slot }
   */
  const createTask = async ({ title, parent_id = null, project_id = null, due_date = null, time_slot = null }) => {
    if (!user) return { error: 'Not authenticated' }
    if (!title?.trim()) return { error: 'Title is required' }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([
          {
            user_id: user.id,
            parent_id,
            project_id,
            title: title.trim(),
            due_date,
            time_slot,
            status: false,
          },
        ])
        .select()
        .single()

      if (error) {
        console.error('Error adding task:', error)
        return { data, error }
      }

      setTasks((prev) => [...prev, data])
      return { data, error: null }
    } catch (err) {
      console.error('Error adding task:', err)
      return { error: err }
    }
  }

  /**
   * Update a task's fields.
   * @param {string} id - Task ID
   * @param {Object} updates - Fields to update
   */
  const updateTask = async (id, updates) => {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (!error) {
      setTasks((prev) => prev.map((t) => (t.id === id ? data : t)))
    }

    return { data, error }
  }

  /**
   * Toggle a task's completion status.
   * @param {string} id - Task ID
   * @param {boolean} status - New status
   */
  const toggleTask = async (id, status) => {
    return updateTask(id, { status })
  }

  /**
   * Toggle a task AND all its descendants (cascade).
   * @param {string} id - Task ID
   * @param {Array} descendantIds - All descendant task IDs
   * @param {boolean} status - New status
   */
  const toggleTaskCascade = async (id, descendantIds, status) => {
    const ids = [id, ...descendantIds]

    const { data, error } = await supabase
      .from('tasks')
      .update({ status })
      .in('id', ids)
      .select()

    if (!error) {
      setTasks((prev) => {
        const updatedMap = new Map(data.map((t) => [t.id, t]))
        return prev.map((t) => updatedMap.get(t.id) || t)
      })
    }

    return { data, error }
  }

  /**
   * Delete a task (cascades to children via ON DELETE CASCADE in DB).
   * @param {string} id - Task ID
   */
  const deleteTask = async (id) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)

    if (!error) {
      // Remove the task and all its descendants from local state
      setTasks((prev) => {
        const toDelete = new Set([id])
        let changed = true
        while (changed) {
          changed = false
          prev.forEach((t) => {
            if (t.parent_id && toDelete.has(t.parent_id) && !toDelete.has(t.id)) {
              toDelete.add(t.id)
              changed = true
            }
          })
        }
        return prev.filter((t) => !toDelete.has(t.id))
      })
    }

    return { error }
  }

  /**
   * Manually refetch all tasks.
   */
  const refetch = useCallback(async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (error) {
      setError(error.message)
    } else {
      setTasks(data || [])
    }
  }, [user])

  return {
    tasks,
    loading,
    error,
    refetch,
    createTask,
    updateTask,
    toggleTask,
    toggleTaskCascade,
    deleteTask,
  }
}

export default useTasks