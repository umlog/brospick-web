'use client';

import { useState, useEffect } from 'react';
import type { useProductSizes } from '../hooks/useProductSizes';
import { products } from '../../../lib/products';
import styles from '../admin.module.css';

type ProductSizesState = ReturnType<typeof useProductSizes>;

const STATUS_LABELS: Record<string, string> = {
  available: '재고',
  sold_out: '품절',
  delayed: '지연배송',
};

interface ProductSizeManagerProps {
  state: ProductSizesState;
}

function StockInput({
  productId,
  size,
  currentStock,
  onUpdate,
}: {
  productId: number;
  size: string;
  currentStock: number;
  onUpdate: (productId: number, size: string, stock: number) => Promise<void>;
}) {
  const [inputValue, setInputValue] = useState(String(currentStock));
  const [saving, setSaving] = useState(false);

  // 부모에서 currentStock이 변경되면 (fetchSizes 재호출 등) 입력값 동기화
  useEffect(() => {
    if (!saving) {
      setInputValue(String(currentStock));
    }
  }, [currentStock]);

  const handleSave = async () => {
    const parsed = parseInt(inputValue, 10);
    if (isNaN(parsed) || parsed < 0) {
      alert('0 이상의 숫자를 입력해주세요.');
      setInputValue(String(currentStock));
      return;
    }
    setSaving(true);
    await onUpdate(productId, size, parsed);
    setSaving(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') setInputValue(String(currentStock));
  };

  return (
    <div className={styles.sizeManagerStockSection}>
      <span className={styles.sizeManagerStockLabel}>재고</span>
      <input
        type="number"
        className={styles.sizeManagerStockInput}
        value={inputValue}
        min={0}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={saving}
      />
      <button
        className={styles.sizeManagerStockButton}
        onClick={handleSave}
        disabled={saving || inputValue === String(currentStock)}
      >
        {saving ? '저장 중...' : '저장'}
      </button>
    </div>
  );
}

export function ProductSizeManager({ state }: ProductSizeManagerProps) {
  const { sizes, loading, updateSize, updateStock } = state;

  if (loading) {
    return <p className={styles.loading}>로딩 중...</p>;
  }

  return (
    <div className={styles.sizeManagerContainer}>
      {Object.values(products).map((product) => {
        const productSizes = sizes.filter((s) => s.product_id === product.id);

        return (
          <div key={product.id} className={styles.sizeManagerCard}>
            <h3 className={styles.sizeManagerTitle}>{product.name}</h3>
            <div className={styles.sizeManagerGrid}>
              {product.sizes.map((size) => {
                const sizeData = productSizes.find((s) => s.size === size);
                const currentStatus = sizeData?.status || 'available';
                const currentStock = sizeData?.stock ?? 0;

                return (
                  <div key={size} className={styles.sizeManagerRow}>
                    <span className={styles.sizeManagerLabel}>{size}</span>
                    <div className={styles.sizeManagerButtons}>
                      {(['available', 'sold_out', 'delayed'] as const).map((status) => (
                        <button
                          key={status}
                          className={`${styles.sizeManagerButton} ${
                            currentStatus === status ? styles[`sizeStatus_${status}`] : ''
                          }`}
                          onClick={() => {
                            if (currentStatus !== status) {
                              updateSize(product.id, size, status);
                            }
                          }}
                          disabled={currentStatus === status}
                        >
                          {STATUS_LABELS[status]}
                        </button>
                      ))}
                    </div>
                    {sizeData && (
                      <StockInput
                        productId={product.id}
                        size={size}
                        currentStock={currentStock}
                        onUpdate={updateStock}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
