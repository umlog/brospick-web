import type { CheckoutFormData } from '../types';
import styles from '../checkout-page.module.css';

interface ShippingFormProps {
  formData: CheckoutFormData;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onAddressSearch: () => void;
}

export function ShippingForm({ formData, onInputChange, onAddressSearch }: ShippingFormProps) {
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
        <label htmlFor="email">이메일 *</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={onInputChange}
          placeholder="주문 확인서를 받으실 이메일"
          required
        />
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
