import '@testing-library/jest-dom';

(globalThis as any).__SUPABASE_URL__ = process.env.VITE_SUPABASE_URL ?? '';
(globalThis as any).__SUPABASE_ANON_KEY__ = process.env.VITE_SUPABASE_ANON_KEY ?? '';
