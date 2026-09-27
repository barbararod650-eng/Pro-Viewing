import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

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
    .from('verifications')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const withUrls = await Promise.all(
    (data || []).map(async (row) => {
      const [idSigned, selfieSigned] = await Promise.all([
        supabase.storage
          .from('verification-documents')
          .createSignedUrl(row.id_document_path, 600),
        supabase.storage
          .from('verification-documents')
          .createSignedUrl(row.selfie_path, 600),
      ]);
      return {
        ...row,
        id_document_url: idSigned.data?.signedUrl || null,
        selfie_url: selfieSigned.data?.signedUrl || null,
      };
    })
  );

  return NextResponse.json({ verifications: withUrls });
}