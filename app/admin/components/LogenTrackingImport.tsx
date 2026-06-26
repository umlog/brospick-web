'use client';

import { useRef, useState } from 'react';
import type { Order } from '../types';
import { showToast } from '../lib/toast';
import { parseLogenResult, type ParsedTrackingRow } from '@/lib/logen/parseLogenResult';
import { TRACKING_IMPORT_SKIP_STATUSES } from '../hooks/useOrders';
import styles from '../admin.module.css';

interface MatchRow {
  parsed: ParsedTrackingRow;
  order: Order;
  nameMatch: boolean;      // 우리 고객명 === 로젠 수하인명
  statusEligible: boolean; // 이미 배송중/완료/취소 아님
  duplicate: boolean;      // 같은 주문번호가 결과 파일에 2번 이상
}

interface Preview {
  matches: MatchRow[];
  unmatched: ParsedTrackingRow[];     // 주문번호가 우리 DB에 없음
  missingOrderNumber: number;         // 결과 파일에 주문번호가 비어있던 행 수
  fileName: string;
}

// 공백·특수문자 차이를 무시하고 이름 비교
const normalizeName = (s: string) => s.replace(/\s+/g, '').trim();

interface LogenTrackingImportProps {
  orders: Order[];
  onImport: (
    items: { orderId: string; trackingNumber: string }[],
    sendNotification: boolean
  ) => Promise<{ success: number; fail: number }>;
  notifyDefault: boolean;
}

