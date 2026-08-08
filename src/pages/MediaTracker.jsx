import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Loader2, Trash2, Film, BookOpen, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { useMediaTracker } from '../hooks/useMediaTracker'
import { cn } from '../lib/utils'

const CATEGORIES = [
  { value: 'book', label: 'Book', icon: BookOpen },
  { value: 'movie', label: 'Movie', icon: Film },
  { value: 'other', label: 'Other', icon: null },
]

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
]

/**
 * MediaTracker - Personal reading / watching list.
 * Users add Books, Movies or other media they plan to consume and
 * mark them as completed. Data is stored in the `media_tracker` table.
 */
export default function MediaTracker() {
  const { items, loading, error, createItem, toggleItem, deleteItem } = useMediaTracker()

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('book')
  const [filter, setFilter] = useState('all')
  const [submitting, setSubmitting] = useState(false)

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('Please enter a title')
      return
    }

    setSubmitting(true)
    const { error } = await createItem({ title, category })
    setSubmitting(false)

    if (error) {
      toast.error(`Failed to add: ${error.message || error}`)
      return
    }
    toast.success('Added to your media list')
    setTitle('')
  }

  const handleToggle = async (id, status) => {
    const { error } = await toggleItem(id, !status)
    if (error) {
      toast.error('Failed to update item')
    } else {
      toast.success(status ? 'Marked as pending' : 'Marked as completed')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this item from your media list?')) return
    const { error } = await deleteItem(id)
    if (error) {
      toast.error('Failed to remove item')
    }
  }

  const visibleItems = items.filter((it) => {
    if (filter === 'pending') return !it.status
    if (filter === 'completed') return it.status
    return true
  })

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">Media</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Books to read, movies to watch, and more
        </p>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      )}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Add form */}
          <form
            onSubmit={handleAdd}
            className="bg-glass-light dark:bg-glass-dark backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-glass rounded-2xl p-6 mb-8"
          >
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Add a Book, Movie, or Other item
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title (e.g., Thinking, Fast and Slow)"
                className="flex-1 px-4 py-3 rounded-xl bg-white/50 dark:bg-white/10 border border-white/30 dark:border-white/20 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-neon-purple/50 transition-all"
              />
              <div className="flex gap-2">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="px-4 py-3 rounded-xl bg-white/50 dark:bg-white/10 border border-white/30 dark:border-white/20 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neon-purple/50 transition-all"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-neon-purple to-neon-pink text-white font-semibold shadow-neon transition-all disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Add
                </motion.button>
              </div>
            </div>
          </form>

          {/* Filter tabs */}
          <div className="inline-flex items-center gap-1 p-1 mb-6 rounded-xl bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/10">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  'px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
                  filter === f.value
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-neon'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* List */}
          {visibleItems.length === 0 ? (
            <div className="text-center py-16 text-slate-500 dark:text-slate-400">
              No items here yet. Add your first book or movie above.
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence initial={false}>
                {visibleItems.map((item) => {
                  const cat = CATEGORIES.find((c) => c.value === item.category) || CATEGORIES[2]
                  const CatIcon = cat.icon
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-xl',
                        'bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/10',
                        item.status && 'opacity-70'
                      )}
                    >
                      <button
                        onClick={() => handleToggle(item.id, item.status)}
                        className={cn(
                          'flex items-center justify-center w-6 h-6 rounded-md border-2 transition-all shrink-0',
                          item.status
                            ? 'bg-gradient-to-br from-neon-green to-neon-cyan border-transparent text-white'
                            : 'border-slate-400 dark:border-slate-500 hover:border-neon-purple dark:hover:border-neon-cyan'
                        )}
                        aria-label={item.status ? 'Mark as pending' : 'Mark as completed'}
                      >
                        {item.status && <Check className="w-4 h-4" />}
                      </button>

                      <div className="flex items-center gap-2 text-sm text-slate-400 min-w-0">
                        {CatIcon && <CatIcon className="w-4 h-4 shrink-0" />}
                        <span
                          className={cn(
                            'text-slate-500 dark:text-slate-400 font-medium capitalize',
                            item.category === 'book' && 'text-blue-500',
                            item.category === 'movie' && 'text-emerald-500'
                          )}
                        >
                          {item.category}
                        </span>
                      </div>

                      <span
                        className={cn(
                          'flex-1 text-sm font-medium text-slate-800 dark:text-slate-200 min-w-0',
                          item.status && 'line-through text-slate-400 dark:text-slate-500'
                        )}
                      >
                        {item.title}
                      </span>

                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-colors shrink-0"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </>
      )}
    </div>
  )
}

