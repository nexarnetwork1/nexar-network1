import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const cspHeader = [
  "default-src 'self'",

  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://challenges.cloudflare.com",

  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",

  "font-src 'self' https://fonts.gstatic.com",



  // السماح بتحميل صور المحافظ
  // google-analytics/googletagmanager cover the GA4 pixel fallback used when
  // beacon and fetch transports are unavailable.
  "img-src 'self' data: blob: https://coin-images.coingecko.com https://assets.coingecko.com https://explorer-api.walletconnect.com https://explorer-api.walletconnect.org https://registry.walletconnect.com https://*.walletconnect.com https://*.walletconnect.org https://www.google-analytics.com https://www.googletagmanager.com",

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
https://rpc.botchain.ai \
https://scan.botchain.ai \
https://auth.privy.io \
https://*.privy.io \
https://privy.io \
https://*.privy.com \
wss://*.privy.io \
https://*.supabase.co \
wss://*.supabase.co \
https://www.googletagmanager.com \
https://www.google-analytics.com \
https://*.google-analytics.com \
https://*.analytics.google.com \
https://*.ingest.sentry.io \
https://*.sentry.io \
https://*.posthog.com \
https://us.i.posthog.com \
https://eu.i.posthog.com \
https://challenges.cloudflare.com",
  "frame-src 'self' https://auth.privy.io https://challenges.cloudflare.com",

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

  async redirects() {
    return [
      {
        source: "/contact",
        destination: "/#contact",
        permanent: false,
      },
      { source: "/signup", destination: "/login?mode=register", permanent: false },
      { source: "/register", destination: "/login?mode=register", permanent: false },
      { source: "/register/customer", destination: "/login?mode=register", permanent: false },
      { source: "/register/merchant", destination: "/login?mode=register", permanent: false },
      { source: "/auth/register", destination: "/login?mode=register", permanent: false },
      { source: "/customer/login", destination: "/login", permanent: false },
      { source: "/merchant/login", destination: "/login", permanent: false },
    ];
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
