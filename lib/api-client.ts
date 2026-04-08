// =============================================================================
// 클라이언트 사이드 API 클라이언트
// 쿠키 기반 인증 - x-admin-password 헤더 불필요
// =============================================================================

import type { Order, ReturnRequest, ProductSize, OrderResponse, BlogPost, AdminProduct } from '@/lib/domain/types';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
}

// API 오류 클래스 - status 코드를 포함하므로 hook에서 401 감지 가능
export class ApiClientError extends Error {
  constructor(
    public readonly message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

async function request<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const response = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let errorMessage = `서버 오류 (${response.status})`;
    try {
      const data = await response.json();
      errorMessage = data.error || errorMessage;
    } catch {
      // JSON 파싱 실패 시 기본 메시지 사용
    }
    throw new ApiClientError(errorMessage, response.status);
  }

  return response.json() as Promise<T>;
}

// -----------------------------------------------------------------------------
// 타입된 API 클라이언트 네임스페이스
// -----------------------------------------------------------------------------

export const apiClient = {
  orders: {
    list: (params?: { status?: string }) => {
      const qs = params?.status ? `?status=${encodeURIComponent(params.status)}` : '';
      return request<{ orders: Order[] }>(`/api/orders${qs}`);
    },

    create: (payload: unknown) =>
      request<OrderResponse>('/api/orders', {
        method: 'POST',
        body: payload,
      }),

    updateStatus: (
      id: string,
      body: { status: string; sendNotification?: boolean; trackingNumber?: string }
    ) =>
      request<{ order: Order }>(`/api/orders/${id}`, {
        method: 'PATCH',
        body,
      }),

    delete: (id: string) =>
      request<{ success: true }>(`/api/orders/${id}`, {
        method: 'DELETE',
      }),

    sendPaymentReminder: (id: string) =>
      request<{ success: true }>(`/api/orders/${id}`, {
        method: 'POST',
      }),

    revokeMarketing: (id: string) =>
      request<{ success: true }>(`/api/orders/${id}/marketing-consent`, {
        method: 'DELETE',
      }),
  },

  returns: {
    list: (params?: { status?: string }) => {
      const qs = params?.status ? `?status=${encodeURIComponent(params.status)}` : '';
      return request<{ requests: ReturnRequest[] }>(`/api/returns${qs}`);
    },

    create: (payload: unknown) =>
      request<{ requestNumber: string; status: string }>('/api/returns', {
        method: 'POST',
        body: payload,
      }),

    updateStatus: (
      id: string,
      body: {
        status: string;
        rejectReason?: string;
        returnTrackingNumber?: string;
        refundCompleted?: boolean;
        sendNotification?: boolean;
      }
    ) =>
      request<{ request: ReturnRequest }>(`/api/returns/${id}`, {
        method: 'PATCH',
        body,
      }),

    delete: (id: string) =>
      request<{ success: true }>(`/api/returns/${id}`, {
        method: 'DELETE',
      }),
  },

  productSizes: {
    list: () =>
      request<{ sizes: ProductSize[] }>('/api/products/sizes'),

    update: (
      body: { productId: number; size: string; status?: string; stock?: number; delay_text?: string | null }
    ) =>
      request<{ success: true; size: ProductSize }>('/api/products/sizes', {
        method: 'PATCH',
        body,
      }),
  },

  products: {
    list: () =>
      request<{ products: AdminProduct[] }>('/api/admin/products'),

    update: (
      id: number,
      body: { name?: string; price?: number; original_price?: number | null; coming_soon?: boolean }
    ) =>
      request<{ product: AdminProduct }>('/api/admin/products', {
        method: 'PATCH',
        body: { id, ...body },
      }),
  },

  blog: {
    list: () =>
      request<{ posts: BlogPost[] }>('/api/admin/blog'),

    create: (body: Omit<BlogPost, 'id' | 'created_at'>) =>
      request<{ post: BlogPost }>('/api/admin/blog', { method: 'POST', body }),

    update: (id: number, body: Omit<BlogPost, 'id' | 'created_at'>) =>
      request<{ post: BlogPost }>(`/api/admin/blog/${id}`, { method: 'PUT', body }),

    delete: (id: number) =>
      request<{ success: true }>(`/api/admin/blog/${id}`, { method: 'DELETE' }),
  },
};