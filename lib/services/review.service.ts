import { supabase, supabaseAdmin } from '@/lib/supabase';

export interface SubmitReviewPayload {
  orderNumber: string;
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

export class ReviewService {
  // 리뷰 제출 (주문번호+전화번호 인증 후)
  async submitReview(payload: SubmitReviewPayload) {
    const { orderNumber, phone, orderItemId, rating, content, images = [], height, usual_size } = payload;

    if (!orderNumber || !phone || !orderItemId || !rating || !content?.trim()) {
      throw Object.assign(new Error('필수 정보가 누락되었습니다.'), { status: 400 });
    }
    if (rating < 1 || rating > 5) {
      throw Object.assign(new Error('별점은 1~5 사이여야 합니다.'), { status: 400 });
    }

    // 주문번호 + 전화번호로 주문 인증
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, customer_name, customer_phone')
      .eq('order_number', orderNumber)
      .eq('customer_phone', phone)
      .is('deleted_at', null)
      .single();

    if (orderError || !order) {
      throw Object.assign(
        new Error('주문을 찾을 수 없습니다. 주문번호와 전화번호를 확인해주세요.'),
        { status: 404 }
      );
    }

    // order_item이 해당 주문에 속하는지 확인 + product_id 획득
    const { data: orderItem, error: itemError } = await supabaseAdmin
      .from('order_items')
      .select('id, product_id')
      .eq('id', orderItemId)
      .eq('order_id', order.id)
      .single();

    if (itemError || !orderItem) {
      throw Object.assign(new Error('해당 주문에서 상품을 찾을 수 없습니다.'), { status: 404 });
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

  // 주문번호+전화번호로 리뷰 작성 가능한 주문 상품 조회
  async getReviewableItems(orderNumber: string, phone: string) {
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, customer_name, order_items(id, product_id, product_name, size, quantity)')
      .eq('order_number', orderNumber)
      .eq('customer_phone', phone)
      .is('deleted_at', null)
      .single();

    if (orderError || !order) {
      throw Object.assign(
        new Error('주문을 찾을 수 없습니다. 주문번호와 전화번호를 확인해주세요.'),
        { status: 404 }
      );
    }

    const items = Array.isArray(order.order_items) ? order.order_items : [];
    const itemIds = items.map((i: { id: string }) => i.id);

    const { data: existingReviews } = await supabaseAdmin
      .from('reviews')
      .select('order_item_id, rating, content, images, height, usual_size')
      .in('order_item_id', itemIds);

    const reviewedMap = new Map(
      (existingReviews ?? []).map((r: { order_item_id: string; rating: number; content: string }) => [
        r.order_item_id,
        r,
      ])
    );

    return {
      orderNumber,
      customerName: order.customer_name,
      items: items
        .filter((i: { product_id: number | null }) => i.product_id)
        .map((i: { id: string; product_id: number; product_name: string; size: string; quantity: number }) => ({
          id: i.id,
          productId: i.product_id,
          productName: i.product_name,
          size: i.size,
          quantity: i.quantity,
          reviewed: reviewedMap.has(i.id),
          existingReview: reviewedMap.get(i.id) ?? null,
        })),
    };
  }

  // 전화번호로 내 리뷰 조회 (개인정보 보유기간 5년 적용)
  async getMyReviews(phone: string) {
    if (!phone?.trim()) {
      throw Object.assign(new Error('전화번호를 입력해주세요.'), { status: 400 });
    }

    const normalized = phone.replace(/[-\s]/g, '');

    const { data: orders } = await supabaseAdmin
      .from('orders')
      .select('id')
      .or(`customer_phone.eq.${phone},customer_phone.eq.${normalized}`)
      .is('deleted_at', null);

    if (!orders?.length) return { reviews: [] };

    const orderIds = orders.map((o: { id: string }) => o.id);

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

  // 리뷰 수정 (전화번호 소유권 확인)
  async updateReview(
    phone: string,
    reviewId: string,
    updates: { rating: number; content: string; images?: string[]; height?: number | null; usual_size?: string | null }
  ) {
    await this._assertOwnership(phone, reviewId);

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

  // 리뷰 삭제 (전화번호 소유권 확인)
  async deleteReview(phone: string, reviewId: string) {
    await this._assertOwnership(phone, reviewId);

    const { error } = await supabaseAdmin.from('reviews').delete().eq('id', reviewId);
    if (error) throw new Error(error.message);
  }

  // 전화번호로 리뷰 소유권 확인
  private async _assertOwnership(phone: string, reviewId: string) {
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

    const normalized = phone.replace(/[-\s]/g, '');
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('id', item.order_id)
      .or(`customer_phone.eq.${phone},customer_phone.eq.${normalized}`)
      .is('deleted_at', null)
      .single();

    if (!order) throw Object.assign(new Error('권한이 없습니다.'), { status: 403 });
  }

  // 상품별 리뷰 목록 조회 (공개)
  async getProductReviews(productId: number) {
    const { data, error } = await supabase
      .from('reviews')
      .select('id, rating, content, reviewer_name, created_at, images, height, usual_size, helpful_count')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`리뷰 조회에 실패했습니다: ${error.message}`);

    const reviews: Review[] = data ?? [];
    const avgRating =
      reviews.length > 0
        ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
        : 0;

    return { reviews, avgRating, count: reviews.length };
  }
}

export const reviewService = new ReviewService();
