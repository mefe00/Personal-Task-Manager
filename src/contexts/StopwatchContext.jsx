/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useTimeLogs } from '../hooks/useTimeLogs'

const StopwatchContext = createContext(null)

const STORAGE_KEY = 'stopwatch_state'

function readPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

/**
 * StopwatchProvider - Global, persistent stopwatch state.
 *
 * The stopwatch lives here (at the app root) rather than inside the
 * Dashboard-scoped widget so that the timer keeps ticking even when the user
 * navigates away to Tasks, Projects, Media, etc.
 *
 * Elapsed time is computed from a timestamp (Date.now()) rather than a naive
 * +1 counter, so the UI is accurate even between re-renders. The live "now"
 * value is held in React state and refreshed by an interval effect (not
 * computed inside render), so we stay within React's purity rules. The state
 * is persisted to localStorage, which also lets the stopwatch survive a full
 * reload or a pop-out Mini-Widget.
 */
export function StopwatchProvider({ children }) {
  const { saveTime } = useTimeLogs()

  // Timestamp-based state.
  // baseSeconds -> accumulated time before the current running session.
  // startTime    -> epoch ms when the running session began (or null).
  const initial = useMemo(() => {
    const persisted = readPersisted()
    if (persisted) {
      return {
        running: !!persisted.running,
        baseSeconds: Number(persisted.baseSeconds) || 0,
        startTime:
          persisted.running && Number.isFinite(Number(persisted.startTime))
            ? Number(persisted.startTime)
            : null,
      }
    }
    return { running: false, baseSeconds: 0, startTime: null }
  }, [])

  const [running, setRunning] = useState(initial.running)
  const [baseSeconds, setBaseSeconds] = useState(initial.baseSeconds)
  const [startTime, setStartTime] = useState(initial.startTime)
  const [now, setNow] = useState(() => 0)
  const [saving, setSaving] = useState(false)

  // While running, refresh "now" once per second so the elapsed value updates
  // live. Date.now() is called inside this effect (allowed) rather than during
  // render. The provider never unmounts, so the timer keeps running even while
  // the user browses other pages.
  useEffect(() => {
    if (!running) return
    const tick = () => setNow(Date.now())
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [running])

  // Persist the stopwatch state to localStorage on every change so it survives
  // navigation AND hard page reloads.
  useEffect(() => {
    const payload = { running, baseSeconds, startTime }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } catch {
      /* storage unavailable — ignore */
    }
  }, [running, baseSeconds, startTime])

  // Live elapsed seconds. Uses the "now" state (updated by the interval) so no
  // impure call happens during render.
  const elapsed = useMemo(() => {
    if (!running) return baseSeconds
    const extra = Math.floor((now - (startTime || now)) / 1000)
    return baseSeconds + Math.max(0, extra)
  }, [running, baseSeconds, startTime, now])

  /** Start / pause the stopwatch. */
  const toggle = useCallback(() => {
    setRunning((prev) => {
      if (prev) {
        // Pausing: fold the current session's time into the base.
        setBaseSeconds((b) => b + Math.max(0, Math.floor((Date.now() - startTime) / 1000)))
        setStartTime(null)
      } else {
        setStartTime(Date.now())
      }
      return !prev
    })
  }, [startTime])

  /** Reset the stopwatch to zero without saving. */
  const reset = useCallback(() => {
    setRunning(false)
    setBaseSeconds(0)
    setStartTime(null)
  }, [])

  /** Save the current elapsed time to the time_logs table and reset. */
  const saveCurrent = useCallback(async () => {
    const seconds = elapsed
    if (seconds <= 0) return { error: 'No time to save' }

    setSaving(true)
    const { error } = await saveTime(seconds)
    setSaving(false)

    if (!error) {
      setRunning(false)
      setBaseSeconds(0)
      setStartTime(null)
    }

    return { error, seconds }
  }, [elapsed, saveTime])

  const value = {
    elapsed,
    running,
    saving,
    toggle,
    reset,
    saveCurrent,
  }

  return (
    <StopwatchContext.Provider value={value}>{children}</StopwatchContext.Provider>
  )
}

/**
 * Custom hook to use the StopwatchContext
 */
export function useStopwatch() {
  const context = useContext(StopwatchContext)
  if (!context) {
    throw new Error('useStopwatch must be used within a StopwatchProvider')
  }
  return context
}

export default StopwatchContext