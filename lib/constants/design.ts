export const COLORS = {
  canvas: "#050816",
  canvasSecondary: "#0B1120",
  chrome: "#0B1120",
  surface: "#111827",
  card: "#111827",
  cardElevated: "#161E2E",
  cardAlt: "#1A2235",
  border: "rgba(255, 255, 255, 0.08)",
  borderHover: "rgba(212, 175, 55, 0.22)",
  gold: "#D4AF37",
  goldSecondary: "#C9A227",
  goldAccent: "#F5D76E",
  white: "#FFFFFF",
  textPrimary: "#FFFFFF",
  textSecondary: "#C9D1D9",
  muted: "#94A3B8",
  onGold: "#0B1120",
  error: "#EF4444",
  success: "#10B981",
  warning: "#F59E0B",
} as const;

export const CANVAS_LIGHT = {
  primary: "#EEF2F7",
  secondary: "#E2E8F0",
} as const;

export const FONTS = {
  heading: "var(--font-sora)",
  body: "var(--font-inter)",
  mono: "var(--font-space-grotesk)",
} as const;

export const ANIMATION = {
  ease: [0.22, 1, 0.36, 1] as const,
  duration: {
    fast: 0.15,
    normal: 0.25,
    slow: 0.4,
  },
} as const;

export const RADIUS = {
  sm: "0.375rem",
  md: "0.625rem",
  lg: "0.75rem",
  xl: "1rem",
} as const;

export const SPACING = {
  sectionY: "clamp(3.5rem, 8vw, 5rem)",
  cardPadding: "1.5rem",
} as const;
