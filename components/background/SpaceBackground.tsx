"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";

type Star = {
  x: number;
  y: number;
  z: number;
  r: number;
  phase: number;
  twinkle: number;
};

type ShootingStar = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
};

/** Stars per CSS pixel², so small viewports render proportionally fewer. */
const STAR_DENSITY = 1 / 1500;
const MIN_STARS = 320;
const MAX_STARS = 1500;

/**
 * Twinkle alpha is quantised into buckets so every frame issues a fixed number
 * of fill calls instead of one per star.
 */
const ALPHA_BUCKETS = 10;
const MIN_ALPHA = 0.15;
const MAX_ALPHA = 0.72;

const SIN_STEPS = 256;
const SIN_LUT = Float32Array.from({ length: SIN_STEPS }, (_, i) =>
  Math.sin((i / SIN_STEPS) * Math.PI * 2),
);

/** Padding on the pre-rendered backdrop so parallax never exposes an edge. */
const PLATE_BLEED = 24;
const PARALLAX_X = 12;
const PARALLAX_Y = 8;

const BASE_COLOR = "#030308";

function buildFillStyles(): string[] {
  const styles: string[] = [];
  for (let bucket = 0; bucket < ALPHA_BUCKETS; bucket += 1) {
    const alpha = MIN_ALPHA + ((MAX_ALPHA - MIN_ALPHA) * bucket) / (ALPHA_BUCKETS - 1);
    styles.push(`rgba(255, 255, 255, ${alpha.toFixed(3)})`);
  }
  for (let bucket = 0; bucket < ALPHA_BUCKETS; bucket += 1) {
    const alpha = MIN_ALPHA + ((MAX_ALPHA - MIN_ALPHA) * bucket) / (ALPHA_BUCKETS - 1);
    styles.push(`rgba(212, 175, 55, ${(alpha * 0.9).toFixed(3)})`);
  }
  return styles;
}

const FILL_STYLES = buildFillStyles();
const TOTAL_BUCKETS = FILL_STYLES.length;

/**
 * Site-wide star field: drifting stars, a soft nebula and occasional shooting
 * stars. Mounted once from `GlobalBackground` and shared by every route, so it
 * is tuned to stay cheap: the backdrop is pre-rendered on resize, stars are
 * batched into a fixed number of fill calls, and the loop stops entirely when
 * the tab is hidden or the user prefers reduced motion.
 */
