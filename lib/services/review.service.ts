import { supabase, supabaseAdmin } from '@/lib/supabase';
import { maskOrderNumber } from '@/lib/utils/order-number';
import { maskPersonName } from '@/lib/utils/mask-name';

export interface SubmitReviewPayload {
  name: string;
  phone: string;
  orderItemId: string;
  rating: number;
  content: string;
  images?: string[];
  height?: number | null;
  usual_size?: string | null;
}

export interface Review {
  id: string;
  rating: number;
  content: string;
  reviewer_name: string;
  created_at: string;
  images: string[];
  height?: number | null;
  usual_size?: string | null;
  helpful_count: number;
}

export interface ReviewableItem {
  id: string;
  productId: number;
  productName: string;
  size: string;
  quantity: number;
  reviewed: boolean;
  existingReview: { rating: number; content: string; images: string[] } | null;
}

/** 화면에서 "어느 주문인지" 고르는 단위. 진짜 주문번호는 담기지 않는다. */
export interface ReviewableOrder {
  /** 주문 UUID — 목록에서 주문을 구분하는 키로만 쓴다 */
  id: string;
  /** 가려진 주문번호 (예: BP-20250209-****) */
  orderNumberMasked: string;
  orderedAt: string;
  items: ReviewableItem[];
}

interface OrderItemRow {
  id: string;
  product_id: number | null;
  product_name: string;
  size: string;
  quantity: number;
}

interface OrderWithItems {
  id: string;
  order_number: string;
  created_at: string;
  customer_name: string;
  order_items: OrderItemRow[] | null;
}

/**
 * 이름 대조용 정규화. 공백을 모두 지우고 대소문자를 맞춘다 —
 * "홍 길동"과 "홍길동"을 다른 사람으로 보면 정작 본인이 못 들어온다.
 */
function normalizeName(name: string): string {
  return name.replace(/\s+/g, '').toLowerCase();
}

// DB에 01012345678 / 010-1234-5678 / +821012345678 세 형식이 섞여 있어 모두로 매칭한다
export function phoneVariants(phone: string): string[] {
  let digits = phone.replace(/\D/g, '');
  // +82 10 ... 로 저장된 번호를 국내 형식으로 되돌린다
  if (digits.startsWith('82') && digits.length >= 11) digits = `0${digits.slice(2)}`;
  if (!digits) return [];

  const variants = [digits];

  if (digits.length === 11) {
    variants.push(`${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`);
  } else if (digits.length === 10) {
    variants.push(`${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`);
  }

  if (digits.startsWith('0')) variants.push(`+82${digits.slice(1)}`);

  return Array.from(new Set(variants));
}

const MAX_REVIEW_IMAGES = 5;
const MAX_CONTENT_LENGTH = 2000;
const MIN_HEIGHT_CM = 100;
const MAX_HEIGHT_CM = 250;
const MAX_USUAL_SIZE_LENGTH = 10;

// 리뷰 사진은 우리 업로드 API(/api/reviews/upload)가 만든 공개 URL만 받는다.
// 검사하지 않으면 외부 추적 이미지나 엉뚱한 주소를 리뷰에 박아 공개 페이지에 띄울 수 있다.
// 업로드 API와 같은 getPublicUrl 로 접두사를 만들어야 주소 형식이 어긋나지 않는다.
const REVIEW_IMAGE_URL_PREFIX = supabaseAdmin.storage.from('review-images').getPublicUrl('').data.publicUrl;

interface ReviewFields {
  rating: unknown;
  content: unknown;
  images?: unknown;
  height?: unknown;
  usual_size?: unknown;
}

function badRequest(message: string): Error {
  return Object.assign(new Error(message), { status: 400 });
}

