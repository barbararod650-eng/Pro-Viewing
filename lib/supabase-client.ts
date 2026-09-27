import { createClient } from '@supabase/supabase-js';

// Browser client — safe to import from client components.
// Uses the public anon key, which only works within your database's
// Row Level Security rules.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, anonKey);