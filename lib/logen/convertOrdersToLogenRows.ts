import type { Order as AdminOrder } from '@/lib/domain/types';

// 로젠 운임구분 코드 (엑셀 H열에 코드값 입력)
const FARE_TYPE_CODES: Record<string, string> = {
  '선불': '010',
  '착불': '020',
  '신용': '030',
  '본사신용': '040',
};
const DEFAULT_FARE_TYPE = '선불'; // 브로스픽 계약 운임구분

// A타입(구시스템양식) 컬럼 순서에 맞춤
export type LogenRow = [
  string, // A 수하인명
  string, // B 빈칸
  string, // C 수하인주소1
  string, // D 수하인전화 (빈칸)
  string, // E 수하인휴대폰 (숫자만, 앞0 보존)
  number, // F 택배수량
  string, // G 택배운임 (빈칸 — 로젠 자동계산)
  string, // H 운임구분 코드 (010/020/030/040)
  string, // I 물품명
  string, // J 선택안함 (빈칸)
  string, // K 배송메세지
  string, // L 선택안함 (빈칸)
  string, // M 선택안함 (빈칸)
  string, // N 주문번호
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

  return [
    order.customer_name,     // A 수하인명
    '',                      // B 빈칸
    fullAddress,             // C 수하인주소1
    '',                      // D 수하인전화 (없음)
    onlyDigits(order.customer_phone), // E 수하인휴대폰
    1,                       // F 택배수량
    '',                      // G 택배운임 (로젠 자동계산)
    FARE_TYPE_CODES[fareType] ?? fareType, // H 운임구분 코드
    buildGoodsName(order),   // I 물품명
    '',                      // J 선택안함
    order.delivery_note ?? '', // K 배송메세지
    '',                      // L 선택안함
    '',                      // M 선택안함
    order.order_number,      // N 주문번호
  ];
}

export function convertOrdersToLogenRows(orders: AdminOrder[], fareType = DEFAULT_FARE_TYPE): LogenRow[] {
  return orders.map((o) => convertOrderToLogenRow(o, fareType));
}
