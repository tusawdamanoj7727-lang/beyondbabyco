/** Delhivery API types — no `any`. */

export interface DelhiveryAddress {
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pin: string;
  country?: string;
}

export interface DelhiveryShipmentLine {
  name: string;
  sku?: string;
  hsn_code?: string;
  quantity: number;
  price: number;
}

export interface DelhiveryCreateShipmentPayload {
  shipments: Array<{
    name: string;
    order: string;
    phone: string;
    add: string;
    pin: string;
    city: string;
    state: string;
    country?: string;
    payment_mode: "Prepaid" | "COD" | "Pickup";
    cod_amount?: number;
    total_amount?: number;
    weight?: number;
    shipment_width?: number;
    shipment_height?: number;
    shipment_length?: number;
    waybill?: string;
    products_desc?: string;
    seller_name?: string;
    seller_add?: string;
    seller_inv?: string;
    seller_gst_tin?: string;
    hsn_code?: string;
  }>;
  pickup_location: { name: string };
}

export interface DelhiveryCreateShipmentResult {
  success: boolean;
  waybill: string | null;
  orderId: string | null;
  status: string | null;
  remarks: string[];
  raw: Record<string, unknown>;
}

export interface DelhiveryServiceabilityResult {
  pincode: string;
  serviceable: boolean;
  cod: boolean;
  prepaid: boolean;
  raw: Record<string, unknown>;
  httpStatus: number;
}

export interface DelhiveryTrackingScan {
  status: string;
  statusCode: string | null;
  location: string | null;
  message: string | null;
  timestamp: string | null;
}

export interface DelhiveryTrackingResult {
  waybill: string;
  status: string;
  expectedDelivery: string | null;
  scans: DelhiveryTrackingScan[];
  raw: Record<string, unknown>;
}

export interface DelhiveryWaybillResult {
  waybills: string[];
  raw: Record<string, unknown>;
}

export interface DelhiveryLabelResult {
  labelUrl: string | null;
  pdfBase64: string | null;
  raw: Record<string, unknown>;
}

export interface DelhiveryPickupRequest {
  pickupDate: string;
  pickupTime: string;
  pickupLocation: string;
  expectedPackageCount: number;
}

export interface DelhiveryPickupResult {
  success: boolean;
  pickupId: string | null;
  raw: Record<string, unknown>;
}

export interface DelhiveryCancelResult {
  success: boolean;
  message: string | null;
  raw: Record<string, unknown>;
}

export interface DelhiveryApiError extends Error {
  statusCode?: number;
  responseBody?: unknown;
}
