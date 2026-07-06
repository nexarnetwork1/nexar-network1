import { ImageResponse } from "next/og";
import { COLORS } from "@/lib/constants/design";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
        }}
      >
        <div
          style={{
            width: 140,
            height: 140,
            borderRadius: 32,
            background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldSecondary})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 72,
            fontWeight: 700,
            color: "#050505",
          }}
        >
          N
        </div>
      </div>
    ),
    { ...size },
  );
}
