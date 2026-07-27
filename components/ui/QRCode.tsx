"use client";

import { useEffect, useRef, useState } from "react";
import QRCodeLib from "qrcode";
import { cn } from "@/lib/utils/cn";

interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
  bgColor?: string;
  fgColor?: string;
  level?: "L" | "M" | "Q" | "H";
}

export function QRCode({
  value,
  size = 200,
  className,
  bgColor = "#FFFFFF",
  fgColor = "#000000",
  level = "M",
}: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const generateQR = async () => {
      try {
        await QRCodeLib.toCanvas(canvas, value, {
          width: size,
          margin: 2,
          color: {
            dark: fgColor,
            light: bgColor,
          },
          errorCorrectionLevel: level,
        });
        setError(false);
      } catch (err) {
        console.error("Failed to generate QR code:", err);
        setError(true);
      }
    };

    generateQR();
  }, [value, size, bgColor, fgColor, level]);

  if (error) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-red-500/10 border border-red-500/30",
          className
        )}
        style={{ width: size, height: size }}
      >
        <span className="text-xs text-red-400">QR Error</span>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={cn("rounded-lg", className)}
      style={{ width: size, height: size }}
      aria-label={`QR code for ${value}`}
    />
  );
}
