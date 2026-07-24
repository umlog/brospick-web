'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart, CartItem } from '../contexts/CartContext';
import { SHIPPING, getShippingFee } from '../../lib/constants';
import { PRODUCT_FALLBACK_IMAGE, CATEGORY_LABELS, ProductCategory, productList } from '../../lib/products';
import styles from './cart-page.module.css';
import { validateCartStock } from '../../lib/validateStock';

const usedCategories = [...new Set(productList.map((p) => p.category))] as ProductCategory[];

const CATEGORY_REPRESENTATIVE_IMAGE: Partial<Record<ProductCategory, string>> = {
  'bottom': '/apparel/bottom/tech-training-shorts-gray/1.png',
  'socks': '/apparel/socks/athletic-long-socks-white/1.png',
};

function getCategoryImage(category: ProductCategory): string {
  if (CATEGORY_REPRESENTATIVE_IMAGE[category]) return CATEGORY_REPRESENTATIVE_IMAGE[category]!;
  return productList.find((p) => p.category === category)?.image ?? PRODUCT_FALLBACK_IMAGE;
}

export default function CartPage() {
  const router = useRouter();
  const { cart, removeFromCart, updateQuantity, getTotalPrice, clearCart } = useCart();
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [soldOutKeys, setSoldOutKeys] = useState<Set<string>>(new Set());

  // 최신 품절 상태를 받아와 장바구니 항목과 대조 (담아둔 뒤 품절된 항목 차단용)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/products/sizes');
        if (!res.ok) return;
        const data = await res.json();
        const rows = Array.isArray(data) ? data : data.sizes ?? [];
        const soldOut = new Set<string>();
        for (const row of rows) {
          if (row.status === 'sold_out' || (row.stock ?? 0) <= 0) {
            soldOut.add(`${row.product_id}-${row.size}`);
          }
        }
        if (!cancelled) setSoldOutKeys(soldOut);
      } catch {
        // 실패 시 품절 표시 생략 — 결제 시 validateCartStock가 최종 방어
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const isSoldOut = (item: CartItem) => soldOutKeys.has(`${item.id}-${item.size}`);

  // 품절 항목이 선택돼 있으면 자동 해제
  useEffect(() => {
    if (soldOutKeys.size === 0) return;
    setSelectedItems((prev) => {
      const next = new Set(prev);
      cart.forEach((item, index) => {
        if (isSoldOut(item)) next.delete(`${item.id}-${item.size}-${index}`);
      });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soldOutKeys, cart]);

  // 체크박스 토글
  const toggleItem = (item: CartItem, index: number) => {
    if (isSoldOut(item)) return;
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

  // 전체 선택/해제 (품절 항목 제외)
  const selectableCount = cart.filter((item) => !isSoldOut(item)).length;
  const toggleAll = () => {
    if (selectedItems.size >= selectableCount && selectableCount > 0) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(
        cart
          .map((item, index) => ({ item, index }))
          .filter(({ item }) => !isSoldOut(item))
          .map(({ item, index }) => `${item.id}-${item.size}-${index}`)
      ));
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
  const handleCheckout = async () => {
    if (selectedCartItems.length === 0) {
      alert('결제할 항목을 선택해주세요.');
      return;
    }

    const stockErrors = await validateCartStock(selectedCartItems);
    if (stockErrors.length > 0) {
      alert(stockErrors.join('\n'));
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
          </div>

          <div className={styles.emptyCategories}>
            <p className={styles.emptyCategoriesLabel}>카테고리 둘러보기</p>
            <div className={styles.emptyCategoryGrid}>
              {usedCategories.map((cat) => (
                <Link key={cat} href={`/apparel?category=${cat}`} className={styles.emptyCategoryCard}>
                  <div className={styles.emptyCategoryImage}>
                    <img
                      src={getCategoryImage(cat)}
                      alt={CATEGORY_LABELS[cat]}
                      onError={(e) => { e.currentTarget.src = PRODUCT_FALLBACK_IMAGE; }}
                    />
                  </div>
                  <span className={styles.emptyCategoryCardLabel}>{CATEGORY_LABELS[cat]}</span>
                </Link>
              ))}
            </div>
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
                    checked={selectableCount > 0 && selectedItems.size >= selectableCount}
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
              const soldOut = isSoldOut(item);
              return (
                <div key={key} className={`${styles.cartItem} ${isSelected ? styles.selected : ''} ${soldOut ? styles.soldOutItem : ''}`}>
                  <label className={styles.itemCheckbox}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleItem(item, index)}
                      className={styles.checkbox}
                      disabled={soldOut}
                    />
                  </label>
                  <div className={styles.itemImage}>
                    <img
                      src={item.image}
                      alt={item.name}
                      onError={(e) => {
                        e.currentTarget.src = PRODUCT_FALLBACK_IMAGE;
                      }}
                    />
                    {soldOut && <span className={styles.soldOutBadge}>품절</span>}
                  </div>
                  <div className={styles.itemInfo}>
                    <h3 className={styles.itemName}>{item.name}</h3>
                    <p className={styles.itemSize}>사이즈: {item.size}</p>
                    {soldOut
                      ? <p className={styles.itemSoldOutText}>품절된 상품입니다. 삭제 후 결제해 주세요.</p>
                      : <p className={styles.itemPrice}>₩{item.price.toLocaleString()}</p>}
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

              {/* 배송비 프로그레스 바 */}
              {(() => {
                const pct = Math.min(100, Math.round((selectedTotalPrice / SHIPPING.freeThreshold) * 100));
                const isFree = selectedTotalPrice >= SHIPPING.freeThreshold;
                return (
                  <div className={styles.shippingProgress}>
                    <div className={styles.shippingProgressText}>
                      {isFree ? (
                        <span className={styles.shippingProgressFreeText}>무료배송 달성!</span>
                      ) : selectedTotalPrice > 0 ? (
                        <span>₩{(SHIPPING.freeThreshold - selectedTotalPrice).toLocaleString()} 더 담으면 무료배송</span>
                      ) : (
                        <span>₩{SHIPPING.freeThreshold.toLocaleString()} 이상 무료배송</span>
                      )}
                      <span className={styles.shippingProgressPct}>{pct}%</span>
                    </div>
                    <div className={styles.shippingProgressTrack}>
                      <div
                        className={`${styles.shippingProgressFill} ${isFree ? styles.shippingProgressFillFree : ''}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })()}

              <div className={styles.summaryRow}>
                <span>선택된 상품 ({selectedCartItems.length}개)</span>
                <span>₩{selectedTotalPrice.toLocaleString()}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>배송비 <small style={{ color: '#888', fontWeight: 400 }}>(주문당 1회)</small></span>
                {getShippingFee(selectedTotalPrice) === 0 ? (
                  <span style={{ color: '#22c55e', fontWeight: 600 }}>무료</span>
                ) : (
                  <span>₩{SHIPPING.fee.toLocaleString()}</span>
                )}
              </div>
              <div className={styles.summaryDivider} />
              <div className={styles.summaryRowTotal}>
                <span>총 결제 금액</span>
                <span>₩{(selectedTotalPrice + getShippingFee(selectedTotalPrice)).toLocaleString()}</span>
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

      {/* 모바일 하단 고정 결제 바 */}
      <div className={styles.mobileStickyBar}>
        <div className={styles.mobileStickyBarInner}>
          <div className={styles.mobileStickyBarInfo}>
            <span className={styles.mobileStickyBarTotal}>
              ₩{(selectedTotalPrice + getShippingFee(selectedTotalPrice)).toLocaleString()}
            </span>
            <span className={styles.mobileStickyBarLabel}>
              {selectedCartItems.length > 0 ? `${selectedCartItems.length}개 선택` : '항목을 선택해주세요'}
            </span>
          </div>
          <button
            className={styles.mobileStickyCheckout}
            onClick={handleCheckout}
            disabled={selectedCartItems.length === 0}
          >
            결제하기
          </button>
        </div>
      </div>
    </main>
  );
}

