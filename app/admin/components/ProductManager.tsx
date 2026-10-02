'use client';

import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { products as staticProducts, CATEGORY_LABELS, getStockKeys, getImplicitColor } from '@/lib/products';
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

/** 재고 줄에 붙이는 색상칩 — 주문 목록(OrderItemSize)과 같은 모양 */
const PM_COLOR_CHIP_CLASS: Record<string, string> = {
  Black: styles.colorChipBlack,
  White: styles.colorChipWhite,
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
  const isNew = !sizeData;
  // 블랙/화이트가 섞인 목록에서 줄마다 색이 바로 보이게 한다 (묶음 제목만으로는 스크롤하면 놓친다)
  const rowColor = size.includes(' — ') ? size.split(' — ')[1] : getImplicitColor(productId, size);
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
      <span className={styles.pmSizeLabel}>
        {size.includes(' — ') ? size.split(' — ')[0] : size}
        {rowColor && PM_COLOR_CHIP_CLASS[rowColor] && (
          <span className={`${styles.colorChip} ${PM_COLOR_CHIP_CLASS[rowColor]}`}>{rowColor.toUpperCase()}</span>
        )}
      </span>

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
              {stockSaving ? '…' : (isNew ? '초기화' : '저장')}
            </button>
          )}
        </div>

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
  defaultColor,
  thumbnail,
  dragHandleProps,
  onCatalogUpdate,
  onStatusChange,
  onStockUpdate,
  onDelayTextUpdate,
}: {
  product: AdminProduct;
  catalogSaving: boolean;
  sizes: ProductSize[];
  staticSizes: string[];
  /** 색상 표기가 없는 옵션의 색 — 일부 옵션만 다른 색이 있는 상품에서 기본색 묶음에 제목을 단다 */
  defaultColor?: string;
  thumbnail?: string;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  onCatalogUpdate: (id: number, updates: { name?: string; price?: number; original_price?: number | null; coming_soon?: boolean }) => Promise<void>;
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
        {dragHandleProps && (
          <div className={styles.pmDragHandle} {...dragHandleProps} title="드래그하여 순서 변경">
            ⠿
          </div>
        )}
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
        <button
          className={`${styles.pmComingSoonBtn} ${product.coming_soon ? styles.pmComingSoonOn : ''}`}
          onClick={() => onCatalogUpdate(product.id, { coming_soon: !product.coming_soon })}
          disabled={catalogSaving}
        >
          {product.coming_soon ? 'COMING SOON' : '출시됨'}
        </button>
      </div>

      {staticSizes.length > 0 && (
        <div className={styles.pmSizesSection}>
          {staticSizes.map((size, idx) => {
            const colorPart = size.includes(' — ') ? size.split(' — ')[1] : null;
            const prevColorPart = idx > 0 && staticSizes[idx - 1].includes(' — ')
              ? staticSizes[idx - 1].split(' — ')[1]
              : null;
            const showColorHeader = colorPart !== null && colorPart !== prevColorPart;
            const showDefaultColorHeader = idx === 0 && colorPart === null && defaultColor !== undefined;
            return (
              <React.Fragment key={size}>
                {showDefaultColorHeader && (
                  <div className={styles.pmColorGroupHeader}>{defaultColor}</div>
                )}
                {showColorHeader && (
                  <div className={styles.pmColorGroupHeader}>{colorPart}</div>
                )}
                <SizeRow
                  productId={product.id}
                  size={size}
                  sizeData={sizes.find((s) => s.product_id === product.id && s.size === size)}
                  onStatusChange={onStatusChange}
                  onStockUpdate={onStockUpdate}
                  onDelayTextUpdate={onDelayTextUpdate}
                />
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── SortableProductCard ──────────────────────────────────────────
function SortableProductCard({
  product,
  isDragEnabled,
  ...cardProps
}: {
  product: AdminProduct;
  isDragEnabled: boolean;
} & Omit<React.ComponentProps<typeof ProductCard>, 'product' | 'dragHandleProps'>) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: product.id,
    disabled: !isDragEnabled,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
      }}
    >
      <ProductCard
        product={product}
        dragHandleProps={isDragEnabled ? { ...attributes, ...listeners } : undefined}
        {...cardProps}
      />
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
  const [orderedIds, setOrderedIds] = useState<number[]>([]);
  const [orderDirty, setOrderDirty] = useState(false);
  const [orderSaving, setOrderSaving] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);

  const { products, loading: catalogLoading, saving: catalogSaving, updateProduct, reorderProducts, unsynced, missingSizes, syncing, syncProducts } = catalogState;
  const { sizes, loading: sizesLoading, updateSize, updateStock, updateDelayText, fetchSizes } = sizesState;
  const needsSync = unsynced.length > 0 || missingSizes.length > 0;

  const handleSync = async () => {
    await syncProducts();
    await fetchSizes();
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  useEffect(() => {
    if (!orderDirty) {
      setOrderedIds(products.map((p) => p.id));
    }
  }, [products, orderDirty]);

  const idToCategory = Object.fromEntries(
    Object.values(staticProducts).map((p) => [p.id, p.category])
  );

  const isDragEnabled = selectedCategory === 'all';

  const displayProducts = orderedIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is AdminProduct => p !== undefined)
    .filter((p) => selectedCategory === 'all' || idToCategory[p.id] === selectedCategory);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setOrderedIds((prev) => {
      const oldIndex = prev.indexOf(active.id as number);
      const newIndex = prev.indexOf(over.id as number);
      return arrayMove(prev, oldIndex, newIndex);
    });
    setOrderDirty(true);
  };

  const handleSaveOrder = async () => {
    setOrderSaving(true);
    const orders = orderedIds.map((id, index) => ({ id, sort_order: index + 1 }));
    await reorderProducts(orders);
    setOrderSaving(false);
    setOrderDirty(false);
  };

  const activeProduct = activeId ? products.find((p) => p.id === activeId) : null;
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
        {orderDirty && (
          <button
            className={styles.pmSaveOrderBtn}
            onClick={handleSaveOrder}
            disabled={orderSaving}
          >
            {orderSaving ? '저장 중…' : '순서 저장'}
          </button>
        )}
      </div>

      {needsSync && (
        <div className={styles.pmPageHeader}>
          <p className={styles.pmDesc}>
            코드에만 있고 DB에 없는 항목이 있습니다 — 상품 {unsynced.length}개 · 옵션 {missingSizes.length}개.
            동기화하면 품절 상태로 등록되고, 재고를 입력해야 판매됩니다.
          </p>
          <button className={styles.pmSaveOrderBtn} onClick={handleSync} disabled={syncing}>
            {syncing ? '동기화 중…' : '동기화'}
          </button>
        </div>
      )}

      <div className={styles.catalogFilterTabs}>
        <button
          className={`${styles.catalogFilterTab} ${selectedCategory === 'all' ? styles.catalogFilterTabActive : ''}`}
          onClick={() => setSelectedCategory('all')}
        >
          전체 ({products.length})
        </button>
        {categories.map(([key, label]) => {
          const count = products.filter((p) => idToCategory[p.id] === key).length;
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

      {!isDragEnabled && (
        <p className={styles.pmDragHint}>순서 변경은 전체 탭에서 가능합니다.</p>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={orderedIds} strategy={verticalListSortingStrategy}>
          <div className={styles.pmList}>
            {displayProducts.length === 0 ? (
              <p className={styles.catalogEmpty}>해당 카테고리에 상품이 없습니다.</p>
            ) : (
              displayProducts.map((product) => {
                const staticProduct = Object.values(staticProducts).find((p) => p.id === product.id);
                return (
                  <SortableProductCard
                    key={product.id}
                    product={product}
                    isDragEnabled={isDragEnabled}
                    catalogSaving={catalogSaving === product.id}
                    sizes={sizes.filter((s) => s.product_id === product.id)}
                    staticSizes={staticProduct ? getStockKeys(staticProduct) : []}
                    defaultColor={staticProduct?.colorSizes ? staticProduct.colors?.[0]?.name : undefined}
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
        </SortableContext>

        <DragOverlay>
          {activeProduct && (
            <div className={styles.pmDragOverlay}>
              {activeProduct.name}
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
