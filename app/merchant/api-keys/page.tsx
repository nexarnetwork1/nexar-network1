"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { useRouter } from "next/navigation";
import { 
  Key, 
  Plus, 
  Copy, 
  Trash2, 
  RefreshCw,
  Shield,
  Check,
  X
} from "lucide-react";

interface ApiKey {
  id: string;
  key_name: string;
  key_prefix: string;
  key?: string;
  permissions: string[];
  is_active: boolean;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export default function ApiKeysPage() {
  const router = useRouter();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyPermissions, setNewKeyPermissions] = useState<string[]>(['read', 'write']);
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const token = localStorage.getItem('session_token');
      if (!token) {
        router.push('/merchant');
        return;
      }

      const response = await fetch('/api/merchants/api-keys', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch API keys');
      }

      const data = await response.json();
      if (data.success) {
        setApiKeys(data.api_keys);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      setError('Key name is required');
      return;
    }

    try {
      const token = localStorage.getItem('session_token');
      const response = await fetch('/api/merchants/api-keys', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key_name: newKeyName,
          permissions: newKeyPermissions,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create API key');
      }

      const data = await response.json();
      if (data.success) {
        setCreatedKey(data.api_key.key);
        setShowCreateModal(false);
        setNewKeyName('');
        setNewKeyPermissions(['read', 'write']);
        await fetchApiKeys();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create API key');
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) {
      return;
    }

    try {
      const token = localStorage.getItem('session_token');
      const response = await fetch(`/api/merchants/api-keys/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete API key');
      }

      await fetchApiKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete API key');
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
  };

  const togglePermission = (perm: string) => {
    if (newKeyPermissions.includes(perm)) {
      setNewKeyPermissions(newKeyPermissions.filter(p => p !== perm));
    } else {
      setNewKeyPermissions([...newKeyPermissions, perm]);
    }
  };

  if (loading) {
    return (
      <Container>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
              <p className="mt-4 text-sm text-muted-foreground">Loading API keys...</p>
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
          <span className="text-white">API Keys</span>
        </nav>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl mb-2">
            API Keys
          </h1>
          <p className="mt-3 text-lg text-muted">
            Generate API keys to integrate with the Nexar Network API. Keys are automatically generated and secure.
          </p>
          <div className="mt-4 p-4 rounded-lg border border-gold/30 bg-gold/10">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-gold mt-0.5" />
              <div className="text-sm">
                <p className="text-white font-medium mb-1">Automatic Key Generation</p>
                <p className="text-muted-foreground">
                  API keys are automatically generated by our secure system. You only need to provide a name and permissions.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-gold px-6 py-3 text-sm font-medium text-black transition-colors hover:bg-gold/90"
          >
            <Plus className="h-4 w-4" />
            Generate API Key
          </button>
          <button
            onClick={fetchApiKeys}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-3 text-sm text-muted hover:border-gold/30 hover:text-gold transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg border border-red-500/50 bg-red-500/10 text-red-400">
            {error}
          </div>
        )}

        {/* Created Key Modal */}
        {createdKey && (
          <div className="mb-6 p-6 rounded-xl border border-gold/50 bg-gold/10">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-gold text-black">
                <Check className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">API Key Created Successfully</h3>
                <p className="text-sm text-muted mb-4">
                  Copy this key now. You won't be able to see it again.
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-black/50 px-4 py-2 rounded text-sm text-gold font-mono">
                    {createdKey}
                  </code>
                  <button
                    onClick={() => handleCopyKey(createdKey)}
                    className="p-2 rounded-lg bg-gold/20 hover:bg-gold/30 text-gold"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <button
                onClick={() => setCreatedKey(null)}
                className="p-2 hover:bg-white/10 rounded-lg text-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="luxury-border rounded-2xl bg-card/40 p-8 backdrop-blur-xl max-w-md w-full">
              <h2 className="text-xl font-semibold text-white mb-6">Create API Key</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-muted mb-2">Key Name</label>
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g., Production Key"
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background/50 text-white focus:border-gold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-muted mb-2">Permissions</label>
                  <div className="space-y-2">
                    {['read', 'write', 'admin'].map((perm) => (
                      <label key={perm} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newKeyPermissions.includes(perm)}
                          onChange={() => togglePermission(perm)}
                          className="w-4 h-4 rounded border-border bg-background/50 text-gold focus:ring-gold"
                        />
                        <span className="text-white capitalize">{perm}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewKeyName('');
                    setNewKeyPermissions(['read', 'write']);
                  }}
                  className="flex-1 px-6 py-3 rounded-lg border border-border text-white hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateKey}
                  className="flex-1 px-6 py-3 rounded-lg bg-gold text-black hover:bg-gold/90"
                >
                  Generate Key
                </button>
              </div>
            </div>
          </div>
        )}

        {/* API Keys List */}
        <div className="luxury-border rounded-3xl bg-card/40 p-8 backdrop-blur-xl">
          {apiKeys.length === 0 ? (
            <div className="text-center py-12">
              <Key className="h-12 w-12 text-muted mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No API Keys Yet</h3>
              <p className="text-muted mb-6">
                Create your first API key to start integrating with your applications
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-gold px-6 py-3 text-sm font-medium text-black transition-colors hover:bg-gold/90"
              >
                <Plus className="h-4 w-4" />
                Create Your First API Key
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((apiKey) => (
                <div key={apiKey.id} className="flex items-center justify-between p-6 rounded-xl border border-border/50 bg-card/30">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-gold/20">
                      <Key className="h-6 w-6 text-gold" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{apiKey.key_name}</h3>
                      <p className="text-sm text-muted">
                        {apiKey.key_prefix}*** | Created {new Date(apiKey.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted" />
                      <span className="text-sm text-muted">
                        {apiKey.permissions.join(', ')}
                      </span>
                    </div>
                    
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      apiKey.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {apiKey.is_active ? 'Active' : 'Inactive'}
                    </div>

                    <button
                      onClick={() => handleDeleteKey(apiKey.id)}
                      className="p-2 rounded-lg hover:bg-red-500/20 text-muted hover:text-red-400 transition-colors"
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