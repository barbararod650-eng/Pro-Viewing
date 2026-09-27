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
    update = { status: 'confirmed', confirmed_at: new Date().toISOString() };
  } else if (action === 'cancel') {
    update = { status: 'cancelled' };
  } else {
    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('payment_requests')
    .update(update)
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ paymentRequest: data });
}