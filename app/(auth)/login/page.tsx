import { Suspense } from "react";
import { AdminAccessPrompt } from "@/components/layout/AdminAccessPrompt";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <>
      <Suspense fallback={null}>
        <AdminAccessPrompt />
      </Suspense>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-card/40" />}>
        <LoginForm />
      </Suspense>
    </>
  );
}
