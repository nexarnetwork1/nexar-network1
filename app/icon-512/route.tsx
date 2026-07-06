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
            width: 360,
            height: 360,
            borderRadius: 80,
            background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldSecondary} 50%, ${COLORS.gold} 100%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 180,
            fontWeight: 700,
            color: "#050505",
          }}
        >
          N
        </div>
      </div>
    ),
    { width: 512, height: 512 },
  );
}
