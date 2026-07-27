import type { Metadata, Viewport } from "next";
import { Inter, Sora, Space_Grotesk } from "next/font/google";
import { Navbar } from "@/components/layout/Navbar";
import { NewsTicker } from "@/components/layout/NewsTicker";
import { BackgroundEffect } from "@/components/background/BackgroundEffect";
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

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
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
{/* <BackgroundEffect /> */}
         <Navbar />

<NewsTicker announcements={tickerAnnouncements} />

<div
  id="main-content"
  className="relative z-10 flex min-h-screen flex-col"
>
  {children}
</div>
          <CookieConsent />
        </AppProviders>
      </body>
    </html>
  );
}
