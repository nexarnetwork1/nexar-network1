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
          overflow: "hidden",
        }}
      >
        {/* Top-right glow orb */}
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -120,
            width: 480,
            height: 480,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${COLORS.gold}22 0%, transparent 70%)`,
          }}
        />
        {/* Bottom-left subtle glow */}
        <div
          style={{
            position: "absolute",
            bottom: -80,
            left: -80,
            width: 320,
            height: 320,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${COLORS.gold}0d 0%, transparent 70%)`,
          }}
        />

        {/* Logo lockup using official logo image */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            marginBottom: 40,
          }}
        >
          {/* Official logo image */}
          <img
            src="https://www.nexarnetwork.org/images/logo.png"
            alt="Nexar Network Logo"
            width={160}
            height={40}
            style={{
              height: 56,
              width: "auto",
            }}
          />
        </div>

        {/* Main headline */}
        <h1
          style={{
            fontSize: 68,
            fontWeight: 700,
            color: "white",
            lineHeight: 1.05,
            margin: 0,
            maxWidth: 880,
          }}
        >
          The infrastructure for{" "}
          <span style={{ color: COLORS.gold }}>global payments</span>
        </h1>

        {/* Tagline */}
        <p
          style={{
            fontSize: 22,
            color: "#888",
            marginTop: 24,
            maxWidth: 680,
            lineHeight: 1.5,
          }}
        >
          {SITE.tagline}
        </p>

        {/* Bottom metadata strip */}
        <div
          style={{
            position: "absolute",
            bottom: 56,
            left: 80,
            right: 80,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 24,
              color: "#555",
              fontSize: 15,
            }}
          >
            <span>BNB Smart Chain</span>
            <span>·</span>
            <span>BEP20</span>
            <span>·</span>
            <span>{SITE.maxSupply} Max Supply</span>
          </div>
          <span
            style={{
              color: `${COLORS.gold}80`,
              fontSize: 13,
              letterSpacing: "0.1em",
            }}
          >
            nexarnetwork.org
          </span>
        </div>

        {/* Horizontal divider line */}
        <div
          style={{
            position: "absolute",
            bottom: 96,
            left: 80,
            right: 80,
            height: 1,
            background: `linear-gradient(to right, transparent, ${COLORS.gold}30, transparent)`,
          }}
        />
      </div>
    ),
    { ...size },
  );
}
