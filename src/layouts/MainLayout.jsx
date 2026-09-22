import { Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import TopNav from '../components/ui/TopNav'
import QuickNotes from '../components/ui/QuickNotes'

/**
 * MainLayout - Application shell with the Apple-style floating TopNav.
 * Wraps page content with a top offset and Framer Motion page transitions.
 * The time-tracking stopwatch is scoped to the Dashboard page only.
 * The Quick Notes scratchpad (floating button + modal) is global.
 */
export default function MainLayout() {
  const location = useLocation()

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 dark:from-slate-900 dark:via-blue-950 dark:to-slate-900">
      {/* Floating top navigation */}
      <TopNav />

      {/* Global Quick Notes scratchpad */}
      <QuickNotes />

      {/* Page content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}