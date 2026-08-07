import type { ReactNode } from "react";

/** Render hashtags and mentions with lightweight styling. */
export function renderRichText(text: string): ReactNode[] {
  const parts = text.split(/(#\w+|@[\w.-]+)/g);
  return parts.map((part, i) => {
    if (part.startsWith("#")) {
      return (
        <span key={i} className="text-gold hover:underline cursor-pointer">
          {part}
        </span>
      );
    }
    if (part.startsWith("@")) {
      return (
        <span key={i} className="text-blue-400 hover:underline cursor-pointer">
          {part}
        </span>
      );
    }
    return part;
  });
}
