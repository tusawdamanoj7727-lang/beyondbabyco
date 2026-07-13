import { afterEach, describe, expect, it, vi } from "vitest";

import {
  SCROLL_REVEAL_SELECTOR,
  prefersReducedMotion,
  revealAllScrollElements,
} from "@/lib/a11y/scroll-reveal";
import { getFocusableElements, handleFocusTrap } from "@/lib/a11y/dialog-a11y";

type MockRevealNode = {
  classList: {
    add: (name: string) => void;
    contains: (name: string) => boolean;
  };
  dataset: DOMStringMap;
};

function mockRevealRoot(classNames: string[]) {
  const nodes: MockRevealNode[] = classNames.map((className) => {
    const classes = new Set<string>([className]);
    return {
      classList: {
        add: (name: string) => classes.add(name),
        contains: (name: string) => classes.has(name),
      },
      dataset: {} as DOMStringMap,
    };
  });

  return {
    root: { querySelectorAll: () => nodes } as unknown as ParentNode,
    nodes,
  };
}

function mockDialog(children: Array<{ id: string; tag: "button" | "input"; disabled?: boolean }>) {
  let active: { id: string; focus: ReturnType<typeof vi.fn> } | null = null;

  const elements = children.map((child) => {
    const el = {
      id: child.id,
      tagName: child.tag.toUpperCase(),
      hasAttribute: (name: string) => name === "disabled" && Boolean(child.disabled),
      getAttribute: (name: string) => {
        if (name === "aria-hidden") return null;
        if (name === "disabled" && child.disabled) return "";
        return null;
      },
      focus: vi.fn(() => {
        active = el;
      }),
    };
    return el;
  });

  active = elements[elements.length - 1]!;

  return {
    container: {
      querySelectorAll: () => elements,
    } as unknown as HTMLElement,
    getActive: () => active,
  };
}

describe("scroll-reveal a11y", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("exports the expected reveal selector", () => {
    expect(SCROLL_REVEAL_SELECTOR).toContain(".scroll-reveal");
    expect(SCROLL_REVEAL_SELECTOR).toContain(".accent-bar-animated");
  });

  it("revealAllScrollElements adds is-revealed to matching nodes", () => {
    const { root, nodes } = mockRevealRoot([
      "scroll-reveal",
      "scroll-reveal-item",
      "accent-bar-animated",
    ]);
    revealAllScrollElements(root);

    for (const node of nodes) {
      expect(node.classList.contains("is-revealed")).toBe(true);
      expect(node.dataset.revealObserved).toBe("1");
    }
  });

  it("prefersReducedMotion reflects matchMedia", () => {
    vi.stubGlobal("window", {
      matchMedia: (query: string) => ({
        matches: query.includes("reduce"),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    });

    expect(prefersReducedMotion()).toBe(true);
  });

  it("prefersReducedMotion returns false when motion is allowed", () => {
    vi.stubGlobal("window", {
      matchMedia: (query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    });

    expect(prefersReducedMotion()).toBe(false);
  });
});

describe("dialog a11y", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("getFocusableElements returns focusable children", () => {
    const dialog = mockDialog([
      { id: "first", tag: "button" },
      { id: "middle", tag: "input" },
      { id: "last", tag: "button" },
    ]);

    expect(getFocusableElements(dialog.container)).toHaveLength(3);
  });

  it("handleFocusTrap wraps focus from last to first on Tab", () => {
    const dialog = mockDialog([
      { id: "first", tag: "button" },
      { id: "middle", tag: "input" },
      { id: "last", tag: "button" },
    ]);

    vi.stubGlobal("document", {
      get activeElement() {
        return dialog.getActive();
      },
    });

    const event = {
      key: "Tab",
      shiftKey: false,
      preventDefault: vi.fn(),
    } as unknown as KeyboardEvent;

    handleFocusTrap(dialog.container, event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(dialog.getActive()?.id).toBe("first");
  });
});
