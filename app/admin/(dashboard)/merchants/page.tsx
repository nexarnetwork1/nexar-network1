"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Building2, 
  Search, 
  Filter, 
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  MoreVertical,
  RefreshCw
} from "lucide-react";

interface Merchant {
  id: string;
  business_name: string;
  business_type: string | null;
  status: 'pending' | 'active' | 'suspended' | 'rejected';
  is_verified: boolean;
  created_at: string;
}

export default function AdminMerchantsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchMerchants();
  }, [statusFilter]);

  const fetchMerchants = async () => {
    try {
      const token = localStorage.getItem('admin_session_token');
      if (!token) {
        setError('Admin authentication required');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/admin/merchants', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch merchants');
      }

      const data = await response.json();
      if (data.success) {
        setMerchants(data.merchants);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load merchants');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveMerchant = async (id: string) => {
    try {
      const token = localStorage.getItem('admin_session_token');
      const response = await fetch(`/api/admin/merchants/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'active',
          is_verified: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve merchant');
      }

      await fetchMerchants();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve merchant');
    }
  };

  const handleRejectMerchant = async (id: string) => {
    if (!confirm('Are you sure you want to reject this merchant?')) {
      return;
    }

    try {
      const token = localStorage.getItem('admin_session_token');
      const response = await fetch(`/api/admin/merchants/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'rejected',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject merchant');
      }

      await fetchMerchants();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject merchant');
    }
  };

  const handleSuspendMerchant = async (id: string) => {
    if (!confirm('Are you sure you want to suspend this merchant?')) {
      return;
    }

    try {
      const token = localStorage.getItem('admin_session_token');
      const response = await fetch(`/api/admin/merchants/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'suspended',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to suspend merchant');
      }

      await fetchMerchants();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to suspend merchant');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-400';
      case 'pending':
        return 'text-yellow-400';
      case 'suspended':
        return 'text-red-400';
      case 'rejected':
        return 'text-gray-400';
      default:
        return 'text-muted';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'suspended':
        return <XCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const filteredMerchants = merchants.filter(merchant => {
    if (statusFilter !== 'all' && merchant.status !== statusFilter) {
      return false;
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        merchant.business_name.toLowerCase().includes(query) ||
        (merchant.business_type && merchant.business_type.toLowerCase().includes(query))
      );
    }
    return true;
  });

  if (loading) {
    return (
      <main className="min-h-screen bg-[#09090b] text-white">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-yellow-400 border-t-transparent" />
              <p className="mt-4 text-sm text-zinc-400">Loading merchants...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#09090b] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-yellow-400">
              Merchant Management
            </h1>
            <p className="mt-2 text-zinc-400">
              Manage merchant accounts and approvals
            </p>
          </div>
          <button
            onClick={fetchMerchants}
            className="inline-flex items-center gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-4 py-2 text-sm font-medium text-yellow-400 transition hover:bg-yellow-500/20"
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

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search merchants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-white/10 bg-zinc-900 text-white focus:border-yellow-400 focus:outline-none"
              />
            </div>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-white/10 bg-zinc-900 text-white focus:border-yellow-400 focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Merchants List */}
        <div className="rounded-2xl border border-white/10 bg-zinc-900 p-6">
          {filteredMerchants.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Merchants Found</h3>
              <p className="text-zinc-400">
                {searchQuery || statusFilter !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'No merchants have registered yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-400">Business Name</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-400">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-400">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-400">Verified</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-400">Created</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMerchants.map((merchant) => (
                    <tr key={merchant.id} className="border-b border-white/10 hover:bg-zinc-800/50">
                      <td className="py-4 px-4 text-sm text-white">
                        {merchant.business_name}
                      </td>
                      <td className="py-4 px-4 text-sm text-zinc-400">
                        {merchant.business_type || 'N/A'}
                      </td>
                      <td className="py-4 px-4 text-sm">
                        <span className={`flex items-center gap-2 ${getStatusColor(merchant.status)}`}>
                          {getStatusIcon(merchant.status)}
                          <span className="capitalize">{merchant.status}</span>
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm">
                        {merchant.is_verified ? (
                          <span className="flex items-center gap-2 text-green-400">
                            <Shield className="h-4 w-4" />
                            Verified
                          </span>
                        ) : (
                          <span className="text-zinc-400">Not verified</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-sm text-zinc-400">
                        {new Date(merchant.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4 text-sm">
                        <div className="flex items-center gap-2">
                          {merchant.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApproveMerchant(merchant.id)}
                                className="p-2 rounded-lg hover:bg-green-500/20 text-zinc-400 hover:text-green-400 transition-colors"
                                title="Approve"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleRejectMerchant(merchant.id)}
                                className="p-2 rounded-lg hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
                                title="Reject"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          
                          {merchant.status === 'active' && (
                            <button
                              onClick={() => handleSuspendMerchant(merchant.id)}
                              className="p-2 rounded-lg hover:bg-yellow-500/20 text-zinc-400 hover:text-yellow-400 transition-colors"
                              title="Suspend"
                            >
                              <Shield className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}