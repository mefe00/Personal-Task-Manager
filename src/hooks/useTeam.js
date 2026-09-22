import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'

/**
 * useTeam — project-scoped collaboration state for the Team tab,
 * task assignments, and task dependencies.
 *
 * @param {string} projectId        - The project being viewed.
 * @param {Array}  projectTasks     - Flat array of this project's tasks
 *                                    (used to scope assignments/dependencies
 *                                     and to resolve dependency titles).
 */
export function useTeam(projectId, projectTasks = []) {
  const { user } = useAuth()
  const [members, setMembers] = useState([]) // [{ id, role, fullName, avatarUrl, email }]
  const [assignments, setAssignments] = useState({}) // taskId -> [{ id, fullName, avatarUrl }]
  const [dependencies, setDependencies] = useState({}) // taskId -> [{ depends_on_task_id, title }]
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Map of task id -> title (for dependency display)
  const taskTitleMap = useMemo(
    () => Object.fromEntries((projectTasks || []).map((t) => [t.id, t.title])),
    [projectTasks]
  )
  const taskIds = useMemo(() => (projectTasks || []).map((t) => t.id), [projectTasks])

  // ---------- helpers ----------
  const mapProfile = (p) => ({
    id: p?.id || p?.user_id || '',
    fullName: p?.full_name || '',
    avatarUrl: p?.avatar_url || null,
    email: p?.email || '',
  })
  const mapMember = (r) => ({
    id: r?.user_id || '',
    role: r?.role || 'member',
    fullName: r?.profiles?.full_name || r?.profiles?.email || '',
    avatarUrl: r?.profiles?.avatar_url || null,
    email: r?.profiles?.email || '',
  })

  // ---------- members ----------
  useEffect(() => {
    if (!projectId || !user) {
      Promise.resolve().then(() => setMembers([]))
      return
    }
    Promise.resolve().then(() => setLoading(true))
    supabase
      .from('project_members')
      .select('user_id, role, profiles!inner(id, full_name, avatar_url, email)')
      .eq('project_id', projectId)
      .then(({ data, error: e }) => {
        if (e) {
          setError(e.message)
          setMembers([])
        } else {
          setMembers((data || []).map(mapMember))
        }
        setLoading(false)
      })
  }, [projectId, user])

  // ---------- assignments ----------
  useEffect(() => {
    if (!taskIds.length || !user) {
      Promise.resolve().then(() => setAssignments({}))
      return
    }
    supabase
      .from('task_assignments')
      .select('task_id, profiles!inner(id, full_name, avatar_url)')
      .in('task_id', taskIds)
      .then(({ data, error: e }) => {
        if (e) {
          setError(e.message)
          return
        }
        const map = {}
        ;(data || []).forEach((row) => {
          ;(map[row.task_id] = map[row.task_id] || []).push(mapProfile(row.profiles))
        })
        setAssignments(map)
      })
    }, [taskIds, user])

  // ---------- dependencies ----------
  useEffect(() => {
    if (!taskIds.length || !user) {
      Promise.resolve().then(() => setDependencies({}))
      return
    }
    supabase
      .from('task_dependencies')
      .select('task_id, depends_on_task_id')
      .in('task_id', taskIds)
      .then(({ data, error: e }) => {
        if (e) {
          setError(e.message)
          return
        }
        const map = {}
        ;(data || []).forEach((row) => {
          ;(map[row.task_id] = map[row.task_id] || []).push({
            depends_on_task_id: row.depends_on_task_id,
            title: taskTitleMap[row.depends_on_task_id] || row.depends_on_task_id,
          })
        })
        setDependencies(map)
      })
  }, [taskIds, user, taskTitleMap])

  // ---------- mutators ----------
  const inviteByEmail = useCallback(
    async (email, role = 'member') => {
      if (!email?.trim()) return { error: 'Email is required' }
      const { data: prof, error: lookupErr } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle()
      if (lookupErr || !prof) {
        return { error: lookupErr?.message || 'No user found with that email' }
      }
      const { data, error } = await supabase
        .from('project_members')
        .insert({ project_id: projectId, user_id: prof.id, role })
        .select('user_id, role, profiles!inner(id, full_name, avatar_url, email)')
        .single()
      if (error) return { error: error.message }
      setMembers((prev) =>
        prev.some((m) => m.id === prof.id) ? prev : [...prev, mapMember(data)]
      )
      return { data, error: null }
    },
    [projectId]
  )

  const removeMember = useCallback(
    async (userId) => {
      const { error } = await supabase
        .from('project_members')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', userId)
      if (error) return { error: error.message }

      // Also clear the member's task assignments inside this project,
      // otherwise those rows stay in the DB and reappear after a refresh.
      if (taskIds.length > 0) {
        await supabase
          .from('task_assignments')
          .delete()
          .in('task_id', taskIds)
          .eq('user_id', userId)
      }

      setMembers((prev) => prev.filter((m) => m.id !== userId))
      setAssignments((prev) => {
        const next = { ...prev }
        Object.keys(next).forEach((tid) => {
          next[tid] = next[tid].filter((p) => p.id !== userId)
          if (next[tid].length === 0) delete next[tid]
        })
        return next
      })
      return { error: null }
    },
    [projectId, taskIds]
  )

  const assignUser = useCallback(async (taskId, userId) => {
    const { data, error } = await supabase
      .from('task_assignments')
      .insert({ task_id: taskId, user_id: userId })
      .select('task_id, profiles!inner(id, full_name, avatar_url)')
      .single()
    if (error) return { error: error.message }
    setAssignments((prev) => ({
      ...prev,
      [taskId]: [...(prev[taskId] || []), mapProfile(data.profiles)],
    }))
    return { data, error: null }
  }, [])

  const unassignUser = useCallback(async (taskId, userId) => {
    const { error } = await supabase
      .from('task_assignments')
      .delete()
      .eq('task_id', taskId)
      .eq('user_id', userId)
    if (error) return { error: error.message }
    setAssignments((prev) => ({
      ...prev,
      [taskId]: (prev[taskId] || []).filter((p) => p.id !== userId),
    }))
    return { error: null }
  }, [])

  const addDependency = useCallback(
    async (taskId, dependsOnTaskId) => {
      if (!dependsOnTaskId) return { error: null }
      const { data, error } = await supabase
        .from('task_dependencies')
        .insert({ task_id: taskId, depends_on_task_id: dependsOnTaskId })
        .select('task_id, depends_on_task_id')
        .single()
      if (error) return { error: error.message }
      setDependencies((prev) => ({
        ...prev,
        [taskId]: [
          ...(prev[taskId] || []),
          {
            depends_on_task_id: dependsOnTaskId,
            title: taskTitleMap[dependsOnTaskId] || dependsOnTaskId,
          },
        ],
      }))
      return { data, error: null }
    },
    [taskTitleMap]
  )

  const removeDependency = useCallback(async (taskId, dependsOnTaskId) => {
    const { error } = await supabase
      .from('task_dependencies')
      .delete()
      .eq('task_id', taskId)
      .eq('depends_on_task_id', dependsOnTaskId)
    if (error) return { error: error.message }
    setDependencies((prev) => ({
      ...prev,
      [taskId]: (prev[taskId] || []).filter(
        (d) => d.depends_on_task_id !== dependsOnTaskId
      ),
    }))
    return { error: null }
  }, [])

  /**
   * Secure directory lookup for the Team tab search bar.
   * Calls the `search_users` RPC (SECURITY DEFINER) which matches by email
   * OR full name. Returns [] when the term is shorter than 2 characters.
   */
  const searchUsers = useCallback(async (searchTerm) => {
    const term = (searchTerm || '').trim()
    if (term.length < 2) return { data: [], error: null }
    const { data, error } = await supabase.rpc('search_users', { search_term: term })
    if (error) return { data: [], error: error.message }
    return { data: data || [], error: null }
  }, [])

  return {
    members,
    assignments,
    dependencies,
    loading,
    error,
    inviteByEmail,
    removeMember,
    assignUser,
    unassignUser,
    addDependency,
    removeDependency,
    searchUsers,
  }
}

export default useTeam
