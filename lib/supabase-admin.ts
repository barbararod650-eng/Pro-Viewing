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


// Used when a request doesn't specify which property it's about (e.g. old
// frontend code that predates multi-property support). Falls back to the
// earliest published listing, so nothing breaks mid-migration.
export async function getDefaultPropertyId(): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('properties')
    .select('id')
    .eq('status', 'published')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}