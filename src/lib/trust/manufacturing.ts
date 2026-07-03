import { TRUST_IMAGES } from "./images";

export type ManufacturingStep = {
  id: string;
  title: string;
  description: string;
  illustration: string;
  illustrationAlt: string;
  icon: string;
};

export const MANUFACTURING_STEPS: ManufacturingStep[] = [
  {
    id: "raw-materials",
    title: "Raw Materials",
    description:
      "Ingredients are sourced from approved suppliers with certificates of analysis. Each batch is logged and traceable from origin to finished product.",
    illustration: TRUST_IMAGES.rawMaterials,
    illustrationAlt: "Sourcing raw materials for baby care production",
    icon: "package",
  },
  {
    id: "quality-inspection",
    title: "Quality Inspection",
    description:
      "Incoming materials undergo identity verification, purity testing, and compliance checks before entering the production area.",
    illustration: TRUST_IMAGES.inspection,
    illustrationAlt: "Quality inspection of raw materials",
    icon: "search-check",
  },
  {
    id: "production",
    title: "Production",
    description:
      "Formulations are produced in GMP-certified facilities with controlled environments, documented batch records, and in-process quality checks.",
    illustration: TRUST_IMAGES.production,
    illustrationAlt: "GMP production of baby care products",
    icon: "factory",
  },
  {
    id: "packaging",
    title: "Packaging",
    description:
      "Products are filled and sealed in clean-room conditions. Labels are verified for accuracy, including ingredient lists and batch codes.",
    illustration: TRUST_IMAGES.packaging,
    illustrationAlt: "Packaging baby care products",
    icon: "box",
  },
  {
    id: "warehouse",
    title: "Warehouse",
    description:
      "Finished goods are stored in climate-controlled warehouses with FIFO inventory management and regular quality audits.",
    illustration: TRUST_IMAGES.warehouse,
    illustrationAlt: "Warehouse storage of finished products",
    icon: "warehouse",
  },
  {
    id: "shipping",
    title: "Shipping",
    description:
      "Orders are picked, packed, and dispatched through trusted logistics partners with real-time tracking for every shipment.",
    illustration: TRUST_IMAGES.shipping,
    illustrationAlt: "Shipping baby care orders across India",
    icon: "truck",
  },
  {
    id: "delivery",
    title: "Customer Delivery",
    description:
      "Products arrive at your doorstep in secure packaging. Our support team is available if you have any questions about your order.",
    illustration: TRUST_IMAGES.delivery,
    illustrationAlt: "Customer receiving BeyondBabyCo delivery",
    icon: "home",
  },
];
