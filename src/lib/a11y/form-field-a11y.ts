/** Pure helpers for wiring FormField label ↔ control ARIA relationships. */

export function mergeAriaDescribedBy(
  existing: string | undefined,
  ...ids: Array<string | undefined>
): string | undefined {
  const parts = [
    ...(existing?.split(/\s+/).filter(Boolean) ?? []),
    ...ids.filter(Boolean),
  ] as string[];
  const unique = [...new Set(parts)];
  return unique.length > 0 ? unique.join(" ") : undefined;
}

export function formControlAriaProps(options: {
  fieldId: string;
  descriptionId?: string;
  errorId?: string;
  hasError?: boolean;
  required?: boolean;
  existingDescribedBy?: string;
  existingInvalid?: boolean | "grammar" | "spelling" | "true" | "false";
  existingRequired?: boolean;
}): {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  "aria-required"?: boolean;
} {
  const describedBy = mergeAriaDescribedBy(
    options.existingDescribedBy,
    options.descriptionId,
    options.hasError ? options.errorId : undefined,
  );

  return {
    id: options.fieldId,
    ...(describedBy ? { "aria-describedby": describedBy } : {}),
    ...(options.hasError || options.existingInvalid
      ? { "aria-invalid": true as const }
      : {}),
    ...(options.required || options.existingRequired
      ? { "aria-required": true as const }
      : {}),
  };
}
