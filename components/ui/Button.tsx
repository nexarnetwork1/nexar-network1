"use client";

import {
  forwardRef,
  useRef,
  type ButtonHTMLAttributes,
  type MouseEvent,
} from "react";
import { cn } from "@/lib/utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";
type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  magnetic?: boolean;
  glow?: boolean;
};

/** Boutique rectangles — soft radius, not Web3 pills. */
const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-gold text-background border border-gold/50 shadow-[0_8px_28px_-12px_rgba(212,175,55,0.4)] hover:bg-gold-accent hover:shadow-[0_10px_32px_-12px_rgba(212,175,55,0.5)]",
  secondary:
    "bg-transparent text-gold border border-gold/45 hover:bg-gold hover:text-background",
  outline:
    "bg-transparent text-white border border-white/15 hover:border-gold/50 hover:text-gold-accent",
  ghost:
    "bg-transparent text-muted hover:text-white hover:bg-white/[0.04] border border-transparent",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-xs font-semibold tracking-[0.06em]",
  md: "h-11 px-6 text-sm font-semibold tracking-[0.04em]",
  lg: "h-12 px-8 text-sm font-semibold tracking-[0.06em]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      magnetic = false,
      glow = false,
      children,
      onMouseMove,
      onMouseLeave,
      ...props
    },
    ref,
  ) => {
    const innerRef = useRef<HTMLButtonElement>(null);

    const setRefs = (node: HTMLButtonElement | null) => {
      innerRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    };

    const handleMouseMove = (event: MouseEvent<HTMLButtonElement>) => {
      if (magnetic && innerRef.current) {
        const rect = innerRef.current.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;
        innerRef.current.style.transform = `translate(${x * 0.1}px, ${y * 0.14}px)`;
      }
      onMouseMove?.(event);
    };

    const handleMouseLeave = (event: MouseEvent<HTMLButtonElement>) => {
      if (magnetic && innerRef.current) {
        innerRef.current.style.transform = "translate(0px, 0px)";
      }
      onMouseLeave?.(event);
    };

    return (
      <button
        ref={setRefs}
        className={cn(
          "group relative inline-flex items-center justify-center overflow-hidden rounded-[0.625rem] transition-all duration-300 ease-out active:scale-[0.98]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:pointer-events-none disabled:opacity-50",
          variantStyles[variant],
          sizeStyles[size],
          glow && "shadow-[0_8px_28px_-12px_rgba(212,175,55,0.45)]",
          className,
        )}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        <span className="relative z-10 inline-flex items-center gap-2 uppercase">
          {children}
        </span>
      </button>
    );
  },
);

Button.displayName = "Button";
