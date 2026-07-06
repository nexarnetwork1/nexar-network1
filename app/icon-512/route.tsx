import { ImageResponse } from "next/og";
import { COLORS } from "@/lib/constants/design";

export const runtime = "edge";

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#050505",
          borderRadius: 96,
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 380,
            height: 380,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${COLORS.gold}22 0%, transparent 70%)`,
          }}
        />
        <div
          style={{
            width: 380,
            height: 380,
            borderRadius: 80,
            background: `linear-gradient(135deg, ${COLORS.gold}22 0%, ${COLORS.goldSecondary}0d 100%)`,
            border: `2px solid ${COLORS.gold}40`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width="200"
            height="200"
            viewBox="0 0 32 32"
            fill="none"
          >
            <path
              d="M8 22L16 6L24 22"
              stroke={COLORS.goldSecondary}
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M10.5 18H21.5"
              stroke={COLORS.goldSecondary}
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    ),
    { width: 512, height: 512 },
  );
}
