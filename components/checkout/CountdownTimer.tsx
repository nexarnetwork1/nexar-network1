"use client";

import { useState, useEffect } from "react";
import { Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface CountdownTimerProps {
  expiresAt: Date;
  onExpire?: () => void;
}

export function CountdownTimer({ expiresAt, onExpire }: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const remaining = expiry - now;
      
      if (remaining <= 0) {
        setIsExpired(true);
        setTimeRemaining(0);
        onExpire?.();
      } else {
        setIsExpired(false);
        setTimeRemaining(remaining);
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    const totalDuration = 15 * 60 * 1000; // 15 minutes in milliseconds
    const remaining = Math.max(0, timeRemaining);
    return (remaining / totalDuration) * 100;
  };

  if (isExpired) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2">
        <AlertCircle className="h-4 w-4 text-red-400" />
        <span className="text-sm font-medium text-red-400">Session Expired</span>
      </div>
    );
  }

  const progressPercentage = getProgressPercentage();
  const isLowTime = progressPercentage < 20;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border px-4 py-2",
        isLowTime
          ? "border-red-500/30 bg-red-500/10"
          : "border-gold/30 bg-gold/10"
      )}
    >
      <Clock
        className={cn(
          "h-4 w-4",
          isLowTime ? "text-red-400 animate-pulse" : "text-gold"
        )}
      />
      <div className="flex-1">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-medium text-white">
            {formatTime(timeRemaining)} remaining
          </span>
          <span className="text-xs text-muted-foreground">
            {Math.ceil(timeRemaining / 1000 / 60)} min
          </span>
        </div>
        <div className="mt-1 h-1 w-full rounded-full bg-black/30">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-1000",
              isLowTime ? "bg-red-500" : "bg-gold"
            )}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
