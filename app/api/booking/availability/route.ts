import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { TIME_SLOTS } from '@/lib/property';
import { isValidDateStr, slotToUtcRange } from '@/lib/booking-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Public on purpose: the calendar is shown before sign-in. Only reveals which
// time slots are taken, never who took them.
export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date') || '';
  if (!isValidDateStr(date)) {
    return NextResponse.json({ error: 'Invalid date.' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('bookings')
    .select('slot_start')
    .eq('slot_date', date)
    .eq('status', 'active');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const taken = new Set((data || []).map((row) => new Date(row.slot_start).getTime()));
  const now = Date.now();

  const unavailable = TIME_SLOTS.filter((label) => {
    const range = slotToUtcRange(date, label);
    if (!range) return true;
    return range.startMs <= now || taken.has(range.startMs);
  });

  return NextResponse.json({ unavailable });
}