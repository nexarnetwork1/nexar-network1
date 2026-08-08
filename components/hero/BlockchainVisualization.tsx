"use client";

import { useEffect, useRef, useCallback } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { COLORS } from "@/lib/constants/design";

type Node = {
  x: number;
  y: number;
  radius: number;
  label: string;
  sublabel?: string;
  connections: number[];
};

const ORBIT_LABELS = [
  "Wallet",
  "Pay",
  "Commerce",
  "Market",
  "Explorer",
  "Bridge",
  "AI",
  "Merchant",
  "Customer",
  "Treasury",
  "Analytics",
  "BOT",
] as const;

function buildNodes(): Node[] {
  const center: Node = {
    x: 0.5,
    y: 0.5,
    radius: 30,
    label: "ATLAS",
    sublabel: "NXR",
    connections: [],
  };

  const orbit: Node[] = ORBIT_LABELS.map((label, i) => {
    const angle = (i / ORBIT_LABELS.length) * 2 * Math.PI - Math.PI / 2;
    const radiusPct = 0.38;
    return {
      x: 0.5 + radiusPct * Math.cos(angle),
      y: 0.5 + radiusPct * Math.sin(angle),
      radius: label.length > 6 ? 9 : 10,
      label,
      connections: [0],
    };
  });

  center.connections = orbit.map((_, i) => i + 1);
  return [center, ...orbit];
}

const NODES = buildNodes();

export function BlockchainVisualization() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 80, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 80, damping: 20 });
  const timeRef = useRef(0);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouseX.set((e.clientX - rect.left - rect.width / 2) / rect.width);
      mouseY.set((e.clientY - rect.top - rect.height / 2) / rect.height);
    },
    [mouseX, mouseY],
  );

  useEffect(() => {
    if (reducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    let isVisible = true;

    const observer = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0 },
    );
    observer.observe(canvas);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth * dpr;
      canvas.height = parent.clientHeight * dpr;
      canvas.style.width = `${parent.clientWidth}px`;
      canvas.style.height = `${parent.clientHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      if (!isVisible) {
        frame = requestAnimationFrame(draw);
        return;
      }
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      timeRef.current += 0.008;

      const offsetX = springX.get() * 12;
      const offsetY = springY.get() * 12;

      const positions = NODES.map((node, i) => {
        const pulse = Math.sin(timeRef.current + i * 0.7) * 3;
        return {
          x: node.x * w + offsetX * (i === 0 ? 0 : 1),
          y: node.y * h + offsetY * (i === 0 ? 0 : 1),
          radius: node.radius + (i === 0 ? pulse : 0),
          label: node.label,
          sublabel: node.sublabel,
        };
      });

      for (const node of NODES) {
        for (const targetIdx of node.connections) {
          const from = positions[NODES.indexOf(node)];
          const to = positions[targetIdx];
          if (!from || !to) continue;

          const gradient = ctx.createLinearGradient(from.x, from.y, to.x, to.y);
          gradient.addColorStop(0, `${COLORS.gold}40`);
          gradient.addColorStop(0.5, `${COLORS.gold}14`);
          gradient.addColorStop(1, `${COLORS.gold}40`);

          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(to.x, to.y);
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 1;
          ctx.stroke();

          const packetProgress =
            (Math.sin(timeRef.current * 2 + node.connections.indexOf(targetIdx)) + 1) / 2;
          const px = from.x + (to.x - from.x) * packetProgress;
          const py = from.y + (to.y - from.y) * packetProgress;
          ctx.beginPath();
          ctx.arc(px, py, 2, 0, Math.PI * 2);
          ctx.fillStyle = `${COLORS.goldHover}cc`;
          ctx.fill();
        }
      }

      positions.forEach((pos, i) => {
        const isCenter = i === 0;
        const glow = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, pos.radius * 2);
        glow.addColorStop(0, isCenter ? `${COLORS.gold}4d` : `${COLORS.gold}1f`);
        glow.addColorStop(1, "transparent");
        ctx.fillStyle = glow;
        ctx.fillRect(pos.x - pos.radius * 2, pos.y - pos.radius * 2, pos.radius * 4, pos.radius * 4);

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, pos.radius, 0, Math.PI * 2);
        ctx.fillStyle = isCenter ? `${COLORS.gold}26` : "rgba(16,16,16,0.85)";
        ctx.fill();
        ctx.strokeStyle = isCenter ? `${COLORS.gold}99` : `${COLORS.gold}40`;
        ctx.lineWidth = isCenter ? 1.5 : 1;
        ctx.stroke();

        ctx.fillStyle = isCenter ? COLORS.goldHover : COLORS.muted;
        ctx.font = `${isCenter ? 10 : 8}px var(--font-space-grotesk)`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        if (isCenter && pos.sublabel) {
          ctx.fillText(pos.label, pos.x, pos.y - 5);
          ctx.font = "7px var(--font-space-grotesk)";
          ctx.fillStyle = COLORS.gold;
          ctx.fillText(pos.sublabel, pos.x, pos.y + 7);
        } else {
          ctx.fillText(pos.label, pos.x, pos.y);
        }
      });

      frame = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      observer.disconnect();
    };
  }, [reducedMotion, springX, springY]);

  return (
    <motion.div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative h-full w-full"
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.2, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.06)_0%,transparent_65%)]" />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 rounded-full border border-gold/10" />
      <div
        className="pointer-events-none absolute inset-[12%] rounded-full border border-white/5"
        style={{ animation: reducedMotion ? undefined : "spin 60s linear infinite" }}
      />
      <div
        className="pointer-events-none absolute inset-[24%] rounded-full border border-gold/5"
        style={{
          animation: reducedMotion ? undefined : "spin 45s linear infinite reverse",
        }}
      />
    </motion.div>
  );
}
