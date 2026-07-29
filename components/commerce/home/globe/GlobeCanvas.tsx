"use client";

import { useEffect, useRef, useMemo } from "react";
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

const GOLD = "rgba(212, 175, 55, 0.9)";
const GOLD_DIM = "rgba(212, 175, 55, 0.25)";
const WHITE_DIM = "rgba(255, 255, 255, 0.08)";

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

  const paymentEvents = useMemo(
    () =>
      activity.filter((e) =>
        ["order_paid", "order_placed", "store_created", "brand_approved"].includes(
          e.activity_type,
        ),
      ),
    [activity],
  );

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
      if (latest) {
        const code = codes[Math.floor(Math.random() * codes.length)];
        pulsesRef.current.push({
          code,
          progress: 0,
          speed: 0.015 + Math.random() * 0.02,
          type: latest.activity_type,
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
      }
    };

    const interval = window.setInterval(spawnFromActivity, 2200);
    spawnFromActivity();

    const draw = () => {
      frame = requestAnimationFrame(draw);
      if (!visible) return;

      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      rotationRef.current += 0.15;
      const rotation = rotationRef.current;
      const cx = w / 2;
      const cy = h / 2;
      const r = Math.min(w, h) * (compact ? 0.34 : 0.38);

      // Outer glow
      const glow = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 1.35);
      glow.addColorStop(0, "rgba(212, 175, 55, 0.08)");
      glow.addColorStop(1, "rgba(212, 175, 55, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.35, 0, Math.PI * 2);
      ctx.fill();

      // Globe sphere
      const sphere = ctx.createRadialGradient(cx - r * 0.25, cy - r * 0.25, r * 0.1, cx, cy, r);
      sphere.addColorStop(0, "rgba(30, 30, 30, 0.95)");
      sphere.addColorStop(0.7, "rgba(12, 12, 12, 0.98)");
      sphere.addColorStop(1, "rgba(5, 5, 5, 1)");
      ctx.fillStyle = sphere;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = GOLD_DIM;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      // Lat/lng grid
      ctx.strokeStyle = WHITE_DIM;
      ctx.lineWidth = 0.5;
      for (let lat = -60; lat <= 60; lat += 30) {
        ctx.beginPath();
        for (let lng = 0; lng <= 360; lng += 4) {
          const pt = countryToGlobePoint(
            lngToCode(lng, lat),
            w,
            h,
            rotation,
          );
          if (!pt?.visible) continue;
          if (lng === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
      }

      // Country markers
      for (const code of codesRef.current) {
        const pt = countryToGlobePoint(code, w, h, rotation);
        if (!pt?.visible) continue;
        ctx.fillStyle = GOLD;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, compact ? 2.5 : 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Transaction arcs
      for (const arc of arcsRef.current) {
        arc.progress = Math.min(1, arc.progress + arc.speed);
        const from = countryToGlobePoint(arc.from, w, h, rotation);
        const to = countryToGlobePoint(arc.to, w, h, rotation);
        if (!from?.visible || !to?.visible) continue;

        const mx = (from.x + to.x) / 2;
        const my = (from.y + to.y) / 2 - 30;
        const t = arc.progress;

        ctx.strokeStyle = `rgba(212, 175, 55, ${0.5 * (1 - Math.abs(t - 0.5))})`;
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

      // Activity pulses
      for (const pulse of pulsesRef.current) {
        pulse.progress = Math.min(1, pulse.progress + pulse.speed);
        const pt = countryToGlobePoint(pulse.code, w, h, rotation);
        if (!pt?.visible) continue;
        const radius = 4 + pulse.progress * (compact ? 18 : 28);
        const alpha = 0.7 * (1 - pulse.progress);
        ctx.strokeStyle = `rgba(212, 175, 55, ${alpha})`;
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
  }, [compact, paymentEvents.length]);

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card/40 via-surface/20 to-background/80 ${className ?? ""}`}
    >
      <canvas ref={canvasRef} className="h-full min-h-[320px] w-full lg:min-h-[480px]" />
      {!compact ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 to-transparent p-5">
          <div className="flex flex-wrap gap-3 text-[10px] tracking-wide text-muted uppercase">
            <span className="rounded-full border border-border/60 bg-background/60 px-3 py-1">
              Merchant Locations
            </span>
            <span className="rounded-full border border-border/60 bg-background/60 px-3 py-1">
              Live Transactions
            </span>
            <span className="rounded-full border border-border/60 bg-background/60 px-3 py-1">
              Realtime Events
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Synthetic code lookup for grid lines (not displayed as data). */
function lngToCode(lng: number, lat: number): string {
  const entries: [string, number, number][] = [
    ["US", -95, 40],
    ["GB", -2, 54],
    ["AE", 54, 24],
    ["SG", 104, 1],
    ["JP", 138, 36],
    ["AU", 133, -25],
    ["BR", -52, -10],
    ["DE", 10, 51],
  ];
  let best = entries[0][0];
  let bestDist = Infinity;
  for (const [code, cLng, cLat] of entries) {
    const d = (lng - cLng) ** 2 + (lat - cLat) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = code;
    }
  }
  return best;
}
