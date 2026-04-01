import { useState, useCallback } from 'react';
import type { BlogPost } from '@/lib/domain/types';
import { apiClient, ApiClientError } from '@/lib/api-client';

export type BlogFormData = Omit<BlogPost, 'id' | 'created_at'>;

export function useBlogPosts() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.blog.list();
      setPosts(data.posts);
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) {
        window.location.href = '/admin/login';
        return;
      }
      alert('블로그 포스트 조회에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  const createPost = async (formData: BlogFormData): Promise<BlogPost | null> => {
    try {
      const result = await apiClient.blog.create(formData);
      setPosts((prev) => [...prev, result.post]);
      return result.post;
    } catch (err) {
      alert(`생성 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
      return null;
    }
  };

  const updatePost = async (id: number, formData: BlogFormData): Promise<BlogPost | null> => {
    try {
      const result = await apiClient.blog.update(id, formData);
      setPosts((prev) => prev.map((p) => (p.id === id ? result.post : p)));
      return result.post;
    } catch (err) {
      alert(`수정 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
      return null;
    }
  };

  const deletePost = async (id: number): Promise<boolean> => {
    if (!confirm('이 블로그 포스트를 삭제할까요? 복구할 수 없습니다.')) return false;
    try {
      await apiClient.blog.delete(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
      return true;
    } catch (err) {
      alert(`삭제 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
      return false;
    }
  };

  return { posts, loading, fetchPosts, createPost, updatePost, deletePost };
}
