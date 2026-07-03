/** Shared storefront UI class recipes — Phase 11.1 premium design system. */

export const focusRing =
  "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/80 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-50";

export const surfaceCard = "premium-card";

export const surfaceCardInteractive = "premium-card interactive-lift";

export const surfaceGlass = "glass-surface";

export const surfaceGlassStrong = "glass-surface glass-surface-elevated";

export const premiumCard = "premium-card";

export const premiumCardHover = "premium-card interactive-lift";

export const sectionPadding = "section-padding";

export const sectionPaddingSm = "section-padding-sm";

export const sectionStack = "section-stack";

export const sectionGridGap = "section-grid-gap";

export const textHero = "text-hero";

export const textH1 = "text-h1";

export const textH2 = "text-h2";

export const textH3 = "text-h3";

export const textCardTitle = "text-card-title";

export const textEyebrow = "text-eyebrow";

export const premiumPageBg = "premium-page-bg";

export const iconOutline = "icon-outline";

export const iconButton =
  "icon-btn";

export const iconButtonSm =
  "icon-btn icon-btn-sm";

export const dialogOverlay =
  "dialog-overlay";

export const dialogPanel =
  "dialog-panel";

export const drawerPanel =
  "drawer-panel";

export const navGlass =
  "nav-glass";

export const formControl =
  "form-control";

/** Muted secondary copy — matches `.text-caption` token */
export const textMuted =
  "text-caption";

export const formLabel =
  "text-label";

export const textCaption =
  "text-caption";

export const textBody =
  "text-body";

export const textSubheading =
  "text-subheading";

export const badgeCount =
  "badge-count";

export const wishlistButton = (active: boolean) =>
  active
    ? "wishlist-btn wishlist-btn-active"
    : "wishlist-btn";

export const motionButton =
  "motion-button";

export const motionCard =
  "motion-card";

export const interactiveSurface =
  "motion-card interactive-lift";

/** Product / marketing image zoom on card hover — 220ms, max 2% scale */
export const imageHoverZoom =
  "motion-safe:transition-transform motion-safe:duration-[var(--duration-card)] motion-safe:ease-[var(--ease-out)] group-hover:scale-[1.02]";

/** Standard homepage CTA height — 52px */
export const ctaHeight =
  "h-[3.25rem] min-h-[3.25rem]";

/** Standard homepage section grid gutters */
export const homepageGridGap =
  "gap-6 sm:gap-7 lg:gap-8";

/** Standard editorial image crop */
export const editorialImageCrop =
  "object-cover object-[center_22%]";

/** Inline trust / badge icon size */
export const trustIconSize =
  "h-4 w-4 shrink-0";

export const dialogContentCentered =
  "dialog-panel fixed left-1/2 top-1/2 z-[110] max-h-[90vh] w-[min(92vw,520px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto p-6 outline-none";

export const transitionColorsFast =
  "transition-colors duration-[var(--duration-button)] ease-[var(--ease-out)]";

export const pressableSurface =
  "motion-card active:scale-[0.98]";

export const productPrice = "product-price";

export const trustBadgePill = "trust-badge-pill";

export const reducedMotionSafe =
  "motion-safe";

/** Premium storefront header — nav links */
export const headerNavLink =
  "group relative font-body text-sm font-medium tracking-[-0.01em] transition-[color,transform] duration-[220ms] ease-[var(--ease-out)] motion-safe:group-hover:-translate-y-px";

/** Premium header icon buttons — equal weight, terra hover glow */
export const headerIconBtn =
  "icon-btn text-green-700 motion-safe:transition-[transform,box-shadow,color] motion-safe:duration-[220ms] motion-safe:ease-[var(--ease-out)] motion-safe:hover:scale-[1.08] motion-safe:hover:text-green-900 motion-safe:hover:shadow-[0_0_0_3px_color-mix(in_srgb,var(--terra-500)_22%,transparent)]";

export const announcementBar =
  "announcement-bar";

export const siteNavbar =
  "site-navbar";

export const siteNavbarScrolled =
  "site-navbar-scrolled";

export const headerAccountPanel =
  "header-account-panel";
