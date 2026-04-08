// 카카오페이 설정 중앙화
// KAKAO_PAY_MODE=dev  → DEV 키 사용 (테스트 결제, 실제 출금 없음)
// KAKAO_PAY_MODE=prod → 운영 키 사용 (실제 결제)

export function getKakaoPayConfig() {
  const isDev = process.env.KAKAO_PAY_MODE === 'dev';
  const cid = isDev ? process.env.KAKAO_PAY_CID_DEV : process.env.KAKAO_PAY_CID;
  const secretKey = isDev ? process.env.KAKAO_PAY_SECRET_KEY_DEV : process.env.KAKAO_PAY_SECRET_KEY;

  if (!cid || !secretKey) {
    throw new Error(`카카오페이 환경변수가 설정되지 않았습니다. (mode: ${isDev ? 'dev' : 'prod'})`);
  }

  return { cid, secretKey, isDev };
}
