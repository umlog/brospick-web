# 작업 지시서: 어드민 "로젠택배 엑셀 내보내기" 기능 구현

> 이 문서를 Claude Code에 그대로 전달하세요. 프로젝트 컨벤션(폴더 구조, 네이밍, lint 규칙)에 맞춰 구현하면 됩니다.

## 목표

BrosPick 어드민(React + TypeScript, RN Web 포함)의 **주문 관리 페이지**에서, 선택한 주문들을 **로젠택배 통합물류시스템 "주문등록/출력(복수건)" 화면에 업로드 가능한 엑셀(.xlsx)** 로 내보내는 기능을 추가한다.

- 데이터 소스: **Supabase** (주문 테이블). 어드민 주문관리 화면이 이미 Supabase에서 주문을 불러오므로, 그 데이터를 그대로 변환해 다운로드한다.
- 출력: 브라우저에서 `.xlsx` 파일 다운로드 (Blob 방식).
- 핵심: 로젠이 인식하는 **컬럼 순서/형식**을 정확히 맞춘다. 한 번 만든 엑셀 양식을 로젠 "엑셀타입설정"에 1회 저장해두면 이후 계속 재사용 가능.

---

## 1. 로젠 엑셀 컬럼 스펙 (제목행 없음 / A타입)

로젠 매뉴얼(lrm01fp100 엑셀타입설정)과 [로젠 OpenAPI 주문 일괄 등록 문서](https://openapihome.ilogen.com/openapi/pages/api-docs/bulk-order.html) 기준. 컬럼 순서는 아래 고정.

| 열 | 항목 | 필수 | 형식/규칙 |
|---|------|------|-----------|
| A | 수하인명 | ✅ | 문자열 |
| B | 우편번호 | ⛔(생략) | 한글 주소는 자동인식 → **빈 칸 유지** |
| C | 수하인주소(전체) | ✅ | 도로명/지번 + 상세주소 합친 전체 주소 |
| D | 수하인전화 | △ | 유선번호. 없으면 빈 칸 (휴대폰만 있어도 됨) |
| E | 수하인휴대폰 | △ | **하이픈 없는 11자리, 텍스트 서식** (앞 0 보존 필수). D·E 중 하나는 반드시 있어야 함 |
| F | 택배수량(박스수) | ✅ | 정수. 주문 1건당 보통 `1` (상품 종류 수가 아니라 박스 개수) |
| G | (선택안함) | - | 빈 칸 |
| H | 운임구분 | ✅ | 계약 기본값 상수. 예: `신용` 또는 `선불`. (코드 사용 시 010/020/030/040) |
| I | 물품명 | △ | 여러 상품을 구분자로 합쳐 한 칸에. 아래 2-3 참고 |
| J | 주문번호 | △ | Supabase 주문 ID/주문번호 (송장 매칭·합포장에 유용) |
| K | 배송메시지 | - | 예: "문 앞에 놓아주세요" |
| L | 내품수량 | - | 주문 내 총 상품 개수 합 |

> 실무 가이드([네이버 블로그](https://blog.naver.com/krichjh/222200334575))상 **이름·주소·전화·수량·운임·운임구분·배송메시지**만 채우면 송장 발행에 문제없음. 결제금액/상품금액/배송비는 로젠 송장과 무관하므로 **넣지 않는다.**

### 중요 형식 규칙
1. **제목행 없음**: 1행부터 데이터. (로젠 엑셀타입설정에서 "제목없음" 선택)
2. **휴대폰/전화번호**: 셀 서식을 텍스트(`@`)로 지정하고 문자열로 기록. `01021437000` 앞 0이 사라지면 안 됨. 하이픈 제거.
3. **물품명 합치기**: 한 주문에 상품 N종이면 구분자 `#`로 묶는다.
   - 형식: `상품명(옵션) 수량` 을 ` # ` 로 연결
   - 예: `Philippians 4:13 Crew Socks(White) 2 # BOOT SKIN 심볼(CROSS) 1 # Cross C-Tape(3.8cm) 1`
4. **택배수량(F)** 과 **내품수량(L)** 구분: F는 박스 개수(기본 1), L은 상품 총 개수.

---

## 2. 입력 타입 (Supabase 주문 형식)

> 아래는 권장 인터페이스. 실제 Supabase 스키마 컬럼명에 맞춰 매핑 레이어에서 변환할 것. (스키마가 다르면 매핑만 수정)

```ts
// types/order.ts
export interface OrderItem {
  productName: string;   // 상품명
  option?: string;       // 옵션 (예: "White / ONE SIZE")
  quantity: number;      // 수량
  unitPrice?: number;    // 단가 (로젠 엑셀엔 불필요, 참고용)
}

export interface Order {
  orderId: string;            // 주문번호 (J열)
  recipientName: string;      // 수하인명 (A열)
  recipientPhone?: string;    // 수하인 유선 (D열)
  recipientMobile: string;    // 수하인 휴대폰 (E열)
  zipCode?: string;           // 우편번호 (B열 - 보통 미사용)
  address: string;            // 전체 주소 (C열)
  deliveryMessage?: string;   // 배송메시지 (K열)
  items: OrderItem[];         // 주문 상품 목록
  boxCount?: number;          // 박스 수 (F열, 기본 1)
}
```

---

## 3. 구현 요구사항

### 3-1. 변환 로직 (순수 함수, 단위테스트 대상)
`src/lib/logen/convertOrdersToLogenRows.ts`

```ts
import type { Order } from "@/types/order";

// 계약 기본값 — 환경변수 또는 설정에서 주입 권장
const DEFAULT_FARE_TYPE = "신용"; // 또는 "선불"

export type LogenRow = [
  string, // A 수하인명
  string, // B 우편번호 (빈 칸)
  string, // C 주소
  string, // D 전화
  string, // E 휴대폰
  number, // F 택배수량(박스)
  string, // G 선택안함 (빈 칸)
  string, // H 운임구분
  string, // I 물품명(합침)
  string, // J 주문번호
  string, // K 배송메시지
  number  // L 내품수량
];

const onlyDigits = (s?: string) => (s ?? "").replace(/[^0-9]/g, "");

function buildGoodsName(order: Order): string {
  return order.items
    .map((it) => {
      const opt = it.option ? `(${it.option})` : "";
      return `${it.productName}${opt} ${it.quantity}`;
    })
    .join(" # ");
}

export function convertOrderToLogenRow(order: Order): LogenRow {
  const inQty = order.items.reduce((sum, it) => sum + it.quantity, 0);
  return [
    order.recipientName,
    order.zipCode ?? "",
    order.address,
    onlyDigits(order.recipientPhone),
    onlyDigits(order.recipientMobile),
    order.boxCount ?? 1,
    "",
    DEFAULT_FARE_TYPE,
    buildGoodsName(order),
    order.orderId,
    order.deliveryMessage ?? "",
    inQty,
  ];
}

export function convertOrdersToLogenRows(orders: Order[]): LogenRow[] {
  return orders.map(convertOrderToLogenRow);
}
```

### 3-2. 엑셀 생성 + 다운로드
`src/lib/logen/exportLogenExcel.ts` — 라이브러리는 **`xlsx` (SheetJS)** 사용.

```ts
import * as XLSX from "xlsx";
import type { Order } from "@/types/order";
import { convertOrdersToLogenRows } from "./convertOrdersToLogenRows";

export function exportLogenExcel(orders: Order[], fileName?: string): void {
  const rows = convertOrdersToLogenRows(orders);

  // 제목행 없이 데이터만 (aoa = array of arrays)
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // 전화(D=index 3), 휴대폰(E=index 4) 컬럼을 텍스트 서식으로 강제
  const range = XLSX.utils.decode_range(ws["!ref"]!);
  for (let r = range.s.r; r <= range.e.r; r++) {
    for (const c of [3, 4]) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = ws[addr];
      if (cell) {
        cell.t = "s";                 // string 타입
        cell.z = "@";                 // 텍스트 서식
        cell.v = String(cell.v ?? ""); // 문자열로
      }
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "로젠주문");

  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const name = fileName ?? `logen_orders_${today}.xlsx`;
  XLSX.writeFile(wb, name); // 브라우저에서 자동 다운로드
}
```

### 3-3. 어드민 UI 연동
주문관리 페이지에서:
- 주문 목록에 **체크박스 선택** 추가 (전체선택 포함)
- 상단/툴바에 **"로젠 엑셀 내보내기"** 버튼 추가
- 클릭 시 선택된 주문(없으면 현재 필터된 전체)을 `exportLogenExcel(selectedOrders)` 로 전달
- 운임구분 기본값을 바꿀 수 있게 드롭다운(신용/선불) 제공하면 더 좋음 (선택)

### 3-4. Supabase 조회 → 매핑
- 기존 주문 조회 쿼리 재사용. 조회 결과(raw row)를 `Order` 인터페이스로 변환하는 **매퍼**를 `src/lib/logen/mapSupabaseOrder.ts` 에 둔다.
- Supabase 실제 컬럼명을 확인 후 매핑 (예: `recipient_name` → `recipientName`). 상품은 별도 테이블이면 `order_items` 조인 또는 jsonb 컬럼에서 추출.

---

## 4. 검증 / 테스트

1. **단위테스트** (`convertOrdersToLogenRows.test.ts`): 아래 예제 주문이 정확한 12열 배열로 변환되는지.
2. **실제 업로드 테스트**: 생성된 .xlsx를 로젠 "주문등록/출력(복수건)" → 엑셀타입설정에서 컬럼 매핑(제목없음) 1회 저장 → 파일열기 → 변환(저장) → 오류 0건 확인.
3. 휴대폰 번호 앞 0이 유지되는지(`01021437000`) 엑셀에서 직접 확인.

### 테스트용 예제 주문 (실제 BrosPick 주문 1건)
```ts
const sample: Order = {
  orderId: "BP-20260529-0001",
  recipientName: "장예성",
  recipientMobile: "01021437000",
  zipCode: "42011",
  address: "대구 수성구 상록로 69 (범어동, 래미안범어아파트) 104동 102호",
  deliveryMessage: "문 앞에 놓아주세요",
  boxCount: 1,
  items: [
    { productName: "Philippians 4:13 Non-Slip Crew Socks (White)", option: "ONE SIZE", quantity: 2 },
    { productName: "BOOT SKIN 심볼 (CROSS)", quantity: 1 },
    { productName: "Cross C-Tape (3.8cm)", option: "ONE SIZE", quantity: 1 },
  ],
};
```
기대 출력 행:
```
["장예성", "42011", "대구 수성구 상록로 69 (범어동, 래미안범어아파트) 104동 102호",
 "", "01021437000", 1, "", "신용",
 "Philippians 4:13 Non-Slip Crew Socks (White)(ONE SIZE) 2 # BOOT SKIN 심볼 (CROSS) 1 # Cross C-Tape (3.8cm)(ONE SIZE) 1",
 "BP-20260529-0001", "문 앞에 놓아주세요", 4]
```

---

## 5. 의존성
```bash
npm install xlsx
# (RN Web 환경이면 웹 번들에서 동작. 순수 RN 네이티브에서도 쓰려면 별도 share/파일저장 처리 필요)
```

## 6. 참고 자료
- 로젠 사용자 매뉴얼 Ver 0.8 (첨부 PDF, 화면ID lrm01f0040 / lrm01fp100)
- 로젠 OpenAPI 주문 일괄 등록: https://openapihome.ilogen.com/openapi/pages/api-docs/bulk-order.html
- iLOGEN 복수건 등록 가이드: https://blog.naver.com/krichjh/222200334575

---

## 작업 순서 (권장)
1. `xlsx` 설치
2. 타입 정의 (`types/order.ts`) + Supabase 매퍼
3. 변환 함수 + 단위테스트 작성/통과
4. 엑셀 생성·다운로드 함수
5. 주문관리 UI에 체크박스 + 내보내기 버튼 연동
6. 실제 로젠 업로드로 end-to-end 검증
