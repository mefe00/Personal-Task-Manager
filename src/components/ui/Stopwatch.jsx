import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, Square, Timer } from 'lucide-react'
import toast from 'react-hot-toast'
import { useTimeLogs } from '../../hooks/useTimeLogs'
import { cn } from '../../lib/utils'

/**
 * Stopwatch - Time-tracking card for the Dashboard.
 * Shows a live 00:00:00 timer with Play / Pause / Stop-Save controls.
 * When stopped, the elapsed time is saved to the `time_logs` table
 * for the current date. Renders as a static card (no floating overlay).
 */
export default function Stopwatch() {
  const { saveTime } = useTimeLogs()
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0) // in seconds
  const [saving, setSaving] = useState(false)
  const intervalRef = useRef(null)

  // Keep time when running
  useEffect(() => {
    if (!running) return
    intervalRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [running])

  const formatTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    const s = totalSeconds % 60
    const pad = (n) => String(n).padStart(2, '0')
    return `${pad(h)}:${pad(m)}:${pad(s)}`
  }

  const togglePlay = () => {
    setRunning((prev) => !prev)
  }

  const handleSave = useCallback(async () => {
    if (elapsed <= 0) return

    setSaving(true)
    const { error } = await saveTime(elapsed)
    setSaving(false)

    if (error) {
      toast.error(`Couldn't save time: ${error.message || error}`)
      return
    }

    toast.success(`Saved ${formatTime(elapsed)} to your log`)
    setRunning(false)
    setElapsed(0)
  }, [elapsed, saveTime])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-glass-light dark:bg-glass-dark backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-glass rounded-2xl p-6 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-500/15 text-blue-500">
          <Timer className="w-4 h-4" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Time Tracker</h2>
      </div>

      {/* Time display */}
      <div
        className={cn(
          'text-center font-mono text-4xl font-bold py-6 rounded-xl mb-4',
          'bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/10',
          running ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-slate-100'
        )}
      >
        {formatTime(elapsed)}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 mt-auto">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={togglePlay}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white font-semibold transition-all',
            running ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-blue-500 to-blue-600'
          )}
        >
          {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {running ? 'Pause' : 'Play'}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          disabled={saving || elapsed <= 0}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Stop and save"
        >
          <Square className="w-4 h-4" />
          Save
        </motion.button>
      </div>
    </motion.div>
  )
}

