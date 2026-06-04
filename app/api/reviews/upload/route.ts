import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { supabaseAdmin } from '@/lib/supabase';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'JPG, PNG, WEBP, HEIC 형식만 업로드 가능합니다.' }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: '파일 크기는 10MB 이하여야 합니다.' }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const inputBuffer = Buffer.from(arrayBuffer);

  // 서버사이드 WebP 변환 (최대 1200px, quality 82)
  const webpBuffer = await sharp(inputBuffer)
    .rotate() // EXIF orientation 자동 보정
    .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;

  const { error } = await supabaseAdmin.storage
    .from('review-images')
    .upload(filename, webpBuffer, { contentType: 'image/webp' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from('review-images')
    .getPublicUrl(filename);

  return NextResponse.json({ url: publicUrl });
}
