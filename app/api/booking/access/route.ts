import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getAuthedUser } from '@/lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type AccessState = 'no_booking' | 'unverified' | 'unpaid' | 'before' | 'during' | 'after';

// Works out whether this person may see their code right now.
// All checks happen here on the server, using the server's clock.
async function evaluate(email: string) {
  const supabase = getSupabaseAdmin();

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, slot_start, slot_end, access_code, code_revealed_at')
    .eq('user_email', email)
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

// Status only — this never includes the access code.
export async function GET(req: NextRequest) {
  const user = await getAuthedUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
  }

  const { state, now, booking } = await evaluate(user.email);

  return NextResponse.json({
    state,
    serverNow: now,
    opensAt: booking?.slot_start ?? null,
    closesAt: booking?.slot_end ?? null,
  });
}

// Reveals the code — only when verified, paid, and inside the viewing window.
export async function POST(req: NextRequest) {
  const user = await getAuthedUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
  }

  const { state, booking } = await evaluate(user.email);

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

  // Remember the first time the code was viewed (useful for the admin).
  if (!booking.code_revealed_at) {
    await getSupabaseAdmin()
      .from('bookings')
      .update({ code_revealed_at: new Date().toISOString() })
      .eq('id', booking.id)
      .is('code_revealed_at', null);
  }

  return NextResponse.json({ code: booking.access_code });
}