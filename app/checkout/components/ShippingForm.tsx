'use client';

import { useState } from 'react';
import type { CheckoutFormData } from '../types';
import styles from '../checkout-page.module.css';

const EMAIL_DOMAINS = [
  'naver.com',
  'gmail.com',
  'daum.net',
  'kakao.com',
  'hanmail.net',
  'nate.com',
  'hotmail.com',
  'outlook.com',
  'icloud.com',
];

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
  const [emailUser, setEmailUser] = useState('');
  const [emailDomain, setEmailDomain] = useState('');
  const [isCustomDomain, setIsCustomDomain] = useState(false);
  const [usingSaved, setUsingSaved] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const isValidEmail = (user: string, domain: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(`${user}@${domain}`);

  const fireEmailChange = (user: string, domain: string) => {
    const combined = user && domain ? `${user}@${domain}` : '';
    onInputChange({
      target: { name: 'email', value: combined },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  const handleEmailUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const user = e.target.value;
    setEmailUser(user);
    setEmailError(null);
    fireEmailChange(user, emailDomain);
  };

  const handleEmailUserBlur = () => {
    if (emailUser && emailDomain) {
      setEmailError(isValidEmail(emailUser, emailDomain) ? null : '올바른 이메일 형식이 아닙니다.');
    } else if (emailUser && !emailDomain) {
      setEmailError('도메인을 선택하거나 입력해주세요.');
    }
  };

  const handleDomainSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === '__custom__') {
      setIsCustomDomain(true);
      setEmailDomain('');
      setEmailError(null);
      fireEmailChange(emailUser, '');
    } else {
      setIsCustomDomain(false);
      setEmailDomain(value);
      if (emailUser) {
        setEmailError(isValidEmail(emailUser, value) ? null : '올바른 이메일 형식이 아닙니다.');
      }
      fireEmailChange(emailUser, value);
    }
  };

  const handleCustomDomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const domain = e.target.value;
    setEmailDomain(domain);
    setEmailError(null);
    fireEmailChange(emailUser, domain);
  };

  const handleCustomDomainBlur = () => {
    if (emailUser && emailDomain) {
      setEmailError(isValidEmail(emailUser, emailDomain) ? null : '올바른 이메일 형식이 아닙니다.');
    }
  };

  const handleUseSavedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsingSaved(e.target.checked);
    if (e.target.checked) onUseSavedInfo();
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
          required
        />
        <p className={styles.fieldHint}>배송·반품 연락 외에는 사용하지 않으며, 마케팅 문자는 발송하지 않습니다.</p>
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="emailUser">이메일 *</label>
        <div className={styles.emailRow}>
          <input
            type="text"
            id="emailUser"
            value={emailUser}
            onChange={handleEmailUserChange}
            onBlur={handleEmailUserBlur}
            placeholder="이메일 아이디"
            required
            autoComplete="email"
          />
          <span className={styles.emailAt}>@</span>
          {isCustomDomain ? (
            <input
              type="text"
              value={emailDomain}
              onChange={handleCustomDomainChange}
              onBlur={handleCustomDomainBlur}
              placeholder="직접 입력"
              required
            />
          ) : (
            <select
              value={emailDomain}
              onChange={handleDomainSelectChange}
              required
            >
              <option value="" disabled>선택</option>
              {EMAIL_DOMAINS.map(domain => (
                <option key={domain} value={domain}>{domain}</option>
              ))}
              <option value="__custom__">직접 입력</option>
            </select>
          )}
        </div>
        {emailError && <p className={styles.emailError}>{emailError}</p>}
        <p className={styles.fieldHint}>주문 확인서 및 배송 알림이 이 주소로 발송됩니다.</p>
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
