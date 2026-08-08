/**
 * Nexar Network — JavaScript design tokens.
 * CSS custom properties in `app/globals.css` are the runtime source of truth.
 * Use these constants only where CSS variables cannot apply (charts, canvas, emails).
 */
export const COLORS = {
  canvas: "#050505",
  canvasSecondary: "#090909",
  chrome: "#090909",
  surface: "#111111",
  card: "#151515",
  cardHover: "#1B1B1B",
  cardActive: "#1B1B1B",
  cardElevated: "#151515",
  border: "rgba(255, 255, 255, 0.08)",
  borderHover: "rgba(212, 175, 55, 0.28)",
  gold: "#D4AF37",
  goldHover: "#F4D27A",
  goldSoft: "rgba(212, 175, 55, 0.14)",
  white: "#FFFFFF",
  textPrimary: "#FFFFFF",
  textSecondary: "#D5D5D5",
  muted: "#8E8E8E",
  onGold: "#050505",
  success: "#22C55E",
  danger: "#EF4444",
  warning: "#F59E0B",
  info: "rgba(212, 175, 55, 0.72)",
} as const;

export const CANVAS_LIGHT = {
  primary: "#FAFAFA",
  secondary: "#F5F5F5",
} as const;

export const FONTS = {
  heading: "var(--font-inter)",
  body: "var(--font-inter)",
  mono: "var(--font-space-grotesk)",
} as const;

export const TYPE_SCALE = {
  hero: "4.5rem",
  h1: "3.5rem",
  h2: "2.5rem",
  h3: "2rem",
  h4: "1.5rem",
  body: "1rem",
  small: "0.875rem",
  caption: "0.75rem",
  label: "0.75rem",
  button: "0.875rem",
} as const;

export const ANIMATION = {
  ease: [0.22, 1, 0.36, 1] as const,
  duration: {
    fast: 0.15,
    normal: 0.2,
    slow: 0.25,
  },
} as const;

export const RADIUS = {
  sm: "0.5rem",
  md: "0.75rem",
  lg: "0.875rem",
  xl: "1rem",
  card: "1rem",
  button: "0.875rem",
} as const;

export const SPACING = {
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.5rem",
  6: "2rem",
  7: "3rem",
  8: "4rem",
  sectionY: "clamp(3rem, 8vw, 4rem)",
  cardPadding: "1.5rem",
} as const;

/** Shared control heights — buttons, inputs, selects. */
export const CONTROL = {
  heightSm: "2.25rem",
  heightMd: "2.75rem",
  heightLg: "3rem",
  paddingX: "1.25rem",
} as const;
