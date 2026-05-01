'use client';

import { useState, useEffect, useCallback } from 'react';
import { subscribeConfirm, getConfirmState, resolveConfirm } from '../lib/confirm';
import styles from '../admin.module.css';

export function ConfirmModal() {
  const [state, setState] = useState(() => getConfirmState());

  useEffect(() => {
    return subscribeConfirm(() => {
      setState({ ...getConfirmState() });
    });
  }, []);

  const handleConfirm = useCallback(() => resolveConfirm(true), []);
  const handleCancel = useCallback(() => resolveConfirm(false), []);

  if (!state.open) return null;

  return (
    <div className={styles.confirmOverlay} onClick={handleCancel}>
      <div className={styles.confirmBox} onClick={(e) => e.stopPropagation()}>
        <p className={styles.confirmMessage}>{state.message}</p>
        <div className={styles.confirmButtons}>
          <button className={styles.trackingCancelButton} onClick={handleCancel}>
            취소
          </button>
          <button className={styles.trackingConfirmButton} onClick={handleConfirm}>
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
