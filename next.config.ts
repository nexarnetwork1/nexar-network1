import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

// Content Security Policy
// Allows connections to WalletConnect relay, BSC RPC nodes, and Google Fonts.
// Adjust 'connect-src' if you add additional RPC providers.
const cspHeader = [
  "default-src 'self'",
  // Scripts: self + inline scripts for JSON-LD schema (sha-based would be ideal
  // but Next.js inline scripts require 'unsafe-inline' at the moment)
  "script-src 'self' 'unsafe-inline'",
  // Styles: self + Google Fonts + inline (Tailwind / Next.js injects inline styles)
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // Fonts: self + Google Fonts CDN
  "font-src 'self' https://fonts.gstatic.com",
  // Images: self + data URIs (for canvas/og images) + blob
"img-src 'self' data: blob: https://coin-images.coingecko.com https://assets.coingecko.com",
  // Connections: self + WalletConnect relay + BSC public RPC + Reown API
 "connect-src 'self' https://api.coingecko.com https://*.walletconnect.com wss://*.walletconnect.com https://*.walletconnect.org wss://*.walletconnect.org https://relay.walletconnect.com wss://relay.walletconnect.com https://rpc.ankr.com https://bsc-dataseed.binance.org https://bsc-dataseed1.binance.org https://bsc-dataseed2.binance.org https://bsc-dataseed3.binance.org https://bsc-dataseed4.binance.org https://*.reown.com",
  // Frames: none (no iframes needed)
  "frame-src 'none'",
  // Objects: none
  "object-src 'none'",
  // Base URI: self only
  "base-uri 'self'",
  // Form action: self only
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  // Performance optimizations
  compress: true,
  // Image optimization
 images: {
  remotePatterns: [
    {
      protocol: "https",
      hostname: "coin-images.coingecko.com",
    },
    {
      protocol: "https",
      hostname: "assets.coingecko.com",
    },
  ],
  formats: ["image/avif", "image/webp"],
  deviceSizes: [320, 375, 390, 414, 640, 750, 828, 1024, 1280, 1440],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
},
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspHeader.replace(/\n/g, ""),
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
