'use client';

import { useState, useEffect } from 'react';
import { products as staticProducts, CATEGORY_LABELS } from '@/lib/products';
import type { useProductCatalog } from '../hooks/useProductCatalog';
import type { useProductSizes } from '../hooks/useProductSizes';
import type { AdminProduct, ProductSize } from '@/lib/domain/types';
import { showToast } from '../lib/toast';
import styles from '../admin.module.css';

type CatalogState = ReturnType<typeof useProductCatalog>;
type SizesState = ReturnType<typeof useProductSizes>;

const STATUS_LABELS: Record<string, string> = {
  available: '재고',
  sold_out: '품절',
  delayed: '지연',
};

// ── SizeRow ──────────────────────────────────────────────────────
function SizeRow({
  productId,
  size,
  sizeData,
  onStatusChange,
  onStockUpdate,
  onDelayTextUpdate,
}: {
  productId: number;
  size: string;
  sizeData: ProductSize | undefined;
  onStatusChange: (id: number, size: string, status: string) => Promise<void>;
  onStockUpdate: (id: number, size: string, stock: number) => Promise<void>;
  onDelayTextUpdate: (id: number, size: string, text: string | null) => Promise<void>;
}) {
  const currentStatus = sizeData?.status ?? 'available';
  const [stock, setStock] = useState(sizeData?.stock ?? 0);
  const [stockDirty, setStockDirty] = useState(false);
  const [stockSaving, setStockSaving] = useState(false);
  const [delayText, setDelayText] = useState(sizeData?.delay_text ?? '');
  const [delayDirty, setDelayDirty] = useState(false);
  const [delaySaving, setDelaySaving] = useState(false);

  useEffect(() => {
    if (!stockSaving) { setStock(sizeData?.stock ?? 0); setStockDirty(false); }
  }, [sizeData?.stock]);

  useEffect(() => {
    if (!delaySaving) { setDelayText(sizeData?.delay_text ?? ''); setDelayDirty(false); }
  }, [sizeData?.delay_text]);

  const handleStockSave = async () => {
    setStockSaving(true);
    await onStockUpdate(productId, size, stock);
    setStockSaving(false);
    setStockDirty(false);
  };

  const handleDelaySave = async () => {
    setDelaySaving(true);
    await onDelayTextUpdate(productId, size, delayText.trim() || null);
    setDelaySaving(false);
    setDelayDirty(false);
  };

  return (
    <div className={styles.pmSizeRow}>
      <span className={styles.pmSizeLabel}>{size}</span>

      <div className={styles.pmStatusToggle}>
        {(['available', 'sold_out', 'delayed'] as const).map((s) => (
          <button
            key={s}
            className={`${styles.pmStatusBtn} ${currentStatus === s ? styles[`pmStatus_${s}`] : ''}`}
            onClick={() => { if (currentStatus !== s && sizeData) onStatusChange(productId, size, s); }}
            disabled={currentStatus === s || !sizeData}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {sizeData && (
        <div className={styles.pmStockStepper}>
          <button
            className={styles.pmStepBtn}
            onClick={() => { setStock(Math.max(0, stock - 1)); setStockDirty(true); }}
            disabled={stockSaving || stock <= 0}
          >
            −
          </button>
          <input
            type="number"
            className={styles.pmStockInput}
            value={stock}
            min={0}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (!isNaN(v) && v >= 0) { setStock(v); setStockDirty(true); }
            }}
            onKeyDown={(e) => { if (e.key === 'Enter' && stockDirty) handleStockSave(); }}
            disabled={stockSaving}
          />
          <button
            className={styles.pmStepBtn}
            onClick={() => { setStock(stock + 1); setStockDirty(true); }}
            disabled={stockSaving}
          >
            +
          </button>
          {stockDirty && (
            <button className={styles.pmInlineSaveBtn} onClick={handleStockSave} disabled={stockSaving}>
              {stockSaving ? '…' : '저장'}
            </button>
          )}
        </div>
      )}

      {sizeData && currentStatus === 'delayed' && (
        <div className={styles.pmDelayRow}>
          <input
            type="text"
            className={styles.pmDelayInput}
            value={delayText}
            placeholder="예: 3주, 5일"
            onChange={(e) => { setDelayText(e.target.value); setDelayDirty(true); }}
            onKeyDown={(e) => { if (e.key === 'Enter' && delayDirty) handleDelaySave(); }}
            disabled={delaySaving}
          />
          {delayDirty && (
            <button className={styles.pmInlineSaveBtn} onClick={handleDelaySave} disabled={delaySaving}>
              {delaySaving ? '…' : '저장'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── ProductCard ──────────────────────────────────────────────────
function ProductCard({
  product,
  catalogSaving,
  sizes,
  staticSizes,
  thumbnail,
  onCatalogUpdate,
  onStatusChange,
  onStockUpdate,
  onDelayTextUpdate,
}: {
  product: AdminProduct;
  catalogSaving: boolean;
  sizes: ProductSize[];
  staticSizes: string[];
  thumbnail?: string;
  onCatalogUpdate: (id: number, updates: { name?: string; price?: number; original_price?: number | null }) => Promise<void>;
  onStatusChange: (id: number, size: string, status: string) => Promise<void>;
  onStockUpdate: (id: number, size: string, stock: number) => Promise<void>;
  onDelayTextUpdate: (id: number, size: string, text: string | null) => Promise<void>;
}) {
  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(String(product.price));
  const [originalPrice, setOriginalPrice] = useState(
    product.original_price != null ? String(product.original_price) : ''
  );
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!catalogSaving) {
      setName(product.name);
      setPrice(String(product.price));
      setOriginalPrice(product.original_price != null ? String(product.original_price) : '');
      setDirty(false);
    }
  }, [product, catalogSaving]);

  const mark = () => setDirty(true);

  const handleSave = async () => {
    const parsedPrice = parseInt(price, 10);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      showToast('올바른 가격을 입력해주세요.', 'error');
      return;
    }
    const parsedOriginal = originalPrice === '' ? null : parseInt(originalPrice, 10);
    if (originalPrice !== '' && (isNaN(parsedOriginal!) || parsedOriginal! <= 0)) {
      showToast('올바른 정가를 입력해주세요.', 'error');
      return;
    }
    await onCatalogUpdate(product.id, {
      name: name.trim(),
      price: parsedPrice,
      original_price: parsedOriginal,
    });
    setDirty(false);
  };

  const onEnter = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleSave(); };

  const p = parseInt(price, 10);
  const op = parseInt(originalPrice, 10);
  const discountPct = (!isNaN(p) && !isNaN(op) && op > p && op > 0)
    ? Math.round((1 - p / op) * 100)
    : null;

  return (
    <div className={`${styles.pmCard} ${dirty ? styles.pmCardDirty : ''}`}>
      <div className={styles.pmCardHeader}>
        {thumbnail ? (
          <img src={thumbnail} alt={product.name} className={styles.pmThumbnail} />
        ) : (
          <span className={styles.pmCardId}>#{product.id}</span>
        )}
        <input
          className={styles.pmNameInput}
          value={name}
          onChange={(e) => { setName(e.target.value); mark(); }}
          onKeyDown={onEnter}
          disabled={catalogSaving}
          placeholder="상품명"
        />
        <div className={styles.pmPriceGroup}>
          <div className={styles.pmPriceField}>
            <input
              className={styles.pmPriceInput}
              type="number"
              value={price}
              onChange={(e) => { setPrice(e.target.value); mark(); }}
              onKeyDown={onEnter}
              disabled={catalogSaving}
              placeholder="판매가"
              min={0}
            />
            <span className={styles.pmPriceUnit}>원</span>
          </div>
          <div className={styles.pmPriceField}>
            <input
              className={`${styles.pmPriceInput} ${styles.pmPriceInputOriginal}`}
              type="number"
              value={originalPrice}
              onChange={(e) => { setOriginalPrice(e.target.value); mark(); }}
              onKeyDown={onEnter}
              disabled={catalogSaving}
              placeholder="정가"
              min={0}
            />
            <span className={styles.pmPriceUnit}>원</span>
          </div>
          {discountPct !== null && (
            <span className={styles.pmDiscountBadge}>{discountPct}%</span>
          )}
        </div>
        <button
          className={styles.pmSaveBtn}
          onClick={handleSave}
          disabled={catalogSaving || !dirty}
        >
          {catalogSaving ? '저장 중…' : '저장'}
        </button>
      </div>

      {staticSizes.length > 0 && (
        <div className={styles.pmSizesSection}>
          {staticSizes.map((size) => (
            <SizeRow
              key={size}
              productId={product.id}
              size={size}
              sizeData={sizes.find((s) => s.size === size)}
              onStatusChange={onStatusChange}
              onStockUpdate={onStockUpdate}
              onDelayTextUpdate={onDelayTextUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── ProductManager ───────────────────────────────────────────────
export function ProductManager({
  catalogState,
  sizesState,
}: {
  catalogState: CatalogState;
  sizesState: SizesState;
}) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { products, loading: catalogLoading, saving: catalogSaving, updateProduct } = catalogState;
  const { sizes, loading: sizesLoading, updateSize, updateStock, updateDelayText } = sizesState;

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter((p) => p.category === selectedCategory);

  const categories = Object.entries(CATEGORY_LABELS) as [string, string][];

  if (catalogLoading || sizesLoading) {
    return <p className={styles.catalogEmpty}>불러오는 중...</p>;
  }

  return (
    <div className={styles.pmContainer}>
      <div className={styles.pmPageHeader}>
        <div>
          <h3 className={styles.pmTitle}>상품 관리</h3>
          <p className={styles.pmDesc}>가격·이름·사이즈 재고를 한 화면에서 수정합니다.</p>
        </div>
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

      <div className={styles.pmList}>
        {filteredProducts.length === 0 ? (
          <p className={styles.catalogEmpty}>해당 카테고리에 상품이 없습니다.</p>
        ) : (
          filteredProducts.map((product) => {
            const staticProduct = Object.values(staticProducts).find((p) => p.id === product.id);
            return (
              <ProductCard
                key={product.id}
                product={product}
                catalogSaving={catalogSaving === product.id}
                sizes={sizes.filter((s) => s.product_id === product.id)}
                staticSizes={staticProduct?.sizes ?? []}
                thumbnail={staticProduct?.images?.[0]}
                onCatalogUpdate={updateProduct}
                onStatusChange={updateSize}
                onStockUpdate={updateStock}
                onDelayTextUpdate={updateDelayText}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
