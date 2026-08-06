import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { motion } from 'framer-motion'

/**
 * ProtectedRoute - Guards routes that require authentication.
 * Redirects unauthenticated users to /login.
 * Shows a loading spinner while auth state is being determined.
 */
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-12 h-12 rounded-full border-4 border-neon-purple/30 border-t-neon-purple"
        />
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}