"use client";

import { useCommerceAuth } from "@/components/commerce/auth/NexarCommerceAuthProvider";
import { Building2 } from "lucide-react";

type AtlasGuestGateProps = {
  title: string;
  description: string;
  redirect: string;
};

export function AtlasGuestGate({ title, description, redirect }: AtlasGuestGateProps) {
  const { openCommerceAuth } = useCommerceAuth();

  return (
    <div className="max-w-lg mx-auto py-16 px-4 text-center">
      <div className="h-16 w-16 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-4">
        <Building2 className="h-8 w-8 text-gold" />
      </div>
      <h1 className="text-xl font-bold mb-2">{title}</h1>
      <p className="text-muted text-sm mb-6">{description}</p>
      <button
        type="button"
        onClick={() =>
          openCommerceAuth({
            mode: "signin",
            redirect,
            message: description,
          })
        }
        className="px-6 py-2.5 rounded-lg bg-gold text-background font-medium hover:bg-gold-secondary"
      >
        Sign In
      </button>
    </div>
  );
}
