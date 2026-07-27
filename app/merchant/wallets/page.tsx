"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { useRouter } from "next/navigation";
import { 
  Wallet, 
  Plus, 
  Trash2, 
  Star,
  CheckCircle2,
  X
} from "lucide-react";

interface Wallet {
  id: string;
  currency: string;
  address: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

export default function WalletsPage() {
  const router = useRouter();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCurrency, setNewCurrency] = useState('');
  const [newAddress, setNewAddress] = useState('');

  useEffect(() => {
    fetchWallets();
  }, []);

  const fetchWallets = async () => {
    try {
      const token = localStorage.getItem('session_token');
      if (!token) {
        router.push('/merchant');
        return;
      }

      const response = await fetch('/api/merchants/wallets', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch wallets');
      }

      const data = await response.json();
      if (data.success) {
        setWallets(data.wallets);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load wallets');
    } finally {
      setLoading(false);
    }
  };

  const handleAddWallet = async () => {
    if (!newCurrency || !newAddress.trim()) {
      setError('Currency and address are required');
      return;
    }

    try {
      const token = localStorage.getItem('session_token');
      const response = await fetch('/api/merchants/wallets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currency: newCurrency,
          address: newAddress.trim(),
          is_default: wallets.length === 0, // Make first wallet default
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add wallet');
      }

      const data = await response.json();
      if (data.success) {
        setShowAddModal(false);
        setNewCurrency('');
        setNewAddress('');
        await fetchWallets();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add wallet');
    }
  };

  const handleDeleteWallet = async (id: string) => {
    if (!confirm('Are you sure you want to delete this wallet?')) {
      return;
    }

    try {
      const token = localStorage.getItem('session_token');
      const response = await fetch(`/api/merchants/wallets/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete wallet');
      }

      await fetchWallets();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete wallet');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const token = localStorage.getItem('session_token');
      const response = await fetch(`/api/merchants/wallets/${id}/default`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to set default wallet');
      }

      await fetchWallets();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set default wallet');
    }
  };

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
  };

  const supportedCurrencies = ['NXR', 'BNB', 'USDT', 'USDC', 'BTC', 'ETH'];

  if (loading) {
    return (
      <Container>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
              <p className="mt-4 text-sm text-muted-foreground">Loading wallets...</p>
            </div>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-muted mb-8">
          <Link href="/" className="hover:text-gold">
            Home
          </Link>
          <span>/</span>
          <Link href="/merchant" className="hover:text-gold">
            Merchant
          </Link>
          <span>/</span>
          <span className="text-white">Wallets</span>
        </nav>

        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
              Wallet Management
            </h1>
            <p className="mt-3 text-lg text-muted">
              Manage your cryptocurrency wallet addresses for receiving payments
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-gold px-6 py-3 text-sm font-medium text-black transition-colors hover:bg-gold/90"
          >
            <Plus className="h-4 w-4" />
            Add Wallet
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg border border-red-500/50 bg-red-500/10 text-red-400">
            {error}
          </div>
        )}

        {/* Add Wallet Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="luxury-border rounded-2xl bg-card/40 p-8 backdrop-blur-xl max-w-md w-full">
              <h2 className="text-xl font-semibold text-white mb-6">Add Wallet</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-muted mb-2">Currency</label>
                  <select
                    value={newCurrency}
                    onChange={(e) => setNewCurrency(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background/50 text-white focus:border-gold focus:outline-none"
                  >
                    <option value="">Select currency</option>
                    {supportedCurrencies.map((currency) => (
                      <option key={currency} value={currency}>{currency}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-muted mb-2">Wallet Address</label>
                  <input
                    type="text"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background/50 text-white focus:border-gold focus:outline-none font-mono text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewCurrency('');
                    setNewAddress('');
                  }}
                  className="flex-1 px-6 py-3 rounded-lg border border-border text-white hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddWallet}
                  className="flex-1 px-6 py-3 rounded-lg bg-gold text-black hover:bg-gold/90"
                >
                  Add Wallet
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Wallets List */}
        <div className="luxury-border rounded-3xl bg-card/40 p-8 backdrop-blur-xl">
          {wallets.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="h-12 w-12 text-muted mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Wallets Yet</h3>
              <p className="text-muted mb-6">
                Add your first wallet address to start receiving payments
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-gold px-6 py-3 text-sm font-medium text-black transition-colors hover:bg-gold/90"
              >
                <Plus className="h-4 w-4" />
                Add Your First Wallet
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {wallets.map((wallet) => (
                <div key={wallet.id} className="flex items-center justify-between p-6 rounded-xl border border-border/50 bg-card/30">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-gold/20">
                      <Wallet className="h-6 w-6 text-gold" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white">{wallet.currency}</h3>
                        {wallet.is_default && (
                          <span className="px-2 py-0.5 rounded-full bg-gold/20 text-gold text-xs font-medium flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted font-mono">
                        {wallet.address.substring(0, 10)}...{wallet.address.substring(wallet.address.length - 8)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyAddress(wallet.address)}
                      className="p-2 rounded-lg hover:bg-white/10 text-muted hover:text-white transition-colors"
                      title="Copy address"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </button>
                    
                    {!wallet.is_default && (
                      <button
                        onClick={() => handleSetDefault(wallet.id)}
                        className="p-2 rounded-lg hover:bg-gold/20 text-muted hover:text-gold transition-colors"
                        title="Set as default"
                      >
                        <Star className="h-4 w-4" />
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteWallet(wallet.id)}
                      className="p-2 rounded-lg hover:bg-red-500/20 text-muted hover:text-red-400 transition-colors"
                      title="Delete wallet"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}