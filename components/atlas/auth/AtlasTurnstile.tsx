"use client";

import { useEffect, useRef, useState } from "react";
import type {} from "@marsidev/react-turnstile";

type AtlasTurnstileProps = {
  onToken: (token: string | null) => void;
  className?: string;
};

const SCRIPT_ID = "cf-turnstile-script";
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export function AtlasTurnstile({ onToken, className }: AtlasTurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [ready, setReady] = useState(false);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey) {
      onToken(null);
      return;
    }

    function loadScript() {
      if (document.getElementById(SCRIPT_ID)) {
        setReady(true);
        return;
      }
      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => setReady(true);
      document.head.appendChild(script);
    }

    loadScript();
  }, [siteKey, onToken]);

  useEffect(() => {
    if (!siteKey || !ready || !containerRef.current || !window.turnstile) return;

    const widgetId = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      theme: "dark",
      callback: (token) => onToken(token),
      "expired-callback": () => onToken(null),
      "error-callback": () => onToken(null),
    });
    widgetIdRef.current = widgetId ?? null;

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [ready, siteKey, onToken]);

  if (!siteKey) {
    return null;
  }

  return <div ref={containerRef} className={className} aria-label="Human verification" />;
}
