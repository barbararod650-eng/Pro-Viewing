import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { notifyAdmin } from '@/lib/notify-admin';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, address, details } = body;

    if (!name || !email || !address) {
      return NextResponse.json(
        { error: 'Name, email, and property address are required.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('landlord_inquiries')
      .insert({
        landlord_name: name,
        landlord_email: email,
        landlord_phone: phone || null,
        property_address: address,
        property_details: details || '',
        status: 'new',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await notifyAdmin({
      subject: 'New landlord inquiry',
      intro: 'A property owner wants to list a property.',
      fields: {
        Name: name,
        Email: email,
        Phone: phone,
        Address: address,
        Details: details,
      },
      action: 'Review the inquiry and mark it contacted, approved or declined (Inquiries tab).',
    });

    return NextResponse.json({ inquiry: data });
  } catch {
    return NextResponse.json({ error: 'Unexpected server error.' }, { status: 500 });
  }
}