import { Suspense } from "react";
import { NetworkSearchPage } from "@/components/atlas/app/network/NetworkSearchPage";

export default function AtlasSearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted text-sm">Loading search…</div>}>
      <NetworkSearchPage />
    </Suspense>
  );
}
