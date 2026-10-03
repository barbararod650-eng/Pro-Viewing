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
    const accessCode = String(body.accessCode || '').trim();
    if (!/^\d{6}$/.test(accessCode)) {
      return NextResponse.json({ error: 'A valid 6-digit access code is required.' }, { status: 400 });
    }
    update = { status: 'confirmed', confirmed_at: new Date().toISOString() };
  } else if (action === 'cancel') {
    update = { status: 'cancelled' };
  } else {
    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
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

  if (action === 'confirm') {
    const accessCode = String(body.accessCode || '').trim();
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .update({ access_code: accessCode })
      .eq('user_email', paymentRequest.user_email)
      .eq('property_id', paymentRequest.property_id)
      .eq('status', 'active')
      .select('id')
      .maybeSingle();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Payment confirmed, but no active viewing was found for this property.' }, { status: 409 });
    }
  }

  return NextResponse.json({ paymentRequest });
}