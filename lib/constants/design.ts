export const COLORS = {
  background: "#050505",
  surface: "#0B0B0B",
  card: "#101010",
  border: "#1A1A1A",
  gold: "#D4AF37",
  goldSecondary: "#F5E39E",
  white: "#FFFFFF",
  muted: "#9A9A9A",
} as const;

export const FONTS = {
  heading: "var(--font-sora)",
  body: "var(--font-inter)",
  mono: "var(--font-space-grotesk)",
} as const;

export const ANIMATION = {
  ease: [0.22, 1, 0.36, 1] as const,
  duration: {
    fast: 0.3,
    normal: 0.6,
    slow: 0.9,
  },
} as const;
