import { Suspense } from "react";
import { AdminAccessPrompt } from "@/components/layout/AdminAccessPrompt";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <>
      <Suspense fallback={null}>
        <AdminAccessPrompt />
      </Suspense>
      <LoginForm />
    </>
  );
}
