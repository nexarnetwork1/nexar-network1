import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { GoogleAnalytics } from "@next/third-parties/google";
import { env } from "@/config/env";
import { Navbar } from "@/components/layout/Navbar";
import { NewsTicker } from "@/components/layout/NewsTicker";
import { GlobalBackground } from "@/components/ui/GlobalBackground";
import { HashScrollHandler } from "@/components/layout/HashScrollHandler";
import { AppProviders } from "@/components/providers/AppProviders";
import { CookieConsent } from "@/components/ui/CookieConsent";
import { Toaster } from "sonner";
import { getActiveTickerAnnouncements } from "@/modules/ticker/repository";
import {
  organizationSchema,
  websiteSchema,
  productSchema,
  siteMetadata,
} from "@/lib/constants/seo";
import { THEME_STORAGE_KEY } from "@/lib/theme/constants";
import "./globals.css";

const inter = localFont({
  src: "./fonts/inter-latin.woff2",
  variable: "--font-inter",
  display: "swap",
  weight: "100 900",
});

const sora = localFont({
  src: "./fonts/sora-latin.woff2",
  variable: "--font-sora",
  display: "swap",
  weight: "100 800",
});

const spaceGrotesk = localFont({
  src: "./fonts/space-grotesk-latin.woff2",
  variable: "--font-space-grotesk",
  display: "swap",
  weight: "300 700",
});

export const metadata: Metadata = {
  ...siteMetadata,
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const tickerAnnouncements = await getActiveTickerAnnouncements();

  return (
    <html
      lang="en"
      className={`${inter.variable} ${sora.variable} ${spaceGrotesk.variable} h-full scroll-smooth`}
    >
      <body className="relative min-h-full bg-canvas font-sans text-foreground antialiased">
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var s=localStorage.getItem(k);var t=s==="light"||s==="dark"||s==="system"?s:"system";var d=t==="system"?window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light":t;document.documentElement.setAttribute("data-theme",d);document.documentElement.classList.toggle("dark",d==="dark");document.documentElement.classList.toggle("light",d==="light");document.documentElement.style.colorScheme=d;}catch(e){}})();`,
          }}
        />
        <Toaster
          position="bottom-center"
          theme="dark"
          closeButton
          toastOptions={{
            classNames: {
              toast:
                "nxr-card !border-border !bg-card !text-foreground !shadow-[var(--nxr-shadow-soft)]",
              title: "!text-foreground !text-sm !font-medium",
              description: "!text-muted !text-sm",
              actionButton: "!nxr-btn-primary !text-on-gold !text-xs",
              cancelButton: "!nxr-btn-secondary !text-xs",
              closeButton: "!text-muted hover:!text-foreground",
              success: "!border-success/30 !bg-success/10",
              error: "!border-danger/30 !bg-danger/10",
              warning: "!border-warning/30 !bg-gold-soft",
            },
            duration: 4200,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(productSchema),
          }}
        />
        <AppProviders>
          {/* Skip-to-content: visible only on focus for keyboard users */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:rounded-full focus:bg-gold focus:px-5 focus:py-3 focus:text-sm focus:font-medium focus:text-background focus:shadow-lg focus:outline-none"
          >
            Skip to content
          </a>
          <GlobalBackground variant="default" />
          <HashScrollHandler />
          <Navbar />

          <NewsTicker announcements={tickerAnnouncements} />

          <div
            id="main-content"
            className="relative z-10 flex min-h-screen flex-col nav-offset bg-canvas"
          >
            {children}
          </div>
          <CookieConsent />
        </AppProviders>
      </body>
      {/*
        Mounted once here so every route shares a single gtag instance.
        Pageviews for client-side navigation come from GA4 Enhanced Measurement
        (History API), so no manual page_view is sent — doing both is what
        produces duplicate events.
      */}
      {env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
        <GoogleAnalytics gaId={env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
      )}
    </html>
  );
}
