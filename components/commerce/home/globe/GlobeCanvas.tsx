"use client";

import { useEffect, useRef } from "react";
import { countryToGlobePoint } from "@/lib/commerce/country-coords";
import type { CommerceActivityEvent } from "@/lib/commerce/types";

type GlobeCanvasProps = {
  countryCodes: string[];
  activity: CommerceActivityEvent[];
  className?: string;
  compact?: boolean;
};

type Pulse = {
  code: string;
  progress: number;
  speed: number;
  type: string;
};

type Arc = {
  from: string;
  to: string;
  progress: number;
  speed: number;
};

const GOLD = "rgba(255, 209, 92, 0.95)";
const GOLD_DIM = "rgba(255, 209, 92, 0.22)";
const OCEAN = "#080808";
const OCEAN_LIGHT = "#141414";

/** Lightweight land mask — approximate continents without external textures. */
function isLandmass(lat: number, lng: number): boolean {
  const regions: [number, number, number, number][] = [
    [15, 72, -170, -52],
    [-56, 15, -82, -34],
    [35, 72, -25, 45],
    [-35, 37, -18, 52],
    [5, 55, 25, 145],
    [-45, -10, 112, 155],
    [-48, -10, 165, 180],
    [10, 75, 45, 180],
    [-48, -10, -180, -110],
    [60, 84, -75, -12],
  ];

  return regions.some(
    ([latMin, latMax, lngMin, lngMax]) =>
      lat >= latMin && lat <= latMax && lng >= lngMin && lng <= lngMax,
  );
}

function latLngToSphere(
  lat: number,
  lng: number,
  cx: number,
  cy: number,
  r: number,
  rotation: number,
): { x: number; y: number; visible: boolean; depth: number } {
  const phi = ((lng + rotation) * Math.PI) / 180;
  const theta = ((90 - lat) * Math.PI) / 180;
  const x3 = r * Math.sin(theta) * Math.cos(phi);
  const y3 = -r * Math.cos(theta);
  const z3 = r * Math.sin(theta) * Math.sin(phi);
  return {
    x: cx + x3,
    y: cy + y3,
    visible: z3 > -r * 0.12,
    depth: z3,
  };
}

