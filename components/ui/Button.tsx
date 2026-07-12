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
};

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-gold text-background border border-gold/30 hover:bg-gold-secondary hover:text-background",
  secondary:
    "bg-surface/80 text-white border border-border backdrop-blur-md hover:border-gold/30 hover:bg-card",
  outline:
    "bg-transparent text-white border border-border hover:border-gold/40 hover:bg-gold/5",
  ghost:
    "bg-transparent text-muted hover:text-white hover:bg-white/5 border border-transparent",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-xs",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-7 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      magnetic = false,
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
        innerRef.current.style.transform = `translate(${x * 0.12}px, ${y * 0.18}px)`;
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
          "group relative inline-flex items-center justify-center overflow-hidden rounded-full font-medium tracking-wide transition-all duration-300 ease-out active:scale-[0.98]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:pointer-events-none disabled:opacity-50",
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          <span className="absolute inset-0 translate-y-full bg-white/10 transition-transform duration-500 group-hover:translate-y-0" />
        </span>
        <span className="relative z-10 inline-flex items-center gap-2">
          {children}
        </span>
      </button>
    );
  },
);

Button.displayName = "Button";
