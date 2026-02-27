// Daum postcode API 글로벌 타입 선언 (기존 유지)
declare global {
  interface Window {
    daum: any;
  }
}

// 하위 호환성 유지를 위한 re-export facade
// 기존 import 경로 그대로 동작
export type { CheckoutFormData, OrderResponse, ParsedAddress } from '@/lib/domain/types';
