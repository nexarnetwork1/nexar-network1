"use client";

import { useState, useTransition } from "react";
import { Loader2, UserPlus, UserMinus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import { followProfileAction, unfollowProfileAction } from "@/modules/atlas-network/actions";

type FollowButtonProps = {
  targetId: string;
  targetType?: "profile" | "business";
  initialFollowing?: boolean;
  session: boolean;
  onAuth: () => void;
  size?: "sm" | "md";
  className?: string;
};

export function FollowButton({
  targetId,
  targetType = "profile",
  initialFollowing = false,
  session,
  onAuth,
  size = "md",
  className,
}: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, startTransition] = useTransition();

  const handleClick = () => {
    if (!session) return onAuth();
    startTransition(async () => {
      try {
        if (following) {
          await unfollowProfileAction({ targetType, targetId });
          setFollowing(false);
          toast.success("Unfollowed");
        } else {
          await followProfileAction({ targetType, targetId });
          setFollowing(true);
          toast.success("Following");
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Action failed");
      }
    });
  };

  return (
    <button
      type="button"
      disabled={pending}
      onClick={handleClick}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-60",
        size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm",
        following
          ? "border border-white/20 bg-white/5 hover:bg-white/10"
          : "bg-gold text-background hover:bg-gold-secondary",
        className,
      )}
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : following ? (
        <UserMinus className="h-4 w-4" />
      ) : (
        <UserPlus className="h-4 w-4" />
      )}
      {following ? "Following" : "Follow"}
    </button>
  );
}
