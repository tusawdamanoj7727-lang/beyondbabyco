import { z } from "zod";

export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
] as const;

export const addressFormSchema = z.object({
  id: z.string().uuid().optional(),
  full_name: z.string().trim().min(2, "Name is required"),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  line1: z.string().trim().min(3, "Address line is required"),
  line2: z.string().trim().optional().nullable(),
  city: z.string().trim().min(2, "City is required"),
  state: z.string().trim().min(2, "State is required"),
  country: z.string().trim().default("India"),
  pincode: z.string().trim().regex(/^\d{6}$/, "Enter a valid 6-digit PIN code"),
  is_default: z.boolean().optional(),
});

export type AddressFormValues = z.infer<typeof addressFormSchema>;

export const checkoutCustomerSchema = z.object({
  full_name: z.string().trim().min(2),
  email: z.string().trim().email(),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/),
});

export type PaymentMethodId = "razorpay" | "cod";

/** Client cart line — server resolves price, GST, and availability. */
export const checkoutCartLineSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().nullable(),
  quantity: z.number().int().positive(),
});

export type CheckoutCartLineInput = z.infer<typeof checkoutCartLineSchema>;

export const placeOrderSchema = z.object({
  idempotencyKey: z.string().uuid(),
  customer: checkoutCustomerSchema,
  shipping: addressFormSchema,
  billingSameAsShipping: z.boolean(),
  billing: addressFormSchema.optional(),
  paymentMethod: z.enum(["razorpay", "cod"]),
  cartItems: z.array(checkoutCartLineSchema).min(1),
  /** Coupon code only — discount computed server-side. */
  couponCode: z.string().trim().optional().nullable(),
  saveShippingAddress: z.boolean().optional(),
  buyerGstin: z.string().trim().optional().nullable(),
});

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;

export function fieldErrorsFrom(
  issues: readonly { path: PropertyKey[]; message: string }[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join(".") || "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
