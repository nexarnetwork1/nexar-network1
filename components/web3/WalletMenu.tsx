"use client";

import { Menu, MenuButton, MenuItems } from "@headlessui/react";
import { ChevronDown, Circle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { WalletMenuPanel } from "./WalletMenuPanel";
import type { WalletPanelState } from "./useWalletPanel";

type WalletMenuProps = {
  panel: WalletPanelState;
  className?: string;
};

export function WalletMenu({ panel, className }: WalletMenuProps) {
  const { address, shortAddress } = panel;

  if (!address) return null;

  return (
    <Menu as="div" className={cn("relative", className)}>
      <MenuButton
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-gold/30",
          "bg-gradient-to-r from-surface-1/90 to-surface-2/90 px-5 py-2.5",
          "text-sm font-semibold text-white shadow-[0_0_25px_rgba(212,175,55,0.12)]",
          "backdrop-blur-xl transition-all duration-300 hover:border-gold",
          "hover:shadow-[0_0_35px_rgba(212,175,55,0.22)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        )}
      >
        <Circle className="h-2.5 w-2.5 fill-success text-success" aria-hidden />
        <span>{shortAddress}</span>
        <ChevronDown size={16} className="transition-transform ui-open:rotate-180" aria-hidden />
      </MenuButton>

      <MenuItems
        transition
        anchor="bottom end"
        className={cn(
          "absolute right-0 z-50 mt-3 w-[22rem] origin-top-right overflow-hidden rounded-3xl",
          "border border-gold/20 bg-chrome/80 p-0 shadow-[0_0_40px_rgba(212,175,55,0.15)]",
          "backdrop-blur-2xl focus:outline-none",
          "transition duration-200 ease-out data-[closed]:scale-95 data-[closed]:opacity-0",
          "data-[open]:scale-100 data-[open]:opacity-100",
        )}
      >
        <WalletMenuPanel panel={panel} />
      </MenuItems>
    </Menu>
  );
}