/** 작성·수정 공통 입력 검증. 클라이언트가 보낸 값을 그대로 믿지 않는다. */
function assertValidReviewFields({ rating, content, images, height, usual_size }: ReviewFields) {
  if (typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw badRequest('별점은 1~5 사이여야 합니다.');
  }
  if (typeof content !== 'string' || !content.trim()) {
    throw badRequest('리뷰 내용을 입력해주세요.');
  }
  if (content.length > MAX_CONTENT_LENGTH) {
    throw badRequest(`리뷰는 ${MAX_CONTENT_LENGTH}자 이내로 작성해주세요.`);
  }
  if (images !== undefined) {
    if (!Array.isArray(images) || images.length > MAX_REVIEW_IMAGES) {
      throw badRequest(`사진은 최대 ${MAX_REVIEW_IMAGES}장까지 첨부할 수 있습니다.`);
    }
    if (!images.every((url) => typeof url === 'string' && url.startsWith(REVIEW_IMAGE_URL_PREFIX))) {
      throw badRequest('올바르지 않은 사진이 포함되어 있습니다.');
    }
  }
  if (height != null) {
    if (typeof height !== 'number' || !Number.isInteger(height) || height < MIN_HEIGHT_CM || height > MAX_HEIGHT_CM) {
      throw badRequest(`키는 ${MIN_HEIGHT_CM}~${MAX_HEIGHT_CM}cm 사이로 입력해주세요.`);
    }
  }
  if (usual_size != null && (typeof usual_size !== 'string' || usual_size.length > MAX_USUAL_SIZE_LENGTH)) {
    throw badRequest('평소 사이즈는 10자 이내로 입력해주세요.');
  }
}

export class ReviewService {
  // 리뷰 제출 (이름+전화번호로 주문 소유권 확인)
  async submitReview(payload: SubmitReviewPayload) {
    const { name, phone, orderItemId, rating, content, images = [], height, usual_size } = payload;

    if (!name?.trim() || !phone || !orderItemId || !rating || !content?.trim()) {
      throw Object.assign(new Error('필수 정보가 누락되었습니다.'), { status: 400 });
    }
    assertValidReviewFields({ rating, content, images, height, usual_size });

    // 상품이 속한 주문을 먼저 찾는다. 주문번호는 화면으로 내보내지 않으므로
    // 여기서도 받지 않고, 상품 id 에서 거꾸로 주문을 짚는다.
    const { data: orderItem, error: itemError } = await supabaseAdmin
      .from('order_items')
      .select('id, product_id, order_id')
      .eq('id', orderItemId)
      .single();

    if (itemError || !orderItem) {
      throw Object.assign(new Error('주문 상품을 찾을 수 없습니다.'), { status: 404 });
    }

    // 그 주문이 정말 이 사람 것인지 이름·전화번호로 대조한다
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, customer_name')
      .eq('id', orderItem.order_id)
      .in('customer_phone', phoneVariants(phone))
      .is('deleted_at', null)
      .single();

    if (
      orderError ||
      !order ||
      normalizeName(order.customer_name ?? '') !== normalizeName(name)
    ) {
      throw Object.assign(
        new Error('주문을 확인할 수 없습니다. 이름과 전화번호를 다시 확인해주세요.'),
        { status: 404 }
      );
    }

    if (!orderItem.product_id) {
      throw Object.assign(new Error('이 상품은 리뷰를 작성할 수 없습니다.'), { status: 400 });
    }

    // 중복 리뷰 확인
    const { data: existing } = await supabaseAdmin
      .from('reviews')
      .select('id')
      .eq('order_item_id', orderItemId)
      .single();

    if (existing) {
      throw Object.assign(new Error('이미 리뷰를 작성한 상품입니다.'), { status: 409 });
    }

    const { data: review, error: insertError } = await supabaseAdmin
      .from('reviews')
      .insert({
        order_item_id: orderItemId,
        product_id: orderItem.product_id,
        rating,
        content: content.trim(),
        reviewer_name: order.customer_name,
        images,
        ...(height != null ? { height } : {}),
        ...(usual_size ? { usual_size } : {}),
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`리뷰 등록에 실패했습니다: ${insertError.message}`);
    }

    return { reviewId: review.id };
  }

