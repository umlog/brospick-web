'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './custom-order.module.css';

type State = 'idle' | 'loading' | 'error';
type PaymentMethod = 'bank' | 'kakaopay';

// Window.daum 전역 타입은 app/checkout/types.ts에서 선언됨 (중복 선언 시 modifier 충돌)

const PRICE_PER_SET = 5000;
// 최소 주문 10세트(=50,000원)라 무료배송 기준(5만원 이상)을 항상 충족하므로 배송비 없음
const SHIPPING_FEE = 0;

export default function CustomOrderClient() {
  const router = useRouter();
  const [state, setState] = useState<State>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [address, setAddress] = useState('');
  const [addressDetail, setAddressDetail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank');
  const [depositorName, setDepositorName] = useState('');
  const [quantity, setQuantity] = useState(10);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [thirdPartyConsent, setThirdPartyConsent] = useState(false);

  function openAddressSearch() {
    if (!window.daum?.Postcode) return;
    new window.daum.Postcode({
      oncomplete: (data) => {
        const addr = data.userSelectedType === 'R' ? data.roadAddress : data.jibunAddress;
        setPostalCode(data.zonecode);
        setAddress(addr);
      },
    }).open();
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState('loading');
    setErrorMsg('');

    const formEl = e.currentTarget;
    const description = (formEl.elements.namedItem('description') as HTMLTextAreaElement).value.trim();
    const imageInput = formEl.elements.namedItem('image') as HTMLInputElement;

    const fd = new FormData();
    fd.append('description', description);
    fd.append('quantity', String(quantity));
    if (imageInput.files?.[0]) fd.append('image', imageInput.files[0]);
    fd.append('customerName', customerName);
    fd.append('customerPhone', customerPhone);
    fd.append('customerEmail', customerEmail);
    fd.append('postalCode', postalCode);
    fd.append('address', address);
    fd.append('addressDetail', addressDetail);
    fd.append('paymentMethod', paymentMethod);
    fd.append('depositorName', depositorName);
    fd.append('privacyConsent', String(privacyConsent));
    fd.append('thirdPartyConsent', String(thirdPartyConsent));

    try {
      const res = await fetch('/api/custom-order', { method: 'POST', body: fd });
      const data = await res.json();

      if (!res.ok) {
        setState('error');
        setErrorMsg(data.error || '전송 중 오류가 발생했습니다.');
        return;
      }

      if (data.type === 'kakao') {
        window.location.href = data.redirectUrl;
        return;
      }

      // 무통장입금
      const params = new URLSearchParams({
        method: 'bank',
        order: data.orderNumber,
        amount: String(data.totalAmount),
        shippingFee: String(data.shippingFee),
        depositor: depositorName || customerName,
      });
      router.push(`/order-complete?${params.toString()}`);
    } catch {
      setState('error');
      setErrorMsg('전송 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    }
  }

  const totalAmount = quantity * PRICE_PER_SET + SHIPPING_FEE;

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        {/* Hero */}
        <div className={styles.hero}>
          <p className={styles.eyebrow}>CUSTOM ORDER</p>
          <h1 className={styles.title}>BOOT SKIN 커스텀</h1>
          <p className={styles.subtitle}>나만의 디자인을 부츠에 새기세요.</p>
        </div>

        {/* Info badges */}
        <div className={styles.infoBadges}>
          <div className={styles.badge}>
            <span className={styles.badgeLabel}>최소 수량</span>
            <span className={styles.badgeValue}>10세트</span>
          </div>
          <div className={styles.badge}>
            <span className={styles.badgeLabel}>기본 사이즈</span>
            <span className={styles.badgeValue}>0.8cm × 1cm</span>
          </div>
          <div className={styles.badge}>
            <span className={styles.badgeLabel}>가격</span>
            <span className={styles.badgeValue}>1세트(2개입) 5,000원</span>
          </div>
        </div>

        {/* Highlight */}
        <div className={styles.highlight}>
          <span className={styles.highlightIcon}>★</span>
          <p>다른 로고로 <strong>최대 3종류까지 혼합</strong>하여 제작 가능합니다.</p>
        </div>

        {/* Notice */}
        <div className={styles.notice}>
          <p>인쇄 과정에서 새롭게 판을 제작해야 하기 때문에 <strong>최소 주문 수량은 10세트</strong>입니다.</p>
          <p>같은 디자인으로 재주문 시에는 추후 1세트씩 낱개 구매도 가능합니다.</p>
          <p>사이즈는 기본 가로 0.8cm × 세로 1cm로 제작되며, 별도 요청 주시면 적용 가능합니다.</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>

          {/* 디자인 정보 */}
          <p className={styles.sectionTitle}>디자인 정보</p>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="description">
              디자인 설명 <span className={styles.required}>*</span>
            </label>
            <textarea
              id="description"
              name="description"
              className={styles.textarea}
              placeholder="원하시는 디자인을 자세히 설명해 주세요. (예: 팀 이름, 번호, 로고 스타일, 색상 등)"
              rows={5}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="image">
              참고 이미지 <span className={styles.optional}>(선택)</span>
            </label>
            <input
              id="image"
              name="image"
              type="file"
              accept="image/*"
              className={styles.fileInput}
            />
            <p className={styles.fieldHint}>JPG, PNG, WEBP — 최대 5MB</p>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="quantity">
              수량 <span className={styles.required}>*</span>
            </label>
            <input
              id="quantity"
              name="quantity"
              type="number"
              min={10}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(10, parseInt(e.target.value) || 10))}
              className={styles.numberInput}
              required
            />
            <p className={styles.fieldHint}>최소 10세트부터 주문 가능합니다.</p>
          </div>

          {/* 배송 정보 */}
          <p className={styles.sectionTitle}>배송 정보</p>

          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="customerName">
                이름 <span className={styles.required}>*</span>
              </label>
              <input
                id="customerName"
                type="text"
                className={styles.input}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="홍길동"
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="customerPhone">
                연락처 <span className={styles.required}>*</span>
              </label>
              <input
                id="customerPhone"
                type="tel"
                className={styles.input}
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="010-0000-0000"
                required
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="customerEmail">
              이메일 <span className={styles.optional}>(선택)</span>
            </label>
            <input
              id="customerEmail"
              type="email"
              className={styles.input}
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="example@email.com"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              주소 <span className={styles.required}>*</span>
            </label>
            <div className={styles.addressRow}>
              <input
                type="text"
                className={styles.postcodeInput}
                value={postalCode}
                placeholder="우편번호"
                readOnly
                required
              />
              <button type="button" className={styles.postcodeBtn} onClick={openAddressSearch}>
                주소 검색
              </button>
            </div>
            <input
              type="text"
              className={styles.input}
              value={address}
              placeholder="기본 주소"
              readOnly
              required
            />
            <input
              type="text"
              className={styles.input}
              value={addressDetail}
              onChange={(e) => setAddressDetail(e.target.value)}
              placeholder="상세 주소 (동/호수 등)"
            />
          </div>

          {/* 결제 방법 */}
          <p className={styles.sectionTitle}>결제 방법</p>

          <div className={styles.paymentToggle}>
            <button
              type="button"
              className={paymentMethod === 'bank' ? `${styles.paymentOption} ${styles.paymentOptionActive}` : styles.paymentOption}
              onClick={() => setPaymentMethod('bank')}
            >
              무통장입금
            </button>
            <button
              type="button"
              className={paymentMethod === 'kakaopay' ? `${styles.paymentOption} ${styles.paymentOptionActive}` : styles.paymentOption}
              onClick={() => setPaymentMethod('kakaopay')}
            >
              카카오페이
            </button>
          </div>

          {paymentMethod === 'bank' && (
            <div className={styles.field}>
              <label className={styles.label} htmlFor="depositorName">
                입금자명 <span className={styles.optional}>(미입력 시 이름으로 처리)</span>
              </label>
              <input
                id="depositorName"
                type="text"
                className={styles.input}
                value={depositorName}
                onChange={(e) => setDepositorName(e.target.value)}
                placeholder={customerName || '홍길동'}
              />
            </div>
          )}

          {/* 주문 금액 */}
          <div className={styles.orderSummary}>
            <div className={styles.summaryRow}>
              <span>부츠스킨 커스텀 {quantity}세트</span>
              <span>{(quantity * PRICE_PER_SET).toLocaleString()}원</span>
            </div>
            <div className={styles.summaryRow}>
              <span>배송비</span>
              <span>무료</span>
            </div>
            <div className={styles.summaryTotal}>
              <span>총 결제금액</span>
              <span>{totalAmount.toLocaleString()}원</span>
            </div>
          </div>

          {/* 약관 동의 */}
          <div className={styles.consentSection}>
            <label className={styles.consentLabel}>
              <input
                type="checkbox"
                checked={privacyConsent}
                onChange={(e) => setPrivacyConsent(e.target.checked)}
                required
              />
              <span>[필수] 개인정보 수집 및 이용에 동의합니다.</span>
            </label>
            <label className={styles.consentLabel}>
              <input
                type="checkbox"
                checked={thirdPartyConsent}
                onChange={(e) => setThirdPartyConsent(e.target.checked)}
                required
              />
              <span>[필수] 개인정보 제3자 제공에 동의합니다.</span>
            </label>
          </div>

          {state === 'error' && <p className={styles.errorMsg}>{errorMsg}</p>}

          <button type="submit" className={styles.submitButton} disabled={state === 'loading' || !privacyConsent || !thirdPartyConsent}>
            {state === 'loading' ? '처리 중...' : paymentMethod === 'kakaopay' ? '카카오페이로 결제하기' : '주문하기'}
          </button>

          <Link href="/apparel" className={styles.backLink}>← 쇼핑 계속하기</Link>
        </form>
      </div>
    </main>
  );
}
