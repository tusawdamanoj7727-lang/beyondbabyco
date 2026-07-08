import { BASE_SAMPLE_DATA } from "../sample-data";
import type { EmailTemplate } from "../types";

function tpl(
  partial: Omit<EmailTemplate, "sampleData"> & { extraSample?: Record<string, string> },
): EmailTemplate {
  return { showTrustBadges: true, ...partial, sampleData: { ...BASE_SAMPLE_DATA, ...partial.extraSample } };
}

const p = (text: string) => `<p style="margin:0 0 16px;">${text}</p>`;

/** Delivery templates — use shipment status placeholders only (no API coupling). */
export const DELIVERY_EMAIL_TEMPLATES: EmailTemplate[] = [
  tpl({
    id: "shipment-picked",
    name: "Shipment Picked",
    category: "delivery",
    subject: "Shipment picked up — {{order_number}}",
    preheader: "Your package has been picked up by {{carrier_name}}.",
    heading: "Shipment Picked Up",
    bodyHtml: `${p("Hi {{customer_name}},")}${p("Your BeyondBabyCo order {{order_number}} has been picked up by {{carrier_name}}.")}${p("<strong>Status:</strong> {{shipment_status}}")}${p("<strong>Tracking:</strong> {{tracking_number}}")}`,
    cta: { label: "Track Shipment", href: "{{order_url}}" },
  }),
  tpl({
    id: "in-transit",
    name: "In Transit",
    category: "delivery",
    subject: "In transit — order {{order_number}}",
    preheader: "Your order is on its way to you.",
    heading: "Shipment In Transit",
    bodyHtml: `${p("Hi {{customer_name}},")}${p("Your order {{order_number}} is in transit via {{carrier_name}}.")}${p("<strong>Estimated delivery:</strong> {{estimated_delivery}}")}`,
    cta: { label: "Track Shipment", href: "{{order_url}}" },
  }),
  tpl({
    id: "reached-city",
    name: "Reached City",
    category: "delivery",
    subject: "Arrived in your city — order {{order_number}}",
    preheader: "Your package has reached your delivery city.",
    heading: "Reached Your City",
    bodyHtml: `${p("Hi {{customer_name}},")}${p("Great news! Your BeyondBabyCo order {{order_number}} has reached your delivery city and will be out for delivery soon.")}${p("<strong>Estimated delivery:</strong> {{estimated_delivery}}")}`,
    cta: { label: "Track Shipment", href: "{{order_url}}" },
  }),
  tpl({
    id: "delivery-out-for-delivery",
    name: "Out for Delivery",
    category: "delivery",
    subject: "Out for delivery today — {{order_number}}",
    preheader: "Your package will arrive today!",
    heading: "Out For Delivery",
    bodyHtml: `${p("Hi {{customer_name}},")}${p("Your order {{order_number}} is out for delivery and should arrive today.")}${p("<strong>Delivery address:</strong><br/>{{delivery_address}}")}`,
    cta: { label: "Track Delivery", href: "{{order_url}}" },
  }),
  tpl({
    id: "delivery-delivered",
    name: "Delivered",
    category: "delivery",
    subject: "Delivered — order {{order_number}}",
    preheader: "Your BeyondBabyCo package has been delivered.",
    heading: "Successfully Delivered",
    bodyHtml: `${p("Hi {{customer_name}},")}${p("Your order {{order_number}} has been delivered. Thank you for choosing BeyondBabyCo!")}${p("We hope your little one enjoys their gentle, research-backed care products.")}`,
    cta: { label: "View Order", href: "{{order_url}}" },
  }),
  tpl({
    id: "delivery-failed",
    name: "Delivery Failed",
    category: "delivery",
    subject: "Delivery attempt failed — {{order_number}}",
    preheader: "We couldn't deliver your package today.",
    heading: "Delivery Attempt Failed",
    bodyHtml: `${p("Hi {{customer_name}},")}${p("We attempted to deliver your order {{order_number}} but were unable to complete delivery.")}${p("{{carrier_name}} will retry or contact you to reschedule. Please ensure your phone is reachable.")}`,
    cta: { label: "Contact Support", href: "{{support_url}}" },
    secondaryCta: { label: "Track Shipment", href: "{{order_url}}" },
  }),
  tpl({
    id: "rescheduled",
    name: "Rescheduled",
    category: "delivery",
    subject: "Delivery rescheduled — {{order_number}}",
    preheader: "Your delivery has been rescheduled to {{estimated_delivery}}.",
    heading: "Delivery Rescheduled",
    bodyHtml: `${p("Hi {{customer_name}},")}${p("Your delivery for order {{order_number}} has been rescheduled.")}${p("<strong>New estimated delivery:</strong> {{estimated_delivery}}")}`,
    cta: { label: "Track Shipment", href: "{{order_url}}" },
  }),
  tpl({
    id: "return-shipment",
    name: "Return Shipment",
    category: "delivery",
    subject: "Return shipment initiated — {{order_number}}",
    preheader: "Your return package is on its way back to us.",
    heading: "Return Shipment In Progress",
    bodyHtml: `${p("Hi {{customer_name}},")}${p("Your return for order {{order_number}} is being shipped back to BeyondBabyCo.")}${p("<strong>Tracking:</strong> {{tracking_number}}")}`,
    cta: { label: "View Return Status", href: "{{order_url}}" },
  }),
  tpl({
    id: "pickup-scheduled",
    name: "Pickup Scheduled",
    category: "delivery",
    subject: "Return pickup scheduled — {{order_number}}",
    preheader: "A pickup has been scheduled for your return.",
    heading: "Return Pickup Scheduled",
    bodyHtml: `${p("Hi {{customer_name}},")}${p("A return pickup for order {{order_number}} has been scheduled.")}${p("<strong>Pickup date:</strong> {{estimated_delivery}}")}${p("Please keep the return package ready with original packaging.")}`,
    cta: { label: "Return Policy", href: "{{site_url}}/refund-policy" },
  }),
];
