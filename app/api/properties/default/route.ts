import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Public: the "default" property (oldest published listing).
// Used by the payment page when the visitor hasn't picked a property yet.
export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  return NextResponse.json({ property: data });
}