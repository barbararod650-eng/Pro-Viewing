import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, getDefaultPropertyId } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email');
  if (!email) {
    return NextResponse.json({ error: 'Missing email.' }, { status: 400 });
  }
  const propertyId = req.nextUrl.searchParams.get('propertyId') || (await getDefaultPropertyId());
  if (!propertyId) {
    return NextResponse.json({ error: 'No property specified.' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('payment_requests')
    .select('id, method, amount, status, account_details, created_at')
    .eq('user_email', email)
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ paymentRequest: data });
}