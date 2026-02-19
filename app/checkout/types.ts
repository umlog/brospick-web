declare global {
  interface Window {
    daum: any;
  }
}

export interface CheckoutFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  addressDetail: string;
  postalCode: string;
  depositorName: string;
  deliveryNote: string;
}

export interface OrderResponse {
  orderNumber: string;
  totalAmount: number;
  shippingFee: number;
}

export interface ParsedAddress {
  postalCode: string;
  address: string;
}
