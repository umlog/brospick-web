'use client';

import { useState, useEffect, useRef } from 'react';
import { BANK } from '@/lib/constants';
import { EBOOK } from '../ebook.config';
import styles from '../ebook-page.module.css';

const EBOOK_PRICE = EBOOK.phase1Price;

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

function OrderForm({ onSuccess }: { onSuccess: (orderNumber: string) => void }) {
  const [form, setForm] = useState<FormValues>({
    name: '',
    phone: '',
    email: '',
    privacyConsent: false,
    contactConsent: false,
  });
  const [state, setState] = useState<FormState>({ status: 'idle' });

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

      onSuccess(data.orderNumber);
    } catch {
      setState({ status: 'error', message: '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' });
    }
  }

  const isDisabled = state.status === 'submitting';
  const canSubmit =
    form.name.trim().length >= 2 &&
    form.phone.trim().length >= 10 &&
    form.email.includes('@') &&
    form.privacyConsent &&
    form.contactConsent;

  return (
    <form onSubmit={handleSubmit} className={styles.dialogForm} noValidate>
      <div className={styles.dialogBankInfo}>
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
        <div className={styles.bankInfoRow}>
          <span>입금액</span>
          <strong className={styles.bankAmount}>₩{EBOOK_PRICE.toLocaleString()}</strong>
        </div>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.formLabel} htmlFor="dlg-name">
          이름 <span className={styles.required}>*</span>
        </label>
        <input
          id="dlg-name"
          name="name"
          type="text"
          value={form.name}
          onChange={handleChange}
          placeholder="홍길동"
          className={styles.input}
          required
          disabled={isDisabled}
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.formLabel} htmlFor="dlg-phone">
          연락처 <span className={styles.required}>*</span>
        </label>
        <input
          id="dlg-phone"
          name="phone"
          type="tel"
          value={form.phone}
          onChange={handleChange}
          placeholder="010-1234-5678"
          className={styles.input}
          required
          disabled={isDisabled}
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.formLabel} htmlFor="dlg-email">
          이메일 <span className={styles.required}>*</span>
        </label>
        <input
          id="dlg-email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          placeholder="example@email.com"
          className={styles.input}
          required
          disabled={isDisabled}
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
            disabled={isDisabled}
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
            disabled={isDisabled}
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
        disabled={isDisabled || !canSubmit}
      >
        {state.status === 'submitting' ? '처리 중...' : `₩${EBOOK_PRICE.toLocaleString()} 구매하기`}
      </button>
    </form>
  );
}

function SuccessView({ orderNumber, onClose }: { orderNumber: string; onClose: () => void }) {
  return (
    <div className={styles.dialogSuccess}>
      <div className={styles.successIcon}>✓</div>
      <h3 className={styles.successTitle}>주문이 접수되었습니다!</h3>
      <p className={styles.successDesc}>
        입금 확인 후 이메일로 다운로드 링크를 보내드립니다.
      </p>

      <div className={styles.successOrderNumber}>
        <span className={styles.successOrderLabel}>주문번호</span>
        <span className={styles.successOrderValue}>{orderNumber}</span>
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

      <button className={styles.dialogCloseBtn} onClick={onClose}>
        닫기
      </button>
    </div>
  );
}

export default function EbookPurchaseDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [successOrder, setSuccessOrder] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // ESC 키로 닫기
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDialog();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  // 열릴 때 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  function openDialog() {
    setSuccessOrder(null);
    setIsOpen(true);
  }

  function closeDialog() {
    setIsOpen(false);
  }

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) closeDialog();
  }

  return (
    <>
      {/* 모바일 Sticky CTA 바 */}
      {!isOpen && (
        <div className={styles.stickyBar}>
          <div className={styles.stickyBarContent}>
            <div>
              <p className={styles.stickyBarTitle}>The Overseas Football Playbook</p>
              <p className={styles.stickyBarPrice}>
              <span style={{ textDecoration: 'line-through', opacity: 0.5, marginRight: 6, fontSize: '0.85em' }}>
                ₩{EBOOK.originalPrice.toLocaleString()}
              </span>
              ₩{EBOOK_PRICE.toLocaleString()}
            </p>
            </div>
            <button onClick={openDialog} className={styles.stickyBarBtn}>
              지금 구매하기
            </button>
          </div>
        </div>
      )}

      {/* CTA 버튼 */}
      <button onClick={openDialog} className={styles.heroCta}>
        지금 구매하기
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </button>

      {/* 다이얼로그 */}
      {isOpen && (
        <div className={styles.dialogOverlay} onClick={handleOverlayClick}>
          <div className={styles.dialog} ref={dialogRef} role="dialog" aria-modal="true">
            <div className={styles.dialogHeader}>
              <div>
                <p className={styles.dialogEyebrow}>GET THE BOOK</p>
                <h2 className={styles.dialogTitle}>전자책 구매하기</h2>
              </div>
              <button
                className={styles.dialogClose}
                onClick={closeDialog}
                aria-label="닫기"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className={styles.dialogBody}>
              {successOrder ? (
                <SuccessView orderNumber={successOrder} onClose={closeDialog} />
              ) : (
                <OrderForm onSuccess={(orderNumber) => setSuccessOrder(orderNumber)} />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
