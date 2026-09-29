import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, getDefaultPropertyId } from '@/lib/supabase-admin';
import { isValidDateStr, slotToUtcRange } from '@/lib/booking-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date') || '';
  if (!isValidDateStr(date)) {
    return NextResponse.json({ error: 'Invalid date.' }, { status: 400 });
  }

  const propertyId = req.nextUrl.searchParams.get('propertyId') || (await getDefaultPropertyId());
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

  const { data, error } = await supabase
    .from('bookings')
    .select('slot_start')
    .eq('property_id', propertyId)
    .eq('slot_date', date)
    .eq('status', 'active');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const taken = new Set((data || []).map((row) => new Date(row.slot_start).getTime()));
  const now = Date.now();

  const unavailable = (property.time_slots as string[]).filter((label) => {
    const range = slotToUtcRange(date, label, property.time_slots, property.timezone);
    if (!range) return true;
    return range.startMs <= now || taken.has(range.startMs);
  });

  return NextResponse.json({ unavailable, timeSlots: property.time_slots });
}