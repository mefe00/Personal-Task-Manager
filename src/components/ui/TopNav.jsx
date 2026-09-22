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
  Menu,
  StickyNote,
  UserRound,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { cn } from '../../lib/utils'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/projects', label: 'Projects', icon: FolderKanban, end: false },
  { to: '/tasks', label: 'Tasks', icon: ListTodo, end: false },
  { to: '/notes', label: 'Notes', icon: StickyNote, end: false },
  { to: '/media', label: 'Media', icon: Film, end: false },
  { to: '/settings', label: 'Settings', icon: Settings, end: false },
]

// Variants for the Apple-style staggered menu links
const menuList = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.05, delayChildren: 0.05 },
  },
}

const menuItem = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1 },
}

function UserChip({ fullName, avatarUrl, email }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex items-center justify-center w-8 h-8 rounded-full overflow-hidden shrink-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-bold">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={fullName}
            className="w-full h-full max-w-full max-h-full object-cover"
          />
        ) : (
          fullName.charAt(0).toUpperCase()
        )}
      </div>
      <div className="min-w-0 text-left">
        <p className="text-sm font-medium text-slate-900 dark:text-white leading-tight truncate">
          {fullName}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{email}</p>
      </div>
    </div>
  )
}

/**
 * TopNav - Floating, glassmorphic, pill-shaped top navigation bar.
 *
 * Responsive behaviour:
 *  - Desktop (sm+): inline horizontal pill nav. The avatar opens a compact
 *    dropdown (user info + sign out) — NOT the full-screen menu.
 *  - Mobile: a "Menu" control opens a full-screen frosted-glass overlay
 *    (iOS Control Center style) with large nav items, theme toggle and user.
 */
