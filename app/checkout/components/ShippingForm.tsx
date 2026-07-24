'use client';

import { useRef, useState } from 'react';
import type { CheckoutFormData } from '../types';
import styles from '../checkout-page.module.css';

// 이메일 도메인 빠른 입력 버튼용
const EMAIL_DOMAINS = ['naver.com', 'gmail.com', 'daum.net', 'kakao.com'];

// 오타 제안(did-you-mean)에 사용할 전체 도메인 목록
const KNOWN_EMAIL_DOMAINS = [
  'naver.com', 'gmail.com', 'daum.net', 'kakao.com', 'hanmail.net',
  'nate.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'yahoo.com',
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[a.length][b.length];
}

// 흔한 도메인 오타를 가장 가까운 정상 도메인으로 교정 제안한다. (예: gmial.com → gmail.com)
function suggestEmail(email: string): string | null {
  const at = email.lastIndexOf('@');
  if (at < 1) return null;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1).toLowerCase();
  if (!domain || KNOWN_EMAIL_DOMAINS.includes(domain)) return null;

  let best: string | null = null;
  let bestDist = 3;
  for (const known of KNOWN_EMAIL_DOMAINS) {
    const dist = levenshtein(domain, known);
    if (dist > 0 && dist < bestDist) {
      bestDist = dist;
      best = known;
    }
  }
  return best && bestDist <= 2 ? `${local}@${best}` : null;
}

const DELIVERY_NOTE_PRESETS = [
  '문 앞에 놓아주세요',
  '경비실에 맡겨주세요',
  '택배함에 넣어주세요',
  '부재 시 경비실에 맡겨주세요',
  '직접 받겠습니다',
  '직접 입력',
];

export interface SavedShippingInfo {
  name: string;
  phone: string;
  email: string;
  postalCode: string;
  address: string;
  addressDetail: string;
}

interface ShippingFormProps {
  formData: CheckoutFormData;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onAddressSearch: () => void;
  savedInfo: SavedShippingInfo | null;
  onUseSavedInfo: () => void;
}

export function ShippingForm({ formData, onInputChange, onAddressSearch, savedInfo, onUseSavedInfo }: ShippingFormProps) {
  const [usingSaved, setUsingSaved] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuggestion, setEmailSuggestion] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  const setEmail = (value: string) => {
    setEmailError(null);
    setEmailSuggestion(null);
    onInputChange({
      target: { name: 'email', value },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmailError(null);
    setEmailSuggestion(null);
    onInputChange(e);
  };

  const validateEmail = () => {
    const value = formData.email.trim();
    setEmailError(value && !EMAIL_PATTERN.test(value) ? '올바른 이메일 주소를 입력해 주세요.' : null);
    setEmailSuggestion(value ? suggestEmail(value) : null);
  };

  // 도메인 빠른 입력: 현재 입력값의 로컬 파트를 유지하고 도메인만 붙인다.
  const applyDomain = (domain: string) => {
    const localPart = formData.email.split('@')[0];
    if (!localPart) {
      emailRef.current?.focus();
      return;
    }
    setEmail(`${localPart}@${domain}`);
  };

  const handleUseSavedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsingSaved(e.target.checked);
    if (e.target.checked) {
      setEmailError(null);
      onUseSavedInfo();
    }
  };

  return (
    <section className={styles.formSection}>
      <h2>배송 정보</h2>

      {savedInfo && (
        <label className={styles.savedInfoCheckbox}>
          <input
            type="checkbox"
            checked={usingSaved}
            onChange={handleUseSavedChange}
          />
          <span>이전 배송정보 사용하기 ({savedInfo.name} / {savedInfo.phone})</span>
        </label>
      )}
      <div className={styles.formGroup}>
        <label htmlFor="name">이름 *</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={onInputChange}
          autoComplete="name"
          required
        />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="phone">전화번호 *</label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={onInputChange}
          placeholder="010-0000-0000"
          autoComplete="tel"
          required
        />
        <p className={styles.fieldHint}>배송·반품 연락 외에는 사용하지 않으며, 마케팅 문자는 발송하지 않습니다.</p>
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="email">이메일 *</label>
        <input
          ref={emailRef}
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleEmailChange}
          onBlur={validateEmail}
          placeholder="example@naver.com"
          autoComplete="email"
          inputMode="email"
          required
        />
        <div className={styles.emailDomainRow}>
          {EMAIL_DOMAINS.map((domain) => (
            <button
              key={domain}
              type="button"
              className={styles.emailDomainButton}
              onClick={() => applyDomain(domain)}
            >
              @{domain}
            </button>
          ))}
        </div>
        {emailError && <p className={styles.emailError}>{emailError}</p>}
        {emailSuggestion && (
          <p className={styles.emailSuggestion}>
            혹시{' '}
            <button type="button" className={styles.emailSuggestionButton} onClick={() => setEmail(emailSuggestion)}>
              {emailSuggestion}
            </button>
            {' '}아닌가요?
          </p>
        )}
        <p className={styles.fieldHint}>주문 확인서 및 배송 알림이 이 주소로 발송됩니다. 정확히 입력해 주세요.</p>
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="postalCode">우편번호 *</label>
        <div className={styles.addressSearch}>
          <input
            type="text"
            id="postalCode"
            name="postalCode"
            value={formData.postalCode}
            onChange={onInputChange}
            placeholder="우편번호"
            readOnly
            required
          />
          <button
            type="button"
            onClick={onAddressSearch}
            className={styles.searchButton}
          >
            주소 검색
          </button>
        </div>
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="address">주소 *</label>
        <input
          type="text"
          id="address"
          name="address"
          value={formData.address}
          onChange={onInputChange}
          placeholder="주소 검색 버튼을 클릭하세요"
          readOnly
          required
        />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="addressDetail">상세주소</label>
        <input
          type="text"
          id="addressDetail"
          name="addressDetail"
          value={formData.addressDetail}
          onChange={onInputChange}
        />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="deliveryNote">배송 시 요청사항</label>
        <DeliveryNoteField value={formData.deliveryNote} onChange={onInputChange} />
      </div>
    </section>
  );
}

function DeliveryNoteField({
  value,
  onChange,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}) {
  const isCustom = value !== '' && !DELIVERY_NOTE_PRESETS.slice(0, -1).includes(value);
  const [showCustom, setShowCustom] = useState(isCustom);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === '직접 입력') {
      setShowCustom(true);
      onChange({ target: { name: 'deliveryNote', value: '' } } as React.ChangeEvent<HTMLInputElement>);
    } else {
      setShowCustom(false);
      onChange({ target: { name: 'deliveryNote', value: e.target.value } } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  const selectValue = showCustom ? '직접 입력' : (value || '');

  return (
    <>
      <select value={selectValue} onChange={handleSelectChange}>
        <option value="">선택하세요</option>
        {DELIVERY_NOTE_PRESETS.map((preset) => (
          <option key={preset} value={preset}>{preset}</option>
        ))}
      </select>
      {showCustom && (
        <input
          type="text"
          name="deliveryNote"
          value={value}
          onChange={onChange}
          placeholder="요청사항을 직접 입력해주세요"
          style={{ marginTop: '8px' }}
        />
      )}
    </>
  );
}
