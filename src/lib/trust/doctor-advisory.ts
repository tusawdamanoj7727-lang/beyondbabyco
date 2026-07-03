import { TRUST_IMAGES } from "./images";

export type DoctorAdvisoryBlock = {
  title: string;
  description: string;
  icon: string;
};

export const DOCTOR_ADVISORY_BLOCKS: DoctorAdvisoryBlock[] = [
  {
    title: "Research Collaboration",
    description:
      "We engage with pediatric and dermatology professionals during product development to review formulation rationale, age-appropriate use, and application guidance — ensuring our products reflect current best practices in infant skin care.",
    icon: "users",
  },
  {
    title: "Safety Testing Protocol",
    description:
      "Every formulation follows a structured safety testing protocol including stability analysis, preservative efficacy testing, microbial limits, and dermatological evaluation — conducted before any product is approved for production.",
    icon: "shield-check",
  },
  {
    title: "Ingredient Review",
    description:
      "Ingredient lists are reviewed for concentration appropriateness, interaction potential, and suitability for baby skin. We maintain a restricted substances list that exceeds regulatory minimums.",
    icon: "flask-conical",
  },
  {
    title: "Development Methodology",
    description:
      "Our development methodology follows a research-first approach: literature review, ingredient screening, prototype formulation, safety validation, and iterative refinement based on testing data — not marketing timelines.",
    icon: "clipboard-list",
  },
];

export const DOCTOR_ADVISORY_DISCLAIMER =
  "BeyondBabyCo products are developed with guidance from pediatric and dermatology professionals as part of our internal development process. Statements on this page describe our methodology — they do not constitute individual medical endorsements or prescriptions. Always consult your pediatrician for specific skin concerns.";

export const DOCTOR_ADVISORY_IMAGE = TRUST_IMAGES.doctorAdvisory;
