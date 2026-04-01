import { NextRequest, NextResponse } from 'next/server';
import { apiError, checkAdminSession, withErrorHandler } from '@/lib/errors';
import { supabaseAdmin } from '@/lib/supabase';
import type { BlogPost } from '@/lib/domain/types';

function isAuthorized(request: NextRequest): boolean {
  return checkAdminSession(request.cookies.get('admin_session')?.value);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandler(async () => {
    if (!isAuthorized(request)) {
      return apiError('권한이 없습니다.', 401);
    }

    const id = parseInt(params.id, 10);
    if (isNaN(id)) return apiError('잘못된 ID입니다.', 400);

    const body = await request.json();
    const { player_name, team, position, status, date, image, excerpt, content, highlights, video_url } = body;

    if (!player_name || !team || !position || !status || !date || !image || !excerpt || !content) {
      return apiError('필수 필드가 누락되었습니다.', 400);
    }

    const { data, error } = await supabaseAdmin
      .from('blog_posts')
      .update({
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
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[admin/blog] PUT error:', error);
      return apiError('블로그 포스트 수정에 실패했습니다.', 500);
    }

    return NextResponse.json({ post: data as BlogPost });
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandler(async () => {
    if (!isAuthorized(request)) {
      return apiError('권한이 없습니다.', 401);
    }

    const id = parseInt(params.id, 10);
    if (isNaN(id)) return apiError('잘못된 ID입니다.', 400);

    const { error } = await supabaseAdmin
      .from('blog_posts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[admin/blog] DELETE error:', error);
      return apiError('블로그 포스트 삭제에 실패했습니다.', 500);
    }

    return NextResponse.json({ success: true });
  });
}
