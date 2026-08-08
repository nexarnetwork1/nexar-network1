"use client";

import { ArrowUpRight, TrendingDown, TrendingUp } from "lucide-react";
import type { AssistantCard } from "@/modules/ai/types";
import { cn } from "@/lib/utils/cn";

type AssistantCardsProps = {
  cards: AssistantCard[];
  onNavigate: (href: string) => void;
};

export function AssistantCards({ cards, onNavigate }: AssistantCardsProps) {
  if (!cards.length) return null;

  return (
    <div className="mt-3 space-y-2">
      {cards.map((card, index) => {
        switch (card.type) {
          case "market":
            return (
              <div
                key={`market-${index}`}
                className="rounded-xl border border-gold/20 bg-gradient-to-br from-gold/5 to-transparent p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold tracking-[0.2em] text-gold uppercase">
                      {card.live ? "Live Market" : "Market"}
                    </p>
                    <p className="mt-1 font-heading text-2xl font-semibold text-white">
                      {card.symbol}
                    </p>
                    {card.priceUsd != null ? (
                      <p className="mt-1 text-lg text-white/90">
                        ${card.priceUsd.toFixed(card.priceUsd < 0.01 ? 6 : 4)}
                        <span className="ml-2 text-xs text-muted">USD</span>
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-muted">Live price unavailable</p>
                    )}
                  </div>
                  {card.change24h != null ? (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
                        card.change24h >= 0
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-red-500/10 text-red-400",
                      )}
                    >
                      {card.change24h >= 0 ? (
                        <TrendingUp className="h-3 w-3" aria-hidden />
                      ) : (
                        <TrendingDown className="h-3 w-3" aria-hidden />
                      )}
                      {card.change24h >= 0 ? "+" : ""}
                      {card.change24h.toFixed(2)}%
                    </span>
                  ) : null}
                </div>
                {card.amount != null && card.convertedValues?.length ? (
                  <div className="mt-3 space-y-1 border-t border-border/50 pt-3">
                    <p className="text-xs text-muted">
                      {card.amount} {card.symbol}
                    </p>
                    {card.convertedValues.map((row) => (
                      <p key={row.currency} className="text-sm text-white/90">
                        ≈ {row.value.toFixed(2)} {row.currency}
                      </p>
                    ))}
                  </div>
                ) : null}
                {card.href ? (
                  <button
                    type="button"
                    onClick={() => onNavigate(card.href!)}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-gold hover:text-gold-hover"
                  >
                    Open Market
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                  </button>
                ) : null}
              </div>
            );
          case "product":
            return (
              <div
                key={`product-${index}`}
                className="rounded-xl border border-border/70 bg-surface/40 p-4"
              >
                <p className="text-[10px] font-semibold tracking-[0.18em] text-gold uppercase">
                  Product
                </p>
                <p className="mt-1 font-medium text-white">{card.title}</p>
                {card.price ? <p className="mt-1 text-sm text-muted">{card.price}</p> : null}
                {card.merchant ? (
                  <p className="mt-1 text-xs text-muted">Merchant: {card.merchant}</p>
                ) : null}
                <button
                  type="button"
                  onClick={() => onNavigate(card.href)}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-gold hover:text-gold-hover"
                >
                  View Product
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>
            );
          case "document":
            return (
              <div
                key={`doc-${index}`}
                className="rounded-xl border border-border/70 bg-surface/40 p-4"
              >
                <p className="text-[10px] font-semibold tracking-[0.18em] text-gold uppercase">
                  Whitepaper
                </p>
                <p className="mt-1 font-medium text-white">{card.title}</p>
                <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted">
                  {card.excerpt}
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate(card.href)}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-gold hover:text-gold-hover"
                >
                  Open Whitepaper
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
