'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { useCart, CartItem } from '../contexts/CartContext';
import styles from './checkout-page.module.css';

declare global {
  interface Window {
    daum: any;
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const { clearCart } = useCart();
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    addressDetail: '',
    postalCode: '',
    depositorName: '',
  });

  useEffect(() => {
    const storedItems = sessionStorage.getItem('checkoutItems');
    if (storedItems) {
      try {
        const items = JSON.parse(storedItems);
        setCheckoutItems(items);
      } catch (error) {
        console.error('Failed to load checkout items', error);
        router.push('/cart');
      }
    } else {
      router.push('/cart');
    }
  }, [router]);

  const selectedTotalPrice = checkoutItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  if (checkoutItems.length === 0) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: formData.name,
          customerPhone: formData.phone,
          customerEmail: formData.email,
          postalCode: formData.postalCode,
          address: formData.address,
          addressDetail: formData.addressDetail,
          totalAmount: selectedTotalPrice,
          shippingFee: 0,
          depositorName: formData.depositorName,
          items: checkoutItems.map((item) => ({
            productName: item.name,
            size: item.size,
            quantity: item.quantity,
            price: item.price,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '주문에 실패했습니다.');
      }

      const data = await response.json();

      // 장바구니에서 구매한 상품 제거
      const currentCart = JSON.parse(localStorage.getItem('brospick-cart') || '[]');
      const remainingItems = currentCart.filter((item: CartItem) => {
        return !checkoutItems.some(
          (checkoutItem) =>
            checkoutItem.id === item.id &&
            checkoutItem.size === item.size &&
            checkoutItem.quantity === item.quantity
        );
      });

      const updatedItems = remainingItems
        .map((item: CartItem) => {
          const checkoutItem = checkoutItems.find(
            (ci) => ci.id === item.id && ci.size === item.size
          );
          if (checkoutItem && item.quantity > checkoutItem.quantity) {
            return { ...item, quantity: item.quantity - checkoutItem.quantity };
          }
          return item;
        })
        .filter((item: CartItem) => item.quantity > 0);

      localStorage.setItem('brospick-cart', JSON.stringify(updatedItems));
      sessionStorage.removeItem('checkoutItems');

      if (updatedItems.length === 0) {
        clearCart();
      }

      // 주문 완료 페이지로 이동
      sessionStorage.setItem(
        'orderComplete',
        JSON.stringify({
          orderNumber: data.orderNumber,
          totalAmount: data.totalAmount,
          shippingFee: data.shippingFee,
          depositorName: formData.depositorName,
        })
      );
      router.push('/order-complete');
    } catch (error) {
      alert(error instanceof Error ? error.message : '주문에 실패했습니다. 다시 시도해주세요.');
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openAddressSearch = () => {
    if (typeof window !== 'undefined' && window.daum && window.daum.Postcode) {
      new window.daum.Postcode({
        oncomplete: function (data: any) {
          let addr = '';
          let extraAddr = '';

          if (data.userSelectedType === 'R') {
            addr = data.roadAddress;
          } else {
            addr = data.jibunAddress;
          }

          if (data.userSelectedType === 'R') {
            if (data.bname !== '' && /[동|로|가]$/g.test(data.bname)) {
              extraAddr += data.bname;
            }
            if (data.buildingName !== '' && data.apartment === 'Y') {
              extraAddr += extraAddr !== '' ? ', ' + data.buildingName : data.buildingName;
            }
            if (extraAddr !== '') {
              extraAddr = ' (' + extraAddr + ')';
            }
          }

          setFormData((prev) => ({
            ...prev,
            postalCode: data.zonecode,
            address: addr + extraAddr,
          }));

          const addressDetailInput = document.getElementById('addressDetail') as HTMLInputElement;
          if (addressDetailInput) {
            addressDetailInput.focus();
          }
        },
        width: '100%',
        height: '100%',
      }).open();
    }
  };

  return (
    <>
      <Script
        src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
        strategy="lazyOnload"
      />
      <main className={styles.main}>
        <div className={styles.container}>
          <h1>결제</h1>

          <div className={styles.checkoutContent}>
            <form className={styles.checkoutForm} onSubmit={handleSubmit}>
              <section className={styles.formSection}>
                <h2>배송 정보</h2>
                <div className={styles.formGroup}>
                  <label htmlFor="name">이름 *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
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
                    onChange={handleInputChange}
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
                    onChange={handleInputChange}
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
                      onChange={handleInputChange}
                      placeholder="우편번호"
                      readOnly
                      required
                    />
                    <button
                      type="button"
                      onClick={openAddressSearch}
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
                    onChange={handleInputChange}
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
                    onChange={handleInputChange}
                  />
                </div>
              </section>

              <section className={styles.formSection}>
                <h2>결제 방법</h2>
                <div className={styles.bankInfo}>
                  <div className={styles.bankLabel}>무통장입금</div>
                  <div className={styles.bankDetails}>
                    <p className={styles.bankAccount}>
                      <span className={styles.bankName}>카카오뱅크</span>
                      <span>3333-27-7618216 (예금주: 홍주영)</span>
                    </p>
                    <p className={styles.bankNotice}>
                      주문 후 24시간 이내에 입금해주세요.
                      미입금 시 주문이 자동 취소됩니다.
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
                    onChange={handleInputChange}
                    placeholder="실제 입금하실 분의 이름"
                    required
                  />
                </div>
              </section>

              <button
                type="submit"
                className={styles.submitButton}
                disabled={isSubmitting}
              >
                {isSubmitting ? '주문 처리 중...' : `₩${selectedTotalPrice.toLocaleString()} 주문하기`}
              </button>
            </form>

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
                      ₩{(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              <div className={styles.orderTotal}>
                <div className={styles.totalRow}>
                  <span>상품 금액</span>
                  <span>₩{selectedTotalPrice.toLocaleString()}</span>
                </div>
                <div className={styles.totalRow}>
                  <span>배송비</span>
                  <span className={styles.shippingFree}>₩3,500 → 무료</span>
                </div>
                <div className={styles.totalRow}>
                  <span>배송비 할인</span>
                  <span className={styles.discountText}>-₩3,500</span>
                </div>
                <div className={styles.totalDivider} />
                <div className={styles.totalRowFinal}>
                  <span>총 결제 금액</span>
                  <span>₩{selectedTotalPrice.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
