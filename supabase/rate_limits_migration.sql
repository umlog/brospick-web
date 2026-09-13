-- 서버리스 인스턴스끼리 공유되는 레이트리밋 카운터 (lib/rate-limit.ts 가 사용)
-- 2026-09-13 원격 DB에 create_rate_limits 마이그레이션으로 적용됨.
-- 인메모리 카운터는 Netlify 함수 인스턴스마다 따로 잡히고 재시작마다 초기화되어 한도가 사실상 무의미했다.
create table public.rate_limits (
  key text primary key,
  count integer not null,
  reset_at timestamptz not null
);

alter table public.rate_limits enable row level security;
revoke all on table public.rate_limits from anon, authenticated;

-- 호출할 때마다 1 올리고, 창 안에서 한도를 넘었으면 true.
-- insert ... on conflict 한 문장이라 동시 요청에서도 카운트가 새지 않는다.
create or replace function public.hit_rate_limit(p_key text, p_max integer, p_window_seconds integer)
returns boolean
language plpgsql
set search_path = ''
as $$
declare
  v_count integer;
begin
  insert into public.rate_limits as rl (key, count, reset_at)
  values (p_key, 1, now() + make_interval(secs => p_window_seconds))
  on conflict (key) do update set
    count = case when rl.reset_at <= now() then 1 else rl.count + 1 end,
    reset_at = case when rl.reset_at <= now() then now() + make_interval(secs => p_window_seconds) else rl.reset_at end
  returning rl.count into v_count;

  -- 만료된 행이 쌓이지 않도록 가끔 쓸어낸다
  if random() < 0.01 then
    delete from public.rate_limits where reset_at < now() - interval '1 hour';
  end if;

  return v_count > p_max;
end;
$$;

revoke execute on function public.hit_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.hit_rate_limit(text, integer, integer) to service_role;
