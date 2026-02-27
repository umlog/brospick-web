// 하위 호환성 유지를 위한 re-export facade
// 기존 import 경로 (import type { Order } from '../types') 그대로 동작
export type { Order, OrderItem, ReturnRequest, ProductSize, AdminTab } from '@/lib/domain/types';
