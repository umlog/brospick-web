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
  onConsentChange: (field: 'privacyConsent' | 'thirdPartyConsent' | 'marketingConsent', checked: boolean) => void;
  onAllConsentChange: (checked: boolean) => void;
}

const CONSENT_ITEMS = [
  {
    field: 'privacyConsent' as const,
    label: '개인정보 수집·이용 동의',
    required: true,
    summary: '이름, 연락처, 이메일, 배송주소를 주문처리 및 배송 목적으로 수집합니다. (보유: 5년)',
    detail: (
      <>
        <table>
          <tbody>
            <tr><th>수집 항목</th><td>이름, 연락처, 이메일, 배송주소, 입금자명</td></tr>
            <tr><th>이용 목적</th><td>주문 처리, 배송, 고객 상담, 주문 확인서 발송</td></tr>
            <tr><th>보유 기간</th><td>전자상거래법에 따라 5년 보관 후 파기</td></tr>
          </tbody>
        </table>
        <p>※ 동의를 거부할 수 있으나, 거부 시 주문이 불가합니다.</p>
      </>
    ),
  },
  {
    field: 'thirdPartyConsent' as const,
    label: '개인정보 제3자 제공 동의',
    required: true,
    summary: '배송을 위해 택배사에 이름·연락처·주소를 제공합니다.',
    detail: (
      <>
        <table>
          <tbody>
            <tr><th>제공 대상</th><td>택배사 (CJ대한통운 등)</td></tr>
            <tr><th>제공 항목</th><td>수령인 이름, 연락처, 배송주소</td></tr>
            <tr><th>이용 목적</th><td>상품 배송</td></tr>
            <tr><th>보유 기간</th><td>배송 완료 후 즉시 파기</td></tr>
          </tbody>
        </table>
        <p>※ 동의를 거부할 수 있으나, 거부 시 배송이 불가합니다.</p>
      </>
    ),
  },
  {
    field: 'marketingConsent' as const,
    label: '마케팅 정보 수신 동의',
    required: false,
    summary: 'SMS·이메일로 신상품, 이벤트 및 할인 정보를 받아보실 수 있습니다.',
    detail: (
      <>
        <table>
          <tbody>
            <tr><th>수신 채널</th><td>SMS, 이메일</td></tr>
            <tr><th>내용</th><td>신상품 출시, 프로모션, 할인 쿠폰, 이벤트 안내</td></tr>
            <tr><th>보유 기간</th><td>동의 철회 시까지</td></tr>
          </tbody>
        </table>
        <p>※ 동의하지 않아도 주문·배송 서비스 이용에 불이익이 없습니다.</p>
      </>
    ),
  },
];

export function PaymentSection({ formData, onInputChange, onConsentChange, onAllConsentChange }: PaymentSectionProps) {
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const allChecked = formData.privacyConsent && formData.thirdPartyConsent && formData.marketingConsent;
  const allRequiredChecked = formData.privacyConsent && formData.thirdPartyConsent;

  const consentValues = {
    privacyConsent: formData.privacyConsent,
    thirdPartyConsent: formData.thirdPartyConsent,
    marketingConsent: formData.marketingConsent,
  };

  const toggleExpand = (field: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(field)) {
        next.delete(field);
      } else {
        next.add(field);
      }
      return next;
    });
  };

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
            <p className={styles.bankNotice}>{BANK.notice}</p>
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
      </section>

      <section className={styles.formSection}>
        <h2>약관 동의</h2>

        {/* 모두 동의 */}
        <div className={consentStyles.allConsentBox}>
          <label className={consentStyles.allConsentLabel}>
            <input
              type="checkbox"
              className={consentStyles.allConsentCheckbox}
              checked={allChecked}
              onChange={(e) => onAllConsentChange(e.target.checked)}
            />
            <span className={consentStyles.allConsentText}>전체 동의</span>
          </label>
          <p className={consentStyles.allConsentDesc}>
            필수 및 선택 항목에 모두 동의합니다.
          </p>
        </div>

        <div className={consentStyles.divider} />

        {/* 개별 동의 항목 */}
        <div className={consentStyles.consentList}>
          {CONSENT_ITEMS.map(({ field, label, required, summary, detail }) => {
            const isExpanded = expandedItems.has(field);
            const isChecked = consentValues[field];

            return (
              <div key={field} className={consentStyles.consentItem}>
                <div className={consentStyles.consentRow}>
                  <label className={consentStyles.consentLabel}>
                    <input
                      type="checkbox"
                      className={consentStyles.consentCheckbox}
                      checked={isChecked}
                      onChange={(e) => onConsentChange(field, e.target.checked)}
                    />
                    <span className={consentStyles.consentText}>
                      {label}
                      <span className={required ? consentStyles.requiredBadge : consentStyles.optionalBadge}>
                        {required ? '필수' : '선택'}
                      </span>
                    </span>
                  </label>
                  <button
                    type="button"
                    className={consentStyles.expandButton}
                    onClick={() => toggleExpand(field)}
                    aria-expanded={isExpanded}
                  >
                    {isExpanded ? '▲' : '▼'}
                  </button>
                </div>

                {!isExpanded && (
                  <p className={consentStyles.consentSummary}>{summary}</p>
                )}

                {isExpanded && (
                  <div className={consentStyles.consentDetail}>
                    {detail}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!allRequiredChecked && (
          <p className={consentStyles.requiredHint}>필수 항목에 동의해야 주문이 가능합니다.</p>
        )}

        <button
          type="button"
          className={consentStyles.policyLink}
          onClick={() => setShowPrivacyModal(true)}
        >
          개인정보 처리방침 전문 보기
        </button>
      </section>

      {showPrivacyModal && (
        <LegalModal type="privacy" onClose={() => setShowPrivacyModal(false)} />
      )}
    </>
  );
}
