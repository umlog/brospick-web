'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { RETURN_POLICY, REMOTE_AREA_SURCHARGE, isRemoteArea } from '@/lib/constants';
import { OrderStatus, ReturnStatus } from '@/lib/domain/enums';
import { getProductByName } from '@/lib/products';
import styles from './returns.module.css';

interface OrderItem {
  id: string;
  product_name: string;
  size: string;
  quantity: number;
  price: number;
}

interface ReturnRequest {
  request_number: string;
  type: '교환' | '반품';
  status: string;
  order_item_id: string;
}

interface OrderResult {
  id: string;
  order_number: string;
  status: string;
  delivered_at: string | null;
  created_at: string;
  postal_code: string | null;
  order_items: OrderItem[];
  return_requests: ReturnRequest[];
}

const STEP_LABELS = ['상품', '유형', '정보', '사유', '확인'];

function ReturnsContent() {
  const searchParams = useSearchParams();

  // Lookup state
  const [orderNumber, setOrderNumber] = useState(searchParams.get('orderNumber') || '');

  useEffect(() => {
    if (!orderNumber) {
      const saved = localStorage.getItem('brospick-last-order');
      if (saved) setOrderNumber(saved);
    }
  }, []);
  const [phone, setPhone] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [order, setOrder] = useState<OrderResult | null>(null);

  // view: 'lookup' | 'ineligible' | 'form' | 'success'
  const [view, setView] = useState<'lookup' | 'ineligible' | 'form' | 'success'>('lookup');

  // Form state
  const [step, setStep] = useState(0);
  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null);
  const [returnType, setReturnType] = useState<'교환' | '반품' | ''>('');
  const [exchangeSize, setExchangeSize] = useState('');
  const [refundBank, setRefundBank] = useState('');
  const [refundAccount, setRefundAccount] = useState('');
  const [refundHolder, setRefundHolder] = useState('');
  const [reason, setReason] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [requestNumber, setRequestNumber] = useState('');
  const [sizeStatuses, setSizeStatuses] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/api/products/sizes')
      .then((res) => res.json())
      .then((data) => {
        const map: Record<string, string> = {};
        for (const item of data.sizes || []) {
          map[`${item.product_id}-${item.size}`] = item.status;
        }
        setSizeStatuses(map);
      })
      .catch(() => {});
  }, []);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  const isEligible = (o: OrderResult) => {
    if (o.status !== OrderStatus.DELIVERED) return false;
    if (!o.delivered_at) return false;
    const diff = (Date.now() - new Date(o.delivered_at).getTime()) / (1000 * 60 * 60 * 24);
    return diff <= RETURN_POLICY.windowDays;
  };

  const hasActiveReturn = (itemId: string) => {
    return order?.return_requests.some(
      (r) => r.order_item_id === itemId && ![ReturnStatus.COMPLETED, ReturnStatus.REJECTED].includes(r.status as ReturnStatus)
    ) ?? false;
  };

  const getProductSizes = (productName: string) => {
    const product = getProductByName(productName);
    if (!product) return { sizes: [], soldOut: [], delayed: [] };
    return {
      sizes: product.sizes,
      soldOut: product.sizes.filter((s) => sizeStatuses[`${product.id}-${s}`] === 'sold_out'),
      delayed: product.sizes.filter((s) => sizeStatuses[`${product.id}-${s}`] === 'delayed'),
    };
  };

  const canNext = () => {
    switch (step) {
      case 0: return !!selectedItem;
      case 1: return !!returnType;
      case 2:
        if (returnType === '교환') return !!exchangeSize;
        return !!refundBank && !!refundAccount && !!refundHolder;
      case 3: return !!reason.trim();
      default: return false;
    }
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber || !phone) return;

    setLookupLoading(true);
    setLookupError('');

    try {
      const res = await fetch('/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber, phone }),
      });
      const data = await res.json();

      if (!res.ok) {
        setLookupError(data.error);
        return;
      }

      setOrder(data.order);
      setView(isEligible(data.order) ? 'form' : 'ineligible');
    } catch {
      setLookupError('조회에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!order || !selectedItem || !returnType || !reason) return;

    setSubmitLoading(true);
    setSubmitError('');

    try {
      const body: Record<string, unknown> = {
        orderNumber: order.order_number,
        phone,
        orderItemId: selectedItem.id,
        type: returnType,
        reason,
        quantity: selectedItem.quantity,
      };

      if (returnType === '교환') {
        body.exchangeSize = exchangeSize;
      } else {
        body.refundBank = refundBank;
        body.refundAccount = refundAccount;
        body.refundHolder = refundHolder;
      }

      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error);
        return;
      }

      setRequestNumber(data.requestNumber);
      setView('success');
    } catch {
      setSubmitError('신청에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleReset = () => {
    setOrder(null);
    setView('lookup');
    setOrderNumber('');
    setPhone('');
    setStep(0);
    setSelectedItem(null);
    setReturnType('');
    setExchangeSize('');
    setRefundBank('');
    setRefundAccount('');
    setRefundHolder('');
    setReason('');
    setSubmitError('');
    setRequestNumber('');
  };

  // ─── Lookup ────────────────────────────────────────────────────────────────
  if (view === 'lookup') {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h1>교환 / 반품 신청</h1>
            <p>주문번호와 전화번호를 입력해 주문을 조회하세요.</p>
            <div className={styles.policyRow}>
              <span className={styles.policyItem}>반품 배송비 ₩{RETURN_POLICY.returnShippingFee.toLocaleString()}</span>
              <span className={styles.policyItem}>교환 배송비 ₩{RETURN_POLICY.exchangeShippingFee.toLocaleString()}</span>
              <span className={styles.policyItem}>수령 후 {RETURN_POLICY.windowDays}일 이내</span>
            </div>
          </div>
          <form className={styles.form} onSubmit={handleLookup}>
            {lookupError && <div className={styles.error}>{lookupError}</div>}
            <div className={styles.inputGroup}>
              <label>주문번호</label>
              <input
                type="text"
                placeholder="BP-20250209-1234"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label>주문 시 입력한 전화번호</label>
              <input
                type="tel"
                placeholder="010-1234-5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <button type="submit" className={styles.submitButton} disabled={lookupLoading}>
              {lookupLoading ? '조회 중...' : '주문 조회'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ─── Ineligible ────────────────────────────────────────────────────────────
  if (view === 'ineligible' && order) {
    const reason =
      order.status !== OrderStatus.DELIVERED
        ? '배송완료된 주문만 교환/반품 신청이 가능합니다.'
        : `수령 후 ${RETURN_POLICY.windowDays}일이 지나 신청이 불가합니다.`;

    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h1>교환 / 반품 신청</h1>
          </div>
          <div className={styles.ineligible}>
            <div className={styles.ineligibleIcon}>✕</div>
            <h3>신청 불가</h3>
            <p>{reason}</p>
            <button className={styles.resetButton} onClick={handleReset}>다시 조회하기</button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Success ───────────────────────────────────────────────────────────────
  if (view === 'success') {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h1>교환 / 반품 신청</h1>
          </div>
          <div className={styles.success}>
            <div className={styles.successIcon}>✓</div>
            <h3 className={styles.successTitle}>{returnType} 신청이 접수되었습니다</h3>
            <p className={styles.successSubtitle}>접수 후 순차적으로 처리됩니다.</p>
            <div className={styles.successInfo}>
              <div className={styles.summaryRow}>
                <span>접수번호</span>
                <span>{requestNumber}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>상태</span>
                <span>접수완료</span>
              </div>
            </div>
            <button className={styles.resetButton} onClick={handleReset}>확인</button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Form ──────────────────────────────────────────────────────────────────
  if (!order) return null;

  const stepLabels = ['상품', '유형', returnType === '교환' ? '사이즈' : '계좌', '사유', '확인'];

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1>교환 / 반품 신청</h1>
        </div>

        <div className={styles.orderPreview}>
          <div className={styles.orderMeta}>
            <span className={styles.orderNumber}>{order.order_number}</span>
            <span className={styles.orderDate}>{formatDate(order.created_at)}</span>
          </div>
          <span className={styles.eligibleBadge}>신청 가능</span>
        </div>

        <div className={styles.steps}>
          {stepLabels.map((label, i) => (
            <div key={i} className={styles.step}>
              <div className={`${styles.stepDot} ${i <= step ? styles.stepDotActive : ''}`}>
                {i + 1}
              </div>
              <span className={`${styles.stepLabel} ${i <= step ? styles.stepLabelActive : ''}`}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {submitError && <div className={styles.error} style={{ margin: '0 28px' }}>{submitError}</div>}

        {/* Step 0: 상품 선택 */}
        {step === 0 && (
          <div className={styles.stepContent}>
            <p className={styles.stepTitle}>교환/반품할 상품을 선택해주세요</p>
            {order.order_items.map((item) => {
              const active = hasActiveReturn(item.id);
              return (
                <button
                  key={item.id}
                  className={`${styles.itemCard} ${selectedItem?.id === item.id ? styles.itemCardActive : ''}`}
                  onClick={() => !active && setSelectedItem(item)}
                  disabled={active}
                >
                  <div>
                    <div className={styles.itemName}>{item.product_name}</div>
                    <div className={styles.itemMeta}>{item.size} · {item.quantity}개 · ₩{(item.price * item.quantity).toLocaleString()}</div>
                  </div>
                  {active && <span className={styles.itemBadge}>진행중</span>}
                </button>
              );
            })}
          </div>
        )}

        {/* Step 1: 유형 선택 */}
        {step === 1 && (
          <div className={styles.stepContent}>
            <p className={styles.stepTitle}>요청 유형을 선택해주세요</p>
            <div className={styles.typeGroup}>
              <button
                className={`${styles.typeButton} ${returnType === '교환' ? styles.typeButtonActive : ''}`}
                onClick={() => { setReturnType('교환'); setExchangeSize(''); }}
              >
                <span className={styles.typeIcon}>⇄</span>
                <span className={styles.typeLabel}>교환</span>
                <span className={styles.typeDesc}>같은 상품, 다른 사이즈</span>
              </button>
              <button
                className={`${styles.typeButton} ${returnType === '반품' ? styles.typeButtonActive : ''}`}
                onClick={() => { setReturnType('반품'); setRefundBank(''); setRefundAccount(''); setRefundHolder(''); }}
              >
                <span className={styles.typeIcon}>↩</span>
                <span className={styles.typeLabel}>반품</span>
                <span className={styles.typeDesc}>환불 처리</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: 교환 사이즈 or 환불 계좌 */}
        {step === 2 && returnType === '교환' && selectedItem && (
          <div className={styles.stepContent}>
            <p className={styles.stepTitle}>교환 희망 사이즈를 선택해주세요</p>
            <div className={styles.sizeGrid}>
              {(() => {
                const { sizes, soldOut, delayed } = getProductSizes(selectedItem.product_name);
                return sizes.map((size) => {
                  const isSoldOut = soldOut.includes(size);
                  const isDelayed = delayed.includes(size);
                  const isCurrent = size === selectedItem.size;
                  return (
                    <button
                      key={size}
                      className={`${styles.sizeButton} ${exchangeSize === size ? styles.sizeButtonActive : ''} ${isSoldOut || isCurrent ? styles.sizeButtonDisabled : ''}`}
                      onClick={() => {
                        if (isSoldOut || isCurrent) return;
                        if (isDelayed) {
                          if (confirm('해당 사이즈는 교환 후 약 3주 뒤 발송됩니다.\n교환하시겠습니까?')) {
                            setExchangeSize(size);
                          }
                          return;
                        }
                        setExchangeSize(size);
                      }}
                      disabled={isSoldOut || isCurrent}
                    >
                      {size}
                      {isCurrent && <span className={styles.sizeTag}>현재</span>}
                      {isSoldOut && !isCurrent && <span className={styles.sizeTag}>품절</span>}
                      {isDelayed && !isCurrent && !isSoldOut && <span className={styles.sizeTag}>3주 뒤</span>}
                    </button>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {step === 2 && returnType === '반품' && (
          <div className={styles.stepContent}>
            <p className={styles.stepTitle}>환불 받으실 계좌 정보를 입력해주세요</p>
            <div className={styles.inputGroup}>
              <label>은행</label>
              <select value={refundBank} onChange={(e) => setRefundBank(e.target.value)}>
                <option value="">은행 선택</option>
                {RETURN_POLICY.banks.map((bank) => (
                  <option key={bank} value={bank}>{bank}</option>
                ))}
              </select>
            </div>
            <div className={styles.inputGroup}>
              <label>계좌번호</label>
              <input
                type="text"
                placeholder="- 없이 입력"
                value={refundAccount}
                onChange={(e) => setRefundAccount(e.target.value)}
              />
            </div>
            <div className={styles.inputGroup}>
              <label>예금주</label>
              <input
                type="text"
                placeholder="예금주명"
                value={refundHolder}
                onChange={(e) => setRefundHolder(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Step 3: 사유 */}
        {step === 3 && (
          <div className={styles.stepContent}>
            <p className={styles.stepTitle}>{returnType} 사유를 입력해주세요</p>
            <div className={styles.inputGroup}>
              <textarea
                placeholder="사유를 입력해주세요"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
        )}

        {/* Step 4: 확인 */}
        {step === 4 && selectedItem && (
          <div className={styles.stepContent}>
            <p className={styles.stepTitle}>신청 내용을 확인해주세요</p>
            <div className={styles.summary}>
              <div className={styles.summaryRow}>
                <span>유형</span>
                <span>{returnType}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>상품</span>
                <span>{selectedItem.product_name}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>사이즈</span>
                <span>{selectedItem.size}{returnType === '교환' ? ` → ${exchangeSize}` : ''}</span>
              </div>
              {(() => {
                const remote = order.postal_code ? isRemoteArea(order.postal_code) : false;
                const baseFee = returnType === '교환' ? RETURN_POLICY.exchangeShippingFee : RETURN_POLICY.returnShippingFee;
                const surcharge = remote ? (returnType === '교환' ? REMOTE_AREA_SURCHARGE.exchange : REMOTE_AREA_SURCHARGE.return) : 0;
                return (
                  <>
                    <div className={styles.summaryRow}>
                      <span>{returnType === '교환' ? '교환 배송비' : '반품 배송비'}</span>
                      <span>₩{(baseFee + surcharge).toLocaleString()}</span>
                    </div>
                    {remote && (
                      <div className={styles.summaryRow} style={{ color: '#dc2626', fontSize: '0.8rem' }}>
                        <span>도서산간 추가배송비 포함</span>
                        <span>+₩{surcharge.toLocaleString()}</span>
                      </div>
                    )}
                  </>
                );
              })()}
              {returnType === '반품' && (
                <>
                  <div className={styles.summaryRow}>
                    <span>상품 금액</span>
                    <span>₩{(selectedItem.price * selectedItem.quantity).toLocaleString()}</span>
                  </div>
                  <div className={`${styles.summaryRow} ${styles.summaryRowBold}`}>
                    <span>환불 예상 금액</span>
                    <span>₩{(selectedItem.price * selectedItem.quantity - RETURN_POLICY.returnShippingFee - (order.postal_code && isRemoteArea(order.postal_code) ? REMOTE_AREA_SURCHARGE.return : 0)).toLocaleString()}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>환불 계좌</span>
                    <span>{refundBank} {refundAccount}</span>
                  </div>
                </>
              )}
              <div className={styles.summaryRow}>
                <span>사유</span>
                <span>{reason}</span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className={styles.actions}>
          {step > 0 && (
            <button className={styles.prevButton} onClick={() => setStep(step - 1)}>
              이전
            </button>
          )}
          {step < 4 ? (
            <button
              className={styles.nextButton}
              onClick={() => setStep(step + 1)}
              disabled={!canNext()}
            >
              다음
            </button>
          ) : (
            <button
              className={styles.nextButton}
              onClick={handleSubmit}
              disabled={submitLoading}
            >
              {submitLoading ? '신청 중...' : '신청하기'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ReturnsPage() {
  return (
    <Suspense fallback={
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h1>교환 / 반품 신청</h1>
            <p>로딩 중...</p>
          </div>
        </div>
      </div>
    }>
      <ReturnsContent />
    </Suspense>
  );
}
