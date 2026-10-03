import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

function isAuthorized(req: NextRequest) {
  const provided = req.headers.get('x-admin-password');
  return provided && provided === process.env.ADMIN_PASSWORD;
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const action = body.action as 'assign' | 'confirm' | 'cancel';
  const supabase = getSupabaseAdmin();
  let accessCode = '';
  let bookingId: string | null = null;

  if (action === 'confirm') {
    accessCode = String(body.accessCode || '').trim();
    if (!/^\d{6}$/.test(accessCode)) {
      return NextResponse.json({ error: 'A valid 6-digit access code is required.' }, { status: 400 });
    }
  }

  let update: Record<string, unknown>;

  if (action === 'assign') {
    const accountDetails = (body.accountDetails as string || '').trim();
    if (!accountDetails) {
      return NextResponse.json({ error: 'Account details are required.' }, { status: 400 });
    }
    update = {
      status: 'awaiting_payment',
      account_details: accountDetails,
      assigned_at: new Date().toISOString(),
    };
  } else if (action === 'confirm') {
    update = { status: 'confirmed', confirmed_at: new Date().toISOString() };
  } else if (action === 'cancel') {
    update = { status: 'cancelled' };
  } else {
    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  }

  if (action === 'confirm') {
    const { data: payment, error: paymentLookupError } = await supabase
      .from('payment_requests')
      .select('user_email, property_id')
      .eq('id', params.id)
      .maybeSingle();
    if (paymentLookupError || !payment?.property_id) {
      return NextResponse.json({ error: 'Payment request not found.' }, { status: 404 });
    }

    const { data: booking, error: bookingLookupError } = await supabase
      .from('bookings')
      .select('id')
      .eq('user_email', payment.user_email)
      .eq('property_id', payment.property_id)
      .eq('status', 'active')
      .maybeSingle();
    if (bookingLookupError || !booking) {
      return NextResponse.json({ error: 'No active viewing was found for this property.' }, { status: 409 });
    }
    bookingId = booking.id;
  }

  const { data: paymentRequest, error } = await supabase
    .from('payment_requests')
    .update(update)
    .eq('id', params.id)
    .select('id, user_email, property_id, status')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'Could not update the payment request.' }, { status: 500 });
  }
  if (!paymentRequest) {
    return NextResponse.json({ error: 'Payment request not found.' }, { status: 404 });
  }

  if (action === 'confirm' && bookingId) {
    const { error: bookingError } = await supabase
      .from('bookings')
      .update({ access_code: accessCode })
      .eq('id', bookingId);

    if (bookingError) {
      return NextResponse.json({ error: 'Could not save the access code.' }, { status: 500 });
    }
  }

  return NextResponse.json({ paymentRequest });
}