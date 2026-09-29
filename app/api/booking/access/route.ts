import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, getDefaultPropertyId } from '@/lib/supabase-admin';
import { getAuthedUser } from '@/lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type AccessState = 'no_booking' | 'unverified' | 'unpaid' | 'before' | 'during' | 'after';

async function evaluate(email: string, propertyId: string) {
  const supabase = getSupabaseAdmin();

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, slot_start, slot_end, access_code, code_revealed_at')
    .eq('user_email', email)
    .eq('property_id', propertyId)
    .eq('status', 'active')
    .maybeSingle();

  const now = Date.now();
  if (!booking) {
    return { state: 'no_booking' as AccessState, now, booking: null };
  }

  const [{ data: verification }, { data: payment }] = await Promise.all([
    supabase
      .from('verifications')
      .select('status')
      .eq('user_email', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('payment_requests')
      .select('status')
      .eq('user_email', email)
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const start = new Date(booking.slot_start).getTime();
  const end = new Date(booking.slot_end).getTime();

  let state: AccessState;
  if (verification?.status !== 'approved') state = 'unverified';
  else if (payment?.status !== 'confirmed') state = 'unpaid';
  else if (now < start) state = 'before';
  else if (now <= end) state = 'during';
  else state = 'after';

  return { state, now, booking };
}

export async function GET(req: NextRequest) {
  const user = await getAuthedUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
  }

  const propertyId = req.nextUrl.searchParams.get('propertyId') || (await getDefaultPropertyId());
  if (!propertyId) {
    return NextResponse.json({ error: 'No property specified.' }, { status: 400 });
  }

  const { state, now, booking } = await evaluate(user.email, propertyId);

  return NextResponse.json({
    state,
    serverNow: now,
    opensAt: booking?.slot_start ?? null,
    closesAt: booking?.slot_end ?? null,
  });
}

export async function POST(req: NextRequest) {
  const user = await getAuthedUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const propertyId = String(body.propertyId || (await getDefaultPropertyId()) || '');
  if (!propertyId) {
    return NextResponse.json({ error: 'No property specified.' }, { status: 400 });
  }

  const { state, booking } = await evaluate(user.email, propertyId);

  if (state !== 'during' || !booking) {
    const messages: Record<AccessState, string> = {
      no_booking: "You don't have a viewing scheduled.",
      unverified: 'Your identity verification needs to be approved first.',
      unpaid: 'Your payment needs to be confirmed first.',
      before: "Your viewing window hasn't opened yet.",
      during: '',
      after: 'Your viewing window has closed.',
    };
    return NextResponse.json({ error: messages[state], state }, { status: 403 });
  }

  if (!booking.code_revealed_at) {
    await getSupabaseAdmin()
      .from('bookings')
      .update({ code_revealed_at: new Date().toISOString() })
      .eq('id', booking.id)
      .is('code_revealed_at', null);
  }

  return NextResponse.json({ code: booking.access_code });
}