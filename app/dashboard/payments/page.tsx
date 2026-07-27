"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Payment {
  id: string;
  invoice_id: string;
  amount: number;
  currency: string;
  status: string;
  confirmations: number;
  required_confirmations: number;
  transaction_hash: string | null;
  created_at: string;
}

export default function DashboardPayments() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchPayments();
  }, [statusFilter]);

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem('session_token');
      if (!token) {
        router.push('/business');
        return;
      }

      const url = statusFilter === 'all' 
        ? '/api/payments' 
        : `/api/payments?status=${statusFilter}`;

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
      case 'confirmed':
        return 'text-green-400';
      case 'pending':
        return 'text-yellow-400';
      case 'failed':
        return 'text-red-400';
      default:
        return 'text-muted';
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
            <p className="mt-4 text-sm text-muted-foreground">Loading payments...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
            Payments
          </h1>
          <p className="mt-3 text-lg text-muted">
            View and manage all payment transactions
          </p>
        </div>

        <div className="luxury-border rounded-3xl bg-card/40 p-8 backdrop-blur-xl">
          {/* Filters */}
          <div className="mb-6 flex flex-wrap gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-border bg-background px-4 py-2 text-sm text-white focus:border-gold focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {error ? (
            <div className="text-center py-12">
              <p className="text-muted mb-4">{error}</p>
              <button
                onClick={fetchPayments}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-gold px-6 py-3 text-sm font-medium text-black transition-colors hover:bg-gold/90"
              >
                Retry
              </button>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted">No payments found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-white">Payment ID</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-white">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-white">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-white">Confirmations</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-white">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b border-border/50 hover:bg-card/20">
                      <td className="py-3 px-4 text-sm text-white">
                        {payment.id.substring(0, 8)}...
                      </td>
                      <td className="py-3 px-4 text-sm text-white">
                        {payment.amount.toFixed(2)} {payment.currency}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <span className={getStatusColor(payment.status)}>
                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-white">
                        {payment.confirmations}/{payment.required_confirmations}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted">
                        {new Date(payment.created_at).toLocaleDateString()}
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
