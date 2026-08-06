import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Save, User, Globe, Sun, Moon, Loader2, ImagePlus, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

/**
 * Settings page - Profile management and preferences.
 * Fetch/update full_name and avatar_url from profiles table,
 * plus theme toggle (dark/light).
 */
export default function Settings() {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [email] = useState(user?.email || '')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  // Fetch profile from the profiles table on mount
  useEffect(() => {
    let isMounted = true

    async function loadProfile() {
      if (!user) {
        if (isMounted) setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!isMounted) return

      if (error) {
        console.error('Error fetching profile:', error)
      } else if (data) {
        setFullName(data.full_name || '')
        setAvatarUrl(data.avatar_url || '')
      }

      setLoading(false)
    }

    loadProfile()

    return () => {
      isMounted = false
    }
  }, [user])

  /**
   * Upload a profile picture to the `avatars` bucket and store the
   * public URL in avatarUrl (saved to the profiles table on submit).
   */
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB')
      return
    }

    setUploadingAvatar(true)
    try {
      const ext = file.name.split('.').pop() || 'png'
      const fileName = `${user.id}-${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      setAvatarUrl(urlData.publicUrl)
      toast.success('Avatar uploaded!')
    } catch (err) {
      console.error('Error uploading avatar:', err)
      toast.error('Failed to upload avatar')
    } finally {
      setUploadingAvatar(false)
      e.target.value = ''
    }
  }

  /**
   * Save updated profile info (full_name + avatar_url)
   */
  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim() || null,
          avatar_url: avatarUrl.trim() || null,
        })
        .eq('id', user.id)

      if (error) {
        toast.error(`Failed to update profile: ${error.message}`)
        return
      }

      // Also update auth metadata so full_name & avatar are consistent globally
      await supabase.auth.updateUser({
        data: { full_name: fullName.trim(), avatar_url: avatarUrl.trim() },
      })

      toast.success('Profile updated successfully!')
    } catch (err) {
      console.error('Error saving profile:', err)
      toast.error('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
          Settings
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Manage your profile and preferences
        </p>
      </div>

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

      {!loading && (
        <div className="space-y-6">
          {/* ===== Profile Card ===== */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-glass-light dark:bg-glass-dark backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-glass rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-neon-purple/20 text-neon-purple">
                <User className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Profile
              </h2>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Email (read-only) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full px-4 py-3 rounded-xl bg-white/30 dark:bg-white/5 border border-white/30 dark:border-white/20 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Email cannot be changed (managed by Supabase Auth)
                </p>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-white/10 border border-white/30 dark:border-white/20 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-neon-purple/50 transition-all"
                />
              </div>

              {/* Avatar / Profile picture */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Profile Picture
                </label>

                <div className="flex items-center gap-4">
                  {/* Preview */}
                  <div className="flex items-center justify-center w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-neon-purple to-neon-pink text-white font-bold text-xl shrink-0">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      (fullName.charAt(0) || 'U').toUpperCase()
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    {/* Upload button */}
                    <label className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/50 dark:bg-white/10 border border-white/30 dark:border-white/20 text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-white/60 dark:hover:bg-white/10 transition-colors">
                      {uploadingAvatar ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <ImagePlus className="w-4 h-4" />
                          Upload photo
                        </>
                      )}
                      <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                    </label>

                    {/* Remove (reset to initials) */}
                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setAvatarUrl('')}
                        className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-3 h-3" />
                        Remove photo
                      </button>
                    )}
                  </div>
                </div>

                {/* Manual URL (optional advanced) */}
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="…or paste an image URL"
                  className="w-full mt-3 px-4 py-3 rounded-xl bg-white/50 dark:bg-white/10 border border-white/30 dark:border-white/20 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-neon-purple/50 transition-all"
                />
              </div>

              {/* Save button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-neon-purple to-neon-pink text-white font-semibold shadow-neon transition-all disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                Save Changes
              </motion.button>
            </form>
          </motion.div>

          {/* ===== Appearance Card ===== */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-glass-light dark:bg-glass-dark backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-glass rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-neon-cyan/20 text-neon-cyan">
                <Globe className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Appearance
              </h2>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/10">
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Theme Mode
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Currently: {theme === 'dark' ? 'Dark' : 'Light'}
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleTheme}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-neon-purple to-neon-pink text-white text-sm font-semibold shadow-neon transition-all"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-4 h-4" />
                    Switch to Light
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4" />
                    Switch to Dark
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}