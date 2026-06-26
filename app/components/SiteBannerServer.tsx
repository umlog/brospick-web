import { getActiveBanner } from '@/lib/site-content';
import { SiteBanner } from './SiteBanner';

// 배너 데이터를 자체적으로 조회하는 async 서버 컴포넌트.
// layout에서 <Suspense>로 감싸 셸(스플래시 포함)이 먼저 흐르게 한다.
export async function SiteBannerServer() {
  const banner = await getActiveBanner();
  return <SiteBanner initialBanner={banner} />;
}
