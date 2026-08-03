"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Cookie, Settings } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

type CookiePreferences = {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
};

const STORAGE_KEY = "nexar-cookie-consent";

export function CookieConsent() {
  const [show, setShow] = useState(() => {
    if (typeof window === "undefined") return false;
    const consent = localStorage.getItem(STORAGE_KEY);
    return !consent;
  });
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  const handleAccept = () => {
    const newPreferences = { necessary: true, analytics: true, marketing: true };
    setPreferences(newPreferences);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ accepted: true, preferences: newPreferences }));
    setShow(false);
  };

  const handleReject = () => {
    const newPreferences = { necessary: true, analytics: false, marketing: false };
    setPreferences(newPreferences);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ accepted: false, preferences: newPreferences }));
    setShow(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ accepted: true, preferences }));
    setShow(false);
    setShowPreferences(false);
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface/95 backdrop-blur-xl"
      >
        <div className="container mx-auto px-4 py-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
            {/* Content */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Cookie className="h-5 w-5 text-gold" />
                <h3 className="font-heading text-base font-semibold">Cookie Preferences</h3>
              </div>
              <p className="text-sm text-muted leading-relaxed max-w-2xl">
                We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.
                <Link href="/privacy" className="text-gold hover:text-gold-secondary underline ml-1">
                  Learn more
                </Link>
              </p>
            </div>

            {/* Actions */}
            {!showPreferences ? (
              <div className="flex flex-wrap items-center gap-3 lg:flex-shrink-0">
                <button
                  type="button"
                  onClick={handleReject}
                  className="rounded-full border border-border px-4 py-2 text-sm text-muted transition-colors hover:border-gold/30 hover:text-white"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreferences(true)}
                  className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-muted transition-colors hover:border-gold/30 hover:text-white"
                >
                  <Settings className="h-4 w-4" />
                  Preferences
                </button>
                <button
                  type="button"
                  onClick={handleAccept}
                  className="rounded-[0.625rem] bg-gold px-6 py-2 text-sm font-semibold uppercase tracking-wide text-background transition-colors hover:bg-gold-accent"
                >
                  Accept All
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4 lg:flex-shrink-0 lg:w-80">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Necessary</span>
                    <span className="text-xs text-gold">Required</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Analytics</span>
                    <button
                      type="button"
                      onClick={() => setPreferences({ ...preferences, analytics: !preferences.analytics })}
                      className={cn(
                        "relative h-5 w-9 rounded-full transition-colors",
                        preferences.analytics ? "bg-gold" : "bg-border"
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform",
                          preferences.analytics ? "translate-x-4" : "translate-x-0.5"
                        )}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Marketing</span>
                    <button
                      type="button"
                      onClick={() => setPreferences({ ...preferences, marketing: !preferences.marketing })}
                      className={cn(
                        "relative h-5 w-9 rounded-full transition-colors",
                        preferences.marketing ? "bg-gold" : "bg-border"
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform",
                          preferences.marketing ? "translate-x-4" : "translate-x-0.5"
                        )}
                      />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPreferences(false)}
                    className="rounded-full border border-border px-4 py-2 text-sm text-muted transition-colors hover:border-gold/30 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSavePreferences}
                    className="rounded-[0.625rem] bg-gold px-4 py-2 text-sm font-semibold uppercase tracking-wide text-background transition-colors hover:bg-gold-accent"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}

            {/* Close button */}
            <button
              type="button"
              onClick={() => setShow(false)}
              className="absolute right-4 top-4 lg:static lg:self-start text-muted hover:text-white transition-colors"
              aria-label="Close cookie consent"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
