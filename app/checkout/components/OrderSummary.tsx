import { CartItem } from '../../contexts/CartContext';
import { SHIPPING, REMOTE_AREA_SURCHARGE, getShippingFee, isRemoteArea } from '../../../lib/constants';
import { formatPrice } from '../utils';
import styles from '../checkout-page.module.css';

interface OrderSummaryProps {
  checkoutItems: CartItem[];
  totalPrice: number;
  postalCode?: string;
}

export function OrderSummary({ checkoutItems, totalPrice, postalCode }: OrderSummaryProps) {
  const remote = !!postalCode && isRemoteArea(postalCode);
  return (
    <div className={styles.orderSummary}>
      <h2>주문 요약</h2>
      <div className={styles.orderItems}>
        {checkoutItems.map((item, index) => (
          <div key={`${item.id}-${item.size}-${index}`} className={styles.orderItem}>
            <div className={styles.orderItemInfo}>
              <span className={styles.orderItemName}>{item.name}</span>
              <span className={styles.orderItemSize}>사이즈: {item.size}</span>
              <span className={styles.orderItemQuantity}>수량: {item.quantity}</span>
            </div>
            <span className={styles.orderItemPrice}>
              {formatPrice(item.price * item.quantity)}
            </span>
          </div>
        ))}
      </div>
      <div className={styles.orderTotal}>
        <div className={styles.totalRow}>
          <span>상품 금액</span>
          <span>{formatPrice(totalPrice)}</span>
        </div>
        <div className={styles.totalRow}>
          <span>배송비</span>
          {getShippingFee(totalPrice, postalCode) === 0 ? (
            <span style={{ color: '#2563eb', fontWeight: 600 }}>무료</span>
          ) : (
            <span>{formatPrice(SHIPPING.fee + (remote ? REMOTE_AREA_SURCHARGE.shipping : 0))}</span>
          )}
        </div>
        {remote && (
          <div className={styles.totalRow} style={{ color: '#dc2626', fontSize: '0.8rem' }}>
            <span>도서산간 추가배송비 포함</span>
            <span>+{formatPrice(REMOTE_AREA_SURCHARGE.shipping)}</span>
          </div>
        )}
        <div className={styles.totalDivider} />
        <div className={styles.totalRowFinal}>
          <span>총 결제 금액</span>
          <span>{formatPrice(totalPrice + getShippingFee(totalPrice, postalCode))}</span>
        </div>
      </div>
    </div>
  );
}
