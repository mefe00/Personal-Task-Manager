import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'

/**
 * useTimeLogs - Custom hook for the time_logs table.
 * Fetches logged time for the current user and provides a
 * saveTime helper used by the stopwatch widget.
 */
export function useTimeLogs() {
  const { user } = useAuth()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch all time logs on mount / user change
  useEffect(() => {
    let isMounted = true

    async function loadLogs() {
      if (!user) {
        if (isMounted) setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('time_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('logged_date', { ascending: true })

      if (!isMounted) return

      if (error) {
        setError(error.message)
      } else {
        setLogs(data || [])
      }

      setLoading(false)
    }

    loadLogs()

    return () => {
      isMounted = false
    }
  }, [user])

  /**
   * Save an elapsed-time entry for a given date.
   * @param {number} durationSeconds - Elapsed time in seconds
   * @param {string} [loggedDate] - Optional date string (YYYY-MM-DD), defaults to today
   */
  const saveTime = async (durationSeconds, loggedDate = null) => {
    if (!user) return { error: 'Not authenticated' }
    if (!durationSeconds || durationSeconds <= 0) {
      return { error: 'No time to save' }
    }

    const date = loggedDate || new Date().toISOString().slice(0, 10)

    const { data, error } = await supabase
      .from('time_logs')
      .insert([
        {
          user_id: user.id,
          duration_seconds: Math.round(durationSeconds),
          logged_date: date,
        },
      ])
      .select()
      .single()

    if (!error) {
      setLogs((prev) => [...prev, data])
    }

    return { data, error }
  }

  /** Manually refetch all time logs. */
  const refetch = useCallback(async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('time_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('logged_date', { ascending: true })

    if (error) {
      setError(error.message)
    } else {
      setLogs(data || [])
    }
  }, [user])

  return {
    logs,
    loading,
    error,
    refetch,
    saveTime,
  }
}

export default useTimeLogs
