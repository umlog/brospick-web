import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

interface OrderItem {
  productName: string;
  size: string;
  quantity: number;
  price: number;
}

interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  shippingFee: number;
  depositorName: string;
  items: OrderItem[];
  address: string;
  addressDetail?: string;
  trackingUrl: string;
}

export async function sendOrderConfirmationEmail(data: OrderEmailData) {
  const itemsHtml = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;">${item.productName}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;text-align:center;">${item.size}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;text-align:center;">${item.quantity}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;text-align:right;">₩${(item.price * item.quantity).toLocaleString()}</td>
      </tr>`
    )
    .join('');

  const html = `
  <div style="max-width:560px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Noto Sans KR',sans-serif;">
    <div style="background:#121212;padding:32px 24px;text-align:center;border-radius:12px 12px 0 0;">
      <h1 style="color:#fff;font-size:20px;margin:0 0 8px;">BROSPICK</h1>
      <p style="color:#b3b3b3;font-size:14px;margin:0;">주문이 완료되었습니다</p>
    </div>

    <div style="padding:28px 24px;background:#fff;border:1px solid #eee;border-top:none;">
      <p style="font-size:15px;color:#333;margin:0 0 20px;">
        ${data.customerName}님, 주문해주셔서 감사합니다.
      </p>

      <div style="background:#f8f8f8;border-radius:8px;padding:16px;margin-bottom:24px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <span style="font-size:13px;color:#888;">주문번호</span>
          <span style="font-size:14px;color:#333;font-weight:600;">${data.orderNumber}</span>
        </div>
      </div>

      <h3 style="font-size:14px;color:#333;margin:0 0 12px;font-weight:600;">주문 상품</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <thead>
          <tr style="background:#f8f8f8;">
            <th style="padding:10px 12px;font-size:12px;color:#888;text-align:left;font-weight:500;">상품</th>
            <th style="padding:10px 12px;font-size:12px;color:#888;text-align:center;font-weight:500;">사이즈</th>
            <th style="padding:10px 12px;font-size:12px;color:#888;text-align:center;font-weight:500;">수량</th>
            <th style="padding:10px 12px;font-size:12px;color:#888;text-align:right;font-weight:500;">금액</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div style="border-top:2px solid #333;padding-top:12px;margin-bottom:24px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <span style="font-size:13px;color:#888;">상품 금액</span>
          <span style="font-size:14px;color:#333;">₩${(data.totalAmount - data.shippingFee).toLocaleString()}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <span style="font-size:13px;color:#888;">배송비</span>
          <span style="font-size:14px;color:#333;">₩${data.shippingFee.toLocaleString()}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:8px;">
          <span style="font-size:15px;color:#333;font-weight:700;">총 결제금액</span>
          <span style="font-size:15px;color:#ff3b30;font-weight:700;">₩${data.totalAmount.toLocaleString()}</span>
        </div>
      </div>

      <div style="background:#fff8f0;border:1px solid #ffe0b2;border-radius:8px;padding:16px;margin-bottom:24px;">
        <h4 style="font-size:14px;color:#e65100;margin:0 0 10px;">입금 안내 (무통장입금)</h4>
        <p style="font-size:13px;color:#555;margin:0 0 4px;">은행명: <strong>카카오뱅크</strong></p>
        <p style="font-size:13px;color:#555;margin:0 0 4px;">계좌번호: <strong>3333-27-7618216</strong></p>
        <p style="font-size:13px;color:#555;margin:0 0 4px;">예금주: <strong>홍주영</strong></p>
        <p style="font-size:13px;color:#555;margin:0 0 4px;">입금자명: <strong>${data.depositorName}</strong></p>
        <p style="font-size:12px;color:#e65100;margin:12px 0 0;font-weight:500;">
          ⚠ 주문 후 24시간 이내에 입금해주세요.
        </p>
      </div>

      <div style="background:#f8f8f8;border-radius:8px;padding:16px;margin-bottom:24px;">
        <h4 style="font-size:14px;color:#333;margin:0 0 8px;">배송지</h4>
        <p style="font-size:13px;color:#555;margin:0;">
          ${data.address}${data.addressDetail ? ' ' + data.addressDetail : ''}
        </p>
      </div>

      <div style="text-align:center;margin-top:24px;">
        <a href="${data.trackingUrl}"
           style="display:inline-block;background:#ff3b30;color:#fff;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;">
          주문 상태 확인하기
        </a>
      </div>
    </div>

    <div style="padding:20px 24px;text-align:center;border-radius:0 0 12px 12px;background:#f8f8f8;border:1px solid #eee;border-top:none;">
      <p style="font-size:12px;color:#999;margin:0;">
        본 메일은 BROSPICK에서 발송된 주문 확인 메일입니다.
      </p>
    </div>
  </div>`;

  await transporter.sendMail({
    from: `"BROSPICK" <${process.env.GMAIL_USER}>`,
    to: data.customerEmail,
    subject: `[BROSPICK] 주문이 완료되었습니다 (${data.orderNumber})`,
    html,
  });
}

// 상태 변경 알림 이메일
interface StatusChangeEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: string;
  trackingUrl: string;
  trackingNumber?: string;
}

const STATUS_INFO: Record<string, { title: string; message: string; color: string; bgColor: string }> = {
  '입금확인': {
    title: '입금이 확인되었습니다',
    message: '입금이 정상적으로 확인되었습니다. 빠르게 배송 준비를 시작하겠습니다.',
    color: '#34c759',
    bgColor: '#f0faf3',
  },
  '배송중': {
    title: '상품이 배송 중입니다',
    message: '주문하신 상품이 발송되었습니다. 곧 받아보실 수 있습니다.',
    color: '#5856d6',
    bgColor: '#f3f0ff',
  },
  '배송완료': {
    title: '배송이 완료되었습니다',
    message: '상품이 정상적으로 배송 완료되었습니다. BROSPICK을 이용해주셔서 감사합니다.',
    color: '#34c759',
    bgColor: '#f0faf3',
  },
};

export async function sendStatusChangeEmail(data: StatusChangeEmailData) {
  const info = STATUS_INFO[data.status];
  if (!info) return;

  const copyButtonStyle = `display:inline-block;margin-left:8px;padding:2px 8px;background:#eee;border-radius:4px;font-size:11px;color:#555;text-decoration:none;cursor:pointer;vertical-align:middle;`;

  const trackingNumberHtml = data.trackingNumber ? `
      <div style="background:#f0f6ff;border:1px solid #d0e3ff;border-radius:8px;padding:16px;margin-bottom:24px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <span style="font-size:13px;color:#888;">운송장번호</span>
          <span>
            <span style="font-size:15px;color:#333;font-weight:700;font-family:monospace;letter-spacing:0.5px;">${data.trackingNumber}</span>
            <a href="#" onclick="navigator.clipboard.writeText('${data.trackingNumber}');this.textContent='복사됨!';setTimeout(()=>this.textContent='복사',1500);return false;" style="${copyButtonStyle}">복사</a>
          </span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:13px;color:#888;">주문번호</span>
          <span>
            <span style="font-size:14px;color:#333;font-weight:600;">${data.orderNumber}</span>
            <a href="#" onclick="navigator.clipboard.writeText('${data.orderNumber}');this.textContent='복사됨!';setTimeout(()=>this.textContent='복사',1500);return false;" style="${copyButtonStyle}">복사</a>
          </span>
        </div>
      </div>` : `
      <div style="background:#f8f8f8;border-radius:8px;padding:16px;margin-bottom:24px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:13px;color:#888;">주문번호</span>
          <span>
            <span style="font-size:14px;color:#333;font-weight:600;">${data.orderNumber}</span>
            <a href="#" onclick="navigator.clipboard.writeText('${data.orderNumber}');this.textContent='복사됨!';setTimeout(()=>this.textContent='복사',1500);return false;" style="${copyButtonStyle}">복사</a>
          </span>
        </div>
      </div>`;

  const html = `
  <div style="max-width:560px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Noto Sans KR',sans-serif;">
    <div style="background:#121212;padding:32px 24px;text-align:center;border-radius:12px 12px 0 0;">
      <h1 style="color:#fff;font-size:20px;margin:0 0 8px;">BROSPICK</h1>
      <p style="color:#b3b3b3;font-size:14px;margin:0;">${info.title}</p>
    </div>

    <div style="padding:28px 24px;background:#fff;border:1px solid #eee;border-top:none;">
      <p style="font-size:15px;color:#333;margin:0 0 20px;">
        ${data.customerName}님, 안녕하세요.
      </p>

      <div style="background:${info.bgColor};border-radius:8px;padding:20px;margin-bottom:24px;text-align:center;">
        <div style="display:inline-block;padding:6px 16px;border-radius:20px;background:${info.color};color:#fff;font-size:14px;font-weight:600;margin-bottom:12px;">
          ${data.status}
        </div>
        <p style="font-size:14px;color:#333;margin:12px 0 0;">${info.message}</p>
      </div>

      ${trackingNumberHtml}

      <div style="text-align:center;margin-top:24px;">
        <a href="${data.trackingUrl}"
           style="display:inline-block;background:#ff3b30;color:#fff;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;">
          주문 상태 확인하기
        </a>
      </div>
    </div>

    <div style="padding:20px 24px;text-align:center;border-radius:0 0 12px 12px;background:#f8f8f8;border:1px solid #eee;border-top:none;">
      <p style="font-size:12px;color:#999;margin:0;">
        본 메일은 BROSPICK에서 발송된 주문 상태 알림 메일입니다.
      </p>
    </div>
  </div>`;

  await transporter.sendMail({
    from: `"BROSPICK" <${process.env.GMAIL_USER}>`,
    to: data.customerEmail,
    subject: `[BROSPICK] ${info.title} (${data.orderNumber})`,
    html,
  });
}
