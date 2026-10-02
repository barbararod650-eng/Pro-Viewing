import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export interface AuthedUser {
  email: string;
  name: string;
}

// Server-only. Verifies the caller's real Supabase login token (sent as an
// "Authorization: Bearer ..." header) and returns who they actually are.
// Unlike trusting an email sent from the browser, this can't be faked.
export async function getAuthedUser(req: NextRequest): Promise<AuthedUser | null> {
  const header = req.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return null;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user?.email) return null;

  return {
    email: data.user.email,
    name: (data.user.user_metadata?.full_name as string | undefined) || data.user.email.split('@')[0],
  };
}