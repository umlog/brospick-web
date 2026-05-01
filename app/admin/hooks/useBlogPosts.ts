import { useState, useCallback } from 'react';
import type { BlogPost } from '@/lib/domain/types';
import { apiClient, ApiClientError } from '@/lib/api-client';
import { showToast } from '../lib/toast';
import { showConfirm } from '../lib/confirm';

export type BlogFormData = Omit<BlogPost, 'id' | 'created_at'>;

export function useBlogPosts() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.blog.list();
      setPosts(data.posts);
      setHasLoaded(true);
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) {
        window.location.href = '/admin/login';
        return;
      }
      showToast('블로그 포스트 조회에 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const createPost = async (formData: BlogFormData): Promise<BlogPost | null> => {
    try {
      const result = await apiClient.blog.create(formData);
      setPosts((prev) => [...prev, result.post]);
      showToast('포스트가 생성되었습니다.', 'success');
      return result.post;
    } catch (err) {
      showToast(`생성 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`, 'error');
      return null;
    }
  };

  const updatePost = async (id: number, formData: BlogFormData): Promise<BlogPost | null> => {
    try {
      const result = await apiClient.blog.update(id, formData);
      setPosts((prev) => prev.map((p) => (p.id === id ? result.post : p)));
      showToast('포스트가 수정되었습니다.', 'success');
      return result.post;
    } catch (err) {
      showToast(`수정 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`, 'error');
      return null;
    }
  };

  const deletePost = async (id: number): Promise<boolean> => {
    const ok = await showConfirm('이 블로그 포스트를 삭제할까요? 복구할 수 없습니다.');
    if (!ok) return false;
    try {
      await apiClient.blog.delete(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
      showToast('포스트가 삭제되었습니다.', 'success');
      return true;
    } catch (err) {
      showToast(`삭제 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`, 'error');
      return false;
    }
  };

  return { posts, loading, hasLoaded, fetchPosts, createPost, updatePost, deletePost };
}
