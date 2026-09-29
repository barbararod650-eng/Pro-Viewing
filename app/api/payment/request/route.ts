import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, getDefaultPropertyId } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

const VALID_METHODS = ['revolut', 'wero', 'bank_transfer', 'paypal'];

export async function POST(req: NextRequest) {
  try {
    const { email, name, method, propertyId: bodyPropertyId } = await req.json();
    const propertyId = bodyPropertyId || (await getDefaultPropertyId());

    if (!email || !method || !VALID_METHODS.includes(method) || !propertyId) {
      return NextResponse.json({ error: 'Missing or invalid fields.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: property, error: propError } = await supabase
      .from('properties')
      .select('inspection_fee')
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
        user_email: email,
        user_name: name || null,
        amount: property.inspection_fee,
        method,
        property_id: propertyId,
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