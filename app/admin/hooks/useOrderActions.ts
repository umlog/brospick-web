import { useState } from 'react';
import { OrderStatus } from '@/lib/domain/enums';
import { TRACKING } from '@/lib/constants';
import { showToast } from '../lib/toast';

type StatusChangeFn = (orderId: string, newStatus: string, trackingNumber?: string, carrier?: string) => Promise<void>;

export function useOrderActions(handleStatusChange: StatusChangeFn) {
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [trackingModal, setTrackingModal] = useState<string | null>(null);
  const [trackingInput, setTrackingInput] = useState('');
  const [carrierInput, setCarrierInput] = useState<string>(TRACKING.defaultCarrier);
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
    setCarrierInput(TRACKING.defaultCarrier);
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
    // 붙여넣기로 딸려오는 하이픈·공백은 떼고, 그 외 글자(이름 등)가 섞이면 막는다.
    const trackingNumber = trackingInput.replace(/[\s-]/g, '');
    if (!trackingNumber) {
      showToast('운송장번호를 입력해주세요.', 'error');
      return;
    }
    if (!/^\d+$/.test(trackingNumber)) {
      showToast('운송장번호는 숫자만 입력할 수 있습니다.', 'error');
      return;
    }
    handleStatusChange(trackingModal, OrderStatus.SHIPPING, trackingNumber, carrierInput);
    setTrackingModal(null);
    setTrackingInput('');
    setCarrierInput(TRACKING.defaultCarrier);
  };

  const handleTrackingCancel = () => {
    setTrackingModal(null);
    setCarrierInput(TRACKING.defaultCarrier);
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
    carrierInput,
    delayModal,
    delayWeeks,
    delayUnit,
    setTrackingInput,
    setCarrierInput,
    setTrackingModal,
    setDelayModal,
    setDelayWeeks,
    setDelayUnit,
    toggleExpanded,
    clearExpanded,
    handleShippingClick,
    handleDelayClick,
    handleTrackingSubmit,
    handleTrackingCancel,
    handleDelaySubmit,
  };
}
