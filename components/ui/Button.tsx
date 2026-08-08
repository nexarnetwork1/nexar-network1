"use client";

import {
  forwardRef,
  useRef,
  type ButtonHTMLAttributes,
  type MouseEvent,
} from "react";
import { cn } from "@/lib/utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "danger" | "success";
type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  magnetic?: boolean;
  glow?: boolean;
};

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "nxr-btn-primary hover:bg-gold-hover border border-gold/35 text-on-gold shadow-[0_1px_0_rgba(255,255,255,0.08)_inset]",
  secondary:
    "nxr-btn-secondary hover:bg-card-hover hover:border-border-default",
  outline:
    "bg-transparent text-foreground border border-border hover:border-gold/30 hover:text-gold",
  ghost:
    "bg-transparent text-muted hover:text-foreground hover:bg-white/[0.04] border border-transparent",
  danger:
    "bg-danger text-white border border-danger/40 hover:bg-danger/90",
  success:
    "bg-success text-white border border-success/40 hover:brightness-110",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-xs font-medium",
  md: "h-11 px-5 text-sm font-medium",
  lg: "h-12 px-6 text-sm font-medium",
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
          "group relative inline-flex items-center justify-center overflow-hidden rounded-[var(--nxr-radius-button)] transition-all duration-150 ease-out active:scale-[0.98]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 focus-visible:ring-offset-2 focus-visible:ring-offset-chrome",
          "disabled:pointer-events-none disabled:opacity-50",
          variantStyles[variant],
          sizeStyles[size],
          glow && variant === "primary" && "hover:shadow-[0_0_28px_-6px_rgba(212,175,55,0.45)]",
          className,
        )}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
      </button>
    );
  },
);

Button.displayName = "Button";
