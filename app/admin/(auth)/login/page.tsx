"use client";

import { Suspense } from "react";
import AdminLoginPanel from "./AdminLoginPanel";

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <AdminLoginPanel />
    </Suspense>
  );
}
