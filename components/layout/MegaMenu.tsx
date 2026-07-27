"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { BUSINESS_HUB_MEGA_MENU } from "@/lib/constants/navigation";

interface MegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MegaMenu({ isOpen, onClose }: MegaMenuProps) {
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Handle mouse leave with delay
  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      onClose();
      setHoveredSection(null);
    }, 300); // 300ms delay before closing
  };

  // Clear timeout when mouse re-enters
  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  // Handle keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
        setHoveredSection(null);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="fixed inset-0 z-40"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="absolute left-0 right-0 top-0 border-b border-gold/20 bg-background/95 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {/* Business Section */}
            <div
              className="space-y-4"
              onMouseEnter={() => {
                handleMouseEnter();
                setHoveredSection('business');
              }}
              onMouseLeave={() => setHoveredSection(null)}
            >
              <h3 className="text-sm font-semibold text-gold uppercase tracking-wider">
                {BUSINESS_HUB_MEGA_MENU.business.title}
              </h3>
              <div className="space-y-3">
                {BUSINESS_HUB_MEGA_MENU.business.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    onClick={onClose}
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold transition-colors group-hover:bg-gold group-hover:text-black">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white group-hover:text-gold transition-colors">
                        {item.label}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Developers Section */}
            <div
              className="space-y-4"
              onMouseEnter={() => {
                handleMouseEnter();
                setHoveredSection('developers');
              }}
              onMouseLeave={() => setHoveredSection(null)}
            >
              <h3 className="text-sm font-semibold text-gold uppercase tracking-wider">
                {BUSINESS_HUB_MEGA_MENU.developers.title}
              </h3>
              <div className="space-y-3">
                {BUSINESS_HUB_MEGA_MENU.developers.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    onClick={onClose}
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold transition-colors group-hover:bg-gold group-hover:text-black">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white group-hover:text-gold transition-colors">
                        {item.label}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Resources Section */}
            <div
              className="space-y-4"
              onMouseEnter={() => {
                handleMouseEnter();
                setHoveredSection('resources');
              }}
              onMouseLeave={() => setHoveredSection(null)}
            >
              <h3 className="text-sm font-semibold text-gold uppercase tracking-wider">
                {BUSINESS_HUB_MEGA_MENU.resources.title}
              </h3>
              <div className="space-y-3">
                {BUSINESS_HUB_MEGA_MENU.resources.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    onClick={onClose}
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold transition-colors group-hover:bg-gold group-hover:text-black">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white group-hover:text-gold transition-colors">
                        {item.label}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Coming Soon Section */}
            <div
              className="space-y-4"
              onMouseEnter={() => {
                handleMouseEnter();
                setHoveredSection('comingSoon');
              }}
              onMouseLeave={() => setHoveredSection(null)}
            >
              <h3 className="text-sm font-semibold text-gold uppercase tracking-wider">
                {BUSINESS_HUB_MEGA_MENU.comingSoon.title}
              </h3>
              <div className="space-y-3">
                {BUSINESS_HUB_MEGA_MENU.comingSoon.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    onClick={onClose}
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold transition-colors group-hover:bg-gold group-hover:text-black">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white group-hover:text-gold transition-colors">
                        {item.label}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
