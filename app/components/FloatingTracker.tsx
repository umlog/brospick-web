'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { CONTACT, RETURN_POLICY, TRACKING } from '../../lib/constants';
import { products } from '../../lib/products';
import styles from './FloatingTracker.module.css';

type Tab = 'track' | 'inquiry';
type TrackView = 'form' | 'result' | 'returnForm' | 'returnSubmitted';

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
  reason: string;
  exchange_size?: string;
  quantity: number;
  reject_reason?: string;
  refund_amount?: number;
  refund_completed?: boolean;
  return_tracking_number?: string;
  created_at: string;
  order_item_id: string;
}

interface OrderResult {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  shipping_fee: number;
  tracking_number: string | null;
  delivered_at: string | null;
  created_at: string;
  order_items: OrderItem[];
  return_requests: ReturnRequest[];
}

interface ChatMessage {
  type: 'bot' | 'user';
  text: string;
}

const INQUIRY_STEPS = [
  { key: 'org', question: '안녕하세요! 단체주문 문의를 도와드릴게요.\n팀(단체)명을 알려주세요.' },
  { key: 'contact', question: '담당자 성함을 알려주세요.' },
  { key: 'phone', question: '연락 가능한 전화번호를 알려주세요.' },
  { key: 'product', question: '주문하고 싶은 상품과 예상 수량을 알려주세요.\n(예: 트레이닝복 상의 30벌, 하의 30벌)' },
  { key: 'message', question: '추가 요청사항이 있으면 적어주세요.\n(없으면 "없음"이라고 입력해주세요)' },
] as const;

const RETURN_STATUS_LABELS: Record<string, { color: string; bg: string }> = {
  '접수완료': { color: '#ffcc00', bg: 'rgba(255, 204, 0, 0.15)' },
  '승인': { color: '#34c759', bg: 'rgba(52, 199, 89, 0.15)' },
  '수거중': { color: '#5856d6', bg: 'rgba(88, 86, 214, 0.15)' },
  '수거완료': { color: '#007aff', bg: 'rgba(0, 122, 255, 0.15)' },
  '처리완료': { color: '#34c759', bg: 'rgba(52, 199, 89, 0.15)' },
  '거절': { color: '#ff3b30', bg: 'rgba(255, 59, 48, 0.15)' },
};

