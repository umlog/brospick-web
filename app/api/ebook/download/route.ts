import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: '유효하지 않은 링크입니다.' }, { status: 400 });
  }

  // 토큰 조회
  const { data: tokenRow, error: tokenError } = await supabaseAdmin
    .from('ebook_download_tokens')
    .select('id, download_count, max_downloads, expires_at')
    .eq('token', token)
    .single();

  if (tokenError || !tokenRow) {
    return NextResponse.json({ error: '유효하지 않은 링크입니다.' }, { status: 404 });
  }

  // 만료 확인
  if (new Date(tokenRow.expires_at) < new Date()) {
    return NextResponse.json({ error: '다운로드 링크가 만료되었습니다.' }, { status: 410 });
  }

  // 다운로드 횟수 확인
  if (tokenRow.download_count >= tokenRow.max_downloads) {
    return NextResponse.json({ error: '최대 다운로드 횟수를 초과했습니다. 브로스픽에 문의해주세요.' }, { status: 403 });
  }

  // 다운로드 횟수 증가
  await supabaseAdmin
    .from('ebook_download_tokens')
    .update({ download_count: tokenRow.download_count + 1 })
    .eq('id', tokenRow.id);

  // Supabase Storage에서 PDF 다운로드
  const bucket = process.env.EBOOK_PDF_BUCKET ?? 'ebooks';
  const path = process.env.EBOOK_PDF_PATH ?? '';

  if (!path) {
    console.error('[ebook/download] EBOOK_PDF_PATH not set');
    return NextResponse.json({ error: '파일을 찾을 수 없습니다.' }, { status: 500 });
  }

  const { data: fileData, error: fileError } = await supabaseAdmin.storage
    .from(bucket)
    .download(path);

  if (fileError || !fileData) {
    console.error('[ebook/download] Storage error:', fileError);
    return NextResponse.json({ error: '파일을 불러오는 중 오류가 발생했습니다.' }, { status: 500 });
  }

  const arrayBuffer = await fileData.arrayBuffer();
  const filename = path.split('/').pop() ?? 'BROSPICK-Ebook.pdf';

  return new NextResponse(arrayBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      'Content-Length': String(arrayBuffer.byteLength),
      'Cache-Control': 'no-store',
    },
  });
}