export default function TopNav() {
  const { user, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const fullName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
  const avatarLetter = fullName.charAt(0).toUpperCase()
  const avatarUrl = user?.user_metadata?.avatar_url

  // Desktop user dropdown visibility
  const [userOpen, setUserOpen] = useState(false)
  const userMenuRef = useRef(null)

  // Mobile full-screen menu visibility (only ever shown on small screens)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Lock body scroll while the full-screen menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  // Close the desktop user dropdown when clicking outside of it
  useEffect(() => {
    const onClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const handleLogout = async () => {
    await signOut()
    setUserOpen(false)
    setMobileOpen(false)
    navigate('/login')
  }

  return (
    <>
      {/* ===== Floating pill navbar ===== */}
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-3xl">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="flex items-center gap-1 rounded-full px-2 py-2 sm:px-3 bg-glass-light dark:bg-glass-dark backdrop-blur-2xl border border-white/30 dark:border-white/10 shadow-glass"
        >
          {/* Brand */}
          <div className="flex items-center gap-2 pl-1 pr-2 sm:pr-3 shrink-0">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CheckSquare className="w-4 h-4" />
            </div>
            <span className="hidden md:block text-sm font-bold text-slate-800 dark:text-white">
              Planning
            </span>
          </div>

          {/* Nav links — desktop only (inline pill) */}
          <div className="hidden sm:flex items-center gap-1 flex-1 min-w-0">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap',
                    'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white',
                    isActive && 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-neon'
                  )
                }
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span className="hidden lg:inline">{item.label}</span>
              </NavLink>
            ))}
          </div>

          {/* Right controls — theme toggle, avatar & (mobile) menu */}
          <div className="flex items-center gap-4 ml-auto shrink-0">
            {/* Theme toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className="p-2 rounded-full shrink-0 text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-white/10 transition-colors"
              aria-label={
                theme === 'dark'
                  ? 'Dark mode is active — click to switch to Light'
                  : 'Light mode is active — click to switch to Dark'
              }
              title={
                theme === 'dark'
                  ? 'Dark mode is active — click to switch to Light'
                  : 'Light mode is active — click to switch to Dark'
              }
            >
              {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </motion.button>

            {/* User avatar — desktop dropdown */}
            <div className="relative hidden sm:flex items-center" ref={userMenuRef}>
              <button
                onClick={() => setUserOpen((v) => !v)}
                className="flex items-center justify-center w-9 h-9 rounded-full overflow-hidden shrink-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold shadow-neon"
                aria-label={userOpen ? 'Close profile menu' : 'Open profile menu'}
                title="Profile"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={fullName}
                    className="w-full h-full max-w-full max-h-full object-cover"
                  />
                ) : (
                  avatarLetter
                )}
              </button>

              <AnimatePresence>
                {userOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-60 rounded-2xl p-2 bg-glass-light dark:bg-glass-dark backdrop-blur-2xl border border-white/30 dark:border-white/10 shadow-glass"
                  >
                    <div className="px-3 py-2 border-b border-white/20 dark:border-white/10 mb-1">
                      <UserChip fullName={fullName} avatarUrl={avatarUrl} email={user?.email} />
                    </div>
                    <NavLink
                      to="/profile"
                      onClick={() => setUserOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors',
                          isActive
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-white/50 dark:hover:bg-white/10'
                        )
                      }
                    >
                      <UserRound className="w-4 h-4" />
                      View profile
                    </NavLink>
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

            {/* Apple-style menu control — mobile only */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setMobileOpen((v) => !v)}
              className="sm:hidden flex items-center justify-center w-9 h-9 rounded-full shrink-0 border border-white/30 dark:border-white/10 bg-white/40 dark:bg-white/5 text-slate-700 dark:text-slate-200"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              title={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              <Menu className="w-5 h-5" />
            </motion.button>
          </div>
        </motion.div>
      </nav>

      {/* ===== Mac-Style full-screen responsive menu (mobile only) ===== */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-0 z-50 flex flex-col sm:hidden bg-white/85 dark:bg-slate-900/85 backdrop-blur-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            {/* Top row */}
            <div className="flex items-center justify-between px-6 pt-6">
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 tracking-wide">
                Menu
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                className="px-4 py-1.5 rounded-full text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
              >
                Done
              </button>
            </div>

            {/* Nav links */}
            <motion.nav
              variants={menuList}
              initial="hidden"
              animate="show"
              className="flex-1 flex flex-col justify-center gap-2 px-6"
            >
              {NAV_ITEMS.map((item) => (
                <motion.div key={item.to} variants={menuItem}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-4 px-5 py-4 rounded-2xl text-base font-semibold transition-colors',
                        'text-slate-700 dark:text-slate-200 hover:bg-white/70 dark:hover:bg-white/10',
                        isActive &&
                          'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-neon'
                      )
                    }
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </NavLink>
                </motion.div>
              ))}
            </motion.nav>

            {/* Account link */}
            <div className="px-6 pb-2">
              <NavLink
                to="/profile"
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-4 px-5 py-4 rounded-2xl text-base font-semibold transition-colors',
                    'text-slate-700 dark:text-slate-200 hover:bg-white/70 dark:hover:bg-white/10',
                    isActive && 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-neon'
                  )
                }
              >
                <UserRound className="w-5 h-5" />
                Profile
              </NavLink>
            </div>

            {/* Bottom: theme + user */}
            <div className="px-6 pb-8 pt-4 flex items-center justify-between gap-3">
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={toggleTheme}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium text-slate-700 dark:text-slate-200 border border-white/40 dark:border-white/10 bg-white/50 dark:bg-white/5"
                aria-label={
                  theme === 'dark'
                    ? 'Dark mode is active — tap to switch to Light'
                    : 'Light mode is active — tap to switch to Dark'
                }
              >
                {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                {theme === 'dark' ? 'Dark mode' : 'Light mode'}
              </motion.button>

              <div className="flex items-center gap-2">
                <UserChip fullName={fullName} avatarUrl={avatarUrl} email={user?.email} />
                <button
                  onClick={handleLogout}
                  className="p-2.5 rounded-full text-red-500 hover:bg-red-500/10 transition-colors"
                  aria-label="Sign out"
                  title="Sign out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
