// =============================================================================
// Email 모듈 barrel export
// =============================================================================

export { escapeHtml, sendMail } from './transporter';
export { sendOrderConfirmationEmail, sendNewOrderNotificationEmail } from './order-emails';
export { sendStatusChangeEmail, sendPaymentReminderEmail, sendOrderCancelEmail, sendAdminCancelNotificationEmail } from './status-emails';
export { sendReturnRequestEmail, sendReturnStatusEmail } from './return-emails';
export { sendEbookOrderConfirmation, sendEbookOrderNotification, sendEbookDownloadLink } from './ebook-emails';
