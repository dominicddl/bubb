import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { chromeStorageAdapter } from './storage';

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase;

  const supabaseUrl = import.meta.env.WXT_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.WXT_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing WXT_SUPABASE_URL or WXT_SUPABASE_ANON_KEY env vars. ' +
        'Create extension/.env with these values.',
    );
  }

  _supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: chromeStorageAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: 'implicit',
    },
  });

  return _supabase;
}
