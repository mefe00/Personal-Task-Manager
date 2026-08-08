import { useState, useRef, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  Film,
  Settings,
  Sun,
  Moon,
  LogOut,
  CheckSquare,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { cn } from '../../lib/utils'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/projects', label: 'Projects', icon: FolderKanban, end: false },
  { to: '/tasks', label: 'Tasks', icon: ListTodo, end: false },
  { to: '/media', label: 'Media', icon: Film, end: false },
  { to: '/settings', label: 'Settings', icon: Settings, end: false },
]

/**
 * TopNav - Floating, glassmorphic, pill-shaped top navigation bar.
 * Replaces the legacy left Sidebar with an Apple-style centered navbar.
 * Contains navigation links and the theme / user / logout controls.
 */
export default function TopNav() {
  const { user, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const fullName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
  const avatarLetter = fullName.charAt(0).toUpperCase()
  const avatarUrl = user?.user_metadata?.avatar_url

  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  // Close the user menu when clicking outside of it
  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-3xl">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="flex items-center gap-1 rounded-full px-2 py-2 sm:px-3 bg-glass-light dark:bg-glass-dark backdrop-blur-2xl border border-white/30 dark:border-white/10 shadow-glass"
      >
        {/* Brand */}
        <div className="flex items-center gap-2 pl-1 pr-2 sm:pr-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CheckSquare className="w-4 h-4" />
          </div>
          <span className="hidden md:block text-sm font-bold text-slate-800 dark:text-white">
            Planning
          </span>
        </div>

        {/* Nav links */}
        <div className="hidden sm:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                  'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white',
                  isActive &&
                    'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-neon'
                )
              }
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>

        {/* Mobile nav links */}
        <div className="flex sm:hidden items-center gap-1 flex-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center justify-center w-9 h-9 rounded-full text-slate-600 dark:text-slate-300 transition-all',
                  isActive && 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-neon'
                )
              }
              aria-label={item.label}
              title={item.label}
            >
              <item.icon className="w-4 h-4" />
            </NavLink>
          ))}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-1 ml-auto">
          {/* Theme toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-white/10 transition-colors"
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </motion.button>

          {/* User menu */}
          <div className="relative" ref={menuRef}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setMenuOpen((v) => !v)}
              className="ml-1 flex items-center justify-center w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold shadow-neon"
              aria-label="User menu"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
              ) : (
                avatarLetter
              )}
            </motion.button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-56 rounded-2xl p-2 bg-glass-light dark:bg-glass-dark backdrop-blur-2xl border border-white/30 dark:border-white/10 shadow-glass"
                >
                  <div className="px-3 py-2 border-b border-white/20 dark:border-white/10 mb-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white leading-tight">
                      {fullName}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {user?.email}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </nav>
  )
}

