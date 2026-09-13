import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { clientIp, isRateLimited } from '@/lib/rate-limit';

// fingerprint 는 브라우저가 만들어 보내는 값이라 바꿔가며 누르면 좋아요를 무한히 올릴 수 있다.
// 막을 수는 없으니 IP당 횟수로 부풀리는 속도를 끊는다.
const LIKE_LIMIT = { max: 60, windowMs: 10 * 60 * 1000 };
const MAX_FINGERPRINT_LENGTH = 128;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  if (await isRateLimited(`reviews:like:${clientIp(request)}`, LIKE_LIMIT)) {
    return NextResponse.json({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }, { status: 429 });
  }

  const { reviewId, fingerprint } = await request.json();

  if (!reviewId || !fingerprint) {
    return NextResponse.json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 });
  }
  if (
    typeof reviewId !== 'string' ||
    !UUID_PATTERN.test(reviewId) ||
    typeof fingerprint !== 'string' ||
    fingerprint.length > MAX_FINGERPRINT_LENGTH
  ) {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  }

  const { data: existing } = await supabaseAdmin
    .from('review_likes')
    .select('id')
    .eq('review_id', reviewId)
    .eq('fingerprint', fingerprint)
    .single();

  if (existing) {
    await supabaseAdmin.from('review_likes').delete().eq('id', existing.id);
  } else {
    const { error } = await supabaseAdmin
      .from('review_likes')
      .insert({ review_id: reviewId, fingerprint });
    if (error) {
      return NextResponse.json({ error: '좋아요 처리에 실패했습니다.' }, { status: 500 });
    }
  }

  // review_likes 실수 기준으로 helpful_count 동기화
  const { count } = await supabaseAdmin
    .from('review_likes')
    .select('*', { count: 'exact', head: true })
    .eq('review_id', reviewId);

  const helpful_count = count ?? 0;
  await supabaseAdmin.from('reviews').update({ helpful_count }).eq('id', reviewId);

  return NextResponse.json({ liked: !existing, helpful_count });
}
