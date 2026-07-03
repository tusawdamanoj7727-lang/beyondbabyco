import type { Transition, Variants, ViewportOptions } from "framer-motion";

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** Unified motion timing scale (Phase 7.4). */
export const MOTION = {
  button: 0.165,
  card: 0.22,
  dialog: 0.26,
  drawer: 0.28,
  page: 0.3,
  reveal: 0.35,
  mascotMin: 5,
  mascotMax: 7,
} as const;

export const buttonTransition: Transition = {
  duration: MOTION.button,
  ease: EASE_OUT,
};

export const cardTransition: Transition = {
  duration: MOTION.card,
  ease: EASE_OUT,
};

export const dialogTransition: Transition = {
  duration: MOTION.dialog,
  ease: EASE_OUT,
};

export const drawerTransition: Transition = {
  duration: MOTION.drawer,
  ease: EASE_OUT,
};

export const pageTransition: Transition = {
  duration: MOTION.page,
  ease: EASE_OUT,
};

export const defaultTransition: Transition = {
  duration: MOTION.reveal,
  ease: EASE_OUT,
};

export const slowTransition: Transition = {
  duration: 0.55,
  ease: EASE_OUT,
};

export const springTransition: Transition = {
  type: "spring",
  stiffness: 120,
  damping: 18,
  mass: 0.8,
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: defaultTransition,
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: MOTION.page, ease: EASE_OUT },
  },
};

export const slideLeft: Variants = {
  hidden: { opacity: 0, x: 24 },
  show: {
    opacity: 1,
    x: 0,
    transition: defaultTransition,
  },
};

export const slideRight: Variants = {
  hidden: { opacity: 0, x: -24 },
  show: {
    opacity: 1,
    x: 0,
    transition: defaultTransition,
  },
};

export const imageZoom: Variants = {
  hidden: { scale: 1.04, opacity: 0 },
  show: {
    scale: 1,
    opacity: 1,
    transition: slowTransition,
  },
};

export const lineGrow: Variants = {
  hidden: { scaleX: 0, transformOrigin: "left center" },
  show: {
    scaleX: 1,
    transformOrigin: "left center",
    transition: defaultTransition,
  },
};

export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08 },
  },
};

export const staggerGrid: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06 },
  },
};

export const heroContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      delayChildren: 0.12,
      staggerChildren: 0.1,
    },
  },
};

export const heroItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: pageTransition,
  },
};

export const floatingAnimation = (duration = 5.5, delay = 0) => ({
  animate: {
    y: [0, -12, 0],
    x: [0, 4, 0],
  },
  transition: {
    duration: Math.min(Math.max(duration, MOTION.mascotMin), MOTION.mascotMax),
    delay,
    repeat: Infinity,
    repeatType: "loop" as const,
    ease: [0.45, 0, 0.55, 1],
  } satisfies Transition,
});

export const pulseAnimation = {
  animate: {
    scale: [1, 1.02, 1],
    opacity: [0.96, 1, 0.96],
  },
  transition: {
    duration: 2.4,
    repeat: Infinity,
    repeatType: "loop" as const,
    ease: "easeInOut",
  } satisfies Transition,
};

/** CSS handles button/card lift — keep for legacy Framer usage only. */
export const hoverLift = {
  whileHover: { y: -4, scale: 1.01 },
  whileTap: { scale: 0.98 },
};

export const mascotHover = {
  whileHover: {
    scale: 1.05,
    y: -4,
    transition: { type: "spring" as const, stiffness: 380, damping: 22 },
  },
};

export const viewportConfig: ViewportOptions = {
  once: true,
  margin: "-48px",
  amount: 0.12,
};
