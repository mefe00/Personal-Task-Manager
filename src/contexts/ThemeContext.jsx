/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { usePreferences } from './PreferencesContext'

const ThemeContext = createContext(null)

/**
 * Background presets for the dynamic theme system. Every gradient stays inside
 * the professional Blue/Slate palette established in Phase 8 (no purple,
 * magenta, or neon tones).
 */
export const THEME_PRESETS = {
  classic: {
    label: 'Classic Slate',
    light: 'linear-gradient(135deg, #f1f5f9 0%, #eff6ff 50%, #f1f5f9 100%)',
    dark: 'linear-gradient(135deg, #0f172a 0%, #172554 50%, #0f172a 100%)',
  },
  sunrise: {
    label: 'Sunrise',
    light: 'linear-gradient(135deg, #fdf6ec 0%, #fde8cd 45%, #dbeafe 100%)',
    dark: 'linear-gradient(135deg, #1f2937 0%, #3f3a2f 50%, #0f172a 100%)',
  },
  daylight: {
    label: 'Clear Daylight',
    light: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 50%, #eff6ff 100%)',
    dark: 'linear-gradient(135deg, #0b1220 0%, #1e3a8a 55%, #0f172a 100%)',
  },
  dusk: {
    label: 'Dusk',
    light: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 45%, #dbeafe 100%)',
    dark: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #1e3a8a 100%)',
  },
  midnight: {
    label: 'Midnight Blue',
    light: 'linear-gradient(135deg, #e2e8f0 0%, #dbeafe 50%, #e2e8f0 100%)',
    dark: 'linear-gradient(135deg, #020617 0%, #172554 55%, #0f172a 100%)',
  },
}

export const DEFAULT_PRESET = 'classic'

/**
 * Map the current hour to a preset. Used when "match background to time of
 * day" is enabled: morning light, clear midday, warm dusk, deep midnight.
 */
export function presetForTime(date = new Date()) {
  const hour = date.getHours()
  if (hour >= 5 && hour < 11) return 'sunrise'
  if (hour >= 11 && hour < 17) return 'daylight'
  if (hour >= 17 && hour < 21) return 'dusk'
  return 'midnight'
}

/**
 * Only http(s) URLs are accepted so a stored value can never inject arbitrary
 * CSS into the document.
 */
function safeBackgroundImage(url) {
  if (!url) return 'none'
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return 'none'
    return `url("${parsed.href}")`
  } catch {
    return 'none'
  }
}

/**
 * ThemeProvider - Manages dark/light mode plus the time-of-day background.
 *
 * Light/dark is persisted to localStorage and toggles the 'dark' class on
 * <html>. The background is resolved from the user's `theme_config` (theme
 * presets stored in `user_preferences`) and published as CSS variables so any
 * surface can consume it. When dynamic mode is on, the preset is re-evaluated
 * every minute, following the same tick pattern as the stopwatch.
 */
export function ThemeProvider({ children }) {
  const { preferences } = usePreferences()

  const [theme, setTheme] = useState(() => {
    // Check localStorage first, then fall back to system preference
    const saved = localStorage.getItem('theme')
    if (saved) return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  })

  // Currently applied background preset key (see the resolution effect below).
  const [activePreset, setActivePreset] = useState(DEFAULT_PRESET)

  const themeConfig = preferences?.theme_config || {}
  const isDynamic = Boolean(themeConfig.dynamic)
  const preferredPreset = THEME_PRESETS[themeConfig.preset] ? themeConfig.preset : DEFAULT_PRESET
  const backgroundImage =
    typeof themeConfig.backgroundImage === 'string' ? themeConfig.backgroundImage : ''

  useEffect(() => {
    // Toggle 'dark' class on the root html element
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  // Resolve which preset applies right now. In dynamic mode the clock is
  // re-checked every minute; otherwise the user's chosen preset is used.
  useEffect(() => {
    const resolve = () => setActivePreset(isDynamic ? presetForTime() : preferredPreset)
    resolve()
    if (!isDynamic) return
    const id = setInterval(resolve, 60000)
    return () => clearInterval(id)
  }, [isDynamic, preferredPreset])

  // Publish the resolved background as CSS variables on <html> so the layout
  // and any future surface can consume it without prop drilling.
  useEffect(() => {
    const root = document.documentElement
    const preset = THEME_PRESETS[activePreset] || THEME_PRESETS[DEFAULT_PRESET]
    root.style.setProperty('--app-bg', preset[theme] || preset.light)
    root.style.setProperty('--app-bg-image', safeBackgroundImage(backgroundImage))
  }, [activePreset, theme, backgroundImage])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  const value = useMemo(
    () => ({
      theme,
      toggleTheme,
      activePreset,
      isDynamic,
      presets: THEME_PRESETS,
    }),
    [theme, activePreset, isDynamic]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

/**
 * Custom hook to use the ThemeContext
 */
export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export default ThemeContext