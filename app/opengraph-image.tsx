import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { ATLAS_BRAND, ATLAS_ASSETS } from "@/config/atlas-branding";
import { COLORS } from "@/lib/constants/design";

export const alt = `${ATLAS_BRAND.fullName} — ${ATLAS_BRAND.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const logoBytes = await readFile(
    join(process.cwd(), "public", ATLAS_ASSETS.logoPrimary.replace(/^\//, "")),
  );
  const logoSrc = `data:image/png;base64,${logoBytes.toString("base64")}`;

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
          background: "linear-gradient(135deg, #050505 0%, #080808 50%, #111111 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
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

        {/* Official ATLAS lockup — sole platform mark */}
        <div style={{ display: "flex", marginBottom: 40 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoSrc}
            alt={ATLAS_BRAND.fullName}
            width={320}
            height={80}
            style={{ height: 72, width: "auto" }}
          />
        </div>

        <h1
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: "white",
            lineHeight: 1.1,
            margin: 0,
            maxWidth: 900,
          }}
        >
          The Business Operating System for{" "}
          <span style={{ color: COLORS.gold }}>global commerce</span>
        </h1>

        <p
          style={{
            fontSize: 22,
            color: "#888",
            marginTop: 24,
            maxWidth: 680,
            lineHeight: 1.5,
          }}
        >
          {ATLAS_BRAND.description}
        </p>

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
          <div style={{ display: "flex", gap: 24, color: "#555", fontSize: 15 }}>
            <span>{ATLAS_BRAND.tagline}</span>
            <span>·</span>
            <span>Web2 + Web3</span>
          </div>
          <span
            style={{
              color: `${COLORS.gold}80`,
              fontSize: 13,
              letterSpacing: "0.1em",
            }}
          >
            {ATLAS_BRAND.byline}
          </span>
        </div>

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
