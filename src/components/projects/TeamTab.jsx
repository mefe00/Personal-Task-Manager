import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, UserPlus, X, Search, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '../../lib/utils'
import { Avatar } from '../tasks/AssigneeAvatars'
import TeamPalette from './TeamPalette'

/**
 * TeamTab — the "Team" tab for ProjectDetails.
 *
 * Lets the project OWNER search the user directory by email or full name
 * (via the secure `search_users` RPC) and invite collaborators (adds them to
 * `project_members` as Admin or Member), review the roster, and remove
 * members. The shared TeamPalette (rendered above the List/Board views) is
 * the drag source used to assign tasks.
 *
 * Props:
 *  - members          : [{ id, role, fullName, avatarUrl, email }]
 *  - isAdmin          : is the current user the project owner?
 *  - currentUser      : current user id (to hide "remove myself")
 *  - onInvite(email, role)
 *  - onRemoveMember(userId)
 *  - onSearchUsers(term) -> { data: [{ id, full_name, avatar_url, email }], error }
 */
export default function TeamTab({
  members = [],
  isAdmin = false,
  currentUser,
  onInvite,
  onRemoveMember,
  onSearchUsers = async () => ({ data: [], error: null }),
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [selected, setSelected] = useState(null) // { id, full_name, avatar_url, email }
  const [inviteRole, setInviteRole] = useState('member')
  const [inviting, setInviting] = useState(false)
  const debounceRef = useRef(null)
  const searchSeqRef = useRef(0)

  // Clear any pending debounce when the tab unmounts.
  useEffect(() => () => clearTimeout(debounceRef.current), [])

  /**
   * Debounced directory search by email OR name (secure `search_users` RPC).
   * Event-driven (called from the input) rather than effect-driven, and
   * guarded against out-of-order responses with a sequence number.
   */
  const runSearch = (term) => {
    clearTimeout(debounceRef.current)
    const seq = ++searchSeqRef.current
    setSearchError('')

    if (term.length < 2) {
      setResults([])
      setSearching(false)
      return
    }

    setSearching(true)
    debounceRef.current = setTimeout(async () => {
      const { data, error } = await onSearchUsers(term)
      if (seq !== searchSeqRef.current) return // a newer search superseded this one
      setSearching(false)
      if (error) {
        setResults([])
        setSearchError(
          /function|does not exist|schema cache/i.test(error.message)
            ? 'User search is not available yet — run phase9_task4_invite_support.sql in Supabase.'
            : error.message
        )
        return
      }
      // Hide users who are already team members.
      setResults((data || []).filter((u) => !members.some((m) => m.id === u.id)))
    }, 300)
  }

  const handleQueryChange = (e) => {
    const value = e.target.value
    setQuery(value)
    setSelected(null)
    runSearch(value.trim())
  }

  const handleSelect = (user) => {
    setSelected(user)
    setQuery('')
    setResults([])
  }

  const handleInvite = async (e) => {
    e.preventDefault()
    if (!isAdmin) return
    // Prefer the user picked from the suggestions; otherwise accept a full
    // email typed directly (fallback when the directory RPC is unavailable).
    const email = selected?.email || (query.includes('@') ? query.trim() : '')
    if (!email) {
      toast.error('Search for a user by email or name first')
      return
    }
    setInviting(true)
    try {
      const res = await onInvite(email, inviteRole)
      if (res?.error) {
        toast.error(`Invite failed: ${res.error}`)
        return
      }
      toast.success('User added to the team!')
      setSelected(null)
      setQuery('')
    } catch {
      toast.error('Something went wrong')
    } finally {
      setInviting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Invite form: search by email or name, then add as Admin/Member */}
      <form onSubmit={handleInvite} className="flex flex-wrap items-end gap-3">
        <div className="relative flex-1 min-w-[260px]">
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            Find a user by email or name
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={query}
              onChange={handleQueryChange}
              placeholder="user@example.com or Full Name"
              disabled={!isAdmin}
              className={cn(
                'w-full pl-9 pr-9 py-2 rounded-xl bg-white/50 dark:bg-white/10 border border-white/30 dark:border-white/20',
                'text-slate-900 dark:text-white placeholder-slate-400',
                'focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all',
                'disabled:opacity-50'
              )}
            />
            {searching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
            )}
          </div>

          {/* Suggestions */}
          {(results.length > 0 || searchError) && (
            <div className="absolute z-20 mt-1 w-full rounded-xl overflow-hidden bg-glass-light dark:bg-glass-dark backdrop-blur-xl border border-white/30 dark:border-white/10 shadow-glass">
              {searchError ? (
                <p className="px-3 py-2 text-xs text-red-500">{searchError}</p>
              ) : (
                results.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleSelect(u)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
                  >
                    <Avatar
                      profile={{
                        id: u.id,
                        fullName: u.full_name,
                        avatarUrl: u.avatar_url,
                        email: u.email,
                      }}
                    />
                    <span className="min-w-0">
                      <span className="block text-sm text-slate-800 dark:text-slate-200 truncate">
                        {u.full_name || u.email}
                      </span>
                      {u.full_name && (
                        <span className="block text-xs text-slate-500 dark:text-slate-400 truncate">
                          {u.email}
                        </span>
                      )}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Selected user chip */}
        {selected && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/30">
            <Avatar
              profile={{
                id: selected.id,
                fullName: selected.full_name,
                avatarUrl: selected.avatar_url,
                email: selected.email,
              }}
            />
            <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
              {selected.full_name || selected.email}
            </span>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="p-0.5 rounded-md text-slate-400 hover:text-red-500"
              aria-label="Clear selected user"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            Role
          </label>
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            disabled={!isAdmin}
            className="px-3 py-2 rounded-xl bg-white/50 dark:bg-white/10 border border-white/30 dark:border-white/20 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <motion.button
          type="submit"
          disabled={inviting || !isAdmin || (!selected && !query.includes('@'))}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold shadow-neon disabled:opacity-50"
        >
          {inviting ? (
            <motion.span
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 0.9 }}
            >
              Adding…
            </motion.span>
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              Add to team
            </>
          )}
        </motion.button>
      </form>

      {/* Draggable team palette — drag a member avatar onto a task to assign */}
      {isAdmin && members.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            Drag a member's avatar from the palette above the task list/board, or
            use the + button on a task, to assign it.
          </p>
          <TeamPalette members={members} />
        </div>
      )}

      {/* Member roster */}
      <div>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
          <Users className="w-4 h-4" />
          Team members
          <span className="text-slate-500 dark:text-slate-400 font-normal">
            ({members.length})
          </span>
        </h3>
        <AnimatePresence>
          {members.length === 0 ? (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-slate-500 dark:text-slate-400"
            >
              No members yet. Invite someone by email above.
            </motion.p>
          ) : (
            <div className="space-y-1">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 p-2 rounded-xl bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/10"
                >
                  <Avatar profile={m} />
                  <div className="flex-1 truncate">
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {m.fullName || m.email}
                    </span>
                    {m.email && (
                      <span className="block text-xs text-slate-500 dark:text-slate-400 truncate">
                        {m.email}
                      </span>
                    )}
                  </div>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-medium',
                      m.role === 'admin'
                        ? 'bg-yellow-400/10 text-yellow-400'
                        : 'bg-blue-500/10 text-blue-400'
                    )}
                  >
                    {m.role === 'admin' ? 'Admin' : 'Member'}
                  </span>
                  {isAdmin && m.id !== currentUser && (
                    <motion.button
                      onClick={() => onRemoveMember(m.id)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                      aria-label={`Remove ${m.fullName || 'member'}`}
                      title="Remove member"
                    >
                      <X className="w-4 h-4" />
                    </motion.button>
                  )}
                </div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
