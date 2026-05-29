import * as XLSX from 'xlsx';
import type { Order as AdminOrder } from '@/lib/domain/types';
import { convertOrdersToLogenRows } from './convertOrdersToLogenRows';

export function exportLogenExcel(orders: AdminOrder[], fareType = '신용', fileName?: string): void {
  const rows = convertOrdersToLogenRows(orders, fareType);

  // 제목행 없이 데이터만 (aoa = array of arrays)
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // 전화(D=index 3), 휴대폰(E=index 4) 컬럼을 텍스트 서식으로 강제 → 앞 0 보존
  const range = XLSX.utils.decode_range(ws['!ref']!);
  for (let r = range.s.r; r <= range.e.r; r++) {
    for (const c of [3, 4]) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = ws[addr];
      if (cell) {
        cell.t = 's';
        cell.z = '@';
        cell.v = String(cell.v ?? '');
      }
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '로젠주문');

  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const name = fileName ?? `logen_orders_${today}.xlsx`;
  XLSX.writeFile(wb, name);
}
