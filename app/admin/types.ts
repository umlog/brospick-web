export interface OrderItem {
  id: string;
  product_name: string;
  size: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  postal_code: string;
  address: string;
  address_detail: string | null;
  total_amount: number;
  shipping_fee: number;
  status: string;
  depositor_name: string | null;
  delivery_note: string | null;
  payment_method: string;
  created_at: string;
  order_items: OrderItem[];
}

export interface ReturnRequest {
  id: string;
  request_number: string;
  type: '교환' | '반품';
  reason: string;
  status: string;
  exchange_size: string | null;
  quantity: number;
  reject_reason: string | null;
  refund_amount: number | null;
  refund_bank: string | null;
  refund_account: string | null;
  refund_holder: string | null;
  refund_completed: boolean;
  return_shipping_fee: number | null;
  return_tracking_number: string | null;
  created_at: string;
  updated_at: string;
  orders: {
    order_number: string;
    customer_name: string;
    customer_phone: string;
    customer_email: string | null;
    address: string;
    address_detail: string | null;
    postal_code: string;
  };
  order_items: {
    product_name: string;
    size: string;
    quantity: number;
    price: number;
  };
}

export type AdminTab = 'orders' | 'returns' | 'products';

export interface ProductSize {
  product_id: number;
  size: string;
  status: 'available' | 'sold_out' | 'delayed';
}
