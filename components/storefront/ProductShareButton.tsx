"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

type ProductShareButtonProps = {
  title: string;
  url: string;
};

export function ProductShareButton({ title, url }: ProductShareButtonProps) {
  const [message, setMessage] = useState<string | null>(null);

  async function handleShare() {
    setMessage(null);
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setMessage("Link copied");
    } catch {
      setMessage("Could not share");
    }
  }

  return (
    <div>
      <Button type="button" size="lg" variant="secondary" onClick={() => void handleShare()}>
        <Share2 className="h-4 w-4" aria-hidden />
        Share
      </Button>
      {message ? <p className="mt-2 text-xs text-muted">{message}</p> : null}
    </div>
  );
}
