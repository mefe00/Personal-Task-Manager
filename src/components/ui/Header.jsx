import { motion } from 'framer-motion'
import { Menu, LogOut, Sun, Moon } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useNavigate } from 'react-router-dom'

/**
 * Header - Top bar with mobile menu toggle, theme switcher,
 * user avatar/name, and logout button.
 */
export default function Header({ onMenuClick }) {
  const { user, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  // Get display name from user metadata
  const fullName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
  const avatarLetter = fullName.charAt(0).toUpperCase()
  const avatarUrl = user?.user_metadata?.avatar_url

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-30 bg-glass-light dark:bg-glass-dark backdrop-blur-xl border-b border-white/20 dark:border-white/10">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3">
        {/* Left: mobile menu toggle */}
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="w-6 h-6" />
          </motion.button>

          {/* Page title placeholder - could be dynamic per route */}
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white hidden sm:block">
            Personal ERP
          </h2>
        </div>

        {/* Right: theme toggle + user info + logout */}
        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </motion.button>

          {/* User info */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-slate-900 dark:text-white leading-tight">
                {fullName}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {user?.email}
              </p>
            </div>

            {/* Avatar */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center justify-center w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-neon-purple to-neon-pink text-white font-bold shadow-neon"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
              ) : (
                avatarLetter
              )}
            </motion.div>
          </div>

          {/* Logout */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-red-500/10 hover:text-red-500 transition-colors"
            aria-label="Logout"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </header>
  )
}