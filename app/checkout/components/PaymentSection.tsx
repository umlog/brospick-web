import { BANK } from '../../../lib/constants';
import type { CheckoutFormData } from '../types';
import styles from '../checkout-page.module.css';

interface PaymentSectionProps {
  formData: CheckoutFormData;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export function PaymentSection({ formData, onInputChange }: PaymentSectionProps) {
  return (
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
    </section>
  );
}