  /**
   * 이름+전화번호로 리뷰 작성 가능한 주문 목록 조회 (최신 주문이 앞).
   *
   * 전화번호만으로 열어주면 번호를 기계적으로 돌려 이름과 구매내역을 긁어갈 수 있다.
   * 이름 대조는 반드시 여기(서버)에서 한다 — 화면에서 거르는 것은 방어가 아니다.
   */
  async getReviewableOrders(name: string, phone: string): Promise<{
    customerName: string;
    orders: ReviewableOrder[];
  }> {
    if (!name?.trim()) {
      throw Object.assign(new Error('이름을 입력해주세요.'), { status: 400 });
    }
    if (!phone?.trim()) {
      throw Object.assign(new Error('전화번호를 입력해주세요.'), { status: 400 });
    }

    const variants = phoneVariants(phone);
    if (!variants.length) {
      throw Object.assign(new Error('전화번호 형식이 올바르지 않습니다.'), { status: 400 });
    }

    const { data: rows, error } = await supabaseAdmin
      .from('orders')
      .select('id, order_number, created_at, customer_name, order_items(id, product_id, product_name, size, quantity)')
      .in('customer_phone', variants)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    // 조회 자체가 실패한 것과 "주문이 없다"를 같은 404로 뭉개면 원인을 못 찾는다
    if (error) {
      console.error('[review] 주문 조회 실패:', error.message);
      throw new Error('주문 조회에 실패했습니다.');
    }

    const target = normalizeName(name);
    const orders = ((rows ?? []) as OrderWithItems[]).filter(
      (order) => normalizeName(order.customer_name ?? '') === target
    );

    // 번호는 맞는데 이름이 틀린 경우와 주문이 아예 없는 경우를 같은 문구로 돌려준다.
    // 문구가 갈리면 "이 번호는 존재한다"는 사실이 새어 나간다.
    if (!orders.length) {
      throw Object.assign(
        new Error('일치하는 주문이 없습니다. 이름과 전화번호를 다시 확인해주세요.'),
        { status: 404 }
      );
    }

    // 주문은 찾았지만 리뷰를 쓸 수 있는 상품이 하나도 없을 수 있다
    // (단종·삭제되어 product_id 가 끊긴 상품만 담긴 주문). 빈 목록을 그냥 돌려주면
    // 화면에 "주문 0건"만 뜨고 아무것도 못 하게 된다.
    const reviewableOrders = await this._buildReviewableOrders(orders);
    if (!reviewableOrders.length) {
      throw Object.assign(
        new Error('리뷰를 작성할 수 있는 상품이 없습니다.'),
        { status: 404 }
      );
    }

    return {
      customerName: orders[0].customer_name,
      orders: reviewableOrders,
    };
  }

  // 주문별로 리뷰 작성 가능한 상품을 묶는다. 상품이 하나도 없는 주문은 뺀다.
  private async _buildReviewableOrders(orders: OrderWithItems[]): Promise<ReviewableOrder[]> {
    const allItemIds = orders.flatMap((order) =>
      (Array.isArray(order.order_items) ? order.order_items : [])
        .filter((i) => i.product_id)
        .map((i) => i.id)
    );

    if (!allItemIds.length) return [];

    const { data: existingReviews } = await supabaseAdmin
      .from('reviews')
      .select('order_item_id, rating, content, images')
      .in('order_item_id', allItemIds);

    const reviewedMap = new Map(
      (existingReviews ?? []).map((r: { order_item_id: string; rating: number; content: string; images: string[] }) => [
        r.order_item_id,
        { rating: r.rating, content: r.content, images: r.images ?? [] },
      ])
    );

    return orders
      .map((order) => ({
        id: order.id,
        orderNumberMasked: maskOrderNumber(order.order_number),
        orderedAt: order.created_at,
        items: (Array.isArray(order.order_items) ? order.order_items : [])
          .filter((i) => i.product_id)
          .map((i) => ({
            id: i.id,
            productId: i.product_id as number,
            productName: i.product_name,
            size: i.size,
            quantity: i.quantity,
            reviewed: reviewedMap.has(i.id),
            existingReview: reviewedMap.get(i.id) ?? null,
          })),
      }))
      .filter((order) => order.items.length > 0);
  }

