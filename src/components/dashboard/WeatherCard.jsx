import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Loader2, MapPin, Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudFog, HelpCircle, AlertTriangle } from 'lucide-react'

// Maps Open-Meteo WMO weather codes to a label + icon
const WMO = {
  0: { label: 'Clear sky', icon: Sun },
  1: { label: 'Mainly clear', icon: Sun },
  2: { label: 'Partly cloudy', icon: Cloud },
  3: { label: 'Overcast', icon: Cloud },
  45: { label: 'Fog', icon: CloudFog },
  48: { label: 'Depositing rime fog', icon: CloudFog },
  51: { label: 'Light drizzle', icon: CloudRain },
  53: { label: 'Drizzle', icon: CloudRain },
  55: { label: 'Dense drizzle', icon: CloudRain },
  61: { label: 'Light rain', icon: CloudRain },
  63: { label: 'Rain', icon: CloudRain },
  65: { label: 'Heavy rain', icon: CloudRain },
  71: { label: 'Light snow', icon: CloudSnow },
  73: { label: 'Snow', icon: CloudSnow },
  75: { label: 'Heavy snow', icon: CloudSnow },
  80: { label: 'Light showers', icon: CloudRain },
  81: { label: 'Showers', icon: CloudRain },
  82: { label: 'Violent showers', icon: CloudLightning },
  95: { label: 'Thunderstorm', icon: CloudLightning },
  96: { label: 'Thunderstorm with hail', icon: CloudLightning },
  99: { label: 'Thunderstorm with hail', icon: CloudLightning },
}

/**
 * WeatherCard - Current weather for the user's location.
 * Uses the free Open-Meteo API (no API key required) with the
 * browser Geolocation API. Handles loading, permission-denied,
 * unavailable-location and network error states gracefully.
 */
export default function WeatherCard() {
  const [weather, setWeather] = useState(null)
  const [status, setStatus] = useState(() =>
    typeof navigator !== 'undefined' && navigator.geolocation ? 'loading' : 'unsupported'
  )
  const [coords, setCoords] = useState(null)

  // Resolve coordinates via the browser geolocation API
  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => setStatus('denied'),
      { timeout: 10000, maximumAge: 300000 }
    )
  }, [])

  // Fetch current weather from Open-Meteo when coordinates are known
  useEffect(() => {
    if (!coords) return
    let cancelled = false

    async function fetchWeather() {
      try {
        const lat = coords.lat.toFixed(2)
        const lon = coords.lon.toFixed(2)
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`
        )
        if (!res.ok) throw new Error('Weather request failed')
        const data = await res.json()
        if (cancelled) return
        setWeather(data.current_weather)
        setStatus('ready')
      } catch {
        if (!cancelled) setStatus('error')
      }
    }

    fetchWeather()
    return () => {
      cancelled = true
    }
  }, [coords])

  const code = weather && weather.weathercode != null ? WMO[weather.weathercode] : null
  const WeatherIcon = code ? code.icon : HelpCircle
  const temp = weather ? Math.round(weather.temperature) : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="bg-glass-light dark:bg-glass-dark backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-glass rounded-2xl p-6 flex flex-col"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-500/15 text-blue-500">
          <MapPin className="w-4 h-4" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Current Weather</h2>
      </div>

      <div className="flex-1 flex items-center justify-center">
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-3 py-8 text-slate-500 dark:text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-sm">Fetching weather&hellip;</span>
          </div>
        )}
        {status === 'denied' && (
          <div className="flex flex-col items-center gap-3 py-8 text-center text-slate-500 dark:text-slate-400">
            <AlertTriangle className="w-6 h-6" />
            <span className="text-sm">Location access is disabled. Weather is unavailable.</span>
          </div>
        )}
        {status === 'unsupported' && (
          <div className="flex flex-col items-center gap-3 py-8 text-center text-slate-500 dark:text-slate-400">
            <AlertTriangle className="w-6 h-6" />
            <span className="text-sm">Geolocation is not supported by this browser.</span>
          </div>
        )}
        {status === 'error' && (
          <div className="flex flex-col items-center gap-3 py-8 text-center text-slate-500 dark:text-slate-400">
            <AlertTriangle className="w-6 h-6" />
            <span className="text-sm">Unable to load weather. Please try again later.</span>
          </div>
        )}
        {status === 'ready' && weather && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-3 py-6 text-center"
          >
            <WeatherIcon className="w-16 h-16 text-blue-500 dark:text-blue-400" />
            <div className="text-5xl font-bold text-slate-900 dark:text-white">
              {temp}&deg;C
            </div>
            <div className="text-sm font-medium text-slate-600 dark:text-slate-300">
              {code ? code.label : 'Current conditions'}
            </div>
            {weather.windspeed != null && (
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Wind {Math.round(weather.windspeed)} km/h
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

