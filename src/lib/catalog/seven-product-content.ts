import { LAUNCH_PRODUCT_SLUGS } from "@/lib/catalog/availability";

type SevenProductContent = {
  directions: string;
  benefits: { name: string; icon: string; description: string }[];
  faqs: { question: string; answer: string }[];
};

export const SEVEN_PRODUCT_CONTENT: Record<string, SevenProductContent> = {
  "baby-wipes": {
    directions:
      "Open the lid and pull one wipe gently. Use for diaper changes, face, and hands. Reseal the pack after each use to keep wipes fresh.",
    benefits: [
      { icon: "💧", name: "99% Purified Water", description: "Gentle cleansing without harsh solvents or heavy fragrance." },
      { icon: "🛡️", name: "Hypoallergenic", description: "Formulated to minimize allergy risk on delicate baby skin." },
      { icon: "✓", name: "Paraben Free", description: "No parabens — suitable for sensitive skin from day one." },
    ],
    faqs: [
      { question: "Are these safe for newborns?", answer: "Yes — dermatologically tested and suitable from birth when used as directed." },
      { question: "Can I use them on the face?", answer: "Yes — they are gentle enough for face, hands, and diaper area." },
    ],
  },
  "baby-hair-oil-100ml": {
    directions:
      "Warm 2–3 drops between your palms. Gently massage into scalp and hair using soft circular motions. Use 2–3 times per week or as needed. Avoid contact with eyes.",
    benefits: [
      { icon: "🌿", name: "Natural Nourishment", description: "Lightweight oils that support healthy baby hair without greasiness." },
      { icon: "✓", name: "Dermatologically Tested", description: "Formulated and tested for delicate infant scalp and skin." },
      { icon: "💧", name: "Non-Sticky Finish", description: "Absorbs quickly so hair stays soft, not oily." },
    ],
    faqs: [
      { question: "From what age can I use Baby Hair Oil?", answer: "Suitable from birth when used as directed. Always patch test first." },
      { question: "How often should I apply it?", answer: "2–3 times per week is ideal for most babies. Adjust based on your child's hair type." },
    ],
  },
  "baby-massage-oil-100ml": {
    directions:
      "Warm a small amount in your palms. Massage gently over arms, legs, chest, and back using slow strokes before bath or bedtime. Wipe excess if needed.",
    benefits: [
      { icon: "🌙", name: "Calming Bedtime Ritual", description: "Supports relaxation and bonding during massage time." },
      { icon: "🌿", name: "Ayurvedic-Inspired Blend", description: "Thoughtfully selected oils traditionally used in baby massage." },
      { icon: "✓", name: "Safe for Daily Use", description: "Gentle enough for regular massage routines." },
    ],
    faqs: [
      { question: "Can I use this before every bath?", answer: "Yes — many parents use it as part of a daily massage and bath routine." },
      { question: "Is it safe for newborns?", answer: "Yes, when used in small amounts and kept away from the face and navel area until healed." },
    ],
  },
  "baby-body-wash-200ml": {
    directions:
      "Dispense a small amount onto wet hands or a soft washcloth. Gently cleanse baby's body, then rinse thoroughly with lukewarm water. Follow with Baby Lotion if needed.",
    benefits: [
      { icon: "💧", name: "Sulfate-Free Cleansing", description: "Cleans effectively without stripping natural skin moisture." },
      { icon: "🛁", name: "Daily Bath Safe", description: "Mild enough for everyday use from day one." },
      { icon: "✓", name: "pH Balanced", description: "Formulated to respect baby skin's natural barrier." },
    ],
    faqs: [
      { question: "Is this tear-free?", answer: "It is formulated to be gentle, but always avoid direct contact with eyes and rinse if contact occurs." },
      { question: "Can I use it on the face?", answer: "Use on the body; for the face, rinse carefully and avoid the eye area." },
    ],
  },
  "baby-lotion-200ml": {
    directions:
      "Apply to clean, dry skin after bath or whenever skin feels dry. Massage gently until absorbed, paying extra attention to elbows, knees, and cheeks.",
    benefits: [
      { icon: "🧴", name: "Deep Moisture", description: "Shea butter and gentle emollients help lock in hydration." },
      { icon: "✓", name: "Dermatologically Tested", description: "Tested for sensitive and delicate baby skin." },
      { icon: "🌿", name: "Light, Non-Greasy Feel", description: "Absorbs quickly for all-day comfort." },
    ],
    faqs: [
      { question: "Can I use this on newborns?", answer: "Yes — apply a thin layer to dry areas as needed after patch testing." },
      { question: "How much should I use?", answer: "A pea- to coin-sized amount is usually enough for arms and legs." },
    ],
  },
  "baby-diaper-rash-cream-50gm": {
    directions:
      "Clean and dry the diaper area thoroughly. Apply a thin, even layer at each diaper change, especially at bedtime or when rash is present.",
    benefits: [
      { icon: "🛡️", name: "Protective Barrier", description: "Helps shield skin from moisture and friction." },
      { icon: "🌿", name: "Soothing Relief", description: "Calms redness and discomfort associated with diaper rash." },
      { icon: "✓", name: "Pediatrician-Friendly Formula", description: "Developed for frequent diaper-area use." },
    ],
    faqs: [
      { question: "How quickly does it work?", answer: "Many parents notice improvement within a few diaper changes when used consistently." },
      { question: "Can I use it preventively?", answer: "Yes — a thin layer at each change helps prevent rash before it starts." },
    ],
  },
  "baby-shampoo-200ml": {
    directions:
      "Wet hair with lukewarm water. Apply a small amount, lather gently, and rinse thoroughly. Tilt head back slightly to keep suds away from eyes.",
    benefits: [
      { icon: "👶", name: "Gentle on Scalp", description: "Mild surfactants cleanse without over-drying." },
      { icon: "💧", name: "Easy Rinse", description: "Rinses clean with minimal residue." },
      { icon: "✓", name: "pH Balanced", description: "Respects the natural balance of baby hair and scalp." },
    ],
    faqs: [
      { question: "How often should I shampoo?", answer: "1–3 times per week is usually enough for babies unless hair is very oily." },
      { question: "Is it suitable for cradle cap?", answer: "Gentle cleansing can help; consult your pediatrician for persistent cradle cap." },
    ],
  },
  "tummy-rollon-40ml": {
    directions:
      "Roll gently onto baby's tummy in a clockwise direction. Use 1–2 swipes during discomfort or as part of a calming bedtime routine. Do not apply to broken skin.",
    benefits: [
      { icon: "🌿", name: "Natural Essential Oils", description: "A soothing blend designed for external tummy application." },
      { icon: "🤲", name: "Easy Roll-On Applicator", description: "Hygienic, mess-free application for busy parents." },
      { icon: "✓", name: "External Use Only", description: "Formulated for gentle topical use on the tummy area." },
    ],
    faqs: [
      { question: "From what age can I use Tummy Roll-On?", answer: "Suitable for babies 3 months and older unless advised otherwise by your doctor." },
      { question: "How often can I apply it?", answer: "Use as needed during discomfort, up to 2–3 times per day." },
    ],
  },
};

export function getSevenProductContent(slug: string): SevenProductContent | null {
  if (!LAUNCH_PRODUCT_SLUGS.has(slug)) return null;
  return SEVEN_PRODUCT_CONTENT[slug] ?? null;
}
