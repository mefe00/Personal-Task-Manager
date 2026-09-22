import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext'
import { PreferencesProvider } from './contexts/PreferencesContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { StopwatchProvider } from './contexts/StopwatchContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <PreferencesProvider>
          <ThemeProvider>
            <StopwatchProvider>
              <App />
            </StopwatchProvider>
          </ThemeProvider>
        </PreferencesProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'rgba(15, 23, 42, 0.9)',
                color: '#fff',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                borderRadius: '12px',
              },
              success: {
                iconTheme: { primary: '#34d399', secondary: '#fff' },
              },
              error: {
                iconTheme: { primary: '#ef4444', secondary: '#fff' },
              },
            }}
          />
        </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)