"use client";

import { useState, useEffect } from "react";
import { Wallet, ChevronDown, AlertCircle } from "lucide-react";

interface Wallet {
  id: string;
  name: string;
  icon: string;
  detected: boolean;
}

interface Chain {
  id: number;
  name: string;
  symbol: string;
}

const SUPPORTED_WALLETS: Wallet[] = [
  { id: "metamask", name: "MetaMask", icon: "🦊", detected: false },
  { id: "rabby", name: "Rabby", icon: "🐰", detected: false },
  { id: "walletconnect", name: "WalletConnect", icon: "🔗", detected: false },
  { id: "coinbase", name: "Coinbase Wallet", icon: "🔵", detected: false },
];

const SUPPORTED_CHAINS: Chain[] = [
  { id: 56, name: "BSC", symbol: "BNB" },
  { id: 1, name: "Ethereum", symbol: "ETH" },
  { id: 137, name: "Polygon", symbol: "MATIC" },
];

export function ImprovedWalletConnect() {
  const [isOpen, setIsOpen] = useState(false);
  const [wallets, setWallets] = useState<Wallet[]>(SUPPORTED_WALLETS);
  const [currentChain, setCurrentChain] = useState<Chain | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    detectWallets();
    detectChain();
  }, []);

  const detectWallets = () => {
    // Detect MetaMask
    const hasMetaMask = typeof window !== "undefined" && 
      (window as any).ethereum?.isMetaMask;
    
    // Detect Rabby
    const hasRabby = typeof window !== "undefined" && 
      (window as any).rabbitmq;
    
    // Detect WalletConnect (via provider)
    const hasWalletConnect = typeof window !== "undefined" && 
      (window as any).walletlink;
    
    // Detect Coinbase Wallet
    const hasCoinbase = typeof window !== "undefined" && 
      (window as any).coinbaseWalletExtension;

    setWallets([
      { id: "metamask", name: "MetaMask", icon: "🦊", detected: hasMetaMask },
      { id: "rabby", name: "Rabby", icon: "🐰", detected: hasRabby },
      { id: "walletconnect", name: "WalletConnect", icon: "🔗", detected: hasWalletConnect },
      { id: "coinbase", name: "Coinbase Wallet", icon: "🔵", detected: hasCoinbase },
    ]);
  };

  const detectChain = async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) return;

    try {
      const chainId = await (window as any).ethereum.request({ method: "eth_chainId" });
      const chainIdNumber = parseInt(chainId, 16);
      const chain = SUPPORTED_CHAINS.find(c => c.id === chainIdNumber);
      setCurrentChain(chain || null);
    } catch (err) {
      console.error("Failed to detect chain:", err);
    }
  };

  const switchChain = async (chainId: number) => {
    try {
      await (window as any).ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
      setCurrentChain(SUPPORTED_CHAINS.find(c => c.id === chainId) || null);
    } catch (err: any) {
      if (err.code === 4902) {
        // Chain not added, try to add it
        await addChain(chainId);
      } else {
        setError("Failed to switch network");
      }
    }
  };

  const addChain = async (chainId: number) => {
    const chain = SUPPORTED_CHAINS.find(c => c.id === chainId);
    if (!chain) return;

    try {
      await (window as any).ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: `0x${chainId.toString(16)}`,
          chainName: chain.name,
          nativeCurrency: {
            name: chain.name,
            symbol: chain.symbol,
            decimals: 18,
          },
          rpcUrls: ["https://bsc-dataseed.binance.org"],
          blockExplorerUrls: ["https://bscscan.com"],
        }],
      });
      setCurrentChain(chain);
    } catch (err) {
      setError("Failed to add network");
    }
  };

  const connectWallet = async (walletId: string) => {
    setIsConnecting(true);
    setError(null);

    try {
      if (walletId === "metamask" || walletId === "rabby" || walletId === "coinbase") {
        await (window as any).ethereum.request({
          method: "eth_requestAccounts",
        });
      } else if (walletId === "walletconnect") {
        // WalletConnect integration would go here
      }
      setIsOpen(false);
    } catch (err: any) {
      setError(err.message || "Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  };

  const detectedWallets = wallets.filter(w => w.detected);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
      >
        <Wallet className="h-5 w-5 text-gold" />
        <span className="text-sm">
          {currentChain ? currentChain.symbol : "Connect Wallet"}
        </span>
        <ChevronDown className="h-4 w-4 text-muted" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-surface-2 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
          {/* Chain Selection */}
          <div className="p-4 border-b border-white/10">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
              Network
            </p>
            <div className="space-y-2">
              {SUPPORTED_CHAINS.map((chain) => (
                <button
                  key={chain.id}
                  onClick={() => switchChain(chain.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                    currentChain?.id === chain.id
                      ? "bg-gold/10 border border-gold/30 text-gold"
                      : "hover:bg-white/5 text-muted"
                  }`}
                >
                  <span className="text-sm">{chain.name}</span>
                  {currentChain?.id === chain.id && (
                    <span className="text-xs bg-gold/20 px-2 py-0.5 rounded-full">
                      Connected
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Wallet Selection */}
          <div className="p-4">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
              Connect Wallet
            </p>
            <div className="space-y-2">
              {detectedWallets.length > 0 ? (
                detectedWallets.map((wallet) => (
                  <button
                    key={wallet.id}
                    onClick={() => connectWallet(wallet.id)}
                    disabled={isConnecting}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-gold/30 transition-colors disabled:opacity-50"
                  >
                    <span className="text-xl">{wallet.icon}</span>
                    <span className="text-sm font-medium">{wallet.name}</span>
                  </button>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted mb-2">No wallets detected</p>
                  <p className="text-xs text-muted">
                    Install MetaMask, Rabby, or Coinbase Wallet
                  </p>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="p-4 border-t border-white/10 bg-red-500/10">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-xs text-red-400">{error}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
