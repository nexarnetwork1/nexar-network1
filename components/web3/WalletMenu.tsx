"use client";

import { useState } from "react";
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { toast } from "sonner";
import {
  CheckCircle2,
  ChevronDown,
  Copy,
  ExternalLink,
  LogOut,
  Wallet,
  Circle,
} from "lucide-react";

export function WalletMenu() {

const { user, logout, connectWallet } = usePrivy();
const { wallets } = useWallets();

const [menuOpen, setMenuOpen] = useState(false);

  const address = user?.wallet?.address ?? "";

  const walletName =
    user?.wallet?.walletClientType === "metamask"
      ? "MetaMask"
      : user?.wallet?.walletClientType === "coinbase_wallet"
      ? "Coinbase Wallet"
      : user?.wallet?.walletClientType === "trust_wallet"
      ? "Trust Wallet"
      : "Wallet";

  const shortAddress =
    address.length > 10
      ? `${address.slice(0, 6)}...${address.slice(-4)}`
      : address;

  async function copyAddress() {
    if (!address) return;


await navigator.clipboard.writeText(address);

toast.success("Wallet address copied");
  }

  async function disconnectWallet() {
    await logout();
  }

  return (
    <Menu as="div" className="relative">
      <MenuButton
        className="
          inline-flex items-center gap-2
          rounded-full
          border border-gold/30
          bg-gradient-to-r from-[#121212] to-[#1a1a1a]
          px-5 py-2.5
          text-sm font-semibold text-white
          shadow-[0_0_25px_rgba(212,175,55,0.12)]
          transition-all duration-300
          hover:border-gold
          hover:shadow-[0_0_35px_rgba(212,175,55,0.22)]
        "
      >
        <Circle
  className="h-2.5 w-2.5 fill-emerald-500 text-emerald-500"
/>

<span>{shortAddress}</span>

<ChevronDown
  size={16}
  className="transition-transform ui-open:rotate-180"
/>
      </MenuButton>

      <MenuItems 
       transition
        anchor="bottom end"
        className="
          absolute right-0 mt-3 w-80
          origin-top-right
          rounded-3xl
          border border-gold/20
          bg-[#0B0B0B]/95
          backdrop-blur-2xl
          p-2
          shadow-[0_0_40px_rgba(212,175,55,0.12)]
          focus:outline-none
          z-50
          overflow-hidden
        "
      >
        <div className="border-b border-white/10 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gold/15 border border-gold/30">
              <Wallet className="h-5 w-5 text-gold" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-white">{walletName}</p>

                <CheckCircle2 className="h-4 w-4 text-green-400" />
              </div>

              <p className="mt-1 text-xs text-gray-400">
                Connected
              </p>

              <p className="mt-2 break-all text-xs text-gray-300">
                {address}
              </p>
            </div>
          </div>
        </div>

        <MenuItem>
          <button
            onClick={copyAddress}
            className="
              flex w-full items-center gap-3
              rounded-2xl
              px-4 py-3
              text-sm text-white
              transition-all duration-200
              hover:bg-gold/10
              hover:text-gold
              active:scale-[0.98]
            "
          >
            <Copy size={18} />
            Copy Address
          </button>
        </MenuItem>

        <MenuItem>
          <a
            href={`https://bscscan.com/address/${address}`}
            target="_blank"
            rel="noreferrer"
           className="
  flex w-full items-center gap-3
  rounded-2xl
  px-4 py-3
  text-sm text-white
  transition-all duration-300
  hover:bg-gold/10
  hover:text-gold
  active:scale-[0.98]
"
          >
            <ExternalLink size={18} />
            View on BscScan
          </a>
        </MenuItem>

        <MenuItem>
          <button
            onClick={disconnectWallet}
            className="
              flex w-full items-center gap-3
              rounded-2xl
              px-4 py-3
              text-sm
              text-red-400
              transition-all duration-200
              hover:bg-red-500/10
              hover:text-red-300
              active:scale-[0.98]
            "
          >
            <LogOut size={18} />
            Disconnect
          </button>
        </MenuItem>
      </MenuItems>
    </Menu>
  );
}
