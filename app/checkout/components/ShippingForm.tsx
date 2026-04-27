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

interface ShippingFormProps {
  formData: CheckoutFormData;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onAddressSearch: () => void;
}

export function ShippingForm({ formData, onInputChange, onAddressSearch }: ShippingFormProps) {
  const [emailUser, setEmailUser] = useState('');
  const [emailDomain, setEmailDomain] = useState('');
  const [isCustomDomain, setIsCustomDomain] = useState(false);

  const fireEmailChange = (user: string, domain: string) => {
    const combined = user && domain ? `${user}@${domain}` : '';
    onInputChange({
      target: { name: 'email', value: combined },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  const handleEmailUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const user = e.target.value;
    setEmailUser(user);
    fireEmailChange(user, emailDomain);
  };

  const handleDomainSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === '__custom__') {
      setIsCustomDomain(true);
      setEmailDomain('');
      fireEmailChange(emailUser, '');
    } else {
      setIsCustomDomain(false);
      setEmailDomain(value);
      fireEmailChange(emailUser, value);
    }
  };

  const handleCustomDomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const domain = e.target.value;
    setEmailDomain(domain);
    fireEmailChange(emailUser, domain);
  };

  return (
    <section className={styles.formSection}>
      <h2>배송 정보</h2>
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
          placeholder="배송 시 연락용으로 사용됩니다"
          required
        />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="emailUser">이메일 *</label>
        <div className={styles.emailRow}>
          <input
            type="text"
            id="emailUser"
            value={emailUser}
            onChange={handleEmailUserChange}
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
        <input
          type="text"
          id="deliveryNote"
          name="deliveryNote"
          value={formData.deliveryNote}
          onChange={onInputChange}
          placeholder="공동현관 비밀번호: 0000"
        />
      </div>
    </section>
  );
}
