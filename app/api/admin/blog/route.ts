import { NextRequest, NextResponse } from 'next/server';
import { apiError, checkAdminSession, withErrorHandler } from '@/lib/errors';
import { supabaseAdmin } from '@/lib/supabase';
import type { BlogPost } from '@/lib/domain/types';

function isAuthorized(request: NextRequest): boolean {
  return checkAdminSession(request.cookies.get('admin_session')?.value);
}

export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    if (!isAuthorized(request)) {
      return apiError('권한이 없습니다.', 401);
    }

    const { data, error } = await supabaseAdmin
      .from('blog_posts')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('[admin/blog] GET error:', error);
      return apiError('블로그 포스트 조회에 실패했습니다.', 500);
    }

    return NextResponse.json({ posts: data as BlogPost[] });
  });
}

export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    if (!isAuthorized(request)) {
      return apiError('권한이 없습니다.', 401);
    }

    const body = await request.json();
    const { player_name, team, position, status, date, image, excerpt, content, highlights, video_url } = body;

    if (!player_name || !team || !position || !status || !date || !image || !excerpt || !content) {
      return apiError('필수 필드가 누락되었습니다.', 400);
    }

    const { data, error } = await supabaseAdmin
      .from('blog_posts')
      .insert({
        player_name,
        team,
        position,
        status,
        date,
        image,
        excerpt,
        content,
        highlights: highlights ?? [],
        video_url: video_url || null,
      })
      .select()
      .single();

    if (error) {
      console.error('[admin/blog] POST error:', error);
      return apiError('블로그 포스트 생성에 실패했습니다.', 500);
    }

    return NextResponse.json({ post: data as BlogPost }, { status: 201 });
  });
}
