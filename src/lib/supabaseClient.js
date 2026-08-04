import { createClient } from '@supabase/supabase-js'

/**
 * Supabase client - initialized from environment variables.
 * Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Prevent crashes with a clear error message if env vars are missing
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing Supabase environment variables. ' +
      'Please create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  )
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
)

export default supabase