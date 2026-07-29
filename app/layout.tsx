import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
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
  themeColor: "#050505",
  colorScheme: "dark",
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

<Toaster
  position="bottom-center"
  richColors
  theme="dark"
/>
      <body className="relative min-h-full bg-background font-sans text-white antialiased">
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
  className="relative z-10 flex min-h-screen flex-col nav-offset"
>
  {children}
</div>
          <CookieConsent />
        </AppProviders>
      </body>
    </html>
  );
}
