import type { Order as AdminOrder } from '@/lib/domain/types';

const DEFAULT_FARE_TYPE = '신용';

export type LogenRow = [
  string, // A 수하인명
  string, // B 우편번호 (빈 칸)
  string, // C 주소
  string, // D 전화 (빈 칸)
  string, // E 휴대폰
  number, // F 택배수량(박스)
  string, // G 선택안함 (빈 칸)
  string, // H 운임구분
  string, // I 물품명
  string, // J 주문번호
  string, // K 배송메시지
  number, // L 내품수량
];

const onlyDigits = (s?: string | null) => (s ?? '').replace(/[^0-9]/g, '');

function buildGoodsName(order: AdminOrder): string {
  return order.order_items
    .map((it) => {
      const opt = it.size ? `(${it.size})` : '';
      return `${it.product_name}${opt} ${it.quantity}`;
    })
    .join(' # ');
}

export function convertOrderToLogenRow(order: AdminOrder, fareType = DEFAULT_FARE_TYPE): LogenRow {
  const fullAddress = [order.address, order.address_detail].filter(Boolean).join(' ');
  const inQty = order.order_items.reduce((sum, it) => sum + it.quantity, 0);

  return [
    order.customer_name,
    '', // 한글 주소 자동인식 — 우편번호 생략
    fullAddress,
    '', // 유선전화 없음
    onlyDigits(order.customer_phone),
    1, // 박스 수 기본값
    '',
    fareType,
    buildGoodsName(order),
    order.order_number,
    order.delivery_note ?? '',
    inQty,
  ];
}

export function convertOrdersToLogenRows(orders: AdminOrder[], fareType = DEFAULT_FARE_TYPE): LogenRow[] {
  return orders.map((o) => convertOrderToLogenRow(o, fareType));
}
