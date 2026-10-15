import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Credenciales directas de producción
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://svpstljbhtxuzxuipdaj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_SczyMAwd_QpxX_9oNWBF7A_E2oDdKmv";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
});