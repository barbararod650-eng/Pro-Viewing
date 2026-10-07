import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, getDefaultPropertyId } from '@/lib/supabase-admin';
import { getAuthedUser } from '@/lib/auth-server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const user = await getAuthedUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
  }
  const propertyId = req.nextUrl.searchParams.get('propertyId') || (await getDefaultPropertyId());
  if (!propertyId) {
    return NextResponse.json({ error: 'No property specified.' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('payment_requests')
    .select('id, method, amount, currency, status, account_details, created_at')
    .eq('user_email', user.email)
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ paymentRequest: data });
}