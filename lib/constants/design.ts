export const COLORS = {
  background: "#050505",
  backgroundSecondary: "#0A0A0A",
  surface: "#141414",
  card: "#1A1A1A",
  cardElevated: "#222222",
  border: "rgba(212, 175, 55, 0.14)",
  borderHover: "#D4AF37",
  gold: "#D4AF37",
  goldSecondary: "#C89B3C",
  goldAccent: "#E8C96A",
  white: "#FFFFFF",
  textSecondary: "#B8B8B8",
  muted: "#7A7A7A",
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
