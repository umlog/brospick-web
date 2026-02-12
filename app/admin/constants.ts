export const STATUS_OPTIONS = ['입금대기', '입금확인', '배송중', '배송완료'];

export const RETURN_STATUS_OPTIONS = ['접수완료', '승인', '수거중', '수거완료', '처리완료', '거절'];

export const RETURN_STATUS_TRANSITIONS: Record<string, string[]> = {
  '접수완료': ['승인', '거절'],
  '승인': ['수거중'],
  '수거중': ['수거완료'],
  '수거완료': ['처리완료'],
};