  /**
   * 이름+전화번호로 내 리뷰 조회 (개인정보 보유기간 5년 적용).
   *
   * 리뷰 작성 조회와 같은 이유로 이름까지 대조한다. 전화번호만 받으면 번호를 돌려
   * 남의 구매 상품·사이즈·키를 볼 수 있다.
   */
  async getMyReviews(name: string, phone: string) {
    if (!name?.trim()) {
      throw Object.assign(new Error('이름을 입력해주세요.'), { status: 400 });
    }
    if (!phone?.trim()) {
      throw Object.assign(new Error('전화번호를 입력해주세요.'), { status: 400 });
    }

    const { data: rows, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('id, customer_name')
      .in('customer_phone', phoneVariants(phone))
      .is('deleted_at', null);

    if (ordersError) {
      console.error('[review] 내 리뷰 주문 조회 실패:', ordersError.message);
      throw new Error('리뷰 조회에 실패했습니다.');
    }

    const target = normalizeName(name);
    const orders = ((rows ?? []) as { id: string; customer_name: string | null }[]).filter(
      (order) => normalizeName(order.customer_name ?? '') === target
    );

    // 번호·이름이 틀린 경우와 리뷰가 없는 경우를 구분하지 않는다 — 번호 존재 여부가 새지 않게
    if (!orders.length) return { reviews: [] };

    const orderIds = orders.map((o) => o.id);

    const { data: items } = await supabaseAdmin
      .from('order_items')
      .select('id, product_name, size')
      .in('order_id', orderIds);

    if (!items?.length) return { reviews: [] };

    const itemMap = new Map(
      (items as { id: string; product_name: string; size: string }[]).map((i) => [
        i.id,
        { productName: i.product_name, size: i.size },
      ])
    );

    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);

    const { data, error } = await supabaseAdmin
      .from('reviews')
      .select('id, rating, content, images, height, usual_size, created_at, order_item_id')
      .in('order_item_id', Array.from(itemMap.keys()))
      .gte('created_at', fiveYearsAgo.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return {
      reviews: (data ?? []).map(
        (r: { id: string; rating: number; content: string; images: string[]; height: number | null; usual_size: string | null; created_at: string; order_item_id: string }) => ({
          id: r.id,
          rating: r.rating,
          content: r.content,
          images: r.images ?? [],
          height: r.height ?? null,
          usual_size: r.usual_size ?? null,
          created_at: r.created_at,
          productName: itemMap.get(r.order_item_id)?.productName ?? '',
          size: itemMap.get(r.order_item_id)?.size ?? '',
        })
      ),
    };
  }

  // 리뷰 수정 (이름+전화번호 소유권 확인)
  async updateReview(
    name: string,
    phone: string,
    reviewId: string,
    updates: { rating: number; content: string; images?: string[]; height?: number | null; usual_size?: string | null }
  ) {
    assertValidReviewFields(updates);
    await this._assertOwnership(name, phone, reviewId);

    const { error } = await supabaseAdmin
      .from('reviews')
      .update({
        rating: updates.rating,
        content: updates.content.trim(),
        ...(updates.images !== undefined ? { images: updates.images } : {}),
        ...(updates.height !== undefined ? { height: updates.height } : {}),
        ...(updates.usual_size !== undefined ? { usual_size: updates.usual_size } : {}),
      })
      .eq('id', reviewId);

    if (error) throw new Error(error.message);
  }

  // 리뷰 삭제 (이름+전화번호 소유권 확인)
  async deleteReview(name: string, phone: string, reviewId: string) {
    await this._assertOwnership(name, phone, reviewId);

    const { error } = await supabaseAdmin.from('reviews').delete().eq('id', reviewId);
    if (error) throw new Error(error.message);
  }

  /**
   * 이름+전화번호로 리뷰 소유권 확인.
   * 리뷰 id 는 공개 리뷰 목록에 그대로 실려 나가므로 id 를 안다는 것만으로는 아무 증명이 안 된다.
   */
  private async _assertOwnership(name: string, phone: string, reviewId: string) {
    if (!name?.trim() || !phone?.trim()) {
      throw Object.assign(new Error('권한이 없습니다.'), { status: 403 });
    }

    const { data: review } = await supabaseAdmin
      .from('reviews')
      .select('order_item_id')
      .eq('id', reviewId)
      .single();

    if (!review) throw Object.assign(new Error('리뷰를 찾을 수 없습니다.'), { status: 404 });

    const { data: item } = await supabaseAdmin
      .from('order_items')
      .select('order_id')
      .eq('id', review.order_item_id)
      .single();

    if (!item) throw Object.assign(new Error('리뷰를 찾을 수 없습니다.'), { status: 404 });

    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('id, customer_name')
      .eq('id', item.order_id)
      .in('customer_phone', phoneVariants(phone))
      .is('deleted_at', null)
      .single();

    if (!order || normalizeName(order.customer_name ?? '') !== normalizeName(name)) {
      throw Object.assign(new Error('권한이 없습니다.'), { status: 403 });
    }
  }

  // 상품별 리뷰 목록 조회 (공개)
  async getProductReviews(productId: number) {
    const { data, error } = await supabase
      .from('reviews')
      .select('id, rating, content, reviewer_name, created_at, images, height, usual_size, helpful_count')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`리뷰 조회에 실패했습니다: ${error.message}`);

    // 누구나 부를 수 있는 응답이다. 작성자 본명은 여기서 가려서 내보낸다 —
    // 화면에서만 자르면 API 를 직접 부르는 쪽에는 본명이 그대로 간다.
    const reviews: Review[] = (data ?? []).map((r: Review) => ({
      ...r,
      reviewer_name: maskPersonName(r.reviewer_name),
    }));
    const avgRating =
      reviews.length > 0
        ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
        : 0;

    return { reviews, avgRating, count: reviews.length };
  }
}

export const reviewService = new ReviewService();
