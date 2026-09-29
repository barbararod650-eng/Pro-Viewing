import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Public: the browsable list of published listings. Never returns drafts.
export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('properties')
    .select('id, name, address, price, beds, baths, sqft, image_url, verified')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ properties: data });
}