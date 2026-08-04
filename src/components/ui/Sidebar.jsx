import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutDashboard, FolderKanban, ListTodo, Settings, Boxes } from 'lucide-react'
import { cn } from '../../lib/utils'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/tasks', label: 'Tasks', icon: ListTodo },
  { to: '/settings', label: 'Settings', icon: Settings },
]

/**
 * Sidebar - Responsive navigation sidebar.
 * - Desktop (lg+): Always visible, static position
 * - Mobile: Slides in/out with overlay
 * Glassmorphic design with animated active states.
 */
export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar (animated) */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 h-full w-64 z-50 lg:hidden bg-glass-light dark:bg-glass-dark backdrop-blur-xl border-r border-white/20 dark:border-white/10 shadow-glass flex flex-col"
          >
            <SidebarContent onClose={onClose} />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop sidebar (always visible) */}
      <aside className="hidden lg:flex w-64 shrink-0 bg-glass-light dark:bg-glass-dark backdrop-blur-xl border-r border-white/20 dark:border-white/10 shadow-glass flex-col">
        <SidebarContent onClose={onClose} />
      </aside>
    </>
  )
}

/**
 * Shared sidebar content (logo + nav + footer)
 */
function SidebarContent({ onClose }) {
  return (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6">
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 4 }}
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-neon-purple/20 text-neon-purple"
        >
          <Boxes className="w-6 h-6" />
        </motion.div>
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
            Personal ERP
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Task Manager
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-white/10',
                isActive &&
                  'bg-gradient-to-r from-neon-purple/20 to-neon-pink/20 text-neon-purple dark:text-neon-cyan shadow-neon'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-neon-purple dark:bg-neon-cyan"
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
        v0.2.0 — Phase 2
      </div>
    </>
  )
}