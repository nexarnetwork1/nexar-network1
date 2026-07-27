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
            padding: 50,
          }}
        >
          {/* Official logo image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://www.nexarnetwork.org/images/logo.png"
            alt="Nexar Network"
            width={280}
            height={70}
            style={{
              width: "auto",
              height: 280,
              objectFit: "contain",
            }}
          />
        </div>
      </div>
    ),
    { width: 512, height: 512 },
  );
}
