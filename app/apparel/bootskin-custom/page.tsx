import type { Metadata } from 'next';
import CustomOrderClient from './CustomOrderClient';

export const metadata: Metadata = {
  title: 'BOOT SKIN 커스텀 | BROSPICK',
  description: '나만의 디자인으로 제작하는 커스텀 부츠스킨. 최소 10세트부터 주문 가능합니다.',
};

export default function CustomOrderPage() {
  return <CustomOrderClient />;
}
