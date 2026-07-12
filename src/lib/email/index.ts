export {
  getSmtpConfig,
  isSmtpConfigured,
  validateSmtpEnv,
  type SmtpConfig,
} from "./config";
export { getTransporter, verifySmtpConnection } from "./transporter";
export { sendEmail, sendEmailAsync, type EmailSendResult } from "./sendEmail";
export { sendTemplateEmail, sendTemplateEmailAsync } from "./send-template";
export {
  resolveOrderEmailData,
  resolveCustomerEmailData,
  resolveContactEmailData,
} from "./data-resolvers";
export {
  onOrderCreated,
  onPaymentSuccess,
  onPaymentFailed,
  onOrderStatusChanged,
  onShipmentStatusChanged,
  onRefundInitiated,
  onRefundCompleted,
  onOrderCancelled,
} from "./events/orders";
export {
  onNewCustomer,
  onContactFormSubmitted,
  onRefundRequested,
  onLowStockAlert,
  onOutOfStockAlert,
  onNewsletterSubscribed,
} from "./events/admin";
