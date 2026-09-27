import { createClient } from '@supabase/supabase-js';

// Server-only client. Never import this file from a 'use client' component —
// it uses the secret service_role key, which must never reach the browser.
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.'
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}