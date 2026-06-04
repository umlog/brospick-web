import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const { reviewId, fingerprint } = await request.json();

  if (!reviewId || !fingerprint) {
    return NextResponse.json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 });
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
