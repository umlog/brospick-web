'use client';
import { useState } from 'react';
import { BANK } from '../../../lib/constants';
import type { CheckoutFormData } from '../types';
import { LegalModal } from '../../components/LegalModal';
import styles from '../checkout-page.module.css';
import consentStyles from './consent.module.css';

interface PaymentSectionProps {
  formData: CheckoutFormData;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onMarketingConsentChange: (checked: boolean) => void;
}

export function PaymentSection({ formData, onInputChange, onMarketingConsentChange }: PaymentSectionProps) {
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  return (
    <>
      <section className={styles.formSection}>
        <h2>결제 방법</h2>
        <div className={styles.bankInfo}>
          <div className={styles.bankLabel}>무통장입금</div>
          <div className={styles.bankDetails}>
            <p className={styles.bankAccount}>
              <span className={styles.bankName}>{BANK.name}</span>
              <span>{BANK.account} (예금주: {BANK.holder})</span>
            </p>
            <p className={styles.bankNotice}>
              {BANK.notice}
            </p>
          </div>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="depositorName">입금자명 *</label>
          <input
            type="text"
            id="depositorName"
            name="depositorName"
            value={formData.depositorName}
            onChange={onInputChange}
            placeholder="실제 입금하실 분의 이름"
            required
          />
        </div>

        <div className={consentStyles.consentBox}>
          <label className={consentStyles.consentLabel}>
            <input
              type="checkbox"
              className={consentStyles.consentCheckbox}
              checked={formData.marketingConsent}
              onChange={(e) => onMarketingConsentChange(e.target.checked)}
            />
            <span className={consentStyles.consentText}>
              <strong>마케팅 정보 수신 동의</strong>
              <span className={consentStyles.optionalBadge}>선택</span>
            </span>
          </label>
          <p className={consentStyles.consentDesc}>
            SMS·이메일로 신상품, 이벤트 및 할인 정보를 받아보실 수 있습니다.
            동의하지 않아도 주문·배송 서비스 이용에 불이익이 없습니다.
          </p>
          <button
            type="button"
            className={consentStyles.policyLink}
            onClick={() => setShowPrivacyModal(true)}
          >
            개인정보 처리방침 보기
          </button>
        </div>
      </section>

      {showPrivacyModal && (
        <LegalModal type="privacy" onClose={() => setShowPrivacyModal(false)} />
      )}
    </>
  );
}
