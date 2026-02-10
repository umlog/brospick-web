'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart, CartItem } from '../contexts/CartContext';
import styles from './cart-page.module.css';

export default function CartPage() {
  const router = useRouter();
  const { cart, removeFromCart, updateQuantity, getTotalPrice, clearCart } = useCart();
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // 체크박스 토글
  const toggleItem = (item: CartItem, index: number) => {
    const key = `${item.id}-${item.size}-${index}`;
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  // 전체 선택/해제
  const toggleAll = () => {
    if (selectedItems.size === cart.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(cart.map((item, index) => `${item.id}-${item.size}-${index}`)));
    }
  };

  // 선택된 항목들만 필터링
  const selectedCartItems = useMemo(() => {
    return cart.filter((item, index) => {
      const key = `${item.id}-${item.size}-${index}`;
      return selectedItems.has(key);
    });
  }, [cart, selectedItems]);

  // 선택된 항목들의 총 가격
  const selectedTotalPrice = useMemo(() => {
    return selectedCartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [selectedCartItems]);

  // 결제 페이지로 이동
  const handleCheckout = () => {
    if (selectedCartItems.length === 0) {
      alert('결제할 항목을 선택해주세요.');
      return;
    }

    // 선택된 항목들을 sessionStorage에 저장
    sessionStorage.setItem('checkoutItems', JSON.stringify(selectedCartItems));
    router.push('/checkout');
  };

  if (cart.length === 0) {
    return (
      <main className={styles.main}>
        <div className={styles.container}>
          <h1>장바구니</h1>
          <div className={styles.emptyCart}>
            <p>장바구니가 비어있습니다.</p>
            <Link href="/apparel" className={styles.shopLink}>
              쇼핑하러 가기 →
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.main}>
        <div className={styles.container}>
          <h1>장바구니</h1>

          <div className={styles.cartContent}>
            <div className={styles.cartItems}>
              {cart.length > 0 && (
                <div className={styles.selectAll}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={selectedItems.size === cart.length && cart.length > 0}
                      onChange={toggleAll}
                      className={styles.checkbox}
                    />
                    <span>전체 선택</span>
                  </label>
                </div>
              )}
              {cart.map((item, index) => {
                const key = `${item.id}-${item.size}-${index}`;
                const isSelected = selectedItems.has(key);
                return (
                  <div key={key} className={`${styles.cartItem} ${isSelected ? styles.selected : ''}`}>
                    <label className={styles.itemCheckbox}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleItem(item, index)}
                        className={styles.checkbox}
                      />
                    </label>
                    <div className={styles.itemImage}>
                    <img
                      src={item.image}
                      alt={item.name}
                      onError={(e) => {
                        e.currentTarget.src = '/apparel/brospick-sportswear-1.png';
                      }}
                    />
                    </div>
                    <div className={styles.itemInfo}>
                    <h3 className={styles.itemName}>{item.name}</h3>
                    <p className={styles.itemSize}>사이즈: {item.size}</p>
                    <p className={styles.itemPrice}>₩{item.price.toLocaleString()}</p>
                  </div>
                  <div className={styles.itemControls}>
                    <div className={styles.quantityControls}>
                      <button
                        className={styles.quantityButton}
                        onClick={() => updateQuantity(item.id, item.size, item.quantity - 1)}
                      >
                        −
                      </button>
                      <span className={styles.quantity}>{item.quantity}</span>
                      <button
                        className={styles.quantityButton}
                        onClick={() => updateQuantity(item.id, item.size, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    <button
                      className={styles.removeButton}
                      onClick={() => removeFromCart(item.id, item.size)}
                    >
                      삭제
                    </button>
                  </div>
                    <div className={styles.itemTotal}>
                      ₩{(item.price * item.quantity).toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={styles.cartSummary}>
              <div className={styles.summaryContent}>
                <h2>주문 요약</h2>
                <div className={styles.summaryRow}>
                  <span>선택된 상품 ({selectedCartItems.length}개)</span>
                  <span>₩{selectedTotalPrice.toLocaleString()}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>배송비</span>
                  <span className={styles.shippingFree}>₩3,500 → 무료</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>배송비 할인</span>
                  <span className={styles.discountText}>-₩3,500</span>
                </div>
                <div className={styles.summaryDivider} />
                <div className={styles.summaryRowTotal}>
                  <span>총 결제 금액</span>
                  <span>₩{selectedTotalPrice.toLocaleString()}</span>
                </div>
                <button
                  className={styles.checkoutButton}
                  onClick={handleCheckout}
                  disabled={selectedCartItems.length === 0}
                >
                  결제하기 ({selectedCartItems.length}개)
                </button>
                <Link href="/apparel" className={styles.continueShopping}>
                  쇼핑 계속하기
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
  );
}

