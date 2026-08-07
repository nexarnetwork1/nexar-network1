export const COLORS = {
  canvas: "#050608",
  canvasSecondary: "#0B0E13",
  chrome: "#0B0E13",
  surface: "#11161F",
  card: "#141A23",
  cardElevated: "#1A2230",
  border: "rgba(255, 255, 255, 0.08)",
  borderHover: "rgba(212, 175, 55, 0.18)",
  gold: "#D4AF37",
  goldHover: "#E5C158",
  goldSecondary: "#E5C158",
  goldSoft: "rgba(212, 175, 55, 0.15)",
  white: "#FFFFFF",
  textPrimary: "#FFFFFF",
  textSecondary: "#C9D1D9",
  muted: "#8B949E",
  onGold: "#050608",
  success: "#2ECC71",
  danger: "#E74C3C",
  warning: "#D4AF37",
} as const;

export const CANVAS_LIGHT = {
  primary: "#F4F6F9",
  secondary: "#E8ECF1",
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
