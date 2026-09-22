import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Save,
  User,
  Globe,
  Sun,
  Moon,
  Loader2,
  ImagePlus,
  X,
  Palette,
  CheckCircle2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { usePreferences } from '../contexts/PreferencesContext'
import { useTheme, DEFAULT_PRESET } from '../contexts/ThemeContext'

/**
 * Settings page - Profile management and preferences.
 * Fetch/update full_name and avatar_url from profiles table,
 * plus theme toggle (dark/light).
 */
export default function Settings() {
  const { user } = useAuth()
  const { theme, toggleTheme, activePreset, isDynamic, presets } = useTheme()
  const { preferences, loading: preferencesLoading, updatePreferences } = usePreferences()

  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [email] = useState(user?.email || '')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [savingTheme, setSavingTheme] = useState(false)
  const backgroundInputRef = useRef(null)

  const themeConfig = preferences?.theme_config || {}
  const activePresetLabel = presets[activePreset]?.label || presets[DEFAULT_PRESET].label

  /**
   * Persist a partial theme_config update. The theme system reads from the same
   * preferences context, so the new background is applied immediately.
   */
  const patchThemeConfig = async (patch) => {
    setSavingTheme(true)
    const next = { ...themeConfig, ...patch }
    const { error } = await updatePreferences({ theme_config: next })
    setSavingTheme(false)
    if (error) toast.error(`Could not save theme: ${error.message || error}`)
    return { error }
  }

  const handleDynamicToggle = async (enabled) => {
    const { error } = await patchThemeConfig({ dynamic: enabled })
    if (!error) {
      toast.success(
        enabled
          ? 'Background now follows the time of day'
          : 'Background fixed to the selected preset'
      )
    }
  }

  const handlePresetChange = async (preset) => {
    const { error } = await patchThemeConfig({ preset })
    if (!error) toast.success('Background preset updated')
  }

  const handleBackgroundImageApply = async (e) => {
    e.preventDefault()
    const value = backgroundInputRef.current?.value.trim() || ''
    const { error } = await patchThemeConfig({ backgroundImage: value })
    if (!error) {
      toast.success(value ? 'Background image applied' : 'Background image cleared')
    }
  }

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
          Private account and system configuration. Your public bio and links live on your{' '}
          <Link
            to="/profile"
            className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
          >
            profile
          </Link>
          .
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

      {!loading && !preferencesLoading && (
        <div className="space-y-6">
          {/* ===== Profile Card ===== */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-glass-light dark:bg-glass-dark backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-glass rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-500/15 text-blue-500">
                <User className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Account
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

          {/* ===== Theme Studio Card ===== */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-glass-light dark:bg-glass-dark backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-glass rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-500/15 text-blue-500">
                <Palette className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Theme Studio
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  Active background: {activePresetLabel}
                  {isDynamic ? ' (matched to the time of day)' : ''}
                </p>
              </div>
              {savingTheme && (
                <Loader2 className="w-4 h-4 animate-spin text-slate-400 ml-auto shrink-0" />
              )}
            </div>

            {/* Time-of-day toggle */}
            <label className="flex items-center justify-between gap-4 p-4 rounded-xl bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/10 cursor-pointer">
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Match background to time of day
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Sunrise, clear daylight, dusk and midnight blue rotate automatically.
                </p>
              </div>
              <input
                type="checkbox"
                checked={isDynamic}
                onChange={(e) => handleDynamicToggle(e.target.checked)}
                className="w-5 h-5 shrink-0 rounded border-white/30 text-blue-500 focus:ring-blue-500/50"
              />
            </label>

            {/* Preset selection */}
            <div className="mt-5">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Background preset
              </label>
              <select
                value={themeConfig.preset || DEFAULT_PRESET}
                onChange={(e) => handlePresetChange(e.target.value)}
                disabled={isDynamic}
                className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-white/10 border border-white/30 dark:border-white/20 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {Object.entries(presets).map(([key, preset]) => (
                  <option key={key} value={key}>
                    {preset.label}
                  </option>
                ))}
              </select>

              {/* Live preset swatches */}
              <div className="flex flex-wrap gap-3 mt-3">
                {Object.entries(presets).map(([key, preset]) => {
                  const isActive = activePreset === key
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handlePresetChange(key)}
                      disabled={isDynamic}
                      title={preset.label}
                      aria-label={`Use the ${preset.label} background`}
                      style={{ backgroundImage: preset[theme] || preset.light }}
                      className={`relative w-14 h-10 rounded-lg border-2 transition-all disabled:cursor-not-allowed ${
                        isActive
                          ? 'border-blue-500 shadow-neon'
                          : 'border-white/30 dark:border-white/10 hover:border-blue-400/60'
                      }`}
                    >
                      {isActive && (
                        <CheckCircle2 className="absolute top-1 right-1 w-3.5 h-3.5 text-white drop-shadow" />
                      )}
                    </button>
                  )
                })}
              </div>

              {isDynamic && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                  Preset selection is paused while time-of-day matching is on.
                </p>
              )}
            </div>

            {/* Optional background image */}
            <form onSubmit={handleBackgroundImageApply} className="mt-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Background image URL (optional)
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  ref={backgroundInputRef}
                  type="url"
                  defaultValue={themeConfig.backgroundImage || ''}
                  placeholder="https://images.example.com/background.jpg"
                  className="flex-1 px-4 py-3 rounded-xl bg-white/50 dark:bg-white/10 border border-white/30 dark:border-white/20 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
                <button
                  type="submit"
                  disabled={savingTheme}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold shadow-neon transition-all disabled:opacity-50"
                >
                  Apply
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Layered over the gradient. Only http(s) URLs are accepted; leave empty to
                clear it.
              </p>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}