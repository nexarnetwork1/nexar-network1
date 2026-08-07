export const COLORS = {
  background: "#000000",
  backgroundSecondary: "#0A0A0A",
  surface: "#0A0A0A",
  card: "#111111",
  cardElevated: "#161616",
  border: "rgba(255, 255, 255, 0.08)",
  borderHover: "rgba(201, 169, 98, 0.28)",
  gold: "#C9A962",
  goldSecondary: "#D4B878",
  goldAccent: "#D4B878",
  white: "#FFFFFF",
  textSecondary: "#A0A4B0",
  muted: "#6B7080",
  error: "#FF5B5B",
  success: "#37C978",
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
