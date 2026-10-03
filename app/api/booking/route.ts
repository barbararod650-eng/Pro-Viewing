import { NextRequest, NextResponse } from 'next/server';
import { randomInt } from 'crypto';
import { getSupabaseAdmin, getDefaultPropertyId } from '@/lib/supabase-admin';
import { getAuthedUser } from '@/lib/auth-server';
import { ACCESS_CODE_LENGTH, slotToUtcRange } from '@/lib/booking-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VIEWING_COLUMNS = 'id, property_id, slot_date, slot_label, slot_start, slot_end';

function generateAccessCode(): string {
  return randomInt(0, 10 ** ACCESS_CODE_LENGTH).toString().padStart(ACCESS_CODE_LENGTH, '0');
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

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('bookings')
    .select(VIEWING_COLUMNS)
    .eq('user_email', user.email)
    .eq('property_id', propertyId)
    .eq('status', 'active')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ viewing: data });
}

export async function POST(req: NextRequest) {
  const user = await getAuthedUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const date = String(body.date || '');
  const slot = String(body.slot || '');
  const propertyId = String(body.propertyId || (await getDefaultPropertyId()) || '');

  if (!propertyId) {
    return NextResponse.json({ error: 'No property specified.' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data: property, error: propError } = await supabase
    .from('properties')
    .select('time_slots, timezone')
    .eq('id', propertyId)
    .eq('status', 'published')
    .maybeSingle();

  if (propError) {
    return NextResponse.json({ error: propError.message }, { status: 500 });
  }
  if (!property) {
    return NextResponse.json({ error: 'Property not found.' }, { status: 404 });
  }

  const range = slotToUtcRange(date, slot, property.time_slots, property.timezone);
  if (!range) {
    return NextResponse.json({ error: 'Invalid date or time slot.' }, { status: 400 });
  }
  if (range.startMs <= Date.now()) {
    return NextResponse.json(
      { error: 'That time has already passed. Please pick a later slot.' },
      { status: 400 }
    );
  }

  const { data: existing, error: lookupError } = await supabase
    .from('bookings')
    .select('id, slot_start, slot_end')
    .eq('user_email', user.email)
    .eq('property_id', propertyId)
    .eq('status', 'active')
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json({ error: lookupError.message }, { status: 500 });
  }

  if (existing && new Date(existing.slot_start).getTime() <= Date.now()) {
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
          property_id: propertyId,
          user_email: user.email,
          user_name: user.name,
          access_code: generateAccessCode(),
          status: 'active',
        })
        .select(VIEWING_COLUMNS)
        .single();

  if (error) {
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