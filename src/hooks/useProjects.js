import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'

/**
 * useProjects - Custom hook for Projects CRUD operations.
 * Fetches projects from Supabase and provides create/update/delete methods.
 */
export function useProjects() {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch projects on mount / user change
  useEffect(() => {
    let isMounted = true

    async function loadProjects() {
      if (!user) {
        if (isMounted) setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (!isMounted) return

      if (error) {
        setError(error.message)
      } else {
        setProjects(data || [])
      }

      setLoading(false)
    }

    loadProjects()

    return () => {
      isMounted = false
    }
  }, [user])

  /**
   * Create a new project
   */
  const createProject = async ({ name, description, github_repo_url }) => {
    if (!user) return { error: 'Not authenticated' }

    const { data, error } = await supabase
      .from('projects')
      .insert([
        {
          user_id: user.id,
          name,
          description: description || null,
          github_repo_url: github_repo_url || null,
          status: 'active',
        },
      ])
      .select()
      .single()

    if (!error) {
      setProjects((prev) => [data, ...prev])
    }

    return { data, error }
  }

  /**
   * Update an existing project
   */
  const updateProject = async (id, updates) => {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (!error) {
      setProjects((prev) => prev.map((p) => (p.id === id ? data : p)))
    }

    return { data, error }
  }

  /**
   * Delete a project
   */
  const deleteProject = async (id) => {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)

    if (!error) {
      setProjects((prev) => prev.filter((p) => p.id !== id))
    }

    return { error }
  }

  /**
   * Manually refetch projects (e.g. after external changes)
   */
  const refetch = useCallback(async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setProjects(data || [])
    }
  }, [user])

  return {
    projects,
    loading,
    error,
    refetch,
    createProject,
    updateProject,
    deleteProject,
  }
}

export default useProjects