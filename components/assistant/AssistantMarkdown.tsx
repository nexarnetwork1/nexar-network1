"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

type AssistantMarkdownProps = {
  content: string;
  className?: string;
  dir?: "ltr" | "rtl" | "auto";
};

function renderInline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)|`[^`]+`)/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const token = match[0];
    if (token.startsWith("**")) {
      parts.push(<strong key={match.index}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("`")) {
      parts.push(
        <code
          key={match.index}
          className="rounded bg-black/30 px-1 py-0.5 font-mono text-[0.85em] text-gold/90"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else {
      const linkMatch = token.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        const href = linkMatch[2];
        const internal = href.startsWith("/");
        parts.push(
          internal ? (
            <Link key={match.index} href={href} className="text-gold underline-offset-2 hover:underline">
              {linkMatch[1]}
            </Link>
          ) : (
            <a
              key={match.index}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold underline-offset-2 hover:underline"
            >
              {linkMatch[1]}
            </a>
          ),
        );
      }
    }
    last = match.index + token.length;
  }

  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

/** Lightweight markdown for assistant responses — no extra dependencies. */
export function AssistantMarkdown({ content, className, dir = "auto" }: AssistantMarkdownProps) {
  const lines = content.split("\n");
  const blocks: ReactNode[] = [];
  let listItems: string[] = [];
  let listOrdered = false;

  const flushList = () => {
    if (!listItems.length) return;
    const ListTag = listOrdered ? "ol" : "ul";
    blocks.push(
      <ListTag
        key={`list-${blocks.length}`}
        className={cn("my-2 space-y-1 pl-5", listOrdered ? "list-decimal" : "list-disc")}
      >
        {listItems.map((item, i) => (
          <li key={i} className="leading-relaxed">
            {renderInline(item)}
          </li>
        ))}
      </ListTag>,
    );
    listItems = [];
    listOrdered = false;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      continue;
    }

    if (/^#{1,3}\s+/.test(trimmed)) {
      flushList();
      const level = trimmed.match(/^#+/)?.[0].length ?? 2;
      const text = trimmed.replace(/^#{1,3}\s+/, "");
      const Tag = level <= 2 ? "h3" : "h4";
      blocks.push(
        <Tag key={`h-${blocks.length}`} className="mt-3 mb-1 font-semibold text-white first:mt-0">
          {renderInline(text)}
        </Tag>,
      );
      continue;
    }

    const ordered = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (ordered) {
      listOrdered = true;
      listItems.push(ordered[2]);
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      listItems.push(trimmed.replace(/^[-*]\s+/, ""));
      continue;
    }

    flushList();
    blocks.push(
      <p key={`p-${blocks.length}`} className="leading-relaxed">
        {renderInline(trimmed)}
      </p>,
    );
  }

  flushList();

  return (
    <div className={cn("space-y-1 text-sm", className)} dir={dir}>
      {blocks}
    </div>
  );
}