export function SpaceBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let frame = 0;
    let running = false;
    let width = 0;
    let height = 0;
    let stars: Star[] = [];
    let shootingStars: ShootingStar[] = [];
    let parallaxX = 0;
    let parallaxY = 0;
    let plate: HTMLCanvasElement | null = null;
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;

    const paths: Path2D[] = Array.from({ length: TOTAL_BUCKETS }, () => new Path2D());

    const renderPlate = () => {
      const plateWidth = width + PLATE_BLEED * 2;
      const plateHeight = height + PLATE_BLEED * 2;
      // The nebula is a soft gradient, so half resolution is indistinguishable
      // once scaled back up and keeps the blit cheap.
      const scale = 0.5;
      const target = plate ?? document.createElement("canvas");
      target.width = Math.max(1, Math.round(plateWidth * scale));
      target.height = Math.max(1, Math.round(plateHeight * scale));

      const plateCtx = target.getContext("2d");
      if (!plateCtx) return;

      plateCtx.setTransform(scale, 0, 0, scale, 0, 0);
      plateCtx.fillStyle = BASE_COLOR;
      plateCtx.fillRect(0, 0, plateWidth, plateHeight);

      const cx = PLATE_BLEED + width * 0.72;
      const cy = PLATE_BLEED + height * 0.18;
      const nebula = plateCtx.createRadialGradient(cx, cy, 0, cx, cy, width * 0.45);
      nebula.addColorStop(0, "rgba(212, 175, 55, 0.06)");
      nebula.addColorStop(0.45, "rgba(80, 60, 120, 0.04)");
      nebula.addColorStop(1, "rgba(0, 0, 0, 0)");
      plateCtx.fillStyle = nebula;
      plateCtx.fillRect(0, 0, plateWidth, plateHeight);

      plate = target;
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(
        MAX_STARS,
        Math.max(MIN_STARS, Math.round(width * height * STAR_DENSITY)),
      );

      stars = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        z: Math.random(),
        r: Math.random() * 1.1 + 0.15,
        phase: Math.random() * Math.PI * 2,
        twinkle: 0.3 + Math.random() * 0.7,
      }));

      renderPlate();
    };

    const drawScene = (time: number) => {
      if (plate) {
        ctx.drawImage(
          plate,
          parallaxX - PLATE_BLEED,
          parallaxY - PLATE_BLEED,
          width + PLATE_BLEED * 2,
          height + PLATE_BLEED * 2,
        );
      } else {
        ctx.fillStyle = BASE_COLOR;
        ctx.fillRect(0, 0, width, height);
      }

      for (let i = 0; i < TOTAL_BUCKETS; i += 1) paths[i] = new Path2D();

      const t = reducedMotion ? 0 : time * 0.001;

      for (const star of stars) {
        const layer = 0.25 + star.z * 0.75;
        const px = star.x + parallaxX * layer;
        const py = star.y + parallaxY * layer;

        let twinkle: number;
        if (reducedMotion) {
          twinkle = star.twinkle;
        } else {
          const angle = t * 2 + star.phase;
          const index = ((angle / (Math.PI * 2)) * SIN_STEPS) | 0;
          twinkle = 0.35 + SIN_LUT[((index % SIN_STEPS) + SIN_STEPS) % SIN_STEPS] * 0.35 * star.twinkle;
        }

        const alpha = MIN_ALPHA + twinkle * 0.55;
        const ratio = (alpha - MIN_ALPHA) / (MAX_ALPHA - MIN_ALPHA);
        const bucket = Math.min(
          ALPHA_BUCKETS - 1,
          Math.max(0, Math.round(ratio * (ALPHA_BUCKETS - 1))),
        );
        const path = paths[star.z > 0.82 ? ALPHA_BUCKETS + bucket : bucket];

        const radius = star.r * (0.6 + layer * 0.5);
        if (radius < 0.8) {
          const size = radius * 2;
          path.rect(px - radius, py - radius, size, size);
        } else {
          path.moveTo(px + radius, py);
          path.arc(px, py, radius, 0, Math.PI * 2);
        }
      }

      for (let i = 0; i < TOTAL_BUCKETS; i += 1) {
        ctx.fillStyle = FILL_STYLES[i];
        ctx.fill(paths[i]);
      }
    };

    const drawShootingStars = () => {
      if (reducedMotion) return;

      if (Math.random() < 0.012 && shootingStars.length < 3) {
        shootingStars.push({
          x: Math.random() * width * 0.8,
          y: Math.random() * height * 0.4,
          vx: 4 + Math.random() * 5,
          vy: 1.5 + Math.random() * 2,
          life: 0,
          maxLife: 40 + Math.random() * 30,
        });
      }

      shootingStars = shootingStars.filter((star) => {
        star.x += star.vx;
        star.y += star.vy;
        star.life += 1;
        const fade = 1 - star.life / star.maxLife;
        if (fade <= 0) return false;

        const tailX = star.x - star.vx * 8;
        const tailY = star.y - star.vy * 8;
        const grad = ctx.createLinearGradient(star.x, star.y, tailX, tailY);
        grad.addColorStop(0, `rgba(255, 248, 220, ${0.7 * fade})`);
        grad.addColorStop(1, "rgba(212, 175, 55, 0)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(star.x, star.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();
        return true;
      });
    };

    const loop = (time: number) => {
      frame = requestAnimationFrame(loop);
      drawScene(time);
      drawShootingStars();
    };

    const start = () => {
      if (running || reducedMotion) return;
      running = true;
      frame = requestAnimationFrame(loop);
    };

    const stop = () => {
      if (!running) return;
      running = false;
      cancelAnimationFrame(frame);
    };

    const onResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resize();
        if (reducedMotion) drawScene(0);
      }, 150);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") stop();
      else start();
    };

    const onMove = (event: MouseEvent) => {
      parallaxX = (event.clientX / width - 0.5) * PARALLAX_X;
      parallaxY = (event.clientY / height - 0.5) * PARALLAX_Y;
    };

    resize();

    window.addEventListener("resize", onResize, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);
    if (!reducedMotion) {
      window.addEventListener("mousemove", onMove, { passive: true });
      start();
    } else {
      drawScene(0);
    }

    return () => {
      stop();
      if (resizeTimer) clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("mousemove", onMove);
      plate = null;
    };
  }, [reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-30 h-full w-full"
    />
  );
}
