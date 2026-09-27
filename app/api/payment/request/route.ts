import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

const VALID_METHODS = ['revolut', 'wero', 'bank_transfer', 'paypal'];

export async function POST(req: NextRequest) {
  try {
    const { email, name, method, amount } = await req.json();

    if (!email || !method || !VALID_METHODS.includes(method) || !amount) {
      return NextResponse.json({ error: 'Missing or invalid fields.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('payment_requests')
      .insert({
        user_email: email,
        user_name: name || null,
        amount,
        method,
        status: 'pending_admin_assignment',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ paymentRequest: data });
  } catch {
    return NextResponse.json({ error: 'Unexpected server error.' }, { status: 500 });
  }
}