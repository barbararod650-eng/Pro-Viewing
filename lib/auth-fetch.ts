import { supabase } from '@/lib/supabase-client';

// Like fetch(), but attaches the signed-in user's login token so the server
// can verify who is asking. Use for any API route that needs a real login.
export async function authFetch(input: string, init: RequestInit = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}