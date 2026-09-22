import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { StickyNote, X, FolderKanban, Send, Trash2, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import { useProjects } from '../../hooks/useProjects'
import { cn } from '../../lib/utils'

const DRAFT_KEY = 'quick_notes_draft'

/**
 * QuickNotes - Global floating note scratchpad.
 *
 * A glassmorphic floating button (bottom-right) opens a small elegant
 * scratchpad. The draft is saved to localStorage on every keystroke so it
 * survives page reloads, and can be sent to any project via the "Send to
 * Project" dropdown (inserts into the `project_notes` table).
 */
export default function QuickNotes() {
  const { user } = useAuth()
  const { projects, loading: projectsLoading } = useProjects()

  const [open, setOpen] = useState(false)
  // Lazy-initialize the note from the saved draft (survives reloads)
  const [note, setNote] = useState(() => {
    try {
      return localStorage.getItem(DRAFT_KEY) ?? ''
    } catch {
      return ''
    }
  })
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [sending, setSending] = useState(false)
  const textareaRef = useRef(null)

  // Selected project id; empty string '' = "General Note (No Project)" (saved as null)
  const activeProjectId = selectedProjectId

  // Close on Escape + focus the field when opening
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    const t = setTimeout(() => textareaRef.current?.focus(), 120)
    return () => {
      document.removeEventListener('keydown', onKey)
      clearTimeout(t)
    }
  }, [open])

  // Instant persistence: every keystroke writes through to localStorage
  const handleChange = (e) => {
    const value = e.target.value
    setNote(value)
    try {
      localStorage.setItem(DRAFT_KEY, value)
    } catch {
      /* ignore */
    }
  }

  const clearPad = () => {
    setNote('')
    try {
      localStorage.removeItem(DRAFT_KEY)
    } catch {
      /* ignore */
    }
    textareaRef.current?.focus()
  }

  const sendToProject = async () => {
    if (!user) {
      toast.error('You must be signed in to save a note')
      return
    }
    if (!note.trim()) {
      toast.error('Write something first')
      return
    }

    setSending(true)
    const { error } = await supabase.from('project_notes').insert([
      {
        user_id: user.id,
        // empty selection => general note (project_id = null)
        project_id: selectedProjectId || null,
        content: note.trim(),
      },
    ])
    setSending(false)

    if (error) {
      toast.error(`Couldn't save note: ${error.message || error}`)
      return
    }

    toast.success(selectedProjectId ? 'Note sent to project' : 'Note saved')
    clearPad()
  }

  return (
    <>
      {/* Floating action button */}
      <motion.button
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close quick note' : 'Open quick note'}
        title="Quick Note"
        className={cn(
          'fixed bottom-6 right-6 z-40 flex items-center justify-center w-14 h-14 rounded-full',
          'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-neon'
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={open ? 'x' : 'pen'}
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 90 }}
            transition={{ duration: 0.15 }}
          >
            {open ? <X className="w-6 h-6" /> : <StickyNote className="w-6 h-6" />}
          </motion.span>
        </AnimatePresence>
      </motion.button>

      {/* Scratchpad modal */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            />

            {/* Panel - centered card on desktop, bottom sheet on mobile */}
            <div className="fixed inset-0 z-40 flex sm:items-center sm:justify-center items-end justify-center p-0 sm:p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 40, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                className="w-full max-w-md pointer-events-auto bg-glass-light dark:bg-glass-dark backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-glass rounded-t-3xl sm:rounded-3xl p-6"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-500/15 text-blue-500">
                      <StickyNote className="w-4 h-4" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      Quick Note
                    </h2>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setOpen(false)}
                    className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>

                {/* Scratchpad */}
                <textarea
                  ref={textareaRef}
                  value={note}
                  onChange={handleChange}
                  placeholder="Jot down anything… it auto-saves as you type."
                  rows={6}
                  className="w-full resize-none rounded-2xl p-4 text-sm text-slate-800 dark:text-slate-100 bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/60 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />

                {/* Char count */}
                <p className="mt-1 text-right text-xs text-slate-400 dark:text-slate-500">
                  {note.length} chars
                </p>

                {/* Send to Project */}
                <label className="block mt-4">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Send to Project
                  </span>
                  <div className="relative mt-1.5">
                    <FolderKanban className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select
                      value={activeProjectId}
                      onChange={(e) => setSelectedProjectId(e.target.value)}
                      disabled={projectsLoading}
                      className="w-full appearance-none rounded-2xl pl-9 pr-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/60 disabled:opacity-50"
                    >
                      <option value="">General Note (No Project)</option>
                      {projectsLoading && (
                        <option value="" disabled>
                          Loading projects…
                        </option>
                      )}
                      {!projectsLoading &&
                        projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </label>

                {/* Actions */}
                <div className="flex items-center gap-3 mt-5">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={sendToProject}
                    disabled={sending || !note.trim()}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Send to Project
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={clearPad}
                    disabled={!note.trim()}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
