import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const cspHeader = [
  "default-src 'self'",

  "script-src 'self' 'unsafe-inline'",

  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",

  "font-src 'self' https://fonts.gstatic.com",



  // السماح بتحميل صور المحافظ
  "img-src 'self' data: blob: https://coin-images.coingecko.com https://assets.coingecko.com https://explorer-api.walletconnect.com https://explorer-api.walletconnect.org https://registry.walletconnect.com https://*.walletconnect.com https://*.walletconnect.org",

"connect-src 'self' \
https://api.coingecko.com \
https://*.walletconnect.com \
wss://*.walletconnect.com \
https://*.walletconnect.org \
wss://*.walletconnect.org \
https://relay.walletconnect.com \
wss://relay.walletconnect.com \
https://explorer-api.walletconnect.com \
https://explorer-api.walletconnect.org \
https://registry.walletconnect.com \
https://rpc.ankr.com \
https://bsc-dataseed.binance.org \
https://bsc-dataseed1.binance.org \
https://bsc-dataseed2.binance.org \
https://bsc-dataseed3.binance.org \
https://bsc-dataseed4.binance.org \
https://auth.privy.io \
https://*.privy.io \
https://privy.io \
https://*.privy.com \
wss://*.privy.io \
https://*.supabase.co \
wss://*.supabase.co",
  "frame-src 'self' https://auth.privy.io",

  "object-src 'none'",

  "base-uri 'self'",

  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: projectRoot,
  },

  compress: true,

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
      {
        protocol: "https",
        hostname: "explorer-api.walletconnect.com",
      },
      {
        protocol: "https",
        hostname: "explorer-api.walletconnect.org",
      },
      {
        protocol: "https",
        hostname: "registry.walletconnect.com",
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

          {
  key: "Cross-Origin-Opener-Policy",
  value: "same-origin-allow-popups",
},
{
  key: "Cross-Origin-Resource-Policy",
  value: "cross-origin",
},
          
        ],
      },
    ];
  },
};

export default nextConfig;
