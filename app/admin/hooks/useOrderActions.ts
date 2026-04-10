import { useState } from 'react';
import { OrderStatus } from '@/lib/domain/enums';
import { showToast } from '../lib/toast';

type StatusChangeFn = (orderId: string, newStatus: string, trackingNumber?: string) => Promise<void>;

export function useOrderActions(handleStatusChange: StatusChangeFn) {
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [trackingModal, setTrackingModal] = useState<string | null>(null);
  const [trackingInput, setTrackingInput] = useState('');
  const [delayModal, setDelayModal] = useState<string | null>(null);
  const [delayWeeks, setDelayWeeks] = useState(3);
  const [delayUnit, setDelayUnit] = useState<'주' | '일'>('주');

  const toggleExpanded = (orderId: string) => {
    setExpandedOrder((prev) => (prev === orderId ? null : orderId));
  };

  const clearExpanded = () => setExpandedOrder(null);

  const handleShippingClick = (orderId: string) => {
    setTrackingModal(orderId);
    setTrackingInput('');
  };

  const handleDelayClick = (orderId: string, currentStatus: string) => {
    const match = currentStatus.match(/^(\d+)(주|일) 뒤 발송$/);
    if (match) {
      setDelayWeeks(parseInt(match[1], 10));
      setDelayUnit(match[2] as '주' | '일');
    } else {
      setDelayWeeks(3);
      setDelayUnit('주');
    }
    setDelayModal(orderId);
  };

  const handleTrackingSubmit = () => {
    if (!trackingModal) return;
    if (!trackingInput.trim()) {
      showToast('운송장번호를 입력해주세요.', 'error');
      return;
    }
    handleStatusChange(trackingModal, OrderStatus.SHIPPING, trackingInput.trim());
    setTrackingModal(null);
    setTrackingInput('');
  };

  const handleDelaySubmit = () => {
    if (!delayModal) return;
    handleStatusChange(delayModal, `${delayWeeks}${delayUnit} 뒤 발송`);
    setDelayModal(null);
  };

  return {
    expandedOrder,
    trackingModal,
    trackingInput,
    delayModal,
    delayWeeks,
    delayUnit,
    setTrackingInput,
    setTrackingModal,
    setDelayModal,
    setDelayWeeks,
    setDelayUnit,
    toggleExpanded,
    clearExpanded,
    handleShippingClick,
    handleDelayClick,
    handleTrackingSubmit,
    handleDelaySubmit,
  };
}
