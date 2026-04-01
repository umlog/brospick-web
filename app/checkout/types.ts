import type { DaumPostcodeData } from '@/lib/domain/types';

// Daum postcode API 글로벌 타입 선언
declare global {
  interface Window {
    daum: {
      Postcode: new (options: {
        oncomplete: (data: DaumPostcodeData) => void;
        width?: string | number;
        height?: string | number;
      }) => { open: () => void };
    };
  }
}

// 하위 호환성 유지를 위한 re-export facade
// 기존 import 경로 그대로 동작
export type { CheckoutFormData, DaumPostcodeData, OrderResponse, ParsedAddress } from '@/lib/domain/types';
