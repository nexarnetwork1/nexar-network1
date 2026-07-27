"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { useRouter } from "next/navigation";

interface DashboardStats {
  total_revenue: number;
  total_payments: number;
  total_customers: number;
  total_invoices: number;
  pending_invoices: number;
  paid_invoices: number;
  average_order_value: number;
  revenue_this_month: number;
  payments_this_month: number;
}

export default function DashboardOverview() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('session_token');
      if (!token) {
        router.push('/business');
        return;
      }

      const response = await fetch('/api/merchants/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/business');
          return;
        }
        throw new Error('Failed to fetch dashboard stats');
      }

      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
            <p className="mt-4 text-sm text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center py-20">
          <h2 className="text-2xl font-semibold text-white mb-4">
            {error || 'Dashboard Unavailable'}
          </h2>
          <p className="text-muted mb-6">
            {error || 'Unable to load dashboard data. Please try again later.'}
          </p>
          <button
            onClick={fetchDashboardStats}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gold px-6 py-3 text-sm font-medium text-black transition-colors hover:bg-gold/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const successRate = stats.total_invoices > 0 
    ? ((stats.paid_invoices / stats.total_invoices) * 100).toFixed(1)
    : '0';

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
            Dashboard Overview
          </h1>
          <p className="mt-3 text-lg text-muted">
            Monitor your business performance and key metrics
          </p>
        </div>

        <div className="luxury-border rounded-3xl bg-card/40 p-8 backdrop-blur-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="p-6 rounded-xl border border-border/50 bg-card/30">
              <h3 className="font-semibold text-gold mb-2">Total Revenue</h3>
              <p className="text-2xl font-bold text-white">
                ${stats.total_revenue.toFixed(2)}
              </p>
              <p className="text-sm text-muted mt-2">
                ${stats.revenue_this_month.toFixed(2)} this month
              </p>
            </div>
            <div className="p-6 rounded-xl border border-border/50 bg-card/30">
              <h3 className="font-semibold text-gold mb-2">Total Payments</h3>
              <p className="text-2xl font-bold text-white">{stats.total_payments}</p>
              <p className="text-sm text-muted mt-2">
                {stats.payments_this_month} this month
              </p>
            </div>
            <div className="p-6 rounded-xl border border-border/50 bg-card/30">
              <h3 className="font-semibold text-gold mb-2">Total Customers</h3>
              <p className="text-2xl font-bold text-white">{stats.total_customers}</p>
              <p className="text-sm text-muted mt-2">
                Active customers
              </p>
            </div>
            <div className="p-6 rounded-xl border border-border/50 bg-card/30">
              <h3 className="font-semibold text-gold mb-2">Success Rate</h3>
              <p className="text-2xl font-bold text-white">{successRate}%</p>
              <p className="text-sm text-muted mt-2">
                {stats.paid_invoices}/{stats.total_invoices} paid
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl border border-border/50 bg-card/30">
              <h3 className="font-semibold text-gold mb-2">Total Invoices</h3>
              <p className="text-2xl font-bold text-white">{stats.total_invoices}</p>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Paid</span>
                  <span className="text-green-400">{stats.paid_invoices}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Pending</span>
                  <span className="text-yellow-400">{stats.pending_invoices}</span>
                </div>
              </div>
            </div>
            <div className="p-6 rounded-xl border border-border/50 bg-card/30">
              <h3 className="font-semibold text-gold mb-2">Average Order Value</h3>
              <p className="text-2xl font-bold text-white">
                ${stats.average_order_value.toFixed(2)}
              </p>
              <p className="text-sm text-muted mt-2">
                Per transaction
              </p>
            </div>
            <div className="p-6 rounded-xl border border-border/50 bg-card/30">
              <h3 className="font-semibold text-gold mb-2">Quick Actions</h3>
              <div className="mt-4 space-y-2">
                <Link
                  href="/dashboard/payments"
                  className="block text-sm text-muted hover:text-gold transition-colors"
                >
                  View Payments →
                </Link>
                <Link
                  href="/dashboard/customers"
                  className="block text-sm text-muted hover:text-gold transition-colors"
                >
                  Manage Customers →
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="block text-sm text-muted hover:text-gold transition-colors"
                >
                  Settings →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}
