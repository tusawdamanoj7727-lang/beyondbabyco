/** Phase 11.4B — Runtime prompts (delegates to commercial-prompts.mjs). */

export {
  buildPrompt,
  getNegativePrompt,
  buildProductPrompt,
  buildHeroPrompt,
  buildLifestylePrompt,
  buildSciencePrompt,
  buildResearchPrompt,
  buildIngredientPrompt,
  candidateSubjectVariation,
  MASTER_PROMPT,
  NEGATIVE_PROMPT,
  GENERATION_CONFIG,
  resolveProductReferencePath,
} from "./commercial-prompts.mjs";
