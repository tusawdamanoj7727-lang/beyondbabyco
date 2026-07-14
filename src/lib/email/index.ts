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
  onCodOrderConfirmed,
  onPaymentSuccess,
  onPaymentFailed,
  onOrderStatusChanged,
  onShipmentStatusChanged,
  onRefundInitiated,
  onRefundCompleted,
  onOrderCancelled,
} from "./events/orders";
export {
  dispatchOrderEmail,
  dispatchOrderEmailAsync,
  type DispatchOrderEmailResult,
} from "./dispatch";
export {
  runOrderCompletionEmails,
  resolveOrderCompletionChannel,
  markOrderConfirmed,
  runCodOrderCreatedEmails,
  runCodOrderCreatedEmailsAsync,
  runPrepaidPaymentCapturedEmails,
  runPrepaidPaymentCapturedEmailsAsync,
  runOrderShippingEmail,
  runOrderShippingEmailAsync,
} from "./lifecycle";
export {
  onNewCustomer,
  onContactFormSubmitted,
  onRefundRequested,
  onLowStockAlert,
  onOutOfStockAlert,
  onNewsletterSubscribed,
} from "./events/admin";
