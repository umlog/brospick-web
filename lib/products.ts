// 상품 데이터 - 가격, 이미지, 사이즈 등을 한 곳에서 관리

export interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  images: string[];
  tagline: string;
  description: string;
  sizes: string[];
}

export const products: Record<string, Product> = {
  '1': {
    id: 1,
    name: 'Half-Zip Training Top',
    price: 29900,
    originalPrice: 69000,
    image: '/apparel/bp-detail1.JPG',
    images: [
      '/apparel/bp-detail1.JPG',
      '/apparel/bp-detailpoint.JPG',
      '/apparel/bp-light-second.png',
      '/apparel/bp-light-main.png',
      '/apparel/bp-thumb.png',
      '/apparel/bp-thumb2.png',
    ],
    tagline: '가볍게 입고, 강하게 뛰는 브로스픽 반집업 트레이닝 탑',
    description:
      '편안한 착용감과 슬림한 실루엣을 동시에 잡은 Half-Zip Training Top. 고탄성 원단으로 몸을 안정감 있게 잡아주면서도 움직임은 자유롭고, 땀은 빠르게 건조되어 격한 운동에도 쾌적함을 유지해 줍니다.',
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
  },
};

// 목록 페이지용 간략 상품 리스트
export const productList = Object.values(products).map((p) => ({
  id: p.id,
  name: p.name,
  price: p.price,
  originalPrice: p.originalPrice,
  image: p.images[0],
  description: p.tagline,
}));

// 할인율 계산 헬퍼
export function getDiscountPercent(price: number, originalPrice: number): number {
  return Math.round((1 - price / originalPrice) * 100);
}
