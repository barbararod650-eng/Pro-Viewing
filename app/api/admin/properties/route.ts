import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { detectTimezoneFromAddress } from '@/lib/timezone-detect';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isAuthorized(req: NextRequest) {
  const provided = req.headers.get('x-admin-password');
  return provided && provided === process.env.ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ properties: data });
}

const DEFAULT_TIME_SLOTS = [
  '9:00 AM – 10:00 AM',
  '11:00 AM – 12:00 PM',
  '1:00 PM – 2:00 PM',
  '3:00 PM – 4:00 PM',
  '5:00 PM – 6:00 PM',
];

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));

  if (!body.name || !body.address) {
    return NextResponse.json({ error: 'Name and address are required.' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('properties')
    .insert({
      name: body.name,
      address: body.address,
      description: body.description || '',
      price: body.price || 0,
      currency: body.currency === 'EUR' ? 'EUR' : 'USD',
      inspection_fee: body.inspection_fee ?? 25,
      beds: body.beds || 0,
      baths: body.baths || 0,
      sqft: body.sqft || 0,
      amenities: body.amenities || [],
      image_url: body.image_url || null,
      gallery_images: body.gallery_images || [],
      time_slots: body.time_slots?.length ? body.time_slots : DEFAULT_TIME_SLOTS,
      timezone: body.timezone || detectTimezoneFromAddress(body.address),
      status: body.status === 'published' ? 'published' : 'draft',
      verified: body.verified ?? true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ property: data });
}