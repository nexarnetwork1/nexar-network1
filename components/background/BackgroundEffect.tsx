"use client";

import { AuroraLayer } from "./AuroraLayer";
import { GridLayer } from "./GridLayer";
import { LightBeamsLayer } from "./LightBeamsLayer";
import { MouseGlowLayer } from "./MouseGlowLayer";
import { NoiseLayer } from "./NoiseLayer";
import { ParticleCanvas } from "./ParticleCanvas";

export function BackgroundEffect() {
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-background"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,16,16,0.4),rgba(5,5,5,1)_70%)]" />
        <AuroraLayer />
        <GridLayer />
        <LightBeamsLayer />
        <ParticleCanvas />
        <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-transparent to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(212,175,55,0.04),transparent_45%)]" />
      </div>
      <NoiseLayer />
      <MouseGlowLayer />
    </>
  );
}
