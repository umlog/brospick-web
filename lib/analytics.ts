// GA4(gtag) + Meta Pixel(fbq) 전환 이벤트 헬퍼
// 스크립트 주입은 app/components/Analytics.tsx 담당 — 여기서는 이벤트 전송만.
// 두 도구가 모두 미설치(env 미설정)여도 안전하게 no-op.

const CURRENCY = 'KRW';

type AnalyticsFn = (...args: unknown[]) => void;

declare global {
  interface Window {
    gtag?: AnalyticsFn;
    fbq?: AnalyticsFn;
  }
}

/** 자체 수집 (어드민 대시보드용) — GA4/픽셀 설치 여부와 무관하게 항상 전송, 실패 무시 */
export function trackInternal(type: 'visit' | 'view_item' | 'add_to_cart' | 'begin_checkout', source?: string) {
  if (typeof window === 'undefined') return;
  fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, source, path: window.location.pathname }),
    keepalive: true,
  }).catch(() => {});
}

/** 유입 소스 판별 — utm_source 우선, 없으면 referrer 도메인 분류 */
export function detectTrafficSource(): string {
  const utmSource = new URLSearchParams(window.location.search).get('utm_source');
  if (utmSource) return utmSource.toLowerCase().slice(0, 50);

  const referrer = document.referrer;
  if (!referrer) return 'direct';
  try {
    const host = new URL(referrer).hostname;
    if (host === window.location.hostname) return 'direct';
    if (host.includes('instagram')) return 'instagram';
    if (host.includes('threads')) return 'threads';
    if (host.includes('naver')) return 'naver';
    if (host.includes('google')) return 'google';
    if (host.includes('youtube')) return 'youtube';
    if (host.includes('kakao')) return 'kakao';
    if (host.includes('facebook') || host.includes('fb.com')) return 'facebook';
    return host.slice(0, 50); // 기타는 도메인 그대로
  } catch {
    return 'direct';
  }
}

/** 상품 상세 조회 */
export function trackViewContent(productId: number, productName: string, price?: number) {
  if (typeof window === 'undefined') return;
  window.fbq?.('track', 'ViewContent', {
    content_ids: [String(productId)],
    content_name: productName,
    content_type: 'product',
    ...(price !== undefined && { value: price, currency: CURRENCY }),
  });
  window.gtag?.('event', 'view_item', {
    currency: CURRENCY,
    ...(price !== undefined && { value: price }),
    items: [{ item_id: String(productId), item_name: productName }],
  });
  trackInternal('view_item');
}

/** 장바구니 담기 — value는 담은 항목 합계 금액 */
export function trackAddToCart(productId: number, productName: string, value: number, quantity: number) {
  if (typeof window === 'undefined') return;
  window.fbq?.('track', 'AddToCart', {
    content_ids: [String(productId)],
    content_name: productName,
    content_type: 'product',
    value,
    currency: CURRENCY,
  });
  window.gtag?.('event', 'add_to_cart', {
    currency: CURRENCY,
    value,
    items: [{ item_id: String(productId), item_name: productName, quantity }],
  });
  trackInternal('add_to_cart');
}

/** 결제 페이지 진입 */
export function trackInitiateCheckout(value: number, numItems: number) {
  if (typeof window === 'undefined') return;
  window.fbq?.('track', 'InitiateCheckout', { value, currency: CURRENCY, num_items: numItems });
  window.gtag?.('event', 'begin_checkout', { currency: CURRENCY, value });
  trackInternal('begin_checkout');
}

/** 주문 완료 — order-complete 페이지에서 주문번호당 1회만 호출할 것 */
export function trackPurchase(orderNumber: string, value: number) {
  if (typeof window === 'undefined') return;
  window.fbq?.('track', 'Purchase', { value, currency: CURRENCY, content_type: 'product' });
  window.gtag?.('event', 'purchase', { transaction_id: orderNumber, currency: CURRENCY, value });
}
