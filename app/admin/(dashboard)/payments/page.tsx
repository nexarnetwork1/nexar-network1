"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  DollarSign, 
  Search, 
  Filter, 
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  ExternalLink
} from "lucide-react";

interface Payment {
  id: string;
  invoice_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled' | 'refunded';
  payment_method: string;
  transaction_hash: string | null;
  created_at: string;
  confirmed_at: string | null;
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPayments();
  }, [statusFilter]);

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem('admin_session_token');
      if (!token) {
        setError('Admin authentication required');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/admin/payments', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payments');
      }

      const data = await response.json();
      if (data.success) {
        setPayments(data.payments);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'succeeded':
        return 'text-green-400';
      case 'pending':
      case 'processing':
        return 'text-yellow-400';
      case 'failed':
      case 'canceled':
        return 'text-red-400';
      case 'refunded':
        return 'text-purple-400';
      default:
        return 'text-muted';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'succeeded':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'pending':
      case 'processing':
        return <Clock className="h-4 w-4" />;
      case 'failed':
      case 'canceled':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const filteredPayments = payments.filter(payment => {
    if (statusFilter !== 'all' && payment.status !== statusFilter) {
      return false;
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        payment.id.toLowerCase().includes(query) ||
        payment.invoice_id.toLowerCase().includes(query) ||
        (payment.transaction_hash && payment.transaction_hash.toLowerCase().includes(query)) ||
        payment.amount.toString().includes(query)
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
              <p className="mt-4 text-sm text-zinc-400">Loading payments...</p>
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
              Payment Management
            </h1>
            <p className="mt-2 text-zinc-400">
              View and monitor all platform payments
            </p>
          </div>
          <button
            onClick={fetchPayments}
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
                placeholder="Search payments..."
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
            <option value="processing">Processing</option>
            <option value="succeeded">Succeeded</option>
            <option value="failed">Failed</option>
            <option value="canceled">Canceled</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        {/* Payments List */}
        <div className="rounded-2xl border border-white/10 bg-zinc-900 p-6">
          {filteredPayments.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Payments Found</h3>
              <p className="text-zinc-400">
                {searchQuery || statusFilter !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'No payments have been processed yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-400">Payment ID</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-400">Invoice ID</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-400">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-400">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-400">Method</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-400">Transaction Hash</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-400">Created</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-400">Confirmed</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="border-b border-white/10 hover:bg-zinc-800/50">
                      <td className="py-4 px-4 text-sm text-white font-mono">
                        {payment.id.substring(0, 8)}...
                      </td>
                      <td className="py-4 px-4 text-sm text-white font-mono">
                        {payment.invoice_id.substring(0, 8)}...
                      </td>
                      <td className="py-4 px-4 text-sm text-white">
                        {payment.amount.toFixed(2)} {payment.currency}
                      </td>
                      <td className="py-4 px-4 text-sm">
                        <span className={`flex items-center gap-2 ${getStatusColor(payment.status)}`}>
                          {getStatusIcon(payment.status)}
                          <span className="capitalize">{payment.status}</span>
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-zinc-400">
                        {payment.payment_method}
                      </td>
                      <td className="py-4 px-4 text-sm">
                        {payment.transaction_hash ? (
                          <a
                            href={`https://etherscan.io/tx/${payment.transaction_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-400 hover:text-blue-300"
                          >
                            {payment.transaction_hash.substring(0, 8)}...
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-zinc-400">N/A</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-sm text-zinc-400">
                        {new Date(payment.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4 text-sm text-zinc-400">
                        {payment.confirmed_at 
                          ? new Date(payment.confirmed_at).toLocaleDateString()
                          : 'N/A'}
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