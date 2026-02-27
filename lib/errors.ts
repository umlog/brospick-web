// =============================================================================
// API 에러 핸들링 유틸리티 - 모든 API 라우트에서 공유
// =============================================================================

import { NextResponse } from 'next/server';

// 에러 코드 상수
export const ErrorCode = {
  VALIDATION: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  CONFLICT: 'CONFLICT',
  INTERNAL: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

// HTTP 상태 코드 → 기본 에러 코드 매핑
const DEFAULT_ERROR_CODES: Record<number, ErrorCode> = {
  400: ErrorCode.VALIDATION,
  401: ErrorCode.UNAUTHORIZED,
  404: ErrorCode.NOT_FOUND,
  409: ErrorCode.CONFLICT,
  500: ErrorCode.INTERNAL,
};

// 표준 에러 응답 생성
export function apiError(
  message: string,
  status: 400 | 401 | 404 | 409 | 500,
  code?: ErrorCode
): NextResponse {
  return NextResponse.json(
    { error: message, code: code ?? DEFAULT_ERROR_CODES[status] },
    { status }
  );
}

// 표준 성공 응답 생성 (데이터가 없을 때 사용)
export function apiSuccess(data?: Record<string, unknown>, status = 200): NextResponse {
  return NextResponse.json(data ?? { success: true }, { status });
}

// 어드민 비밀번호 검증 헬퍼 - 중복 제거
export function checkAdminPassword(headerPassword: string | null): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;
  return headerPassword === adminPassword;
}

// 라우트 에러 경계 래퍼 - unhandled exception 처리
export async function withErrorHandler(
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    return await handler();
  } catch (err: unknown) {
    console.error('Unhandled route error:', err);
    return apiError('서버 오류가 발생했습니다.', 500);
  }
}
