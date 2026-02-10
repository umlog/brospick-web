-- BROSPICK 주문 관리 테이블
-- Supabase SQL Editor에서

-- 주문 테이블
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  postal_code TEXT NOT NULL,
  address TEXT NOT NULL,
  address_detail TEXT,
  total_amount INTEGER NOT NULL,
  shipping_fee INTEGER NOT NULL DEFAULT 3500,
  status TEXT NOT NULL DEFAULT '입금대기',
  depositor_name TEXT,
  tracking_number TEXT,
  payment_method TEXT NOT NULL DEFAULT '무통장입금',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 주문 상품 테이블
CREATE TABLE order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  size TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price INTEGER NOT NULL
);

-- 인덱스
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- RLS (Row Level Security) 정책
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- anon key 정책 (공개 클라이언트 - 최소 권한)
-- ============================================

-- 주문 생성만 허용 (고객이 주문할 때)
CREATE POLICY "Anon can insert orders" ON orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anon can insert order items" ON order_items
  FOR INSERT WITH CHECK (true);

-- SELECT/UPDATE/DELETE는 anon에게 허용하지 않음
-- 모든 조회/수정/삭제는 service_role key를 사용하는 API Route에서 처리

-- ============================================
-- service_role key는 RLS를 완전히 우회하므로
-- 별도 정책이 필요 없음 (모든 CRUD 가능)
-- ============================================
