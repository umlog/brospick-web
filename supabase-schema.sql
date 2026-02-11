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

-- ============================================
-- 교환/반품 관리
-- ============================================

-- 배송완료 시점 기록 (교환/반품 7일 이내 신청 판단용)
ALTER TABLE orders ADD COLUMN delivered_at TIMESTAMPTZ;

-- 교환/반품 요청 테이블
CREATE TABLE return_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  request_number TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('교환', '반품')),
  reason TEXT NOT NULL,
  exchange_size TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT '접수완료'
    CHECK (status IN ('접수완료', '승인', '수거중', '수거완료', '처리완료', '거절')),
  reject_reason TEXT,
  refund_amount INTEGER,
  refund_bank TEXT,
  refund_account TEXT,
  refund_holder TEXT,
  refund_completed BOOLEAN DEFAULT FALSE,
  return_tracking_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_return_requests_order_id ON return_requests(order_id);
CREATE INDEX idx_return_requests_status ON return_requests(status);
CREATE INDEX idx_return_requests_request_number ON return_requests(request_number);

ALTER TABLE return_requests ENABLE ROW LEVEL SECURITY;

-- return_requests는 anon key에 대한 정책 없음 (의도적)
-- 모든 CRUD는 API Route에서 service_role key(supabaseAdmin)를 통해 처리
