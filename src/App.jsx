import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/auth/ProtectedRoute'
import MainLayout from './layouts/MainLayout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import ProjectDetails from './pages/ProjectDetails'
import TaskView from './pages/TaskView'
import MediaTracker from './pages/MediaTracker'
import Settings from './pages/Settings'
import Notes from './pages/Notes'
import Profile from './pages/Profile'

/**
 * Main App component - Defines all application routes.
 *
 * Public routes:
 *  - /login     -> Login page
 *  - /register  -> Register page
 *
 * Protected routes (wrapped in ProtectedRoute + MainLayout):
 *  - /                    -> Dashboard
 *  - /projects            -> Projects CRUD
 *  - /projects/:projectId -> Project Details (project-specific tasks)
 *  - /tasks               -> TaskView (infinite nested tasks)
 *  - /media               -> MediaTracker (books, movies, other)
 *  - /settings            -> Settings
 */
function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected routes with MainLayout */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:projectId" element={<ProjectDetails />} />
        <Route path="/tasks" element={<TaskView />} />
        <Route path="/media" element={<MediaTracker />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App