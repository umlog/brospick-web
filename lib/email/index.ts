// =============================================================================
// Email 모듈 barrel export
// =============================================================================

export { escapeHtml, sendMail } from './transporter';
export { sendOrderConfirmationEmail, sendNewOrderNotificationEmail } from './order-emails';
export { sendStatusChangeEmail, sendPaymentReminderEmail } from './status-emails';
export { sendReturnRequestEmail, sendReturnStatusEmail } from './return-emails';
