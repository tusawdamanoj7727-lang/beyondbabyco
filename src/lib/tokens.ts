type GreenScaleStep = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
type TerraScaleStep = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700;
type CreamScaleStep = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

type SemanticTokens = {
  brand: {
    primary: string;
    primaryHover: string;
    primaryActive: string;
    onPrimary: string;
  };
  accent: {
    default: string;
    soft: string;
    strong: string;
    onAccent: string;
  };
  background: {
    page: string;
    pageAlt: string;
    inverse: string;
  };
  surface: {
    default: string;
    subtle: string;
    elevated: string;
    interactive: string;
  };
  text: {
    primary: string;
    secondary: string;
    muted: string;
    inverse: string;
    link: string;
  };
  border: {
    default: string;
    subtle: string;
    strong: string;
    focus: string;
  };
  shadow: {
    clay: string;
    card: string;
  };
  success: {
    default: string;
    soft: string;
    on: string;
  };
  warning: {
    default: string;
    soft: string;
    on: string;
  };
  error: {
    default: string;
    soft: string;
    on: string;
  };
};

type ComponentTokens = {
  button: {
    primary: {
      background: string;
      backgroundHover: string;
      text: string;
      border: string;
      shadow: string;
    };
    secondary: {
      background: string;
      backgroundHover: string;
      text: string;
      border: string;
      shadow: string;
    };
    ghost: {
      background: string;
      backgroundHover: string;
      text: string;
      border: string;
    };
  };
  card: {
    default: {
      background: string;
      border: string;
      shadow: string;
      text: string;
    };
    feature: {
      background: string;
      border: string;
      shadow: string;
      text: string;
    };
  };
  navbar: {
    background: string;
    border: string;
    text: string;
    textMuted: string;
    shadow: string;
  };
  badge: {
    background: string;
    text: string;
    border: string;
  };
  section: {
    background: string;
    backgroundAlt: string;
    heading: string;
    body: string;
  };
};

// Layer 1: Primitive tokens (raw values, no semantic meaning).
export const primitive = {
  color: {
    green: {
      50: "#f3fbf6",
      100: "#dff5e7",
      200: "#bce9cc",
      300: "#8fd9aa",
      400: "#5ec082",
      500: "#3da764",
      600: "#2f8450",
      700: "#276a42",
      800: "#225536",
      900: "#1d452d",
    } as const satisfies Record<GreenScaleStep, string>,
    terra: {
      50: "#fcf5ef",
      100: "#f8e5d7",
      200: "#f0c9ad",
      300: "#e6a884",
      400: "#dc8660",
      500: "#cd6a45",
      600: "#ad5639",
      700: "#8d4732",
    } as const satisfies Record<TerraScaleStep, string>,
    cream: {
      50: "#fffdf8",
      100: "#fef9eb",
      200: "#fdf2d5",
      300: "#f9e7b1",
      400: "#f3d98a",
      500: "#ebc760",
      600: "#d4aa4a",
      700: "#b3873a",
      800: "#90682f",
      900: "#765528",
    } as const satisfies Record<CreamScaleStep, string>,
    neutral: {
      white: "#ffffff",
      black: "#000000",
      transparent: "transparent",
    },
  },
} as const;

// Layer 2: Semantic tokens (maps primitives to design intent).
export const semantic: SemanticTokens = {
  brand: {
    primary: primitive.color.green[500],
    primaryHover: primitive.color.green[600],
    primaryActive: primitive.color.green[700],
    onPrimary: primitive.color.neutral.white,
  },
  accent: {
    default: primitive.color.terra[500],
    soft: primitive.color.terra[100],
    strong: primitive.color.terra[700],
    onAccent: primitive.color.neutral.white,
  },
  background: {
    page: primitive.color.cream[50],
    pageAlt: primitive.color.cream[100],
    inverse: primitive.color.neutral.black,
  },
  surface: {
    default: primitive.color.neutral.white,
    subtle: primitive.color.cream[100],
    elevated: primitive.color.neutral.white,
    interactive: primitive.color.green[50],
  },
  text: {
    primary: primitive.color.green[900],
    secondary: primitive.color.green[700],
    muted: primitive.color.green[600],
    inverse: primitive.color.neutral.white,
    link: primitive.color.green[600],
  },
  border: {
    default: primitive.color.cream[300],
    subtle: primitive.color.cream[200],
    strong: primitive.color.green[500],
    focus: primitive.color.terra[500],
  },
  shadow: {
    clay: "0 12px 30px rgba(141, 71, 50, 0.2)",
    card: "0 8px 24px rgba(23, 23, 23, 0.12)",
  },
  success: {
    default: primitive.color.green[600],
    soft: primitive.color.green[100],
    on: primitive.color.neutral.white,
  },
  warning: {
    default: primitive.color.cream[700],
    soft: primitive.color.cream[200],
    on: primitive.color.neutral.black,
  },
  error: {
    default: primitive.color.terra[600],
    soft: primitive.color.terra[100],
    on: primitive.color.neutral.white,
  },
};

// Layer 3: Component tokens (ready-to-use values per UI component).
export const component: ComponentTokens = {
  button: {
    primary: {
      background: semantic.brand.primary,
      backgroundHover: semantic.brand.primaryHover,
      text: semantic.brand.onPrimary,
      border: semantic.brand.primary,
      shadow: semantic.shadow.clay,
    },
    secondary: {
      background: semantic.surface.default,
      backgroundHover: semantic.surface.subtle,
      text: semantic.text.primary,
      border: semantic.border.default,
      shadow: semantic.shadow.card,
    },
    ghost: {
      background: primitive.color.neutral.transparent,
      backgroundHover: semantic.surface.interactive,
      text: semantic.text.primary,
      border: primitive.color.neutral.transparent,
    },
  },
  card: {
    default: {
      background: semantic.surface.default,
      border: semantic.border.subtle,
      shadow: semantic.shadow.card,
      text: semantic.text.primary,
    },
    feature: {
      background: semantic.surface.interactive,
      border: semantic.border.strong,
      shadow: semantic.shadow.clay,
      text: semantic.text.primary,
    },
  },
  navbar: {
    background: semantic.surface.default,
    border: semantic.border.subtle,
    text: semantic.text.primary,
    textMuted: semantic.text.secondary,
    shadow: semantic.shadow.card,
  },
  badge: {
    background: semantic.accent.soft,
    text: semantic.accent.strong,
    border: semantic.border.default,
  },
  section: {
    background: semantic.background.page,
    backgroundAlt: semantic.background.pageAlt,
    heading: semantic.text.primary,
    body: semantic.text.secondary,
  },
};

export const tokens = {
  primitive,
  semantic,
  component,
} as const;
