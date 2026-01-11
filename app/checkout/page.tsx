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
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    addressDetail: '',
    postalCode: '',
    paymentMethod: 'card',
  });

  // sessionStorage에서 선택된 항목 불러오기
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

  // 선택된 항목들의 총 가격
  const selectedTotalPrice = checkoutItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  if (checkoutItems.length === 0) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 실제로는 결제 API를 호출해야 합니다
    alert('결제가 완료되었습니다! (테스트 모드)');
    
    // 선택된 항목만 장바구니에서 제거
    const currentCart = JSON.parse(localStorage.getItem('brospick-cart') || '[]');
    const remainingItems = currentCart.filter((item: CartItem) => {
      return !checkoutItems.some(
        (checkoutItem) => 
          checkoutItem.id === item.id && 
          checkoutItem.size === item.size &&
          checkoutItem.quantity === item.quantity
      );
    });
    
    // 수량이 다른 경우 처리 (일부만 결제한 경우)
    const updatedItems = remainingItems.map((item: CartItem) => {
      const checkoutItem = checkoutItems.find(
        (ci) => ci.id === item.id && ci.size === item.size
      );
      if (checkoutItem && item.quantity > checkoutItem.quantity) {
        return { ...item, quantity: item.quantity - checkoutItem.quantity };
      }
      return item;
    }).filter((item: CartItem) => item.quantity > 0);
    
    localStorage.setItem('brospick-cart', JSON.stringify(updatedItems));
    sessionStorage.removeItem('checkoutItems');
    
    // 장바구니가 비어있으면 clearCart 호출, 아니면 페이지 새로고침으로 상태 업데이트
    if (updatedItems.length === 0) {
      clearCart();
    } else {
      // 장바구니 상태를 업데이트하기 위해 페이지 새로고침
      window.location.href = '/';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 카카오 주소 API 열기
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

          // 상세주소 입력란에 포커스
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
                  <label htmlFor="email">이메일 (선택사항)</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="주문 확인서를 받으실 이메일"
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
                <div className={styles.formGroup}>
                  <label htmlFor="paymentMethod">결제 수단 *</label>
                  <select
                    id="paymentMethod"
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="card">신용카드</option>
                    <option value="bank">무통장 입금</option>
                    <option value="kakao">카카오페이</option>
                    <option value="toss">토스페이</option>
                  </select>
                </div>
              </section>

              <button type="submit" className={styles.submitButton}>
                결제하기
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
                  <span>₩3,000</span>
                </div>
                <div className={styles.totalDivider} />
                <div className={styles.totalRowFinal}>
                  <span>총 결제 금액</span>
                  <span>₩{(selectedTotalPrice + 3000).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

