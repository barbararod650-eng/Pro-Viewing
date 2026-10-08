import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { notifyAdmin } from '@/lib/notify-admin';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const email = (formData.get('email') as string) || '';
    const name = (formData.get('name') as string) || '';
    const idFile = formData.get('idFile') as File | null;
    const selfieFile = formData.get('selfieFile') as File | null;

    if (!email || !idFile || !selfieFile) {
      return NextResponse.json(
        { error: 'Missing email, ID document, or selfie.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const timestamp = Date.now();
    const safeEmail = email.replace(/[^a-zA-Z0-9]/g, '_');

    const idExt = idFile.name.split('.').pop() || 'jpg';
    const idPath = `${safeEmail}/${timestamp}-id.${idExt}`;
    const idBuffer = Buffer.from(await idFile.arrayBuffer());

    const selfieExt = selfieFile.name.split('.').pop() || 'jpg';
    const selfiePath = `${safeEmail}/${timestamp}-selfie.${selfieExt}`;
    const selfieBuffer = Buffer.from(await selfieFile.arrayBuffer());

    const { error: idUploadError } = await supabase.storage
      .from('verification-documents')
      .upload(idPath, idBuffer, { contentType: idFile.type, upsert: false });

    if (idUploadError) {
      return NextResponse.json({ error: idUploadError.message }, { status: 500 });
    }

    const { error: selfieUploadError } = await supabase.storage
      .from('verification-documents')
      .upload(selfiePath, selfieBuffer, { contentType: selfieFile.type, upsert: false });

    if (selfieUploadError) {
      return NextResponse.json({ error: selfieUploadError.message }, { status: 500 });
    }

    const { data, error: insertError } = await supabase
      .from('verifications')
      .insert({
        user_email: email,
        user_name: name,
        id_document_path: idPath,
        selfie_path: selfiePath,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    await notifyAdmin({
      subject: 'New ID verification to review',
      intro: 'A renter submitted their ID and selfie for verification.',
      fields: { Name: name, Email: email },
      action: 'Review the documents and approve or reject them (Verifications tab).',
    });

    return NextResponse.json({ verification: data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Unexpected server error.' }, { status: 500 });
  }
}