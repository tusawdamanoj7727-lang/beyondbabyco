import "server-only";

import { brandSupportEmail } from "@/lib/brand/contact";
import { PRODUCTION_SITE_URL } from "@/lib/seo/site";

/** Seller legal entity shown on tax invoices (env-overridable for production). */
export type SellerLegal = {
  brandName: string;
  legalName: string;
  gstin: string;
  registeredAddress: string;
  city: string;
  state: string;
  stateCode: string;
  pincode: string;
  country: string;
  supportEmail: string;
  website: string;
  returnPolicy: string;
};

export function getSellerLegal(): SellerLegal {
  const gstin = process.env.SELLER_GSTIN?.trim() || "08AALCT7770Q1Z8";
  const registeredAddress =
    process.env.SELLER_REGISTERED_ADDRESS?.trim() ||
    "Tusawda Global Private Limited, Udaipur, Rajasthan, India";

  return {
    brandName: "BeyondBabyCo",
    legalName:
      process.env.SELLER_LEGAL_NAME?.trim() || "Tusawda Global Private Limited",
    gstin,
    registeredAddress,
    city: process.env.SELLER_CITY?.trim() || "Udaipur",
    state: process.env.SELLER_STATE?.trim() || "Rajasthan",
    stateCode: process.env.SELLER_STATE_CODE?.trim() || "08",
    pincode: process.env.SELLER_PINCODE?.trim() || "313001",
    country: "India",
    supportEmail: brandSupportEmail(),
    website: process.env.NEXT_PUBLIC_SITE_URL?.trim() || PRODUCTION_SITE_URL,
    returnPolicy:
      process.env.SELLER_RETURN_POLICY?.trim() ||
      "7-day returns on unused products in original packaging. Contact support to initiate a return.",
  };
}

export function sellerGstinDisplay(seller: SellerLegal): string {
  return seller.gstin || "Configure SELLER_GSTIN";
}
