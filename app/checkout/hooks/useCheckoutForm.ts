import { useState } from 'react';
import type { CheckoutFormData } from '../types';
import { parsePostcodeResult } from '../utils';

const INITIAL_FORM_DATA: CheckoutFormData = {
  name: '',
  email: '',
  phone: '',
  address: '',
  addressDetail: '',
  postalCode: '',
  depositorName: '',
  deliveryNote: '',
};

export function useCheckoutForm() {
  const [formData, setFormData] = useState<CheckoutFormData>(INITIAL_FORM_DATA);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openAddressSearch = () => {
    if (typeof window === 'undefined' || !window.daum?.Postcode) return;

    new window.daum.Postcode({
      oncomplete: (data: any) => {
        const parsed = parsePostcodeResult(data);
        setFormData((prev) => ({ ...prev, ...parsed }));

        const addressDetailInput = document.getElementById('addressDetail') as HTMLInputElement;
        addressDetailInput?.focus();
      },
      width: '100%',
      height: '100%',
    }).open();
  };

  return { formData, handleInputChange, openAddressSearch };
}
