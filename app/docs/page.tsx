import Link from "next/link";
import { Container } from "@/components/ui/Container";

export default function DocsPage() {
  return (
    <Container>
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
            Documentation
          </h1>
          <p className="mt-3 text-lg text-muted">
            Comprehensive guides, API references, and tutorials
          </p>
        </div>

        <div className="luxury-border rounded-3xl bg-card/40 p-8 backdrop-blur-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link 
              href="/docs/api"
              className="p-6 rounded-xl border border-border/50 bg-card/30 hover:border-gold/50 transition-colors"
            >
              <h3 className="font-semibold text-gold mb-2">API Documentation</h3>
              <p className="text-sm text-muted">
                Complete API reference with endpoints and examples
              </p>
            </Link>
            
            <Link 
              href="/docs/developer"
              className="p-6 rounded-xl border border-border/50 bg-card/30 hover:border-gold/50 transition-colors"
            >
              <h3 className="font-semibold text-gold mb-2">Developer Guide</h3>
              <p className="text-sm text-muted">
                Getting started guide for developers
              </p>
            </Link>
            
            <div className="p-6 rounded-xl border border-border/50 bg-card/30">
              <h3 className="font-semibold text-gold mb-2">Quick Start</h3>
              <p className="text-sm text-muted">
                Quick start guides and installation
              </p>
            </div>
            
            <div className="p-6 rounded-xl border border-border/50 bg-card/30">
              <h3 className="font-semibold text-gold mb-2">Webhooks</h3>
              <p className="text-sm text-muted">
                Webhook configuration and events
              </p>
            </div>
            
            <div className="p-6 rounded-xl border border-border/50 bg-card/30">
              <h3 className="font-semibold text-gold mb-2">Security</h3>
              <p className="text-sm text-muted">
                Security best practices and guidelines
              </p>
            </div>
            
            <div className="p-6 rounded-xl border border-border/50 bg-card/30">
              <h3 className="font-semibold text-gold mb-2">Tutorials</h3>
              <p className="text-sm text-muted">
                Step-by-step tutorials and examples
              </p>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
