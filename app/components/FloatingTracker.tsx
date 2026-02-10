'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from './FloatingTracker.module.css';

type Tab = 'track' | 'inquiry';

interface OrderItem {
  product_name: string;
  size: string;
  quantity: number;
  price: number;
}

interface OrderResult {
  order_number: string;
  status: string;
  total_amount: number;
  shipping_fee: number;
  tracking_number: string | null;
  created_at: string;
  order_items: OrderItem[];
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

    window.location.href = `mailto:team.brospick@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

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
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  const isInquiryComplete = chatStep >= INQUIRY_STEPS.length && !inquirySent;

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
                {!result ? (
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
                  </form>
                ) : (
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
                        <div className={styles.orderRow}>
                          <span>운송장번호</span>
                          <span className={styles.trackingNumber}>{result.tracking_number}</span>
                        </div>
                      )}
                      <div className={styles.orderRow}>
                        <span>주문일</span>
                        <span>{formatDate(result.created_at)}</span>
                      </div>
                      <div className={styles.orderRow}>
                        <span>결제금액</span>
                        <span>{`\u20A9${result.total_amount.toLocaleString()}`}</span>
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

                    <button className={styles.resetButton} onClick={handleReset}>
                      다른 주문 조회
                    </button>
                  </div>
                )}
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
