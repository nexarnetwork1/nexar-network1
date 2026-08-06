"use client";

import { useEffect } from "react";
import { captureException } from "@/lib/monitoring/sentry";
import { SystemStatusPage } from "@/components/system/SystemStatusPage";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureException(error, { digest: error.digest, boundary: "route" });
  }, [error]);

  return (
    <SystemStatusPage
      kind="unexpected"
      digest={error.digest}
      onRetry={reset}
      onReload={() => window.location.reload()}
    />
  );
}
