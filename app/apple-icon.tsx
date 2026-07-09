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
        {/* Icon container with rounded corners for apple icon */}
        <div
          style={{
            width: 148,
            height: 148,
            borderRadius: 34,
            background: `linear-gradient(135deg, ${COLORS.gold}26 0%, ${COLORS.goldSecondary}0d 100%)`,
            border: `1.5px solid ${COLORS.gold}50`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          {/* Official logo image */}
          <img
            src="https://nexar.network/images/logo.png"
            alt="Nexar Network"
            width={108}
            height={27}
            style={{
              width: "auto",
              height: 108,
              objectFit: "contain",
            }}
          />
        </div>
      </div>
    ),
    { ...size },
  );
}
