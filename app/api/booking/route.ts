import { NextRequest, NextResponse } from 'next/server';
import { randomInt } from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getAuthedUser } from '@/lib/auth-server';
import { ACCESS_CODE_LENGTH, slotToUtcRange } from '@/lib/booking-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VIEWING_COLUMNS = 'id, slot_date, slot_label, slot_start, slot_end';

function generateAccessCode(): string {
  return randomInt(0, 10 ** ACCESS_CODE_LENGTH).toString().padStart(ACCESS_CODE_LENGTH, '0');
}

// The signed-in person's current booking. Never includes the access code.
export async function GET(req: NextRequest) {
  const user = await getAuthedUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('bookings')
    .select(VIEWING_COLUMNS)
    .eq('user_email', user.email)
    .eq('status', 'active')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ viewing: data });
}

// Book a slot — or move an existing booking to a new slot.
export async function POST(req: NextRequest) {
  const user = await getAuthedUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const date = String(body.date || '');
  const slot = String(body.slot || '');

  const range = slotToUtcRange(date, slot);
  if (!range) {
    return NextResponse.json({ error: 'Invalid date or time slot.' }, { status: 400 });
  }
  if (range.startMs <= Date.now()) {
    return NextResponse.json(
      { error: 'That time has already passed. Please pick a later slot.' },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();

  const { data: existing, error: lookupError } = await supabase
    .from('bookings')
    .select('id, slot_start, slot_end')
    .eq('user_email', user.email)
    .eq('status', 'active')
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json({ error: lookupError.message }, { status: 500 });
  }

    if (existing && new Date(existing.slot_end).getTime() <= Date.now()) {
    return NextResponse.json(
      { error: "Your viewing has already started, so it can't be rescheduled." },
      { status: 400 }
    );
  }

  const slotFields = {
    slot_date: date,
    slot_label: slot,
    slot_start: new Date(range.startMs).toISOString(),
    slot_end: new Date(range.endMs).toISOString(),
  };

  const { data, error } = existing
    ? await supabase
        .from('bookings')
        .update(slotFields)
        .eq('id', existing.id)
        .select(VIEWING_COLUMNS)
        .single()
    : await supabase
        .from('bookings')
        .insert({
          ...slotFields,
          user_email: user.email,
          user_name: user.name,
          access_code: generateAccessCode(),
          status: 'active',
        })
        .select(VIEWING_COLUMNS)
        .single();

  if (error) {
    // 23505 = unique violation: someone else grabbed this slot first.
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'That time slot was just taken. Please choose another.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ viewing: data });
}