import { describe, expect, it } from "vitest";

import {
  formControlAriaProps,
  mergeAriaDescribedBy,
} from "@/lib/a11y/form-field-a11y";

describe("form-field a11y", () => {
  it("mergeAriaDescribedBy deduplicates and joins ids", () => {
    expect(mergeAriaDescribedBy("a b", "b", "c")).toBe("a b c");
    expect(mergeAriaDescribedBy(undefined, undefined)).toBeUndefined();
  });

  it("formControlAriaProps wires description and error ids", () => {
    const props = formControlAriaProps({
      fieldId: "email",
      descriptionId: "email-description",
      errorId: "email-error",
      hasError: true,
      required: true,
    });

    expect(props.id).toBe("email");
    expect(props["aria-describedby"]).toBe("email-description email-error");
    expect(props["aria-invalid"]).toBe(true);
    expect(props["aria-required"]).toBe(true);
  });

  it("formControlAriaProps omits error id when there is no error", () => {
    const props = formControlAriaProps({
      fieldId: "name",
      descriptionId: "name-description",
      errorId: "name-error",
      hasError: false,
    });

    expect(props["aria-describedby"]).toBe("name-description");
    expect(props["aria-invalid"]).toBeUndefined();
  });

  it("formControlAriaProps preserves existing describedby values", () => {
    const props = formControlAriaProps({
      fieldId: "phone",
      descriptionId: "phone-description",
      errorId: "phone-error",
      hasError: true,
      existingDescribedBy: "phone-hint",
    });

    expect(props["aria-describedby"]).toBe("phone-hint phone-description phone-error");
  });
});
