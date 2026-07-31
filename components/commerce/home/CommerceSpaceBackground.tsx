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

const STAR_COUNT = 2200;

export function CommerceSpaceBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    let width = 0;
    let height = 0;
    let stars: Star[] = [];
    let shootingStars: ShootingStar[] = [];
    let parallaxX = 0;
    let parallaxY = 0;
    let visible = true;

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry?.isIntersecting ?? true;
      },
      { threshold: 0 },
    );
    observer.observe(canvas);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      stars = Array.from({ length: STAR_COUNT }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        z: Math.random(),
        r: Math.random() * 1.1 + 0.15,
        phase: Math.random() * Math.PI * 2,
        twinkle: 0.3 + Math.random() * 0.7,
      }));
    };

    resize();
    window.addEventListener("resize", resize);

    const onMove = (event: MouseEvent) => {
      if (reducedMotion) return;
      parallaxX = (event.clientX / width - 0.5) * 12;
      parallaxY = (event.clientY / height - 0.5) * 8;
    };
    window.addEventListener("mousemove", onMove);

    const spawnShootingStar = () => {
      if (reducedMotion || Math.random() > 0.012) return;
      shootingStars.push({
        x: Math.random() * width * 0.8,
        y: Math.random() * height * 0.4,
        vx: 4 + Math.random() * 5,
        vy: 1.5 + Math.random() * 2,
        life: 0,
        maxLife: 40 + Math.random() * 30,
      });
      if (shootingStars.length > 3) shootingStars.shift();
    };

    const draw = (time: number) => {
      frame = requestAnimationFrame(draw);
      if (!visible) return;

      ctx.fillStyle = "#030308";
      ctx.fillRect(0, 0, width, height);

      const nebula = ctx.createRadialGradient(
        width * 0.72 + parallaxX,
        height * 0.18 + parallaxY,
        0,
        width * 0.72,
        height * 0.18,
        width * 0.45,
      );
      nebula.addColorStop(0, "rgba(212, 175, 55, 0.06)");
      nebula.addColorStop(0.45, "rgba(80, 60, 120, 0.04)");
      nebula.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = nebula;
      ctx.fillRect(0, 0, width, height);

      const t = reducedMotion ? 0 : time * 0.001;

      for (const star of stars) {
        const layer = 0.25 + star.z * 0.75;
        const px = star.x + parallaxX * layer;
        const py = star.y + parallaxY * layer;
        const twinkle = reducedMotion
          ? star.twinkle
          : 0.35 + Math.sin(t * 2 + star.phase) * 0.35 * star.twinkle;
        const alpha = 0.15 + twinkle * 0.55;
        const isGold = star.z > 0.82;

        ctx.fillStyle = isGold
          ? `rgba(212, 175, 55, ${alpha * 0.9})`
          : `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(px, py, star.r * (0.6 + layer * 0.5), 0, Math.PI * 2);
        ctx.fill();
      }

      spawnShootingStar();
      shootingStars = shootingStars.filter((s) => {
        s.x += s.vx;
        s.y += s.vy;
        s.life += 1;
        const fade = 1 - s.life / s.maxLife;
        if (fade <= 0) return false;

        const grad = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * 8, s.y - s.vy * 8);
        grad.addColorStop(0, `rgba(255, 248, 220, ${0.7 * fade})`);
        grad.addColorStop(1, "rgba(212, 175, 55, 0)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - s.vx * 8, s.y - s.vy * 8);
        ctx.stroke();
        return true;
      });
    };

    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      observer.disconnect();
    };
  }, [reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
    />
  );
}
