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
  shipping_fee INTEGER NOT NULL DEFAULT 3000,
  status TEXT NOT NULL DEFAULT '입금대기',
  depositor_name TEXT,
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

-- 누구나 주문 생성 가능 (anon key로)
CREATE POLICY "Anyone can insert orders" ON orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can insert order items" ON order_items
  FOR INSERT WITH CHECK (true);

-- 주문번호로 조회 가능 (주문 확인용)
CREATE POLICY "Anyone can read orders by order_number" ON orders
  FOR SELECT USING (true);

CREATE POLICY "Anyone can read order items" ON order_items
  FOR SELECT USING (true);

-- 업데이트는 모든 사용자 허용 (관리자 페이지용 - 추후 인증 추가 가능)
CREATE POLICY "Anyone can update orders" ON orders
  FOR UPDATE USING (true);
