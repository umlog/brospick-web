'use client';

import { useState, useRef } from 'react';
import { BANK } from '@/lib/constants';
import styles from '../ebook-page.module.css';

// PLACEHOLDER — 실제 가격으로 교체
const EBOOK_PRICE = 29000;

type FormState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success'; orderNumber: string }
  | { status: 'error'; message: string };

interface FormValues {
  name: string;
  phone: string;
  email: string;
  privacyConsent: boolean;
  contactConsent: boolean;
}

export default function EbookOrderForm() {
  const [form, setForm] = useState<FormValues>({
    name: '',
    phone: '',
    email: '',
    privacyConsent: false,
    contactConsent: false,
  });
  const [state, setState] = useState<FormState>({ status: 'idle' });
  const formRef = useRef<HTMLElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state.status === 'submitting') return;

    setState({ status: 'submitting' });

    try {
      const res = await fetch('/api/ebook/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setState({ status: 'error', message: data.error || '오류가 발생했습니다.' });
        return;
      }

      setState({ status: 'success', orderNumber: data.orderNumber });
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch {
      setState({ status: 'error', message: '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' });
    }
  }

  if (state.status === 'success') {
    return (
      <div className={styles.successCard} ref={formRef as React.RefObject<HTMLDivElement>}>
        <div className={styles.successIcon}>✓</div>
        <h3 className={styles.successTitle}>주문이 접수되었습니다!</h3>
        <p className={styles.successDesc}>
          입금 확인 후 이메일로 다운로드 링크를 보내드립니다.
        </p>

        <div className={styles.successOrderNumber}>
          <span className={styles.successOrderLabel}>주문번호</span>
          <span className={styles.successOrderValue}>{state.orderNumber}</span>
        </div>

        <div className={styles.bankInfoBox}>
          <p className={styles.bankInfoTitle}>무통장 입금 안내</p>
          <div className={styles.bankInfoRow}>
            <span>은행명</span>
            <strong>{BANK.name}</strong>
          </div>
          <div className={styles.bankInfoRow}>
            <span>계좌번호</span>
            <strong>{BANK.account}</strong>
          </div>
          <div className={styles.bankInfoRow}>
            <span>예금주</span>
            <strong>{BANK.holder}</strong>
          </div>
          <div className={styles.bankInfoRow}>
            <span>입금액</span>
            <strong className={styles.bankAmount}>₩{EBOOK_PRICE.toLocaleString()}</strong>
          </div>
          <p className={styles.bankNotice}>
            ⚠ 주문 후 24시간 이내에 입금해주세요. 입금자명은 주문 시 입력하신 이름으로 해주세요.
          </p>
        </div>

        <p className={styles.successEmailNote}>
          주문 확인 이메일을 발송했습니다. 메일함을 확인해주세요.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.formWrapper}>
      {/* 가격 표시 */}
      <div className={styles.priceDisplay}>
        <span className={styles.priceLabel}>전자책 가격</span>
        <span className={styles.priceValue}>₩{EBOOK_PRICE.toLocaleString()}</span>
      </div>

      {/* 무통장 입금 계좌 미리 표시 */}
      <div className={styles.bankInfoBox}>
        <p className={styles.bankInfoTitle}>무통장 입금 계좌</p>
        <div className={styles.bankInfoRow}>
          <span>은행명</span>
          <strong>{BANK.name}</strong>
        </div>
        <div className={styles.bankInfoRow}>
          <span>계좌번호</span>
          <strong>{BANK.account}</strong>
        </div>
        <div className={styles.bankInfoRow}>
          <span>예금주</span>
          <strong>{BANK.holder}</strong>
        </div>
        <p className={styles.bankNotice}>
          아래 양식을 작성하고 제출하면 주문번호와 함께 상세 안내 메일을 보내드립니다.
        </p>
      </div>

      {/* 주문 양식 */}
      <form ref={formRef as React.RefObject<HTMLFormElement>} onSubmit={handleSubmit} className={styles.form} noValidate>
        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="name">
            이름 <span className={styles.required}>*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            placeholder="홍길동"
            className={styles.input}
            required
            disabled={state.status === 'submitting'}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="phone">
            연락처 <span className={styles.required}>*</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            placeholder="010-1234-5678"
            className={styles.input}
            required
            disabled={state.status === 'submitting'}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="email">
            이메일 <span className={styles.required}>*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="example@email.com"
            className={styles.input}
            required
            disabled={state.status === 'submitting'}
          />
          <p className={styles.inputHint}>다운로드 링크를 이 이메일로 보내드립니다.</p>
        </div>

        <div className={styles.consentGroup}>
          <label className={styles.checkboxLabel}>
            <input
              name="privacyConsent"
              type="checkbox"
              checked={form.privacyConsent}
              onChange={handleChange}
              className={styles.checkbox}
              required
              disabled={state.status === 'submitting'}
            />
            <span className={styles.checkboxText}>
              <strong>[필수]</strong> 개인정보 수집 및 이용에 동의합니다.
              <span className={styles.consentDetail}>
                (수집 항목: 이름·연락처·이메일 / 목적: 전자책 주문 처리 및 발송 / 보유기간: 1년)
              </span>
            </span>
          </label>

          <label className={styles.checkboxLabel}>
            <input
              name="contactConsent"
              type="checkbox"
              checked={form.contactConsent}
              onChange={handleChange}
              className={styles.checkbox}
              required
              disabled={state.status === 'submitting'}
            />
            <span className={styles.checkboxText}>
              <strong>[필수]</strong> 브로스픽이 입금 확인 및 다운로드 링크 전달을 위해 연락하는 것에 동의합니다.
            </span>
          </label>
        </div>

        {state.status === 'error' && (
          <p className={styles.errorMsg}>{state.message}</p>
        )}

        <button
          type="submit"
          className={styles.submitBtn}
          disabled={
            state.status === 'submitting' ||
            !form.name ||
            !form.phone ||
            !form.email ||
            !form.privacyConsent ||
            !form.contactConsent
          }
        >
          {state.status === 'submitting' ? '처리 중...' : `₩${EBOOK_PRICE.toLocaleString()} 구매하기`}
        </button>
      </form>
    </div>
  );
}