export function LogenTrackingImport({ orders, onImport, notifyDefault }: LogenTrackingImportProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set()); // 등록할 orderId
  const [sendNotification, setSendNotification] = useState(notifyDefault);
  const [sending, setSending] = useState(false);

  const handleFile = async (file: File) => {
    try {
      const XLSX = await import('xlsx');
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: false, defval: '' });

      const { rows: parsedRows, missingOrderNumber } = parseLogenResult(rows);

      if (parsedRows.length === 0 && missingOrderNumber === 0) {
        showToast('운송장번호가 있는 행을 찾지 못했습니다. 파일을 확인해주세요.', 'error');
        return;
      }

      // 우리 주문 인덱스 (주문번호 → 주문)
      const byOrderNumber = new Map(orders.map((o) => [o.order_number, o]));
      // 결과 파일 내 주문번호 등장 횟수 (중복 매칭 탐지)
      const orderNumberCount = new Map<string, number>();
      parsedRows.forEach((r) => orderNumberCount.set(r.orderNumber, (orderNumberCount.get(r.orderNumber) ?? 0) + 1));

      const matches: MatchRow[] = [];
      const unmatched: ParsedTrackingRow[] = [];

      for (const parsed of parsedRows) {
        const order = byOrderNumber.get(parsed.orderNumber);
        if (!order) {
          unmatched.push(parsed);
          continue;
        }
        matches.push({
          parsed,
          order,
          nameMatch: normalizeName(order.customer_name) === normalizeName(parsed.customerName),
          statusEligible: !TRACKING_IMPORT_SKIP_STATUSES.includes(order.status),
          duplicate: (orderNumberCount.get(parsed.orderNumber) ?? 0) > 1,
        });
      }

      // 기본 선택: 이름 일치 + 상태 정상 + 중복 아님 인 건만 체크
      const safeDefaults = new Set(
        matches.filter((m) => m.nameMatch && m.statusEligible && !m.duplicate).map((m) => m.order.id)
      );

      setPreview({ matches, unmatched, missingOrderNumber, fileName: file.name });
      setSelected(safeDefaults);
      setSendNotification(notifyDefault);
    } catch (err) {
      showToast(err instanceof Error ? err.message : '엑셀을 읽는 중 오류가 발생했습니다.', 'error');
    }
  };

  const toggleRow = (orderId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  const close = () => {
    setPreview(null);
    setSelected(new Set());
  };

  const handleSubmit = async () => {
    if (!preview) return;
    const items = preview.matches
      .filter((m) => selected.has(m.order.id))
      .map((m) => ({ orderId: m.order.id, trackingNumber: m.parsed.trackingNumber }));

    if (items.length === 0) {
      showToast('등록할 주문을 선택해주세요.', 'info');
      return;
    }

    setSending(true);
    try {
      await onImport(items, sendNotification);
      close();
    } finally {
      setSending(false);
    }
  };

  const selectedCount = selected.size;

  return (
    <div className={styles.trackingImportBar}>
      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.xls"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = ''; // 같은 파일 재선택 허용
        }}
      />
      <button className={styles.trackingImportBtn} onClick={() => fileRef.current?.click()}>
        로젠 운송장 일괄 등록
      </button>

      {preview && (
        <div className={styles.trackingImportOverlay} onClick={close}>
          <div className={styles.trackingImportModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.trackingImportHeader}>
              <h3>운송장 일괄 등록 — 확인</h3>
              <button className={styles.trackingImportClose} onClick={close} aria-label="닫기">✕</button>
            </div>

            <p className={styles.trackingImportSummary}>
              매칭 {preview.matches.length}건 · 선택 {selectedCount}건
              {preview.unmatched.length > 0 && ` · 미매칭 ${preview.unmatched.length}건`}
              {preview.missingOrderNumber > 0 && ` · 주문번호 없음 ${preview.missingOrderNumber}건`}
            </p>

            <div className={styles.trackingImportTableWrap}>
              <table className={styles.trackingImportTable}>
                <thead>
                  <tr>
                    <th></th>
                    <th>주문번호</th>
                    <th>우리 고객</th>
                    <th>로젠 수하인</th>
                    <th>운송장</th>
                    <th>비고</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.matches.map((m) => {
                    const warn = !m.nameMatch || !m.statusEligible || m.duplicate;
                    return (
                      <tr key={m.parsed.rowNo + m.parsed.orderNumber} className={warn ? styles.trackingImportRowWarn : ''}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selected.has(m.order.id)}
                            onChange={() => toggleRow(m.order.id)}
                          />
                        </td>
                        <td>{m.parsed.orderNumber}</td>
                        <td>{m.order.customer_name}</td>
                        <td className={!m.nameMatch ? styles.trackingImportNameMismatch : ''}>
                          {m.parsed.customerName || '-'}
                        </td>
                        <td>{m.parsed.trackingNumber}</td>
                        <td className={styles.trackingImportNote}>
                          {!m.nameMatch && <span className={styles.trackingImportBadgeDanger}>이름 불일치</span>}
                          {!m.statusEligible && <span className={styles.trackingImportBadge}>이미 {m.order.status}</span>}
                          {m.duplicate && <span className={styles.trackingImportBadgeDanger}>주문번호 중복</span>}
                          {m.nameMatch && m.statusEligible && !m.duplicate && '✓'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {preview.unmatched.length > 0 && (
              <details className={styles.trackingImportUnmatched}>
                <summary>미매칭 {preview.unmatched.length}건 (우리 주문에 없는 주문번호)</summary>
                <ul>
                  {preview.unmatched.map((u) => (
                    <li key={u.rowNo + u.orderNumber}>
                      {u.orderNumber || '(주문번호 없음)'} — {u.customerName || '-'} / {u.trackingNumber}
                    </li>
                  ))}
                </ul>
              </details>
            )}

            <label className={styles.trackingImportNotify}>
              <input
                type="checkbox"
                checked={sendNotification}
                onChange={(e) => setSendNotification(e.target.checked)}
              />
              등록 시 고객에게 배송 알림 보내기
            </label>

            <div className={styles.trackingImportActions}>
              <button className={styles.trackingImportCancel} onClick={close} disabled={sending}>
                취소
              </button>
              <button
                className={styles.trackingImportConfirm}
                onClick={handleSubmit}
                disabled={sending || selectedCount === 0}
              >
                {sending ? '등록 중...' : `${selectedCount}건 배송중 등록`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