export function GlobeCanvas({
  countryCodes,
  activity,
  className,
  compact = false,
}: GlobeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef(0);
  const pulsesRef = useRef<Pulse[]>([]);
  const arcsRef = useRef<Arc[]>([]);
  const activityRef = useRef(activity);
  const codesRef = useRef(countryCodes);

  useEffect(() => {
    activityRef.current = activity;
    codesRef.current = countryCodes.length ? countryCodes : ["US", "GB", "AE", "SG"];
  }, [activity, countryCodes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    let visible = true;

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry?.isIntersecting ?? true;
      },
      { threshold: 0.05 },
    );
    observer.observe(canvas);

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = parent.clientWidth * dpr;
      canvas.height = parent.clientHeight * dpr;
      canvas.style.width = `${parent.clientWidth}px`;
      canvas.style.height = `${parent.clientHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    const spawnFromActivity = () => {
      const codes = codesRef.current;
      if (!codes.length) return;

      const latest = activityRef.current[0];
      const code = codes[Math.floor(Math.random() * codes.length)];
      pulsesRef.current.push({
        code,
        progress: 0,
        speed: 0.015 + Math.random() * 0.02,
        type: latest?.activity_type ?? "activity",
      });
      if (pulsesRef.current.length > 12) pulsesRef.current.shift();

      if (codes.length >= 2) {
        const from = codes[Math.floor(Math.random() * codes.length)];
        let to = codes[Math.floor(Math.random() * codes.length)];
        while (to === from) to = codes[Math.floor(Math.random() * codes.length)];
        arcsRef.current.push({
          from,
          to,
          progress: 0,
          speed: 0.008 + Math.random() * 0.012,
        });
        if (arcsRef.current.length > 6) arcsRef.current.shift();
      }
    };

    const interval = window.setInterval(spawnFromActivity, 2200);
    spawnFromActivity();

    const drawEarthSurface = (
      cx: number,
      cy: number,
      r: number,
      rotation: number,
    ) => {
      const step = compact ? 5 : 4;
      for (let lat = -80; lat <= 80; lat += step) {
        for (let lng = -180; lng < 180; lng += step) {
          const pt = latLngToSphere(lat, lng, cx, cy, r, rotation);
          if (!pt.visible) continue;
          const land = isLandmass(lat, lng);
          const shade = 0.55 + (pt.depth / r) * 0.35;
          ctx.fillStyle = land
            ? `rgba(${Math.floor(34 * shade)}, ${Math.floor(88 * shade)}, ${Math.floor(52 * shade)}, ${0.75 + shade * 0.2})`
            : `rgba(10, 28, 48, ${0.65 + shade * 0.25})`;
          ctx.fillRect(pt.x - 1.6, pt.y - 1.6, 3.2, 3.2);
        }
      }
    };

    const draw = () => {
      frame = requestAnimationFrame(draw);
      if (!visible) return;

      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      rotationRef.current += 0.08;
      const rotation = rotationRef.current;
      const cx = w / 2;
      const cy = h / 2;
      const r = Math.min(w, h) * (compact ? 0.34 : 0.38);

      const atmosphere = ctx.createRadialGradient(cx, cy, r * 0.85, cx, cy, r * 1.45);
      atmosphere.addColorStop(0, "rgba(80, 140, 220, 0.12)");
      atmosphere.addColorStop(0.55, "rgba(255, 209, 92, 0.06)");
      atmosphere.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = atmosphere;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.45, 0, Math.PI * 2);
      ctx.fill();

      const ocean = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.25, r * 0.05, cx, cy, r);
      ocean.addColorStop(0, OCEAN_LIGHT);
      ocean.addColorStop(0.65, OCEAN);
      ocean.addColorStop(1, "#050608");
      ctx.fillStyle = ocean;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();
      drawEarthSurface(cx, cy, r, rotation);

      const specular = ctx.createRadialGradient(
        cx - r * 0.35,
        cy - r * 0.4,
        0,
        cx,
        cy,
        r * 1.1,
      );
      specular.addColorStop(0, "rgba(255, 255, 255, 0.14)");
      specular.addColorStop(0.35, "rgba(255, 255, 255, 0.03)");
      specular.addColorStop(1, "rgba(0, 0, 0, 0.35)");
      ctx.fillStyle = specular;
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      ctx.restore();

      ctx.strokeStyle = GOLD_DIM;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      for (const code of codesRef.current) {
        const pt = countryToGlobePoint(code, w, h, rotation);
        if (!pt?.visible) continue;

        const glow = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, compact ? 10 : 14);
        glow.addColorStop(0, "rgba(255, 209, 92, 0.55)");
        glow.addColorStop(1, "rgba(255, 209, 92, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, compact ? 10 : 14, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = GOLD;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, compact ? 2.5 : 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const arc of arcsRef.current) {
        arc.progress = Math.min(1, arc.progress + arc.speed);
        const from = countryToGlobePoint(arc.from, w, h, rotation);
        const to = countryToGlobePoint(arc.to, w, h, rotation);
        if (!from?.visible || !to?.visible) continue;

        const mx = (from.x + to.x) / 2;
        const my = (from.y + to.y) / 2 - 36;
        const t = arc.progress;

        ctx.strokeStyle = `rgba(255, 209, 92, ${0.55 * (1 - Math.abs(t - 0.5))})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.quadraticCurveTo(mx, my, to.x, to.y);
        ctx.stroke();

        const px = (1 - t) * (1 - t) * from.x + 2 * (1 - t) * t * mx + t * t * to.x;
        const py = (1 - t) * (1 - t) * from.y + 2 * (1 - t) * t * my + t * t * to.y;
        ctx.fillStyle = GOLD;
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      arcsRef.current = arcsRef.current.filter((a) => a.progress < 1);

      for (const pulse of pulsesRef.current) {
        pulse.progress = Math.min(1, pulse.progress + pulse.speed);
        const pt = countryToGlobePoint(pulse.code, w, h, rotation);
        if (!pt?.visible) continue;
        const radius = 4 + pulse.progress * (compact ? 18 : 28);
        const alpha = 0.7 * (1 - pulse.progress);
        ctx.strokeStyle = `rgba(255, 209, 92, ${alpha})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
      pulsesRef.current = pulsesRef.current.filter((p) => p.progress < 1);
    };

    draw();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      observer.disconnect();
      clearInterval(interval);
    };
  }, [compact]);

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-surface-1/90 via-chrome/70 to-background/80 shadow-[0_0_80px_-20px_rgba(255,209,92,0.25)] ${className ?? ""}`}
    >
      <canvas
        ref={canvasRef}
        className="h-full min-h-[320px] w-full lg:min-h-[480px]"
        aria-label="Animated globe showing Nexar Commerce merchant network"
        role="img"
      />
      {!compact ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 to-transparent p-5">
          <div className="flex flex-wrap gap-3 text-[10px] tracking-wide text-muted uppercase">
            <span className="rounded-full border border-border/60 bg-background/60 px-3 py-1">
              Global merchants
            </span>
            <span className="rounded-full border border-border/60 bg-background/60 px-3 py-1">
              Live connections
            </span>
            <span className="rounded-full border border-border/60 bg-background/60 px-3 py-1">
              Verified commerce
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
