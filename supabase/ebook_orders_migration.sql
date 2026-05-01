-- ============================================================
-- 전자책 주문 + 다운로드 토큰 테이블
-- Supabase > SQL Editor에서 실행
-- ============================================================

-- 1. ebook_orders 테이블
create table if not exists ebook_orders (
  id              serial primary key,
  order_number    text not null unique,
  name            text not null,
  phone           text not null,
  email           text not null,
  amount          integer not null,
  status          text not null default 'pending_payment',
  -- pending_payment  : 입금 대기
  -- payment_confirmed: 입금 확인
  -- download_sent    : 다운로드 링크 발송 완료
  privacy_consent  boolean not null default true,
  contact_consent  boolean not null default true,
  download_sent_at timestamptz,
  created_at       timestamptz not null default now()
);

alter table ebook_orders enable row level security;

create policy "service_role full access on ebook_orders"
  on ebook_orders for all to service_role
  using (true) with check (true);

-- 2. download_tokens 테이블
create table if not exists ebook_download_tokens (
  id            serial primary key,
  token         text not null unique default gen_random_uuid()::text,
  order_id      integer not null references ebook_orders(id) on delete cascade,
  download_count integer not null default 0,
  max_downloads  integer not null default 5,
  expires_at     timestamptz not null default (now() + interval '30 days'),
  created_at     timestamptz not null default now()
);

alter table ebook_download_tokens enable row level security;

create policy "service_role full access on ebook_download_tokens"
  on ebook_download_tokens for all to service_role
  using (true) with check (true);
