"use client";

import { Container } from "@/components/ui/Container";
import { BookOpen, Play, Code, Terminal, CheckCircle2, ArrowRight, Star, Clock, Users } from "lucide-react";
import Link from "next/link";

export default function TutorialsPage() {
  return (
    <Container>
      <div className="max-w-7xl mx-auto py-12">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-muted mb-8">
          <Link href="/business/documentation" className="hover:text-gold">
            Documentation
          </Link>
          <span>/</span>
          <span className="text-white">Tutorials</span>
        </nav>

        {/* Page Header */}
        <div className="mb-12">
          <h1 className="font-heading text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl mb-4">
            Tutorials
          </h1>
          <p className="text-lg text-muted">
            Step-by-step guides to help you integrate Nexar Network
          </p>
        </div>

        {/* Tutorial Categories */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* Getting Started */}
          <div className="luxury-border rounded-xl bg-card/40 p-6 backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-gold/20">
                <Play className="h-6 w-6 text-gold" />
              </div>
              <h3 className="text-lg font-semibold text-white">Getting Started</h3>
            </div>
            <ul className="space-y-3">
              <li>
                <Link href="/docs/quick-start" className="flex items-center gap-2 text-muted-foreground hover:text-gold transition-colors">
                  <ArrowRight className="h-4 w-4" />
                  <span>Quick Start Guide</span>
                </Link>
              </li>
              <li>
                <Link href="/docs/api" className="flex items-center gap-2 text-muted-foreground hover:text-gold transition-colors">
                  <ArrowRight className="h-4 w-4" />
                  <span>Your First API Call</span>
                </Link>
              </li>
              <li>
                <Link href="/business/sdks" className="flex items-center gap-2 text-muted-foreground hover:text-gold transition-colors">
                  <ArrowRight className="h-4 w-4" />
                  <span>SDK Installation</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Payment Integration */}
          <div className="luxury-border rounded-xl bg-card/40 p-6 backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-gold/20">
                <Code className="h-6 w-6 text-gold" />
              </div>
              <h3 className="text-lg font-semibold text-white">Payment Integration</h3>
            </div>
            <ul className="space-y-3">
              <li>
                <Link href="/docs/api" className="flex items-center gap-2 text-muted-foreground hover:text-gold transition-colors">
                  <ArrowRight className="h-4 w-4" />
                  <span>Create Invoice</span>
                </Link>
              </li>
              <li>
                <Link href="/checkout" className="flex items-center gap-2 text-muted-foreground hover:text-gold transition-colors">
                  <ArrowRight className="h-4 w-4" />
                  <span>Checkout Integration</span>
                </Link>
              </li>
              <li>
                <Link href="/business/payment-links" className="flex items-center gap-2 text-muted-foreground hover:text-gold transition-colors">
                  <ArrowRight className="h-4 w-4" />
                  <span>Payment Links</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Advanced */}
          <div className="luxury-border rounded-xl bg-card/40 p-6 backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-gold/20">
                <Terminal className="h-6 w-6 text-gold" />
              </div>
              <h3 className="text-lg font-semibold text-white">Advanced</h3>
            </div>
            <ul className="space-y-3">
              <li>
                <Link href="/docs/webhooks" className="flex items-center gap-2 text-muted-foreground hover:text-gold transition-colors">
                  <ArrowRight className="h-4 w-4" />
                  <span>Webhook Setup</span>
                </Link>
              </li>
              <li>
                <Link href="/docs/security" className="flex items-center gap-2 text-muted-foreground hover:text-gold transition-colors">
                  <ArrowRight className="h-4 w-4" />
                  <span>Security Best Practices</span>
                </Link>
              </li>
              <li>
                <Link href="/docs/api" className="flex items-center gap-2 text-muted-foreground hover:text-gold transition-colors">
                  <ArrowRight className="h-4 w-4" />
                  <span>Error Handling</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Featured Tutorials */}
        <div className="luxury-border rounded-3xl bg-card/40 p-8 backdrop-blur-xl mb-12">
          <h2 className="text-xl font-semibold text-white mb-6">Featured Tutorials</h2>
          <div className="space-y-6">
            {/* Tutorial 1 */}
            <div className="border border-border/50 rounded-xl p-6 bg-card/30">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Building a Payment Page with Next.js
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Learn how to create a complete payment page using Next.js and the Nexar SDK
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>15 min</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-gold/20 text-gold">Intermediate</span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">Next.js</span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">React</span>
              </div>
            </div>

            {/* Tutorial 2 */}
            <div className="border border-border/50 rounded-xl p-6 bg-card/30">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Django Integration Guide
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Integrate Nexar payments into your Django application with Python SDK
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>20 min</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-gold/20 text-gold">Beginner</span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">Python</span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400">Django</span>
              </div>
            </div>

            {/* Tutorial 3 */}
            <div className="border border-border/50 rounded-xl p-6 bg-card/30">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Webhook Implementation
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Set up and handle webhooks for real-time payment notifications
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>25 min</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-gold/20 text-gold">Advanced</span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">Node.js</span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">Express</span>
              </div>
            </div>
          </div>
        </div>

        {/* Video Tutorials */}
        <div className="luxury-border rounded-3xl bg-card/40 p-8 backdrop-blur-xl">
          <h2 className="text-xl font-semibold text-white mb-6">Video Tutorials</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-border/50 rounded-xl p-6 bg-card/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-lg bg-gold/20">
                  <Play className="h-6 w-6 text-gold" />
                </div>
                <div>
                  <h3 className="text-white font-medium">Getting Started Video</h3>
                  <p className="text-sm text-muted-foreground">10 min introduction</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>2.5K views</span>
              </div>
            </div>

            <div className="border border-border/50 rounded-xl p-6 bg-card/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-lg bg-gold/20">
                  <Play className="h-6 w-6 text-gold" />
                </div>
                <div>
                  <h3 className="text-white font-medium">API Deep Dive</h3>
                  <p className="text-sm text-muted-foreground">Advanced API usage</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>1.8K views</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}