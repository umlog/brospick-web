'use client';

import { useState, useEffect } from 'react';
import type { useProductCatalog } from '../hooks/useProductCatalog';
import type { AdminProduct } from '@/lib/domain/types';
import { CATEGORY_LABELS } from '@/lib/products';
import styles from '../admin.module.css';

type ProductCatalogState = ReturnType<typeof useProductCatalog>;

interface ProductCatalogManagerProps {
  state: ProductCatalogState;
}

function ProductRow({
  product,
  saving,
  onUpdate,
}: {
  product: AdminProduct;
  saving: boolean;
  onUpdate: (id: number, updates: { name?: string; price?: number; original_price?: number | null }) => Promise<void>;
}) {
  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(String(product.price));
  const [originalPrice, setOriginalPrice] = useState(
    product.original_price != null ? String(product.original_price) : ''
  );
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!saving) {
      setName(product.name);
      setPrice(String(product.price));
      setOriginalPrice(product.original_price != null ? String(product.original_price) : '');
      setDirty(false);
    }
  }, [product, saving]);

  const handleSave = async () => {
    const parsedPrice = parseInt(price, 10);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      alert('올바른 가격을 입력해주세요.');
      return;
    }
    const parsedOriginal = originalPrice === '' ? null : parseInt(originalPrice, 10);
    if (originalPrice !== '' && (isNaN(parsedOriginal!) || parsedOriginal! <= 0)) {
      alert('올바른 정가를 입력해주세요.');
      return;
    }
    await onUpdate(product.id, {
      name: name.trim(),
      price: parsedPrice,
      original_price: parsedOriginal,
    });
    setDirty(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
  };

  return (
    <div className={styles.catalogRow}>
      <span className={styles.catalogProductId}>#{product.id}</span>
      <input
        className={styles.catalogInput}
        value={name}
        onChange={(e) => { setName(e.target.value); setDirty(true); }}
        onKeyDown={handleKeyDown}
        disabled={saving}
        placeholder="상품명"
      />
      <div className={styles.catalogPriceGroup}>
        <input
          className={`${styles.catalogInput} ${styles.catalogPriceInput}`}
          type="number"
          value={price}
          onChange={(e) => { setPrice(e.target.value); setDirty(true); }}
          onKeyDown={handleKeyDown}
          disabled={saving}
          placeholder="판매가"
          min={0}
        />
        <span className={styles.catalogPriceSep}>원</span>
        <input
          className={`${styles.catalogInput} ${styles.catalogPriceInput}`}
          type="number"
          value={originalPrice}
          onChange={(e) => { setOriginalPrice(e.target.value); setDirty(true); }}
          onKeyDown={handleKeyDown}
          disabled={saving}
          placeholder="정가 (선택)"
          min={0}
        />
        <span className={styles.catalogPriceSep}>원</span>
        {(() => {
          const p = parseInt(price, 10);
          const op = parseInt(originalPrice, 10);
          if (!isNaN(p) && !isNaN(op) && op > p && op > 0) {
            return (
              <span className={styles.catalogDiscountBadge}>
                {Math.round((1 - p / op) * 100)}%
              </span>
            );
          }
          return null;
        })()}
      </div>
      <button
        className={styles.catalogSaveButton}
        onClick={handleSave}
        disabled={saving || !dirty}
      >
        {saving ? '저장 중...' : '저장'}
      </button>
    </div>
  );
}

export function ProductCatalogManager({ state }: ProductCatalogManagerProps) {
  const { products, loading, error, saving, fetchProducts, updateProduct, unsynced, syncing, syncProducts } = state;
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    if (products.length === 0) fetchProducts();
  }, []);

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter((p) => p.category === selectedCategory);

  const categories = Object.entries(CATEGORY_LABELS) as [string, string][];

  if (loading) return <p className={styles.catalogEmpty}>불러오는 중...</p>;
  if (error) return <p className={styles.catalogEmpty} style={{ color: 'red' }}>{error}</p>;

  return (
    <div className={styles.catalogContainer}>
      {unsynced.length > 0 && (
        <div className={styles.syncBanner}>
          <div className={styles.syncBannerText}>
            <strong>⚠️ DB에 등록되지 않은 상품 {unsynced.length}개</strong>
            <span>{unsynced.map((p) => p.name).join(', ')}</span>
          </div>
          <button
            className={styles.syncButton}
            onClick={syncProducts}
            disabled={syncing}
          >
            {syncing ? '등록 중...' : '지금 동기화'}
          </button>
        </div>
      )}
      <div className={styles.catalogHeader}>
        <h3 className={styles.catalogTitle}>상품 가격 / 이름 관리</h3>
        <p className={styles.catalogDesc}>
          여기서 수정한 가격이 실제 주문 결제 금액에 적용됩니다.
        </p>
      </div>
      <div className={styles.catalogFilterTabs}>
        <button
          className={`${styles.catalogFilterTab} ${selectedCategory === 'all' ? styles.catalogFilterTabActive : ''}`}
          onClick={() => setSelectedCategory('all')}
        >
          전체 ({products.length})
        </button>
        {categories.map(([key, label]) => {
          const count = products.filter((p) => p.category === key).length;
          if (count === 0) return null;
          return (
            <button
              key={key}
              className={`${styles.catalogFilterTab} ${selectedCategory === key ? styles.catalogFilterTabActive : ''}`}
              onClick={() => setSelectedCategory(key)}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>
      <div className={styles.catalogList}>
        <div className={styles.catalogRowHeader}>
          <span className={styles.catalogProductId}>ID</span>
          <span>상품명</span>
          <span>판매가 / 정가</span>
          <span></span>
        </div>
        {filteredProducts.length === 0 ? (
          <p className={styles.catalogEmpty}>해당 카테고리에 상품이 없습니다.</p>
        ) : (
          filteredProducts.map((product) => (
            <ProductRow
              key={product.id}
              product={product}
              saving={saving === product.id}
              onUpdate={updateProduct}
            />
          ))
        )}
      </div>
    </div>
  );
}
