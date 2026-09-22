import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'

/**
 * useNotes - Custom hook for the project_notes table.
 *
 * Fetches the current user's notes. When `projectId` is provided it only
 * returns notes for that project; otherwise it returns ALL of the user's
 * notes. The project name is joined in so notes can show which project they
 * belong to (general notes have an empty project).
 *
 * @param {{ projectId?: string | null }} [options]
 */
export function useNotes({ projectId = null } = {}) {
  const { user } = useAuth()
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    async function loadNotes() {
      if (!user) {
        if (isMounted) setLoading(false)
        return
      }

      let query = supabase
        .from('project_notes')
        .select('id, user_id, project_id, content, created_at, projects(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (projectId) {
        query = query.eq('project_id', projectId)
      }

      const { data, error } = await query

      if (!isMounted) return

      if (error) {
        setError(error.message)
      } else {
        setNotes(data || [])
      }

      setLoading(false)
    }

    loadNotes()

    return () => {
      isMounted = false
    }
  }, [user, projectId])

  /** Manually refetch the notes (e.g. after inserting a new one). */
  const refetch = useCallback(async () => {
    if (!user) return

    let query = supabase
      .from('project_notes')
      .select('id, user_id, project_id, content, created_at, projects(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    const { data, error } = await query
    if (error) {
      setError(error.message)
    } else {
      setNotes(data || [])
    }
  }, [user, projectId])

  /**
   * Permanently delete a note. Used from the global Notes view — the note is
   * removed everywhere (the row is gone from the database).
   */
  const deleteNote = useCallback(async (id) => {
    const { error } = await supabase.from('project_notes').delete().eq('id', id)
    if (!error) {
      setNotes((prev) => prev.filter((n) => n.id !== id))
    }
    return { error }
  }, [])

  /**
   * Detach a note from its project (project_id -> null) without deleting it.
   * Used from the Project Details -> Project Notes view, so the note only
   * disappears from THAT project but stays available in the global Notes view.
   */
  const detachNote = useCallback(async (id) => {
    const { error } = await supabase
      .from('project_notes')
      .update({ project_id: null })
      .eq('id', id)

    if (!error) {
      // In a project-filtered view the note no longer belongs to this project.
      setNotes((prev) => prev.filter((n) => n.id !== id))
    }
    return { error }
  }, [])

  return {
    notes,
    loading,
    error,
    refetch,
    deleteNote,
    detachNote,
  }
}

export default useNotes