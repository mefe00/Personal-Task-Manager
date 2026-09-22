import { GripVertical } from 'lucide-react'
import { Avatar } from '../tasks/AssigneeAvatars'

/**
 * TeamPalette — the drag source used to assign tasks to collaborators.
 *
 * Rendered above the List/Board views (and inside the Team tab) so an admin
 * can drag a member's avatar and drop it onto a task's assignee box
 * (AssigneeAvatars listens for the native drop event).
 *
 * Props:
 *  - members: [{ id, fullName, avatarUrl, email, role }]
 */
export default function TeamPalette({ members = [] }) {
  if (members.length === 0) return null

  return (
    <div className="flex items-center gap-3 flex-wrap p-2.5 rounded-2xl bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/10 mb-4">
      <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
        <GripVertical className="w-3.5 h-3.5" />
        Drag onto a task to assign
      </span>
      <div className="flex items-center gap-2 flex-wrap">
        {members.map((m) => (
          <div
            key={m.id}
            draggable
            onDragStart={(e) => e.dataTransfer.setData('text/plain', m.id)}
            title={`Assign ${m.fullName || m.email || 'member'}`}
            className="cursor-grab active:cursor-grabbing"
          >
            <Avatar profile={m} />
          </div>
        ))}
      </div>
    </div>
  )
}
