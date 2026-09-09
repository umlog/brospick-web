'use client';

import { useAdminResource } from './useAdminResource';

export interface InstagramPost {
  id: number;
  post_url: string;
  image_url: string;
  caption: string | null;
  is_video: boolean;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export function useInstagramPosts() {
  const r = useAdminResource<InstagramPost>({
    endpoint: '/api/admin/instagram',
    label: '인스타 게시물',
    appendOnCreate: true,
  });
  return {
    posts: r.items,
    loading: r.loading,
    hasLoaded: r.hasLoaded,
    fetchPosts: r.fetchList,
    createPost: r.create,
    updatePost: r.update,
    deletePost: r.remove,
  };
}
