import Link from "next/link";
import type { ReactNode } from "react";
import {
  Home,
  Lock,
  RefreshCw,
  Search,
  ShieldAlert,
  WifiOff,
  AlertTriangle,
  ServerCrash,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AtlasLogo } from "@/components/ui/AtlasLogo";
import { cn } from "@/lib/utils/cn";

export type SystemStatusKind =
  | "404"
  | "401"
  | "403"
  | "500"
  | "offline"
  | "network"
  | "unexpected";

type StatusCopy = {
  code: string;
  title: string;
  description: string;
  icon: ReactNode;
};

const STATUS: Record<SystemStatusKind, StatusCopy> = {
  "404": {
    code: "404",
    title: "Page not found",
    description:
      "The page you requested does not exist or may have moved. Return home or continue in Marketplace.",
    icon: <Search className="h-6 w-6" aria-hidden />,
  },
  "401": {
    code: "401",
    title: "Sign in required",
    description:
      "You need an ATLAS account to view this area. Sign in to continue where you left off.",
    icon: <Lock className="h-6 w-6" aria-hidden />,
  },
  "403": {
    code: "403",
    title: "Access restricted",
    description:
      "You do not have permission for this resource. Contact your business admin if you believe this is a mistake.",
    icon: <ShieldAlert className="h-6 w-6" aria-hidden />,
  },
  "500": {
    code: "500",
    title: "Something went wrong",
    description:
      "We hit an unexpected error. You can retry, reload, or return home — the issue has been logged.",
    icon: <ServerCrash className="h-6 w-6" aria-hidden />,
  },
  offline: {
    code: "OFFLINE",
    title: "You are offline",
    description:
      "ATLAS cannot reach the network right now. Check your connection and try again.",
    icon: <WifiOff className="h-6 w-6" aria-hidden />,
  },
  network: {
    code: "NETWORK",
    title: "Network error",
    description:
      "We could not complete this request. Confirm your connection and retry in a moment.",
    icon: <WifiOff className="h-6 w-6" aria-hidden />,
  },
  unexpected: {
    code: "ERROR",
    title: "Unexpected error",
    description:
      "Something unexpected happened. Retry the action or return to a known page.",
    icon: <AlertTriangle className="h-6 w-6" aria-hidden />,
  },
};

type SystemStatusPageProps = {
  kind: SystemStatusKind;
  /** Override title / description when needed. */
  title?: string;
  description?: string;
  digest?: string;
  onRetry?: () => void;
  onReload?: () => void;
  className?: string;
  /** Compact card without full viewport centering (embedded). */
  embedded?: boolean;
};

export function SystemStatusPage({
  kind,
  title,
  description,
  digest,
  onRetry,
  onReload,
  className,
  embedded = false,
}: SystemStatusPageProps) {
  const copy = STATUS[kind];

  return (
    <main
      className={cn(
        "animate-atlas-fade-in flex items-center justify-center px-6 py-16",
        !embedded && "min-h-[calc(100vh-var(--nxr-header-offset))]",
        className,
      )}
    >
      <div className="nxr-card mx-auto w-full max-w-md p-8 text-center shadow-xl shadow-black/20 backdrop-blur-2xl">
        <div className="mb-6 flex justify-center">
          <AtlasLogo height={48} priority />
        </div>
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-surface/80 text-gold">
          {copy.icon}
        </div>
        <p className="font-mono text-xs tracking-[0.2em] text-gold/70">{copy.code}</p>
        <h1 className="mt-2 font-heading text-2xl font-semibold text-white">
          {title ?? copy.title}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {description ?? copy.description}
        </p>
        {digest && (
          <p className="mt-2 font-mono text-xs text-muted/70">Reference: {digest}</p>
        )}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
          {onRetry && (
            <Button type="button" onClick={onRetry} className="gap-2">
              <RefreshCw className="h-4 w-4" aria-hidden />
              Try again
            </Button>
          )}
          {onReload && (
            <Button type="button" variant="secondary" onClick={onReload}>
              Reload page
            </Button>
          )}
          <Link href="/">
            <Button type="button" variant="outline" className="w-full gap-2 sm:w-auto">
              <Home className="h-4 w-4" aria-hidden />
              Return home
            </Button>
          </Link>
          {kind === "404" && (
            <Link href="/marketplace">
              <Button type="button" variant="ghost" className="w-full gap-2 sm:w-auto">
                <Search className="h-4 w-4" aria-hidden />
                Marketplace
              </Button>
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