export default function FloatingTracker() {
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('track');

  // 배송 조회 상태
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<OrderResult | null>(null);
  const [trackView, setTrackView] = useState<TrackView>('form');

  // 교환/반품 신청 폼 상태
  const [returnSelectedItem, setReturnSelectedItem] = useState<OrderItem | null>(null);
  const [returnType, setReturnType] = useState<'교환' | '반품' | ''>('');
  const [returnExchangeSize, setReturnExchangeSize] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [returnRefundBank, setReturnRefundBank] = useState('');
  const [returnRefundAccount, setReturnRefundAccount] = useState('');
  const [returnRefundHolder, setReturnRefundHolder] = useState('');
  const [returnStep, setReturnStep] = useState(0);
  const [returnLoading, setReturnLoading] = useState(false);
  const [returnError, setReturnError] = useState('');
  const [returnRequestNumber, setReturnRequestNumber] = useState('');
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

  // 단체주문 문의 채팅 상태
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatStep, setChatStep] = useState(0);
  const [chatInput, setChatInput] = useState('');
  const [inquiryData, setInquiryData] = useState<Record<string, string>>({});
  const [inquirySent, setInquirySent] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchParams.get('track') === 'true') {
      setIsOpen(true);
      setActiveTab('track');
    }
  }, [searchParams]);

  // 채팅 탭 초기 메시지
  useEffect(() => {
    if (activeTab === 'inquiry' && chatMessages.length === 0 && !inquirySent) {
      setChatMessages([{ type: 'bot', text: INQUIRY_STEPS[0].question }]);
      setChatStep(0);
    }
  }, [activeTab, chatMessages.length, inquirySent]);

  // 채팅 스크롤
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    const currentKey = INQUIRY_STEPS[chatStep].key;

    const newData = { ...inquiryData, [currentKey]: userMsg };
    setInquiryData(newData);

    const nextStep = chatStep + 1;

    if (nextStep < INQUIRY_STEPS.length) {
      setChatMessages(prev => [
        ...prev,
        { type: 'user', text: userMsg },
        { type: 'bot', text: INQUIRY_STEPS[nextStep].question },
      ]);
      setChatStep(nextStep);
    } else {
      setChatMessages(prev => [
        ...prev,
        { type: 'user', text: userMsg },
        { type: 'bot', text: '입력해주신 내용을 확인해주세요.' },
      ]);
      setChatStep(nextStep);
    }

    setChatInput('');
  };

  const handleSendEmail = () => {
    const subject = `[단체주문 문의] ${inquiryData.org}`;
    const body = [
      `팀(단체)명: ${inquiryData.org}`,
      `담당자: ${inquiryData.contact}`,
      `연락처: ${inquiryData.phone}`,
      `주문 내용: ${inquiryData.product}`,
      `추가 요청: ${inquiryData.message}`,
    ].join('\n');

    window.location.href = `mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    setChatMessages(prev => [
      ...prev,
      { type: 'bot', text: '메일 앱이 열렸습니다.\n전송해주시면 빠르게 답변드리겠습니다!' },
    ]);
    setInquirySent(true);
  };

  const handleInquiryReset = () => {
    setChatMessages([{ type: 'bot', text: INQUIRY_STEPS[0].question }]);
    setChatStep(0);
    setChatInput('');
    setInquiryData({});
    setInquirySent(false);
  };

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber || !phone) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber, phone }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error);
        return;
      }

      setResult(data.order);
      setTrackView('result');
    } catch {
      setError('조회에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError('');
    setOrderNumber('');
    setPhone('');
    setTrackView('form');
    resetReturnForm();
  };

  const resetReturnForm = () => {
    setReturnSelectedItem(null);
    setReturnType('');
    setReturnExchangeSize('');
    setReturnReason('');
    setReturnRefundBank('');
    setReturnRefundAccount('');
    setReturnRefundHolder('');
    setReturnStep(0);
    setReturnLoading(false);
    setReturnError('');
    setReturnRequestNumber('');
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  // 교환/반품 신청 가능 여부 확인
  const canRequestReturn = () => {
    if (!result || result.status !== '배송완료') return false;
    if (!result.delivered_at) return false;
    const deliveredDate = new Date(result.delivered_at);
    const now = new Date();
    const diffDays = (now.getTime() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= RETURN_POLICY.windowDays;
  };

  // 이미 활성 교환/반품 요청이 있는 아이템인지 확인
  const hasActiveReturn = (itemId: string) => {
    if (!result?.return_requests) return false;
    return result.return_requests.some(
      (r) => r.order_item_id === itemId && !['처리완료', '거절'].includes(r.status)
    );
  };

  // 해당 상품의 사이즈 정보 가져오기
  const getProductSizes = (productName: string) => {
    const product = Object.values(products).find((p) => p.name === productName);
    if (!product) return { sizes: [], soldOut: [], delayedShipping: [] };

    const soldOut = product.sizes.filter(
      (s) => sizeStatuses[`${product.id}-${s}`] === 'sold_out'
    );
    const delayedShipping = product.sizes.filter(
      (s) => sizeStatuses[`${product.id}-${s}`] === 'delayed'
    );
    return { sizes: product.sizes, soldOut, delayedShipping };
  };

  // 교환/반품 신청 제출
  const handleReturnSubmit = async () => {
    if (!result || !returnSelectedItem || !returnType || !returnReason) return;

    setReturnLoading(true);
    setReturnError('');

    try {
      const body: Record<string, unknown> = {
        orderNumber: result.order_number,
        phone,
        orderItemId: returnSelectedItem.id,
        type: returnType,
        reason: returnReason,
        quantity: returnSelectedItem.quantity,
      };

      if (returnType === '교환') {
        body.exchangeSize = returnExchangeSize;
      } else {
        body.refundBank = returnRefundBank;
        body.refundAccount = returnRefundAccount;
        body.refundHolder = returnRefundHolder;
      }

      const response = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        setReturnError(data.error);
        return;
      }

      setReturnRequestNumber(data.requestNumber);
      setTrackView('returnSubmitted');
    } catch {
      setReturnError('신청에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setReturnLoading(false);
    }
  };

  // 교환/반품 폼 다음 단계 가능 여부
  const canNextReturnStep = () => {
    switch (returnStep) {
      case 0: return !!returnSelectedItem;
      case 1: return !!returnType;
      case 2:
        if (returnType === '교환') return !!returnExchangeSize;
        if (returnType === '반품') return !!returnRefundBank && !!returnRefundAccount && !!returnRefundHolder;
        return false;
      case 3: return !!returnReason.trim();
      default: return false;
    }
  };

  const isInquiryComplete = chatStep >= INQUIRY_STEPS.length && !inquirySent;

  // 교환/반품 신청 폼 렌더링
  const renderReturnForm = () => {
    if (!result) return null;

    return (
      <div className={styles.returnForm}>
        <div className={styles.returnHeader}>
          <button className={styles.returnBackButton} onClick={() => { setTrackView('result'); resetReturnForm(); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h4 className={styles.returnTitle}>교환/반품 신청</h4>
        </div>

        {returnError && <div className={styles.error}>{returnError}</div>}

        {/* 스텝 인디케이터 */}
        <div className={styles.returnSteps}>
          {['상품', '유형', returnType === '교환' ? '사이즈' : '계좌', '사유'].map((label, i) => (
            <div key={i} className={`${styles.returnStepDot} ${i <= returnStep ? styles.returnStepActive : ''}`}>
              <span>{i + 1}</span>
              <span className={styles.returnStepLabel}>{label}</span>
            </div>
          ))}
        </div>

        {/* Step 0: 아이템 선택 */}
        {returnStep === 0 && (
          <div className={styles.returnStepContent}>
            <p className={styles.returnStepTitle}>교환/반품할 상품을 선택해주세요</p>
            {result.order_items.map((item) => {
              const active = hasActiveReturn(item.id);
              return (
                <button
                  key={item.id}
                  className={`${styles.returnItemCard} ${returnSelectedItem?.id === item.id ? styles.returnItemCardActive : ''}`}
                  onClick={() => !active && setReturnSelectedItem(item)}
                  disabled={active}
                >
                  <div className={styles.returnItemInfo}>
                    <span className={styles.returnItemName}>{item.product_name}</span>
                    <span className={styles.returnItemMeta}>{item.size} / {item.quantity}개 / ₩{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                  {active && <span className={styles.returnItemBadge}>진행중</span>}
                </button>
              );
            })}
          </div>
        )}

        {/* Step 1: 유형 선택 */}
        {returnStep === 1 && (
          <div className={styles.returnStepContent}>
            <p className={styles.returnStepTitle}>요청 유형을 선택해주세요</p>
            <div className={styles.returnTypeGroup}>
              <button
                className={`${styles.returnTypeButton} ${returnType === '교환' ? styles.returnTypeActive : ''}`}
                onClick={() => { setReturnType('교환'); setReturnExchangeSize(''); }}
              >
                <span className={styles.returnTypeIcon}>&#8644;</span>
                <span className={styles.returnTypeLabel}>교환</span>
                <span className={styles.returnTypeDesc}>같은 상품, 다른 사이즈</span>
              </button>
              <button
                className={`${styles.returnTypeButton} ${returnType === '반품' ? styles.returnTypeActive : ''}`}
                onClick={() => { setReturnType('반품'); setReturnRefundBank(''); setReturnRefundAccount(''); setReturnRefundHolder(''); }}
              >
                <span className={styles.returnTypeIcon}>&#8629;</span>
                <span className={styles.returnTypeLabel}>반품</span>
                <span className={styles.returnTypeDesc}>환불 처리</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: 교환 사이즈 or 환불 계좌 */}
        {returnStep === 2 && returnType === '교환' && returnSelectedItem && (
          <div className={styles.returnStepContent}>
            <p className={styles.returnStepTitle}>교환 희망 사이즈를 선택해주세요</p>
            <div className={styles.returnSizeGrid}>
              {(() => {
                const productSizes = getProductSizes(returnSelectedItem.product_name);
                return productSizes.sizes.map((size) => {
                  const isSoldOut = productSizes.soldOut.includes(size);
                  const isDelayed = productSizes.delayedShipping.includes(size);
                  const isCurrent = size === returnSelectedItem.size;
                  return (
                    <button
                      key={size}
                      className={`${styles.returnSizeButton} ${returnExchangeSize === size ? styles.returnSizeActive : ''} ${isSoldOut || isCurrent ? styles.returnSizeDisabled : ''}`}
                      onClick={() => {
                        if (isSoldOut || isCurrent) return;
                        if (isDelayed) {
                          if (confirm('해당 사이즈는 교환 후 약 3주 뒤 발송됩니다.\n교환하시겠습니까?')) {
                            setReturnExchangeSize(size);
                          }
                          return;
                        }
                        setReturnExchangeSize(size);
                      }}
                      disabled={isSoldOut || isCurrent}
                    >
                      {size}
                      {isCurrent && <span className={styles.returnSizeTag}>현재</span>}
                      {isSoldOut && !isCurrent && <span className={styles.returnSizeTag}>품절</span>}
                      {isDelayed && !isCurrent && !isSoldOut && <span className={styles.returnSizeTag}>3주 뒤 발송</span>}
                    </button>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {returnStep === 2 && returnType === '반품' && (
          <div className={styles.returnStepContent}>
            <p className={styles.returnStepTitle}>환불 받으실 계좌 정보를 입력해주세요</p>
            <div className={styles.inputGroup}>
              <label>은행</label>
              <select
                className={styles.returnSelect}
                value={returnRefundBank}
                onChange={(e) => setReturnRefundBank(e.target.value)}
              >
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
                value={returnRefundAccount}
                onChange={(e) => setReturnRefundAccount(e.target.value)}
              />
            </div>
            <div className={styles.inputGroup}>
              <label>예금주</label>
              <input
                type="text"
                placeholder="예금주명"
                value={returnRefundHolder}
                onChange={(e) => setReturnRefundHolder(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Step 3: 사유 */}
        {returnStep === 3 && (
          <div className={styles.returnStepContent}>
            <p className={styles.returnStepTitle}>{returnType} 사유를 입력해주세요</p>
            <textarea
              className={styles.returnTextarea}
              placeholder="사유를 입력해주세요"
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              rows={3}
            />
          </div>
        )}

        {/* Step 4: 확인 */}
        {returnStep === 4 && returnSelectedItem && (
          <div className={styles.returnStepContent}>
            <p className={styles.returnStepTitle}>신청 내용을 확인해주세요</p>
            <div className={styles.returnSummary}>
              <div className={styles.summaryRow}>
                <span>유형</span>
                <span>{returnType}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>상품</span>
                <span>{returnSelectedItem.product_name}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>사이즈</span>
                <span>{returnSelectedItem.size}{returnType === '교환' ? ` → ${returnExchangeSize}` : ''}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>{returnType === '교환' ? '교환 배송비' : '반품 배송비'}</span>
                <span>₩{(returnType === '교환' ? RETURN_POLICY.exchangeShippingFee : RETURN_POLICY.returnShippingFee).toLocaleString()}</span>
              </div>
              {returnType === '반품' && (
                <>
                  <div className={styles.summaryRow}>
                    <span>상품 금액</span>
                    <span>₩{(returnSelectedItem.price * returnSelectedItem.quantity).toLocaleString()}</span>
                  </div>
                  <div className={styles.summaryRow} style={{ fontWeight: 700 }}>
                    <span>환불 예상 금액</span>
                    <span>₩{(returnSelectedItem.price * returnSelectedItem.quantity - RETURN_POLICY.returnShippingFee).toLocaleString()}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>환불 계좌</span>
                    <span>{returnRefundBank} {returnRefundAccount}</span>
                  </div>
                </>
              )}
              <div className={styles.summaryRow}>
                <span>사유</span>
                <span>{returnReason}</span>
              </div>
            </div>
          </div>
        )}

        {/* 하단 버튼 */}
        <div className={styles.returnActions}>
          {returnStep > 0 && returnStep < 5 && (
            <button className={styles.returnPrevButton} onClick={() => setReturnStep(returnStep - 1)}>
              이전
            </button>
          )}
          {returnStep < 4 && (
            <button
              className={styles.returnNextButton}
              onClick={() => setReturnStep(returnStep + 1)}
              disabled={!canNextReturnStep()}
            >
              다음
            </button>
          )}
          {returnStep === 4 && (
            <button
              className={styles.returnSubmitButton}
              onClick={handleReturnSubmit}
              disabled={returnLoading}
            >
              {returnLoading ? '신청 중...' : '신청하기'}
            </button>
          )}
        </div>
      </div>
    );
  };

  // 교환/반품 신청 완료 뷰
  const renderReturnSubmitted = () => (
    <div className={styles.returnSubmittedView}>
      <div className={styles.returnSuccessIcon}>&#10003;</div>
      <h4 className={styles.returnSuccessTitle}>{returnType} 신청이 접수되었습니다</h4>
      <div className={styles.returnSuccessInfo}>
        <div className={styles.summaryRow}>
          <span>접수번호</span>
          <span>{returnRequestNumber}</span>
        </div>
        <div className={styles.summaryRow}>
          <span>상태</span>
          <span>접수완료</span>
        </div>
      </div>
      <p className={styles.returnSuccessDesc}>
        접수된 요청은 확인 후 순차적으로 처리됩니다.
        주문 조회에서 처리 상태를 확인하실 수 있습니다.
      </p>
      <button className={styles.resetButton} onClick={handleReset}>
        확인
      </button>
    </div>
  );

  // 교환/반품 현황 카드 렌더링
  const renderReturnRequests = () => {
    if (!result?.return_requests?.length) return null;

    return (
      <div className={styles.returnStatusSection}>
        <h4>교환/반품 현황</h4>
        {result.return_requests.map((req) => {
          const item = result.order_items.find((i) => i.id === req.order_item_id);
          const statusStyle = RETURN_STATUS_LABELS[req.status] || { color: '#888', bg: 'rgba(136,136,136,0.15)' };
          return (
            <div key={req.request_number} className={styles.returnStatusCard}>
              <div className={styles.returnStatusTop}>
                <span
                  className={styles.returnTypeBadge}
                  style={{ background: req.type === '교환' ? 'rgba(0,122,255,0.15)' : 'rgba(255,149,0,0.15)', color: req.type === '교환' ? '#007aff' : '#ff9500' }}
                >
                  {req.type}
                </span>
                <span
                  className={styles.returnStatusBadge}
                  style={{ background: statusStyle.bg, color: statusStyle.color }}
                >
                  {req.status}
                  {req.type === '반품' && req.refund_completed && req.status === '처리완료' && ' (환불완료)'}
                </span>
              </div>
              <div className={styles.returnStatusDetails}>
                {item && <span>{item.product_name} ({item.size}){req.exchange_size ? ` → ${req.exchange_size}` : ''}</span>}
                <span className={styles.returnStatusDate}>{formatDate(req.created_at)}</span>
              </div>
              {req.status === '거절' && req.reject_reason && (
                <div className={styles.returnRejectReason}>거절 사유: {req.reject_reason}</div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {isOpen && (
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div className={styles.tabs}>
              <button
                className={`${styles.tab} ${activeTab === 'track' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('track')}
              >
                배송 조회
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'inquiry' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('inquiry')}
              >
                단체주문 문의
              </button>
            </div>
            <button className={styles.closeButton} onClick={() => setIsOpen(false)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className={styles.panelBody}>
            {activeTab === 'track' ? (
              <>
                {trackView === 'form' && (
                  <form onSubmit={handleTrack}>
                    {error && <div className={styles.error}>{error}</div>}
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
                    <button type="submit" className={styles.trackButton} disabled={loading}>
                      {loading ? '조회 중...' : '조회하기'}
                    </button>
                    <a href="/tracking" className={styles.pageLink}>
                      페이지에서 조회하기
                    </a>
                  </form>
                )}

                {trackView === 'result' && result && (
                  <div className={styles.result}>
                    <span className={`${styles.statusBadge} ${styles[`status${result.status}`]}`}>
                      {result.status}
                    </span>

                    <div className={styles.orderInfo}>
                      <div className={styles.orderRow}>
                        <span>주문번호</span>
                        <span>{result.order_number}</span>
                      </div>
                      {result.tracking_number && (
                        <>
                          <div className={styles.orderRow}>
                            <span>택배사</span>
                            <span>{TRACKING.defaultCarrier}</span>
                          </div>
                          <div className={styles.orderRow}>
                            <span>운송장번호</span>
                            <a
                              href={`${TRACKING.cjBaseUrl}${encodeURIComponent(result.tracking_number)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.trackingNumber}
                              style={{ color: '#5856d6', textDecoration: 'underline', cursor: 'pointer' }}
                            >
                              {result.tracking_number}
                            </a>
                          </div>
                        </>
                      )}
                      <div className={styles.orderRow}>
                        <span>주문일</span>
                        <span>{formatDate(result.created_at)}</span>
                      </div>
                      <div className={styles.orderRow}>
                        <span>결제금액</span>
                        <span>{`₩${result.total_amount.toLocaleString()}`}</span>
                      </div>
                    </div>

                    {result.order_items.length > 0 && (
                      <div className={styles.itemsList}>
                        <h4>주문 상품</h4>
                        {result.order_items.map((item, i) => (
                          <div key={i} className={styles.item}>
                            {item.product_name} <span>/ {item.size} / {item.quantity}개</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {renderReturnRequests()}

                    {canRequestReturn() && (
                      <button
                        className={styles.returnButton}
                        onClick={() => { setTrackView('returnForm'); resetReturnForm(); }}
                      >
                        교환/반품 신청
                      </button>
                    )}

                    <button className={styles.resetButton} onClick={handleReset}>
                      다른 주문 조회
                    </button>
                  </div>
                )}

                {trackView === 'returnForm' && renderReturnForm()}

                {trackView === 'returnSubmitted' && renderReturnSubmitted()}
              </>
            ) : (
              <div className={styles.chatContainer}>
                <div className={styles.chatMessages}>
                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`${styles.chatBubble} ${msg.type === 'bot' ? styles.botBubble : styles.userBubble}`}
                    >
                      {msg.text.split('\n').map((line, j) => (
                        <span key={j}>
                          {line}
                          {j < msg.text.split('\n').length - 1 && <br />}
                        </span>
                      ))}
                    </div>
                  ))}

                  {isInquiryComplete && (
                    <div className={styles.inquirySummary}>
                      <div className={styles.summaryRow}>
                        <span>팀(단체)명</span>
                        <span>{inquiryData.org}</span>
                      </div>
                      <div className={styles.summaryRow}>
                        <span>담당자</span>
                        <span>{inquiryData.contact}</span>
                      </div>
                      <div className={styles.summaryRow}>
                        <span>연락처</span>
                        <span>{inquiryData.phone}</span>
                      </div>
                      <div className={styles.summaryRow}>
                        <span>주문 내용</span>
                        <span>{inquiryData.product}</span>
                      </div>
                      <div className={styles.summaryRow}>
                        <span>추가 요청</span>
                        <span>{inquiryData.message}</span>
                      </div>
                      <div className={styles.summaryActions}>
                        <button className={styles.summaryResetButton} onClick={handleInquiryReset}>
                          다시 작성
                        </button>
                        <button className={styles.sendEmailButton} onClick={handleSendEmail}>
                          메일 보내기
                        </button>
                      </div>
                    </div>
                  )}

                  {inquirySent && (
                    <button className={styles.resetButton} onClick={handleInquiryReset} style={{ marginTop: 12 }}>
                      새 문의하기
                    </button>
                  )}

                  <div ref={chatEndRef} />
                </div>

                {chatStep < INQUIRY_STEPS.length && !inquirySent && (
                  <form className={styles.chatInputArea} onSubmit={handleChatSubmit}>
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="입력해주세요..."
                      autoFocus
                    />
                    <button type="submit" disabled={!chatInput.trim()}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <button
        className={styles.fab}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="주문 도우미"
      >
        {isOpen ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>
    </>
  );
}
