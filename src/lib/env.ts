
export const env = {
  VITE_APP_DOMAIN: import.meta.env.VITE_APP_DOMAIN || 'app.strataige.cc',
  VITE_LANDING_DOMAIN: import.meta.env.VITE_LANDING_DOMAIN || 'www.strataige.cc',
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
};
