"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  FileText, 
  Search, 
  Filter, 
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Eye
} from "lucide-react";

interface Invoice {
  id: string;
  invoice_number: string;
  description: string | null;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'expired' | 'cancelled' | 'refunded';
  merchant_id: string;
  created_at: string;
  expires_at: string;
}

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  const fetchInvoices = async () => {
    try {
      const token = localStorage.getItem('admin_session_token');
      if (!token) {
        setError('Admin authentication required');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/admin/invoices', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch invoices');
      }

      const data = await response.json();
      if (data.success) {
        setInvoices(data.invoices);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-400';
      case 'pending':
        return 'text-yellow-400';
      case 'expired':
        return 'text-red-400';
      case 'cancelled':
        return 'text-gray-400';
      case 'refunded':
        return 'text-purple-400';
      default:
        return 'text-muted';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'expired':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    if (statusFilter !== 'all' && invoice.status !== statusFilter) {
      return false;
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        invoice.invoice_number.toLowerCase().includes(query) ||
        (invoice.description && invoice.description.toLowerCase().includes(query)) ||
        invoice.amount.toString().includes(query)
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
              <p className="mt-4 text-sm text-zinc-400">Loading invoices...</p>
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
              Invoice Management
            </h1>
            <p className="mt-2 text-zinc-400">
              View and manage all platform invoices
            </p>
          </div>
          <button
            onClick={fetchInvoices}
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
                placeholder="Search invoices..."
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
            <option value="paid">Paid</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        {/* Invoices List */}
        <div className="rounded-2xl border border-white/10 bg-zinc-900 p-6">
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Invoices Found</h3>
              <p className="text-zinc-400">
                {searchQuery || statusFilter !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'No invoices have been created yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-400">Invoice #</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-400">Description</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-400">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-400">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-400">Merchant ID</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-400">Created</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-400">Expires</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-white/10 hover:bg-zinc-800/50">
                      <td className="py-4 px-4 text-sm text-white font-mono">
                        {invoice.invoice_number}
                      </td>
                      <td className="py-4 px-4 text-sm text-white">
                        {invoice.description || 'N/A'}
                      </td>
                      <td className="py-4 px-4 text-sm text-white">
                        {invoice.amount.toFixed(2)} {invoice.currency}
                      </td>
                      <td className="py-4 px-4 text-sm">
                        <span className={`flex items-center gap-2 ${getStatusColor(invoice.status)}`}>
                          {getStatusIcon(invoice.status)}
                          <span className="capitalize">{invoice.status}</span>
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-zinc-400 font-mono">
                        {invoice.merchant_id.substring(0, 8)}...
                      </td>
                      <td className="py-4 px-4 text-sm text-zinc-400">
                        {new Date(invoice.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4 text-sm text-zinc-400">
                        {new Date(invoice.expires_at).toLocaleDateString()}
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