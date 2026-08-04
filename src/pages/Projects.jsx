import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, FolderKanban, GitBranch, Trash2, Pencil, ExternalLink, Loader2, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { useProjects } from '../hooks/useProjects'
import Modal from '../components/ui/Modal'
import { cn } from '../lib/utils'

/**
 * Projects page - CRUD management for user projects.
 * Project cards are clickable and navigate to /projects/:projectId
 * where users can manage project-specific tasks.
 */
export default function Projects() {
  const navigate = useNavigate()
  const { projects, loading, error, createProject, updateProject, deleteProject } = useProjects()

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState(null)

  // Form state
  const [formData, setFormData] = useState({ name: '', description: '', github_repo_url: '' })
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Delete confirmation
  const [deletingId, setDeletingId] = useState(null)

  // Webhook publish state
  const [publishingId, setPublishingId] = useState(null)
  const [publishMessage, setPublishMessage] = useState('')

  const openCreateModal = () => {
    setEditingProject(null)
    setFormData({ name: '', description: '', github_repo_url: '' })
    setFormError('')
    setModalOpen(true)
  }

  const openEditModal = (e, project) => {
    e.stopPropagation()
    setEditingProject(project)
    setFormData({
      name: project.name,
      description: project.description || '',
      github_repo_url: project.github_repo_url || '',
    })
    setFormError('')
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setSubmitting(true)

    if (!formData.name.trim()) {
      setFormError('Project name is required')
      setSubmitting(false)
      return
    }

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      github_repo_url: formData.github_repo_url.trim() || null,
    }

    let result
    if (editingProject) {
      result = await updateProject(editingProject.id, payload)
    } else {
      result = await createProject(payload)
    }

    if (result.error) {
      setFormError(result.error.message || 'Something went wrong')
      toast.error('Failed to save project')
      setSubmitting(false)
      return
    }

    toast.success(editingProject ? 'Project updated!' : 'Project created!')
    setSubmitting(false)
    setModalOpen(false)
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    setDeletingId(id)
    const { error } = await deleteProject(id)
    setDeletingId(null)
    if (error) {
      toast.error(`Failed to delete project: ${error.message}`)
    } else {
      toast.success('Project deleted')
    }
  }

  /**
   * Publish a completed project to the external portfolio via webhook.
   * Sends a POST request to the webhook URL from env or user settings.
   */
  const handlePublishToPortfolio = async (e, project) => {
    e.stopPropagation()
    setPublishingId(project.id)
    setPublishMessage('')

    // Webhook URL from env (VITE_PORTFOLIO_WEBHOOK_URL) or fallback
    const webhookUrl = import.meta.env.VITE_PORTFOLIO_WEBHOOK_URL

    if (!webhookUrl) {
      setPublishMessage('⚠️ No webhook URL configured. Set VITE_PORTFOLIO_WEBHOOK_URL in your .env file.')
      toast.error('No webhook URL configured. Check your .env file.')
      setPublishingId(null)
      return
    }

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: 'project.completed',
          project: {
            id: project.id,
            name: project.name,
            description: project.description,
            github_repo_url: project.github_repo_url,
            status: project.status,
            completed_at: new Date().toISOString(),
          },
          timestamp: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error(`Webhook responded with status ${response.status}`)
      }

      setPublishMessage('✅ Project published to portfolio!')
      toast.success('Project published to portfolio!')
    } catch (err) {
      console.error('Error publishing to portfolio:', err)
      setPublishMessage(`❌ Failed to publish: ${err.message}`)
      toast.error(`Failed to publish: ${err.message}`)
    } finally {
      setPublishingId(null)
    }
  }

  const statusColors = {
    active: 'bg-neon-green/20 text-neon-green',
    completed: 'bg-neon-cyan/20 text-neon-cyan',
    archived: 'bg-slate-500/20 text-slate-500 dark:text-slate-400',
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
            Projects
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage your hardware, firmware & web projects
            <span className="text-neon-purple dark:text-neon-cyan"> — Click a project to manage its tasks</span>
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-neon-purple to-neon-pink text-white font-semibold shadow-neon hover:shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" />
          New Project
        </motion.button>
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400">
          Failed to load projects: {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            className="w-10 h-10 rounded-full border-4 border-neon-purple/30 border-t-neon-purple"
          />
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && projects.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-neon-purple/10 text-neon-purple mb-6"
          >
            <FolderKanban className="w-10 h-10" />
          </motion.div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            No projects yet
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Create your first project to get started
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-neon-purple to-neon-pink text-white font-semibold shadow-neon"
          >
            <Plus className="w-5 h-5" />
            Create Project
          </motion.button>
        </motion.div>
      )}

      {/* Projects grid */}
      {!loading && !error && projects.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                whileHover={{ y: -5, scale: 1.02 }}
                onClick={() => navigate(`/projects/${project.id}`)}
                className="cursor-pointer bg-glass-light dark:bg-glass-dark backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-glass rounded-2xl p-6 flex flex-col transition-shadow hover:shadow-neon"
              >
                {/* Status badge */}
                <div className="flex items-start justify-between mb-4">
                  <span
                    className={cn(
                      'px-3 py-1 rounded-full text-xs font-semibold capitalize',
                      statusColors[project.status] || statusColors.active
                    )}
                  >
                    {project.status}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => openEditModal(e, project)}
                      className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
                      aria-label="Edit project"
                    >
                      <Pencil className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => handleDelete(e, project.id)}
                      disabled={deletingId === project.id}
                      className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-colors disabled:opacity-50"
                      aria-label="Delete project"
                    >
                      {deletingId === project.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </motion.button>
                  </div>
                </div>

                {/* Project icon */}
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-neon-purple/20 to-neon-pink/20 text-neon-purple dark:text-neon-cyan mb-4">
                  <FolderKanban className="w-7 h-7" />
                </div>

                {/* Name */}
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  {project.name}
                </h3>

                {/* Description */}
                <p className="text-sm text-slate-600 dark:text-slate-400 flex-1 mb-4 line-clamp-3">
                  {project.description || 'No description provided.'}
                </p>

                {/* GitHub link */}
                {project.github_repo_url && (
                  <a
                    href={project.github_repo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-2 text-sm text-neon-purple dark:text-neon-cyan hover:underline"
                  >
                    <GitBranch className="w-4 h-4" />
                    View Repository
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}

                {/* Publish to Portfolio (only for completed projects) */}
                {project.status === 'completed' && (
                  <div className="mt-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={(e) => handlePublishToPortfolio(e, project)}
                      disabled={publishingId === project.id}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-green text-white text-sm font-semibold shadow-neon transition-all disabled:opacity-50"
                    >
                      {publishingId === project.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      Publish to Portfolio
                    </motion.button>
                    {publishMessage && publishingId === null && (
                      <p className="mt-2 text-xs text-center text-slate-600 dark:text-slate-400">
                        {publishMessage}
                      </p>
                    )}
                  </div>
                )}

                {/* Created date */}
                <p className="mt-4 text-xs text-slate-500 dark:text-slate-500">
                  Created {new Date(project.created_at).toLocaleDateString()}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProject ? 'Edit Project' : 'Create New Project'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm">
              {formError}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Project Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. PCB Design v2"
              required
              className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-white/10 border border-white/30 dark:border-white/20 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-neon-purple/50 transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What is this project about?"
              rows="3"
              className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-white/10 border border-white/30 dark:border-white/20 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-neon-purple/50 transition-all resize-none"
            />
          </div>

          {/* GitHub URL */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              GitHub Repo URL
            </label>
            <input
              type="url"
              value={formData.github_repo_url}
              onChange={(e) => setFormData({ ...formData, github_repo_url: e.target.value })}
              placeholder="https://github.com/username/repo"
              className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-white/10 border border-white/30 dark:border-white/20 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-neon-purple/50 transition-all"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => setModalOpen(false)}
              className="flex-1 py-3 rounded-xl bg-white/50 dark:bg-white/10 border border-white/30 dark:border-white/20 text-slate-700 dark:text-slate-300 font-medium transition-all"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-neon-purple to-neon-pink text-white font-semibold shadow-neon transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </span>
              ) : (
                editingProject ? 'Save Changes' : 'Create Project'
              )}
            </motion.button>
          </div>
        </form>
      </Modal>
    </div>
  )
}