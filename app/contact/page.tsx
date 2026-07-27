import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Mail, MessageCircle, Send } from "lucide-react";
import {
FaXTwitter,
FaTelegram,
FaGithub,
FaFacebook,
FaInstagram,
FaLinkedin,
FaDiscord,
FaTiktok,
} from "react-icons/fa6";

import { SiBinance } from "react-icons/si";
import { Container } from "@/components/ui/Container";
import { SITE, SOCIAL } from "@/lib/constants/site";

export const metadata: Metadata = {
  title: "Contact",
  description: `Get in touch with ${SITE.name}. Reach out via our official social media channels or community platforms.`,
  openGraph: {
    title: `Contact | ${SITE.name}`,
    description: `Contact ${SITE.name} via official channels.`,
  },
};

const CONTACT_CHANNELS = [
  {
    name: "X",
    handle: "@NexarNetwork1",
    href: SOCIAL.x,
    icon: FaXTwitter,
    description: "Latest announcements",
  },
  {
    name: "Binance Square",
    handle: "Nexar Network",
    href: SOCIAL.binanceSquare,
    icon: SiBinance,
    description: "Official Binance Square",
  },
  {
    name: "Telegram",
    handle: "t.me/NexarNetworkCommunity",
    href: SOCIAL.telegram,
    icon: FaTelegram,
    description: "Official Community",
  },
  {
    name: "TikTok",
    handle: "@nexarnetwork",
    href: SOCIAL.tiktok,
    icon: FaTiktok,
    description: "Official TikTok",
  },
  {
    name: "Instagram",
    handle: "@nexarnetwork1",
    href: SOCIAL.instagram,
    icon: FaInstagram,
    description: "Official Instagram",
  },
  {
    name: "Facebook",
    handle: "Nexar Network",
    href: SOCIAL.facebook,
    icon: FaFacebook,
    description: "Official Facebook",
  },
  {
    name: "Discord",
    handle: "Nexar Network",
    href: SOCIAL.discord,
    icon: FaDiscord,
    description: "Official Discord",
  },
  {
    name: "GitHub",
    handle: "github.com/nexarnetwork1",
    href: SOCIAL.github,
    icon: FaGithub,
    description: "Open Source",
  },
  {
    name: "LinkedIn",
    handle: "Mahmoud Elgabry",
    href: SOCIAL.linkedin,
    icon: FaLinkedin,
    description: "Founder",
  },
];

export default function ContactPage() {
  return (
    <main className="nav-offset min-h-screen">
      <Container className="py-16 lg:py-24">
        <Link
          href="/"
          className="mb-10 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-gold"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <div className="mx-auto max-w-4xl">
          <p className="mb-4 text-xs font-medium tracking-[0.24em] text-gold uppercase">
            Contact
          </p>
          <h1 className="font-heading text-[clamp(2rem,5vw,3.5rem)] leading-[1.05] font-semibold tracking-[-0.03em]">
            Get in Touch
          </h1>
          <p className="mt-5 text-lg leading-8 text-muted">
            Connect with {SITE.name} through our official channels. Join our community, follow our updates, or reach out for partnerships.
          </p>

          {/* Social Channels Grid */}
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CONTACT_CHANNELS.map((channel) => (
              <a
                key={channel.name}
                href={channel.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group luxury-border rounded-2xl bg-card/40 p-6 backdrop-blur-xl transition-all hover:border-gold/30 hover:bg-card/60"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-surface/80 transition-colors group-hover:border-gold/30">
                    <channel.icon className="h-5 w-5 text-gold" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-heading text-lg font-semibold text-white">
                      {channel.name}
                    </h3>
                    <p className="mt-1 text-sm font-mono text-gold-secondary">
                      {channel.handle}
                    </p>
                    <p className="mt-2 text-sm text-muted">
                      {channel.description}
                    </p>
                  </div>
                </div>
              </a>
            ))}
          </div>

          {/* Community Guidelines */}
          <div className="mt-12 luxury-border rounded-3xl bg-card/40 p-8 backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/20 bg-gold/5">
                <MessageCircle className="h-5 w-5 text-gold" />
              </div>
              <h2 className="font-heading text-xl font-semibold">Community Guidelines</h2>
            </div>
            <div className="space-y-4 text-sm leading-7 text-muted">
              <p>
                Our community channels are moderated to ensure a respectful and productive environment for all participants. Please follow these guidelines:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Be respectful to all community members</li>
                <li>No spam, self-promotion, or irrelevant content</li>
                <li>Do not share private keys or sensitive information</li>
                <li>Verify official announcements from our verified accounts only</li>
                <li>Report suspicious activity to moderators</li>
              </ul>
              <p className="mt-4">
                <strong className="text-white">Important:</strong> Our team will never ask for your private keys, seed phrases, or request you to send funds to any address. Be cautious of impersonators and scams.
              </p>
            </div>
          </div>

          {/* Partnership Inquiries */}
          <div className="mt-8 luxury-border rounded-3xl bg-card/40 p-8 backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/20 bg-gold/5">
                <Mail className="h-5 w-5 text-gold" />
              </div>
              <h2 className="font-heading text-xl font-semibold">Partnership Inquiries</h2>
            </div>
            <p className="text-sm leading-7 text-muted">
              For partnership opportunities, integration requests, or business inquiries, please reach out through our official Telegram channel or Twitter. Our team reviews all inquiries and will respond to relevant proposals.
            </p>
          </div>

          {/* Quick Links */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Link
              href="/whitepaper"
              className="luxury-border rounded-2xl bg-card/40 p-6 backdrop-blur-xl transition-all hover:border-gold/30 hover:bg-card/60"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface/80">
                  <Send className="h-5 w-5 text-gold" />
                </div>
                <div>
                  <h3 className="font-heading text-base font-semibold">Read Whitepaper</h3>
                  <p className="text-sm text-muted">Learn about our vision and technology</p>
                </div>
              </div>
            </Link>
            <Link
              href="/market"
              className="luxury-border rounded-2xl bg-card/40 p-6 backdrop-blur-xl transition-all hover:border-gold/30 hover:bg-card/60"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface/80">
                  <Send className="h-5 w-5 text-gold" />
                </div>
                <div>
                  <h3 className="font-heading text-base font-semibold">View Market</h3>
                  <p className="text-sm text-muted">Trading information and contract addresses</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </Container>
    </main>
  );
}
