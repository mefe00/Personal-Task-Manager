import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'

/**
 * useMediaTracker - Custom hook for the media_tracker table.
 * Manages a personal list of Books to read, Movies to watch, and
 * other media entries. Each can be marked as completed.
 */
export function useMediaTracker() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch all media entries on mount / user change
  useEffect(() => {
    let isMounted = true

    async function loadItems() {
      if (!user) {
        if (isMounted) setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('media_tracker')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (!isMounted) return

      if (error) {
        setError(error.message)
      } else {
        setItems(data || [])
      }
      setLoading(false)
    }

    loadItems()
    return () => {
      isMounted = false
    }
  }, [user])

  /**
   * Create a new media entry.
   * @param {Object} params - { title, category: 'book' | 'movie' | 'other' }
   */
  const createItem = async ({ title, category = 'book' }) => {
    if (!user) return { error: 'Not authenticated' }
    if (!title?.trim()) return { error: 'Title is required' }

    const { data, error } = await supabase
      .from('media_tracker')
      .insert([{ user_id: user.id, title: title.trim(), category, status: false }])
      .select()
      .single()

    if (!error) {
      setItems((prev) => [data, ...prev])
    }
    return { data, error }
  }

  /**
   * Update an existing media entry.
   */
  const updateItem = async (id, updates) => {
    const { data, error } = await supabase
      .from('media_tracker')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (!error) {
      setItems((prev) => prev.map((it) => (it.id === id ? data : it)))
    }
    return { data, error }
  }

  /**
   * Toggle a media entry's completed status.
   */
  const toggleItem = async (id, status) => updateItem(id, { status })

  /**
   * Delete a media entry.
   */
  const deleteItem = async (id) => {
    const { error } = await supabase.from('media_tracker').delete().eq('id', id)

    if (!error) {
      setItems((prev) => prev.filter((it) => it.id !== id))
    }
    return { error }
  }

  /**
   * Manually refetch all media entries.
   */
  const refetch = useCallback(async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('media_tracker')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setItems(data || [])
    }
  }, [user])

  return {
    items,
    loading,
    error,
    refetch,
    createItem,
    updateItem,
    toggleItem,
    deleteItem,
  }
}

export default useMediaTracker
