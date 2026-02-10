import { SolapiMessageService } from 'solapi';

const apiKey = process.env.SOLAPI_API_KEY || '';
const apiSecret = process.env.SOLAPI_API_SECRET || '';
const pfId = process.env.SOLAPI_PFID || '';

let messageService: SolapiMessageService | null = null;

function getMessageService() {
  if (!messageService && apiKey && apiSecret) {
    messageService = new SolapiMessageService(apiKey, apiSecret);
  }
  return messageService;
}

// 주문 확인 알림톡
interface OrderAlimtalkData {
  customerPhone: string;
  orderNumber: string;
  productName: string;
  totalAmount: number;
  depositorName: string;
  siteUrl: string;
}

export async function sendOrderAlimtalk(data: OrderAlimtalkData) {
  const service = getMessageService();
  if (!service || !pfId) {
    console.warn('Solapi 설정이 완료되지 않아 알림톡을 발송하지 않습니다.');
    return;
  }

  try {
    await service.sendOne({
      to: data.customerPhone,
      from: process.env.SOLAPI_SENDER_NUMBER || '',
      kakaoOptions: {
        pfId,
        templateId: process.env.SOLAPI_ORDER_TEMPLATE_ID || '',
        variables: {
          '#{주문번호}': data.orderNumber,
          '#{상품명}': data.productName,
          '#{결제금액}': `₩${data.totalAmount.toLocaleString()}`,
          '#{입금자명}': data.depositorName,
          '#{사이트URL}': data.siteUrl,
        },
      },
    });
    console.log(`알림톡 발송 성공: ${data.orderNumber}`);
  } catch (error) {
    console.error('알림톡 발송 실패:', error);
  }
}

// 상태 변경 알림톡
interface StatusAlimtalkData {
  customerPhone: string;
  orderNumber: string;
  productName: string;
  status: string;
  siteUrl: string;
}

export async function sendStatusAlimtalk(data: StatusAlimtalkData) {
  const service = getMessageService();
  if (!service || !pfId) {
    console.warn('Solapi 설정이 완료되지 않아 알림톡을 발송하지 않습니다.');
    return;
  }

  const templateId = process.env.SOLAPI_STATUS_TEMPLATE_ID || '';
  if (!templateId) {
    console.warn('상태변경 알림톡 템플릿이 설정되지 않았습니다.');
    return;
  }

  try {
    await service.sendOne({
      to: data.customerPhone,
      from: process.env.SOLAPI_SENDER_NUMBER || '',
      kakaoOptions: {
        pfId,
        templateId,
        variables: {
          '#{주문번호}': data.orderNumber,
          '#{상품명}': data.productName,
          '#{주문상태}': data.status,
          '#{사이트URL}': data.siteUrl,
        },
      },
    });
    console.log(`상태변경 알림톡 발송 성공: ${data.orderNumber} → ${data.status}`);
  } catch (error) {
    console.error('상태변경 알림톡 발송 실패:', error);
  }
}
