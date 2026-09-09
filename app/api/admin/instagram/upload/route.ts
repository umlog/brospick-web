import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdminAuthorized, apiError } from '@/lib/errors';

// 인스타 큐레이션 썸네일 업로드 전용 라우트.
// site-images 공개 버킷에 올리고 공개 URL을 돌려준다.
// image-loader.js가 외부 https URL은 변환 없이 통과시키므로 gen-opt/재배포가 필요 없다.

const BUCKET = 'site-images';
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(request: NextRequest) {
  if (!isAdminAuthorized(request)) return apiError('권한이 없습니다.', 401);

  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) return apiError('파일이 없습니다.', 400);
  if (!ALLOWED_TYPES.includes(file.type)) {
    return apiError('JPG, PNG, WEBP 이미지만 올릴 수 있습니다.', 400);
  }
  if (file.size > MAX_BYTES) return apiError('이미지 용량은 5MB까지입니다.', 400);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const extension = file.type.split('/')[1].replace('jpeg', 'jpg');
  const path = `instagram/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, cacheControl: '31536000' });

  if (error) {
    console.error('[admin/instagram/upload] storage error:', error.message);
    return apiError('이미지 업로드에 실패했습니다.', 500);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
