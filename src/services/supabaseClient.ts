import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const resolveEnv = (key: 'url' | 'anon'): string | undefined => {
  if (typeof globalThis !== 'undefined') {
    if (key === 'url') return (globalThis as any).__SUPABASE_URL__ ?? undefined;
    if (key === 'anon') return (globalThis as any).__SUPABASE_ANON_KEY__ ?? undefined;
  }
  if (typeof process !== 'undefined') {
    if (key === 'url') {
      return process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
    }
    return process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
  }
  return undefined;
};

const supabaseUrl = resolveEnv('url');
const supabaseAnonKey = resolveEnv('anon');

export type DatabaseClient = SupabaseClient<any, 'public', any>;

export const supabase: DatabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? (createClient(supabaseUrl, supabaseAnonKey) as DatabaseClient)
    : null;

export const hasSupabase = Boolean(supabaseUrl && supabaseAnonKey);
