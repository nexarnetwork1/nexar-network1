"use client";

import { Container } from "@/components/ui/Container";
import { Shield, Lock, Key, CheckCircle2, ArrowRight, AlertTriangle, Eye, Server, Database } from "lucide-react";
import Link from "next/link";

export default function SecurityPage() {
  return (
    <Container>
      <div className="max-w-7xl mx-auto py-12">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-muted mb-8">
          <Link href="/business/documentation" className="hover:text-gold">
            Documentation
          </Link>
          <span>/</span>
          <span className="text-white">Security</span>
        </nav>

        {/* Page Header */}
        <div className="mb-12">
          <h1 className="font-heading text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl mb-4">
            Security Best Practices
          </h1>
          <p className="text-lg text-muted">
            Essential security guidelines for integrating Nexar Network safely
          </p>
        </div>

        {/* API Key Security */}
        <div className="luxury-border rounded-3xl bg-card/40 p-8 backdrop-blur-xl mb-12">
          <h2 className="text-xl font-semibold text-white mb-6">API Key Security</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-gold/20 shrink-0">
                <Key className="h-6 w-6 text-gold" />
              </div>
              <div>
                <h3 className="text-white font-medium mb-2">Keep Keys Secret</h3>
                <p className="text-sm text-muted-foreground">
                  Never expose API keys in client-side code, public repositories, or configuration files
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-gold/20 shrink-0">
                <Server className="h-6 w-6 text-gold" />
              </div>
              <div>
                <h3 className="text-white font-medium mb-2">Use Environment Variables</h3>
                <p className="text-sm text-muted-foreground">
                  Store API keys in environment variables, not in source code
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-gold/20 shrink-0">
                <Lock className="h-6 w-6 text-gold" />
              </div>
              <div>
                <h3 className="text-white font-medium mb-2">Rotate Keys Regularly</h3>
                <p className="text-sm text-muted-foreground">
                  Regularly rotate API keys and invalidate old ones when personnel changes
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-gold/20 shrink-0">
                <Eye className="h-6 w-6 text-gold" />
              </div>
              <div>
                <h3 className="text-white font-medium mb-2">Use Separate Keys</h3>
                <p className="text-sm text-muted-foreground">
                  Use different API keys for development, staging, and production environments
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Webhook Security */}
        <div className="luxury-border rounded-3xl bg-card/40 p-8 backdrop-blur-xl mb-12">
          <h2 className="text-xl font-semibold text-white mb-6">Webhook Security</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-gold/20 shrink-0">
                <Shield className="h-6 w-6 text-gold" />
              </div>
              <div>
                <h3 className="text-white font-medium mb-2">Verify Signatures</h3>
                <p className="text-sm text-muted-foreground">
                  Always verify webhook signatures using your webhook secret key
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-gold/20 shrink-0">
                <Lock className="h-6 w-6 text-gold" />
              </div>
              <div>
                <h3 className="text-white font-medium mb-2">Use HTTPS</h3>
                <p className="text-sm text-muted-foreground">
                  Webhook endpoints must use HTTPS with valid SSL certificates
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-gold/20 shrink-0">
                <Database className="h-6 w-6 text-gold" />
              </div>
              <div>
                <h3 className="text-white font-medium mb-2">Idempotency</h3>
                <p className="text-sm text-muted-foreground">
                  Handle duplicate webhook deliveries gracefully using idempotency keys
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Data Protection */}
        <div className="luxury-border rounded-3xl bg-card/40 p-8 backdrop-blur-xl mb-12">
          <h2 className="text-xl font-semibold text-white mb-6">Data Protection</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-gold/20 shrink-0">
                <CheckCircle2 className="h-6 w-6 text-gold" />
              </div>
              <div>
                <h3 className="text-white font-medium mb-2">Encrypt at Rest</h3>
                <p className="text-sm text-muted-foreground">
                  Encrypt sensitive data when storing it in your database
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-gold/20 shrink-0">
                <Lock className="h-6 w-6 text-gold" />
              </div>
              <div>
                <h3 className="text-white font-medium mb-2">Minimize Data Collection</h3>
                <p className="text-sm text-muted-foreground">
                  Only collect and store the data you absolutely need
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-gold/20 shrink-0">
                <Shield className="h-6 w-6 text-gold" />
              </div>
              <div>
                <h3 className="text-white font-medium mb-2">Compliance</h3>
                <p className="text-sm text-muted-foreground">
                  Ensure compliance with GDPR, PCI DSS, and other relevant regulations
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Common Vulnerabilities */}
        <div className="luxury-border rounded-3xl bg-card/40 p-8 backdrop-blur-xl mb-12">
          <h2 className="text-xl font-semibold text-white mb-6">Common Vulnerabilities</h2>
          <div className="space-y-4">
            <div className="border border-red-500/50 rounded-xl p-6 bg-red-500/10">
              <div className="flex items-center gap-3 mb-3">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <h3 className="text-white font-medium">Exposing API Keys</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Never commit API keys to version control or include them in client-side JavaScript
              </p>
            </div>

            <div className="border border-red-500/50 rounded-xl p-6 bg-red-500/10">
              <div className="flex items-center gap-3 mb-3">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <h3 className="text-white font-medium">Ignoring Webhook Signatures</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Always verify webhook signatures to prevent fake payment notifications
              </p>
            </div>

            <div className="border border-red-500/50 rounded-xl p-6 bg-red-500/10">
              <div className="flex items-center gap-3 mb-3">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <h3 className="text-white font-medium">SQL Injection</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Use parameterized queries and ORM to prevent SQL injection attacks
              </p>
            </div>

            <div className="border border-red-500/50 rounded-xl p-6 bg-red-500/10">
              <div className="flex items-center gap-3 mb-3">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <h3 className="text-white font-medium">XSS Attacks</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Sanitize and escape user input to prevent cross-site scripting attacks
              </p>
            </div>
          </div>
        </div>

        {/* Security Checklist */}
        <div className="luxury-border rounded-3xl bg-card/40 p-8 backdrop-blur-xl">
          <h2 className="text-xl font-semibold text-white mb-6">Security Checklist</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm text-white">
              <CheckCircle2 className="h-4 w-4 text-gold shrink-0" />
              <span>API keys stored in environment variables</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-white">
              <CheckCircle2 className="h-4 w-4 text-gold shrink-0" />
              <span>Webhook signature verification implemented</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-white">
              <CheckCircle2 className="h-4 w-4 text-gold shrink-0" />
              <span>HTTPS enabled for all endpoints</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-white">
              <CheckCircle2 className="h-4 w-4 text-gold shrink-0" />
              <span>Input validation and sanitization</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-white">
              <CheckCircle2 className="h-4 w-4 text-gold shrink-0" />
              <span>Rate limiting implemented</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-white">
              <CheckCircle2 className="h-4 w-4 text-gold shrink-0" />
              <span>Logging and monitoring enabled</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-white">
              <CheckCircle2 className="h-4 w-4 text-gold shrink-0" />
              <span>Regular security audits scheduled</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-white">
              <CheckCircle2 className="h-4 w-4 text-gold shrink-0" />
              <span>Dependency updates maintained</span>
            </div>
          </div>
        </div>

        {/* Report Security Issues */}
        <div className="mt-12 text-center">
          <div className="luxury-border rounded-2xl bg-card/40 p-8 backdrop-blur-xl max-w-2xl mx-auto">
            <Shield className="h-12 w-12 text-gold mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-4">Found a Security Issue?</h2>
            <p className="text-muted-foreground mb-6">
              Please report security vulnerabilities responsibly. We'll work with you to address any issues.
            </p>
            <a
              href="mailto:security@nexarnetwork.org"
              className="inline-flex items-center gap-2 text-gold hover:text-gold/80 text-sm font-medium"
            >
              <span>security@nexarnetwork.org</span>
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </Container>
  );
}