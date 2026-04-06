'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ToastType } from '../lib/toast';
import styles from '../admin.module.css';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

let nextId = 0;

export function Toasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const { message, type } = (e as CustomEvent).detail;
      const id = nextId++;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => remove(id), 3500);
    };
    window.addEventListener('admin-toast', handler);
    return () => window.removeEventListener('admin-toast', handler);
  }, [remove]);

  if (toasts.length === 0) return null;

  return (
    <div className={styles.toastContainer}>
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`${styles.toast} ${styles[`toast_${t.type}`]}`}
          onClick={() => remove(t.id)}
        >
          <span className={styles.toastIcon}>
            {t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}
          </span>
          {t.message}
        </div>
      ))}
    </div>
  );
}
