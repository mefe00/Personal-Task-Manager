/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Professional Blue/Slate accent palette
        // (Phase 8: all purple/magenta/neon accents replaced with calm blue tones)
        neon: {
          cyan: '#0ea5e9',   // Sky-500 (secondary blue accent)
          purple: '#3b82f6', // Blue-500 (primary accent)
          pink: '#2563eb',   // Blue-600 (gradient partner)
          green: '#10b981',  // Emerald-500 (success)
        },
        // Glassmorphic surface colors
        glass: {
          light: 'rgba(255, 255, 255, 0.6)',
          dark: 'rgba(17, 24, 39, 0.6)',
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
        'neon': '0 0 24px rgba(59, 130, 246, 0.35)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}