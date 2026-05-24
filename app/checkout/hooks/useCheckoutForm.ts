import { useState, useEffect } from 'react';
import type { CheckoutFormData, DaumPostcodeData } from '../types';
import { parsePostcodeResult } from '../utils';
import type { SavedShippingInfo } from '../components/ShippingForm';

const COOKIE_NAME = 'brospick_shipping';
const COOKIE_DAYS = 90;

function readShippingCookie(): SavedShippingInfo | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.split('; ').find((c) => c.startsWith(`${COOKIE_NAME}=`));
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match.split('=').slice(1).join('=')));
  } catch {
    return null;
  }
}

export function saveShippingToCookie(data: SavedShippingInfo) {
  if (typeof document === 'undefined') return;
  const expires = new Date();
  expires.setDate(expires.getDate() + COOKIE_DAYS);
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(data))}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}

const INITIAL_FORM_DATA: CheckoutFormData = {
  name: '',
  email: '',
  phone: '',
  address: '',
  addressDetail: '',
  postalCode: '',
  paymentMethod: 'bank',
  depositorName: '',
  deliveryNote: '',
  privacyConsent: false,
  thirdPartyConsent: false,
  marketingConsent: false,
};

export function useCheckoutForm() {
  const [formData, setFormData] = useState<CheckoutFormData>(INITIAL_FORM_DATA);
  const [savedInfo, setSavedInfo] = useState<SavedShippingInfo | null>(null);

  useEffect(() => {
    setSavedInfo(readShippingCookie());
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleConsentChange = (field: 'privacyConsent' | 'thirdPartyConsent' | 'marketingConsent', checked: boolean) => {
    setFormData((prev) => ({ ...prev, [field]: checked }));
  };

  const handleAllConsentChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      privacyConsent: checked,
      thirdPartyConsent: checked,
      marketingConsent: checked,
    }));
  };

  const applySavedInfo = () => {
    if (!savedInfo) return;
    setFormData((prev) => ({
      ...prev,
      name: savedInfo.name,
      phone: savedInfo.phone,
      email: savedInfo.email,
      postalCode: savedInfo.postalCode,
      address: savedInfo.address,
      addressDetail: savedInfo.addressDetail,
    }));
  };

  const openAddressSearch = () => {
    if (typeof window === 'undefined' || !window.daum?.Postcode) return;

    new window.daum.Postcode({
      oncomplete: (data: DaumPostcodeData) => {
        const parsed = parsePostcodeResult(data);
        setFormData((prev) => ({ ...prev, ...parsed }));

        const addressDetailInput = document.getElementById('addressDetail') as HTMLInputElement;
        addressDetailInput?.focus();
      },
      width: '100%',
      height: '100%',
    }).open();
  };

  return { formData, handleInputChange, handleConsentChange, handleAllConsentChange, openAddressSearch, savedInfo, applySavedInfo };
}
