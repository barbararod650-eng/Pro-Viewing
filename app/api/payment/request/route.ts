import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, getDefaultPropertyId } from '@/lib/supabase-admin';
import { getAuthedUser } from '@/lib/auth-server';
import { notifyAdmin, paymentMethodLabels } from '@/lib/notify-admin';

export const runtime = 'nodejs';

const VALID_METHODS = ['revolut', 'wero', 'bank_transfer', 'paypal', 'payoneer', 'wise', 'skrill'];

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
    }

    const { method, propertyId: bodyPropertyId } = await req.json();
    const propertyId = bodyPropertyId || (await getDefaultPropertyId());

    if (!method || !VALID_METHODS.includes(method) || !propertyId) {
      return NextResponse.json({ error: 'Missing or invalid fields.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: property, error: propError } = await supabase
      .from('properties')
      .select('name, inspection_fee, currency')
      .eq('id', propertyId)
      .maybeSingle();

    if (propError) {
      return NextResponse.json({ error: propError.message }, { status: 500 });
    }
    if (!property) {
      return NextResponse.json({ error: 'Property not found.' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('payment_requests')
      .insert({
        user_email: user.email,
        user_name: user.name || null,
        amount: property.inspection_fee,
        currency: property.currency || 'USD',
        method,
        property_id: propertyId,
        status: 'pending_admin_assignment',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const methodLabel = paymentMethodLabels[method] ?? method;
    await notifyAdmin({
      subject: `Payment request (${methodLabel})`,
      intro: 'A renter asked for payment instructions.',
      fields: {
        Renter: user.name,
        Email: user.email,
        Property: property.name,
        Method: methodLabel,
        Amount: `${data.amount} ${data.currency}`,
      },
      action: 'Send them your account details (Payments tab, Needs account details).',
    });

    return NextResponse.json({ paymentRequest: data });
  } catch {
    return NextResponse.json({ error: 'Unexpected server error.' }, { status: 500 });
  }
}