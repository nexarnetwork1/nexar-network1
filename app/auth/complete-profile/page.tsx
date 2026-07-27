import { Suspense } from "react";
import CompleteProfilePage from "./CompleteProfilePage";

export default function Page() {
  return (
    <Suspense fallback={<div className="text-center text-muted">Loading…</div>}>
      <CompleteProfilePage />
    </Suspense>
  );
}
