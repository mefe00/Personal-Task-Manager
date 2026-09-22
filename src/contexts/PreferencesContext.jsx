/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from './AuthContext'

const PreferencesContext = createContext(null)

/**
 * Default shape of a user_preferences row. Used when the row has just been
 * created (accounts that predate the preferences trigger start with defaults).
 */
export const EMPTY_PREFERENCES = {
  ai_api_key: null,
  news_sources: [],
  theme_config: {},
  social_links: {},
  bio: '',
}

/**
 * PreferencesProvider - Single source of truth for the private per-user
 * preferences stored in `user_preferences`.
 *
 * The row is created on demand: when a user has no row yet one is inserted
 * before the values are exposed to the UI. The theme system and the
 * Settings/Profile pages all read and write through this provider, so a change
 * made in one place is reflected everywhere immediately.
 */
export function PreferencesProvider({ children }) {
  const { user } = useAuth()
  const [row, setRow] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    // Signed out: drop the previous user's preferences.
    if (!user) {
      Promise.resolve().then(() => {
        if (!isMounted) return
        setRow(null)
        setError(null)
        setLoading(false)
      })
      return () => {
        isMounted = false
      }
    }

    const load = async () => {
      const { data, error: selectError } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!isMounted) return

      if (selectError) {
        setError(selectError.message)
        setRow(null)
        setLoading(false)
        return
      }

      if (data) {
        setError(null)
        setRow(data)
        setLoading(false)
        return
      }

      // No row yet (older account): create one so later writes have a target.
      const { data: created, error: insertError } = await supabase
        .from('user_preferences')
        .insert({ user_id: user.id })
        .select()
        .single()

      if (!isMounted) return

      if (insertError) {
        // A concurrent insert may have won the race; re-read once.
        const { data: retry } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()
        if (!isMounted) return
        setRow(retry)
        setError(retry ? null : insertError.message)
      } else {
        setError(null)
        setRow(created)
      }
      setLoading(false)
    }

    Promise.resolve()
      .then(() => {
        if (isMounted) setLoading(true)
      })
      .then(load)

    return () => {
      isMounted = false
    }
  }, [user])

  /**
   * Persist a partial update. Only the provided keys are written, and the local
   * row is replaced with the server response so every consumer stays in sync.
   */
  const updatePreferences = useCallback(
    async (patch) => {
      if (!user) return { error: 'Not authenticated' }

      const { data, error: upsertError } = await supabase
        .from('user_preferences')
        .upsert({ user_id: user.id, ...patch }, { onConflict: 'user_id' })
        .select()
        .single()

      if (upsertError) {
        setError(upsertError.message)
        return { error: upsertError }
      }

      setError(null)
      setRow(data)
      return { data, error: null }
    },
    [user]
  )

  const value = useMemo(
    () => ({
      preferences: row ? { ...EMPTY_PREFERENCES, ...row } : null,
      loading,
      error,
      updatePreferences,
    }),
    [row, loading, error, updatePreferences]
  )

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  )
}

/**
 * Custom hook to use the PreferencesContext
 */
export function usePreferences() {
  const context = useContext(PreferencesContext)
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider')
  }
  return context
}

export default PreferencesContext