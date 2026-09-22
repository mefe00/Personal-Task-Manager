import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UserPlus, Check } from 'lucide-react'

/**
 * AssigneeAvatars — renders the small avatar boxes under a task, plus the
 * drop zone + (for admins) an assign popover.
 *
 * Reused by both TaskItem (List view) and KanbanBoard (Board view).
 *
 * Props:
 *  - taskId      : the task these assignees belong to
 *  - assignees   : [{ id, fullName, avatarUrl }] currently assigned
 *  - members     : [{ id, fullName, avatarUrl, role }] all project members
 *  - isAdmin     : can the current user assign/unassign?
 *  - onAssign(taskId, userId)    : assign a member
 *  - onUnassign(taskId, userId)  : remove a member
 */
export default function AssigneeAvatars({
  taskId,
  assignees = [],
  members = [],
  isAdmin = false,
  onAssign,
  onUnassign,
}) {
  const [open, setOpen] = useState(false)

  const handleDrop = (e) => {
    e.preventDefault()
    const uid = e.dataTransfer.getData('text/plain')
    if (uid && isAdmin && onAssign) onAssign(taskId, uid)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'link'
  }

  const handleAssign = (memberId) => {
    if (onAssign) onAssign(taskId, memberId)
    setOpen(false)
  }

  const unassignedMembers = members.filter(
    (m) => !assignees.some((a) => a.id === m.id)
  )

  // Nothing to render: no assignees yet AND no team to assign from.
  // This keeps the task list clean for personal (non-collaborative) projects.
  if (assignees.length === 0 && !(isAdmin && members.length > 0)) return null

  return (
    <div className="relative mt-1 flex items-center gap-2 flex-wrap">
      {/* Drop zone — accept a dragged member avatar from the Team palette */}
      <motion.div
        layout
        onDragOver={isAdmin ? handleDragOver : undefined}
        onDrop={isAdmin ? handleDrop : undefined}
        className={cnDrop(
          'flex items-center gap-1.5 px-2 py-1 rounded-lg min-h-[26px]',
          isAdmin &&
            'border-2 border-dashed border-white/30 dark:border-white/10 hover:border-blue-400/70 transition-colors cursor-pointer',
          'bg-white/30 dark:bg-white/5'
        )}
      >
                {assignees.length === 0 ? (
          <span className="text-xs text-slate-400 dark:text-slate-500">
            Unassigned
          </span>
        ) : (
          assignees.map((a) => (
            <div key={a.id} className="relative group">
              <Avatar profile={a} />
              {isAdmin && onUnassign && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onUnassign(taskId, a.id)}
                  className="absolute -top-0.5 -right-1 w-3.5 h-3.5 rounded-full bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={`Unassign ${a.fullName || 'user'}`}
                  title="Unassign"
                >
                  <svg
                    className="w-2.5 h-2.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18 6L6 18M6 6l12 12"
                    />
                  </svg>
                </motion.button>
              )}
            </div>
          ))
        )}

        {isAdmin && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setOpen((v) => !v)}
            className="p-1 rounded-lg text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
            aria-label="Assign users"
            title="Assign users"
          >
            <UserPlus className="w-3.5 h-3.5" />
          </motion.button>
        )}
      </motion.div>

      {/* Assign popover (click-based fallback for assignment) */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -6 }}
            transition={{ duration: 0.15 }}
            className="z-10 absolute top-full left-0 mt-2 w-56 max-h-64 overflow-y-auto rounded-xl p-2 bg-glass-light dark:bg-glass-dark backdrop-blur-xl border border-white/30 dark:border-white/10 shadow-glass space-y-1"
          >
            {unassignedMembers.length === 0 ? (
              <span className="block text-xs text-slate-400 dark:text-slate-500 px-2 py-1">
                No more team members
              </span>
            ) : (
              unassignedMembers.map((m) => (
                <MemberRow
                  key={m.id}
                  member={m}
                  draggable
                  onDragStart={(e) =>
                    e.dataTransfer.setData('text/plain', m.id)
                  }
                  onSelect={() => handleAssign(m.id)}
                />
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function Avatar({ profile }) {
  const name = profile?.fullName || profile?.email || 'U'
  const initials = name.charAt(0).toUpperCase()
  return (
    <div className="relative">
      {profile?.avatarUrl ? (
        <img
          src={profile.avatarUrl}
          alt={name}
          className="w-6 h-6 rounded-full object-cover border-2 border-white dark:border-slate-800"
        />
      ) : (
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
          {initials}
        </div>
      )}
    </div>
  )
}

function MemberRow({ member, draggable = false, onDragStart, onSelect }) {
  const name = member?.fullName || member?.email || 'Team member'
  const initials = name.charAt(0).toUpperCase()
  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onClick={onSelect}
      className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors hover:bg-white/50 dark:hover:bg-white/10 text-left"
    >
      {member?.avatarUrl ? (
        <img
          src={member.avatarUrl}
          alt={name}
          className="w-6 h-6 rounded-full object-cover"
        />
      ) : (
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
          {initials}
        </div>
      )}
      <span className="text-sm text-slate-800 dark:text-slate-200 flex-1 truncate">
        {name}
      </span>
      {member?.role === 'admin' && (
        <Check className="w-3.5 h-3.5 text-blue-500" />
      )}
    </div>
  )
}

// Local className helper (kept minimal — no extra dependency needed)
function cnDrop(...classes) {
  return classes.filter(Boolean).join(' ')
}