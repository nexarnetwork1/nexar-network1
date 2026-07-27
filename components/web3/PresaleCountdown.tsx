"use client";

import { useEffect, useState } from "react";
import { formatCountdown } from "@/lib/web3/presale-math";

type PresaleCountdownProps = {
  seconds: number;
  label: string;
};

export function PresaleCountdown({ seconds, label }: PresaleCountdownProps) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
    const id = window.setInterval(() => {
      setRemaining((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [seconds]);

  return (
    <div className="mb-4 rounded-xl border border-gold/20 bg-gold/5 p-4 text-center" aria-live="polite">
      <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-2 font-mono text-2xl font-semibold text-gold">{formatCountdown(remaining)}</p>
    </div>
  );
}
