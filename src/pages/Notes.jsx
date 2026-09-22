import { useState } from 'react'
import { motion } from 'framer-motion'
import { StickyNote, FolderKanban, Sparkles, Trash2, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { useNotes } from '../hooks/useNotes'
import { cn } from '../lib/utils'

/**
 * Notes - Global view of ALL the user's notes.
 * Route: /notes
 *
 * Fetches every note from `project_notes` (both general notes with no project
 * and notes attached to a project) and displays them as a responsive masonry
 * grid of cards. Project-specific notes show their project name as a badge.
 */
export default function Notes() {
  const { notes, loading, error, deleteNote } = useNotes()
  const [confirmId, setConfirmId] = useState(null)

  // Two-step delete: first click arms the confirm, second click deletes.
  const performDelete = async (id) => {
    const { error } = await deleteNote(id)
    setConfirmId(null)
    if (error) {
      toast.error(`Couldn't delete note: ${error.message || error}`)
    } else {
      toast.success('Note deleted')
    }
  }

  const requestDelete = (id) => {
    if (confirmId === id) {
      performDelete(id)
    } else {
      setConfirmId(id)
      window.setTimeout(() => setConfirmId((c) => (c === id ? null : c)), 3500)
    }
  }

  const formatDate = (iso) => {
    if (!iso) return ''
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-3">
          <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-blue-500/15 text-blue-500">
            <StickyNote className="w-6 h-6" />
          </div>
          Notes
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Every note you've captured — general and project-specific.
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            className="w-10 h-10 rounded-full border-4 border-blue-500/30 border-t-blue-500"
          />
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="text-center py-16">
          <span className="text-red-500">Unable to load notes: {error}</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && notes.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-24"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-blue-500/10 text-blue-500 mb-6"
          >
            <StickyNote className="w-10 h-10" />
          </motion.div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            No notes yet
          </h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            Tap the floating note button (bottom-right) to jot something down —
            it auto-saves as you type.
          </p>
        </motion.div>
      )}

      {/* Masonry grid */}
      {!loading && !error && notes.length > 0 && (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-5">
          {notes.map((note, index) => {
            const isGeneral = !note.project_id
            return (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.04, 0.4) }}
                className="break-inside-avoid mb-5 bg-glass-light dark:bg-glass-dark backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-glass rounded-2xl p-5"
              >
                <p className="text-sm text-slate-800 dark:text-slate-100 whitespace-pre-wrap break-words leading-relaxed">
                  {note.content}
                </p>

                <div className="flex items-center justify-between gap-3 mt-4">
                  <span
                    className={cn(
                      'px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5',
                      isGeneral
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    )}
                  >
                    {isGeneral ? (
                      <Sparkles className="w-3 h-3" />
                    ) : (
                      <FolderKanban className="w-3 h-3" />
                    )}
                    {isGeneral ? 'General' : note.projects?.name || 'Project'}
                  </span>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {formatDate(note.created_at)}
                    </span>
                    <button
                      onClick={() => requestDelete(note.id)}
                      className={cn(
                        'p-1.5 rounded-lg transition-all',
                        confirmId === note.id
                          ? 'bg-red-500/15 text-red-500'
                          : 'text-slate-400 dark:text-slate-500 hover:text-red-500 hover:bg-red-500/10'
                      )}
                      title={
                        confirmId === note.id
                          ? 'Click again to confirm deletion'
                          : 'Delete note (removes it everywhere)'
                      }
                      aria-label={
                        confirmId === note.id
                          ? 'Confirm delete note'
                          : 'Delete note'
                      }
                    >
                      {confirmId === note.id ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}