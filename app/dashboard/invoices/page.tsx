"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Copy, 
  Eye,
  Trash2,
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  DollarSign,
  Calendar,
  MoreVertical
} from "lucide-react";

interface Invoice {
  id: string;
  invoice_number: string;
  description: string | null;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'expired' | 'cancelled' | 'refunded';
  payment_url: string | null;
  qr_code_url: string | null;
  expires_at: string;
  created_at: string;
}

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Create invoice form state
  const [formData, setFormData] = useState({
    customer_email: '',
    description: '',
    amount: '',
    currency: 'USD',
    expires_in: '30',
  });

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  const fetchInvoices = async () => {
    try {
      const token = localStorage.getItem('session_token');
      if (!token) {
        router.push('/business');
        return;
      }

      const url = statusFilter === 'all' 
        ? '/api/invoices' 
        : `/api/invoices?status=${statusFilter}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/business');
          return;
        }
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

  const handleCreateInvoice = async () => {
    if (!formData.amount || !formData.description) {
      setError('Amount and description are required');
      return;
    }

    try {
      const token = localStorage.getItem('session_token');
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_email: formData.customer_email || undefined,
          description: formData.description,
          amount: parseFloat(formData.amount),
          currency: formData.currency,
          expires_in: formData.expires_in,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create invoice');
      }

      const data = await response.json();
      if (data.success) {
        setShowCreateModal(false);
        setFormData({
          customer_email: '',
          description: '',
          amount: '',
          currency: 'USD',
          expires_in: '30',
        });
        await fetchInvoices();
        
        // Redirect to invoice details if it has a payment URL
        if (data.invoice && data.invoice.payment_url) {
          window.open(data.invoice.payment_url, '_blank');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invoice');
    }
  };

  const handleViewInvoice = async (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowViewModal(true);
  };

  const handleCancelInvoice = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this invoice?')) {
      return;
    }

    try {
      const token = localStorage.getItem('session_token');
      const response = await fetch(`/api/invoices/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'cancelled',
          reason: 'Cancelled by merchant',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel invoice');
      }

      await fetchInvoices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel invoice');
    }
  };

  const handleCopyPaymentLink = (url: string) => {
    navigator.clipboard.writeText(url);
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
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
            <p className="mt-4 text-sm text-muted-foreground">Loading invoices...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
              Invoices
            </h1>
            <p className="mt-3 text-lg text-muted">
              Create and manage your payment invoices
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-gold px-6 py-3 text-sm font-medium text-black transition-colors hover:bg-gold/90"
          >
            <Plus className="h-4 w-4" />
            Create Invoice
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <input
                type="text"
                placeholder="Search invoices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background/50 text-white focus:border-gold focus:outline-none"
              />
            </div>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-border bg-background/50 text-white focus:border-gold focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        {/* Create Invoice Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="luxury-border rounded-2xl bg-card/40 p-8 backdrop-blur-xl max-w-lg w-full">
              <h2 className="text-xl font-semibold text-white mb-6">Create Invoice</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-muted mb-2">Customer Email (Optional)</label>
                  <input
                    type="email"
                    value={formData.customer_email}
                    onChange={(e) => setFormData({...formData, customer_email: e.target.value})}
                    placeholder="customer@example.com"
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background/50 text-white focus:border-gold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-muted mb-2">Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Product purchase or service"
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background/50 text-white focus:border-gold focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-muted mb-2">Amount</label>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      placeholder="100.00"
                      step="0.01"
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background/50 text-white focus:border-gold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-muted mb-2">Currency</label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({...formData, currency: e.target.value})}
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background/50 text-white focus:border-gold focus:outline-none"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="BTC">BTC</option>
                      <option value="ETH">ETH</option>
                      <option value="USDT">USDT</option>
                      <option value="USDC">USDC</option>
                      <option value="NXR">NXR</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-muted mb-2">Expires In (Minutes)</label>
                  <input
                    type="number"
                    value={formData.expires_in}
                    onChange={(e) => setFormData({...formData, expires_in: e.target.value})}
                    placeholder="30"
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background/50 text-white focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({
                      customer_email: '',
                      description: '',
                      amount: '',
                      currency: 'USD',
                      expires_in: '30',
                    });
                  }}
                  className="flex-1 px-6 py-3 rounded-lg border border-border text-white hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateInvoice}
                  className="flex-1 px-6 py-3 rounded-lg bg-gold text-black hover:bg-gold/90"
                >
                  Create Invoice
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Invoice Modal */}
        {showViewModal && selectedInvoice && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="luxury-border rounded-2xl bg-card/40 p-8 backdrop-blur-xl max-w-lg w-full">
              <div className="flex items-start justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Invoice Details</h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg text-muted"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted">Invoice Number</span>
                  <span className="text-white font-mono">{selectedInvoice.invoice_number}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted">Description</span>
                  <span className="text-white">{selectedInvoice.description || 'N/A'}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted">Amount</span>
                  <span className="text-white font-semibold text-xl">
                    {selectedInvoice.amount.toFixed(2)} {selectedInvoice.currency}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted">Status</span>
                  <span className={`flex items-center gap-2 ${getStatusColor(selectedInvoice.status)}`}>
                    {getStatusIcon(selectedInvoice.status)}
                    <span className="capitalize">{selectedInvoice.status}</span>
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted">Created</span>
                  <span className="text-white">
                    {new Date(selectedInvoice.created_at).toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted">Expires</span>
                  <span className="text-white">
                    {new Date(selectedInvoice.expires_at).toLocaleString()}
                  </span>
                </div>

                {selectedInvoice.payment_url && (
                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm text-muted">Payment Link</span>
                      <button
                        onClick={() => handleCopyPaymentLink(selectedInvoice.payment_url!)}
                        className="p-1 hover:bg-white/10 rounded text-muted hover:text-white"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                    <input
                      type="text"
                      readOnly
                      value={selectedInvoice.payment_url}
                      className="w-full px-4 py-2 rounded-lg border border-border bg-background/50 text-white text-sm font-mono"
                    />
                  </div>
                )}

                {selectedInvoice.qr_code_url && (
                  <div className="pt-4 border-t border-border">
                    <span className="text-sm text-muted mb-3 block">QR Code</span>
                    <div className="flex justify-center">
                      <img src={selectedInvoice.qr_code_url} alt="QR Code" className="w-48 h-48" />
                    </div>
                  </div>
                )}
              </div>

              {selectedInvoice.status === 'pending' && (
                <div className="mt-6 pt-6 border-t border-border flex gap-4">
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      handleCancelInvoice(selectedInvoice.id);
                    }}
                    className="flex-1 px-6 py-3 rounded-lg border border-red-500/50 text-red-400 hover:bg-red-500/10"
                  >
                    Cancel Invoice
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Invoices List */}
        <div className="luxury-border rounded-3xl bg-card/40 p-8 backdrop-blur-xl">
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Invoices Yet</h3>
              <p className="text-muted mb-6">
                Create your first invoice to start accepting payments
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-gold px-6 py-3 text-sm font-medium text-black transition-colors hover:bg-gold/90"
              >
                <Plus className="h-4 w-4" />
                Create Your First Invoice
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-white">Invoice #</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-white">Description</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-white">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-white">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-white">Created</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-white">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-border/50 hover:bg-card/20">
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
                      <td className="py-4 px-4 text-sm text-muted">
                        {new Date(invoice.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4 text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewInvoice(invoice)}
                            className="p-2 rounded-lg hover:bg-white/10 text-muted hover:text-white transition-colors"
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          
                          {invoice.payment_url && (
                            <button
                              onClick={() => handleCopyPaymentLink(invoice.payment_url!)}
                              className="p-2 rounded-lg hover:bg-white/10 text-muted hover:text-white transition-colors"
                              title="Copy payment link"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                          )}

                          {invoice.status === 'pending' && (
                            <button
                              onClick={() => handleCancelInvoice(invoice.id)}
                              className="p-2 rounded-lg hover:bg-red-500/20 text-muted hover:text-red-400 transition-colors"
                              title="Cancel invoice"
                            >
                              <Trash2 className="h-4 w-4" />
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
  );
}