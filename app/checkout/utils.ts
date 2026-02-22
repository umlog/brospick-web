import { CartItem } from '../contexts/CartContext';
import { SHIPPING } from '../../lib/constants';
import type { CheckoutFormData, ParsedAddress } from './types';

export function formatPrice(amount: number): string {
  return `₩${amount.toLocaleString()}`;
}

export function parsePostcodeResult(data: any): ParsedAddress {
  let addr = data.userSelectedType === 'R' ? data.roadAddress : data.jibunAddress;
  let extraAddr = '';

  if (data.userSelectedType === 'R') {
    if (data.bname !== '' && /[동|로|가]$/g.test(data.bname)) {
      extraAddr += data.bname;
    }
    if (data.buildingName !== '' && data.apartment === 'Y') {
      extraAddr += extraAddr !== '' ? ', ' + data.buildingName : data.buildingName;
    }
    if (extraAddr !== '') {
      extraAddr = ' (' + extraAddr + ')';
    }
  }

  return {
    postalCode: data.zonecode,
    address: addr + extraAddr,
  };
}

export function buildOrderPayload(
  formData: CheckoutFormData,
  checkoutItems: CartItem[],
  totalPrice: number
) {
  return {
    customerName: formData.name,
    customerPhone: formData.phone,
    customerEmail: formData.email,
    postalCode: formData.postalCode,
    address: formData.address,
    addressDetail: formData.addressDetail,
    totalAmount: totalPrice + SHIPPING.fee,
    shippingFee: SHIPPING.fee,
    depositorName: formData.depositorName,
    deliveryNote: formData.deliveryNote,
    items: checkoutItems.map((item) => ({
      productId: item.id,
      productName: item.name,
      size: item.size,
      quantity: item.quantity,
      price: item.price,
    })),
  };
}

export function removePurchasedItems(
  cart: CartItem[],
  purchasedItems: CartItem[]
): CartItem[] {
  return cart
    .filter((item) => {
      const exactMatch = purchasedItems.some(
        (purchased) =>
          purchased.id === item.id &&
          purchased.size === item.size &&
          purchased.quantity === item.quantity
      );
      return !exactMatch;
    })
    .map((item) => {
      const purchased = purchasedItems.find(
        (p) => p.id === item.id && p.size === item.size
      );
      if (purchased && item.quantity > purchased.quantity) {
        return { ...item, quantity: item.quantity - purchased.quantity };
      }
      return item;
    })
    .filter((item) => item.quantity > 0);
}
