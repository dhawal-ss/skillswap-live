import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';

declare global {
  interface Window {
    __SUPABASE_URL__?: string;
    __SUPABASE_ANON_KEY__?: string;
  }
}

if (typeof window !== 'undefined') {
  window.__SUPABASE_URL__ = import.meta.env.VITE_SUPABASE_URL;
  window.__SUPABASE_ANON_KEY__ = import.meta.env.VITE_SUPABASE_ANON_KEY;
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
