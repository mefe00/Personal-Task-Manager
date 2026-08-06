import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, Square, Timer, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useTimeLogs } from '../../hooks/useTimeLogs'
import { cn } from '../../lib/utils'

/**
 * Stopwatch - Floating time-tracking widget.
 * Shows a live 00:00:00 timer with Play / Pause / Stop-Save controls.
 * When stopped, the elapsed time is saved to the `time_logs` table
 * for the current date.
 */
export default function Stopwatch() {
  const { saveTime } = useTimeLogs()
  // Open by default so the timer + controls are always visible.
  const [isOpen, setIsOpen] = useState(true)
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

    toast.success(`Saved ${formatTime(elapsed)} to your log! 🎉`)
    setRunning(false)
    setElapsed(0)
  }, [elapsed, saveTime])

  return (
    <AnimatePresence>
      {/* Floating collapsed button */}
      {!isOpen && (
        <motion.button
          key="collapsed"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold shadow-neon"
          aria-label="Open timer"
        >
          <Timer className="w-5 h-5" />
          <span className="font-mono">{formatTime(elapsed)}</span>
        </motion.button>
      )}

      {/* Floating expanded timer */}
      {isOpen && (
        <motion.div
          key="expanded"
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed bottom-6 right-6 z-40 w-72 rounded-2xl p-5 bg-glass-light dark:bg-glass-dark backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-neon"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
              <Timer className="w-4 h-4 text-blue-500" />
              Time Tracker
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
              aria-label="Close timer"
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Time display */}
          <div
            className={cn(
              'text-center font-mono text-4xl font-bold py-4 rounded-xl mb-4',
              'bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/10',
              running ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-slate-100'
            )}
          >
            {formatTime(elapsed)}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={togglePlay}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white font-semibold transition-all',
                running
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-600'
              )}
            >
              {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {running ? 'Pause' : 'Play'}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
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
      )}
    </AnimatePresence>
  )
}
