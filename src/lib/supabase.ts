import { createClient } from '@supabase/supabase-js'

// true in development (npm run dev), false in production (npm run build)
export const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// Il client viene creato sempre, ma in demo mode i servizi
// intercettano isDemoMode prima di fare qualsiasi chiamata reale.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
