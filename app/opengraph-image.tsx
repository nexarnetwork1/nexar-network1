import { ImageResponse } from "next/og";
import { SITE } from "@/lib/constants/site";
import { COLORS } from "@/lib/constants/design";

export const alt = `${SITE.name} — Decentralized Payment Infrastructure`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "linear-gradient(135deg, #050505 0%, #0a0a0a 50%, #111 100%)",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${COLORS.gold}26 0%, transparent 70%)`,
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldSecondary})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              fontWeight: 700,
              color: "#050505",
            }}
          >
            N
          </div>
          <span style={{ color: "#888", fontSize: 20, letterSpacing: 4 }}>{SITE.ticker}</span>
        </div>
        <h1
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: "white",
            lineHeight: 1.05,
            margin: 0,
            maxWidth: 900,
          }}
        >
          The infrastructure for{" "}
          <span style={{ color: COLORS.gold }}>global payments</span>
        </h1>
        <p style={{ fontSize: 24, color: "#888", marginTop: 24, maxWidth: 700 }}>
          {SITE.tagline}
        </p>
        <div
          style={{
            position: "absolute",
            bottom: 60,
            left: 80,
            display: "flex",
            gap: 24,
            color: "#666",
            fontSize: 16,
          }}
        >
          <span>BNB Smart Chain</span>
          <span>·</span>
          <span>BEP20</span>
          <span>·</span>
          <span>{SITE.maxSupply} Max Supply</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
