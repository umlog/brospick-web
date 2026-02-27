// =============================================================================
// 클라이언트 사이드 API 클라이언트
// 모든 hook에서 반복되는 fetch() + x-admin-password 헤더 패턴을 추상화
// =============================================================================

import type { Order, ReturnRequest, ProductSize, OrderResponse } from '@/lib/domain/types';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  adminPassword?: string;
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
  const { method = 'GET', adminPassword, body } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (adminPassword) headers['x-admin-password'] = adminPassword;

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
    list: (password: string, params?: { status?: string }) => {
      const qs = params?.status ? `?status=${encodeURIComponent(params.status)}` : '';
      return request<{ orders: Order[] }>(`/api/orders${qs}`, {
        adminPassword: password,
      });
    },

    create: (payload: unknown) =>
      request<OrderResponse>('/api/orders', {
        method: 'POST',
        body: payload,
      }),

    updateStatus: (
      id: string,
      password: string,
      body: { status: string; sendNotification?: boolean; trackingNumber?: string }
    ) =>
      request<{ order: Order }>(`/api/orders/${id}`, {
        method: 'PATCH',
        adminPassword: password,
        body,
      }),

    delete: (id: string, password: string) =>
      request<{ success: true }>(`/api/orders/${id}`, {
        method: 'DELETE',
        adminPassword: password,
      }),

    sendPaymentReminder: (id: string, password: string) =>
      request<{ success: true }>(`/api/orders/${id}`, {
        method: 'POST',
        adminPassword: password,
      }),
  },

  returns: {
    list: (password: string, params?: { status?: string }) => {
      const qs = params?.status ? `?status=${encodeURIComponent(params.status)}` : '';
      return request<{ requests: ReturnRequest[] }>(`/api/returns${qs}`, {
        adminPassword: password,
      });
    },

    create: (payload: unknown) =>
      request<{ requestNumber: string; status: string }>('/api/returns', {
        method: 'POST',
        body: payload,
      }),

    updateStatus: (
      id: string,
      password: string,
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
        adminPassword: password,
        body,
      }),

    delete: (id: string, password: string) =>
      request<{ success: true }>(`/api/returns/${id}`, {
        method: 'DELETE',
        adminPassword: password,
      }),
  },

  productSizes: {
    list: () =>
      request<{ sizes: ProductSize[] }>('/api/products/sizes'),

    update: (
      password: string,
      body: { productId: number; size: string; status?: string; stock?: number }
    ) =>
      request<{ success: true; size: ProductSize }>('/api/products/sizes', {
        method: 'PATCH',
        adminPassword: password,
        body,
      }),
  },
};
