// 로젠 "주문실적조회" 결과 엑셀 파싱 → 주문번호·운송장번호 추출
// 내보내기(A타입) 때 N열에 주문번호를 넣어 올리면, 결과 파일 주문번호 열에 그대로 돌아옴.
// 그 주문번호를 키로 우리 주문과 매칭한다.

export interface ParsedTrackingRow {
  rowNo: string;          // 결과 파일의 No. (디버깅/표시용)
  orderNumber: string;    // 주문번호 (매칭 키)
  trackingNumber: string; // 운송장번호 (숫자만)
  customerName: string;   // 수하인명 (표시용)
}

export interface ParseLogenResult {
  rows: ParsedTrackingRow[];
  totalDataRows: number;       // 운송장번호가 있는 전체 데이터 행 수
  missingOrderNumber: number;  // 그 중 주문번호가 비어 매칭 불가한 행 수
}

const onlyDigits = (s: unknown) => String(s ?? '').replace(/[^0-9]/g, '');
const TRACKING_PATTERN = /\d{3}-?\d{4}-?\d{4}/; // 로젠 운송장: 446-4156-4785

/** 헤더 행에서 정확히 일치하는 열 인덱스를 찾는다 (없으면 -1) */
function findColumn(rows: unknown[][], headerText: string): number {
  for (const row of rows) {
    for (let c = 0; c < row.length; c++) {
      if (String(row[c] ?? '').trim() === headerText) return c;
    }
  }
  return -1;
}

/**
 * sheet_to_json(header:1) 로 읽은 2차원 배열을 받아 파싱한다.
 * 열 위치는 헤더 텍스트로 동적 탐지하므로 로젠 양식이 약간 바뀌어도 견딘다.
 */
export function parseLogenResult(rows: unknown[][]): ParseLogenResult {
  const orderNoCol = findColumn(rows, '주문번호');
  const trackingCol = findColumn(rows, '운송장번호'); // '재출력\n운송장번호' 와 정확일치로 구분됨
  const nameCol = findColumn(rows, '명');             // 수하인 그룹의 첫 '명'
  const noCol = findColumn(rows, 'No.');

  if (trackingCol === -1) {
    throw new Error('운송장번호 열을 찾을 수 없습니다. 로젠 주문실적조회 엑셀이 맞는지 확인해주세요.');
  }

  const result: ParsedTrackingRow[] = [];
  let totalDataRows = 0;
  let missingOrderNumber = 0;

  for (const row of rows) {
    const rawTracking = String(row[trackingCol] ?? '').trim();
    // 헤더 행/빈 행 스킵: 운송장 패턴이 있는 행만 데이터로 취급
    if (!TRACKING_PATTERN.test(rawTracking)) continue;

    totalDataRows++;
    const orderNumber = orderNoCol === -1 ? '' : String(row[orderNoCol] ?? '').trim();
    if (!orderNumber) {
      missingOrderNumber++;
      continue; // 매칭 키 없으면 등록 대상에서 제외
    }

    result.push({
      rowNo: noCol === -1 ? '' : String(row[noCol] ?? '').trim(),
      orderNumber,
      trackingNumber: onlyDigits(rawTracking),
      customerName: nameCol === -1 ? '' : String(row[nameCol] ?? '').trim(),
    });
  }

  return { rows: result, totalDataRows, missingOrderNumber };
}
