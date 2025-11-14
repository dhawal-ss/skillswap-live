import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type DatabaseClient = SupabaseClient<any, 'public', any>;

let cachedClient: DatabaseClient | null | undefined;

const resolveEnv = () => {
  const urlFromGlobal =
    typeof globalThis !== 'undefined' ? (globalThis as any).__SUPABASE_URL__ : undefined;
  const anonFromGlobal =
    typeof globalThis !== 'undefined' ? (globalThis as any).__SUPABASE_ANON_KEY__ : undefined;
  const urlFromProcess =
    typeof process !== 'undefined'
      ? process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL
      : undefined;
  const anonFromProcess =
    typeof process !== 'undefined'
      ? process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY
      : undefined;

  return {
    url: urlFromGlobal ?? urlFromProcess,
    anonKey: anonFromGlobal ?? anonFromProcess,
  };
};

export const getSupabaseClient = (): DatabaseClient | null => {
  if (cachedClient !== undefined) {
    return cachedClient;
  }

  const { url, anonKey } = resolveEnv();
  if (!url || !anonKey) {
    cachedClient = null;
    return cachedClient;
  }

  cachedClient = createClient(url, anonKey) as DatabaseClient;
  return cachedClient;
};

export const hasSupabase = () => Boolean(getSupabaseClient());
