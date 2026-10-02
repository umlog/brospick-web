'use client';

import React, { useState } from 'react';
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CATEGORY_LABELS, ProductCategory } from '@/lib/products';
import styles from '../admin.module.css';

function SortableCategoryChip({ category }: { category: ProductCategory }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category });

  return (
    <button
      ref={setNodeRef}
      type="button"
      className={`${styles.catalogFilterTab} ${styles.pmCategoryChip}`}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      aria-label={`${CATEGORY_LABELS[category]} 순서 이동`}
      {...attributes}
      {...listeners}
    >
      ⠿ {CATEGORY_LABELS[category]}
    </button>
  );
}

interface CategoryOrderEditorProps {
  order: ProductCategory[];
  saving: boolean;
  onSave: (order: ProductCategory[]) => Promise<boolean>;
  onClose: () => void;
}

/** 카테고리 칩을 끌어서 쇼핑몰 카테고리 노출 순서를 바꾼다 */
export function CategoryOrderEditor({ order, saving, onSave, onClose }: CategoryOrderEditorProps) {
  const [draft, setDraft] = useState<ProductCategory[]>(order);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setDraft((prev) =>
      arrayMove(prev, prev.indexOf(active.id as ProductCategory), prev.indexOf(over.id as ProductCategory))
    );
  };

  const handleSave = async () => {
    const saved = await onSave(draft);
    if (saved) onClose();
  };

  return (
    <div className={styles.pmCategoryEditor}>
      <p className={styles.pmDragHint}>끌어서 순서를 바꾼 뒤 저장하세요. 쇼핑몰 카테고리 탭·카드에 바로 반영됩니다.</p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={draft} strategy={rectSortingStrategy}>
          <div className={styles.catalogFilterTabs}>
            {draft.map((category) => (
              <SortableCategoryChip key={category} category={category} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <div className={styles.pmCategoryEditorActions}>
        <button type="button" className={styles.pmSaveOrderBtn} onClick={handleSave} disabled={saving}>
          {saving ? '저장 중…' : '카테고리 순서 저장'}
        </button>
        <button type="button" className={styles.catalogFilterTab} onClick={onClose} disabled={saving}>
          취소
        </button>
      </div>
    </div>
  );
}
