import { Container } from "@/components/ui/Container";
import { Clock, ArrowRight, Zap } from "lucide-react";
import Link from "next/link";

interface ComingSoonProps {
  title: string;
  description: string;
  estimatedTime?: string;
}

export function ComingSoon({ title, description, estimatedTime = "Coming Soon" }: ComingSoonProps) {
  return (
    <Container>
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-2 mb-8">
          <Clock className="h-4 w-4 text-gold" />
          <span className="text-sm font-medium text-gold">{estimatedTime}</span>
        </div>
        
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gold/10 mx-auto mb-8">
          <Zap className="h-10 w-10 text-gold" />
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
          {title}
        </h1>
        
        <p className="text-lg text-muted-foreground mb-8">
          {description}
        </p>
        
        <div className="rounded-xl border border-border/50 bg-background/50 p-6 mb-8">
          <p className="text-sm text-muted-foreground mb-4">
            We're building this feature with care. Join our community to get notified when it launches.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gold px-6 py-3 text-sm font-medium text-black transition-colors hover:bg-gold/90"
            >
              <span>Get Notified</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/business"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gold/30 bg-gold/10 px-6 py-3 text-sm font-medium text-gold transition-colors hover:bg-gold/20"
            >
              <span>Back to Business Hub</span>
            </Link>
          </div>
        </div>
      </div>
    </Container>
  );
}
