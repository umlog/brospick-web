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

export function ProductSizeManager({ state }: ProductSizeManagerProps) {
  const { sizes, loading, updateSize } = state;

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
