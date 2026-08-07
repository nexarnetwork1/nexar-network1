export const COLORS = {
  canvas: "#050505",
  canvasSecondary: "#080808",
  chrome: "#0C0C0C",
  surface: "#101010",
  card: "#111111",
  cardHover: "#181818",
  cardActive: "#202020",
  cardElevated: "#141414",
  border: "rgba(255, 255, 255, 0.08)",
  borderHover: "rgba(255, 209, 92, 0.25)",
  gold: "#FFD15C",
  goldHover: "#FFE082",
  goldSecondary: "#FFE082",
  goldSoft: "rgba(255, 209, 92, 0.15)",
  white: "#FFFFFF",
  textPrimary: "#FFFFFF",
  textSecondary: "#D5D5D5",
  muted: "#9A9A9A",
  onGold: "#050505",
  success: "#22C55E",
  danger: "#EF4444",
  warning: "#F59E0B",
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
  lg: "1rem",
  xl: "1.125rem",
  card: "1.125rem",
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
