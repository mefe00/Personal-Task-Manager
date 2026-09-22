import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  AtSign,
  Briefcase,
  CheckCircle2,
  Code2,
  ExternalLink,
  Globe,
  Loader2,
  Save,
  Settings as SettingsIcon,
  UserRound,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { usePreferences } from '../contexts/PreferencesContext'
import { useProjects } from '../hooks/useProjects'

/**
 * Public link fields. Lucide removed its brand icons, so neutral glyphs are
 * used for the social links.
 */
const SOCIAL_FIELDS = [
  { key: 'github', label: 'GitHub', icon: Code2, placeholder: 'https://github.com/username' },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    icon: Briefcase,
    placeholder: 'https://www.linkedin.com/in/username',
  },
  { key: 'x', label: 'X', icon: AtSign, placeholder: 'https://x.com/username' },
  { key: 'website', label: 'Website', icon: Globe, placeholder: 'https://example.com' },
]

const EMPTY_SOCIALS = { github: '', linkedin: '', x: '', website: '' }

/**
 * Profile - the public half of the account.
 * Route: /profile
 *
 * Deliberately separate from Settings, which holds private system
 * configuration. This page presents the user's public identity: bio, social
 * links, and the projects they have completed.
 *
 * The form inputs are uncontrolled and read once on submit through FormData,
 * so server state is never mirrored into local state.
 */
export default function Profile() {
  const { user } = useAuth()
  const { preferences, loading: preferencesLoading, updatePreferences } = usePreferences()
  const { projects, loading: projectsLoading } = useProjects()
  const [saving, setSaving] = useState(false)

  const fullName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
  const avatarUrl = user?.user_metadata?.avatar_url
  const socials = { ...EMPTY_SOCIALS, ...(preferences?.social_links || {}) }

  const completedProjects = useMemo(
    () => (projects || []).filter((project) => project.status === 'completed'),
    [projects]
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    const form = new FormData(e.target)

    // Only store the links the user actually filled in.
    const social_links = {}
    SOCIAL_FIELDS.forEach(({ key }) => {
      const value = String(form.get(key) || '').trim()
      if (value) social_links[key] = value
    })

    setSaving(true)
    const { error } = await updatePreferences({
      bio: String(form.get('bio') || '').trim(),
      social_links,
    })
    setSaving(false)

    if (error) {
      toast.error(`Could not save profile: ${error.message || error}`)
    } else {
      toast.success('Profile updated')
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-3">
          <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-blue-500/15 text-blue-500">
            <UserRound className="w-6 h-6" />
          </div>
          Profile
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Your public identity: bio, links, and completed projects.
        </p>
      </div>

      {preferencesLoading ? (
        <div className="flex items-center justify-center py-24">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            className="w-10 h-10 rounded-full border-4 border-blue-500/30 border-t-blue-500"
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Identity card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-glass-light dark:bg-glass-dark backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-glass rounded-2xl p-6"
          >
            <div className="flex items-center gap-5">
              <div className="flex items-center justify-center w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold text-xl shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
                ) : (
                  fullName.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white truncate">
                  {fullName}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                  {user?.email}
                </p>
                <Link
                  to="/settings"
                  className="inline-flex items-center gap-1.5 mt-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <SettingsIcon className="w-3.5 h-3.5" />
                  Manage account and photo in Settings
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Public details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="bg-glass-light dark:bg-glass-dark backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-glass rounded-2xl p-6"
          >
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Public Details
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Bio
                </label>
                <textarea
                  name="bio"
                  rows={4}
                  defaultValue={preferences?.bio || ''}
                  placeholder="A short summary of what you build and work on."
                  className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-white/10 border border-white/30 dark:border-white/20 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none"
                />
              </div>

              {/* Social links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {SOCIAL_FIELDS.map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      {field.label}
                    </label>
                    <div className="relative">
                      <field.icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="url"
                        name={field.key}
                        defaultValue={socials[field.key] || ''}
                        placeholder={field.placeholder}
                        className="w-full pl-9 pr-4 py-3 rounded-xl bg-white/50 dark:bg-white/10 border border-white/30 dark:border-white/20 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold shadow-neon transition-all disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                Save public profile
              </motion.button>
            </form>
          </motion.div>

          {/* Completed projects */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="bg-glass-light dark:bg-glass-dark backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-glass rounded-2xl p-6"
          >
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Completed Projects
              <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
                ({completedProjects.length})
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Projects marked as completed. Project status is managed from the Projects page.
            </p>

            {projectsLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : completedProjects.length === 0 ? (
              <div className="text-center py-10">
                <CheckCircle2 className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No completed projects yet. Finished work will appear here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {completedProjects.map((project) => (
                  <div
                    key={project.id}
                    className="p-4 rounded-xl bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/10"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                        {project.name}
                      </h3>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    </div>
                    {project.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-3">
                      <Link
                        to={`/projects/${project.id}`}
                        className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Open project
                      </Link>
                      {project.github_repo_url && (
                        <a
                          href={project.github_repo_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-blue-500"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Repository
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  )
}