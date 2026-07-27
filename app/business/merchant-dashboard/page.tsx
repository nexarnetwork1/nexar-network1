"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Building2, DollarSign, FileText, Link as LinkIcon, Settings, ArrowRight, CheckCircle2, Lock, Zap, Globe, CreditCard, BarChart3, Users, Key, Wallet } from "lucide-react";

interface Merchant {
  id: string;
  business_name: string;
  business_type: string | null;
  status: string;
  is_verified: boolean;
  created_at: string;
}

interface DashboardStats {
  total_revenue: number;
  total_payments: number;
  total_customers: number;
  total_invoices: number;
}

export default function MerchantDashboardPage() {
  const router = useRouter();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMerchantData();
  }, []);

  const fetchMerchantData = async () => {
    try {
      const token = localStorage.getItem('session_token');
      if (!token) {
        router.push('/business/login');
        return;
      }

      // Fetch merchant
      const merchantResponse = await fetch('/api/merchants', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!merchantResponse.ok) {
        if (merchantResponse.status === 404) {
          router.push('/business/login');
          return;
        }
        if (merchantResponse.status === 401) {
          router.push('/business/login');
          return;
        }
        throw new Error('Failed to fetch merchant data');
      }

      const merchantData = await merchantResponse.json();
      if (merchantData.success) {
        setMerchant(merchantData.merchant);
      }

      // Fetch dashboard stats
      const statsResponse = await fetch('/api/merchants/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (statsData.success) {
          setStats(statsData.stats);
        }
      }

    } catch (err) {
      console.error('Failed to load merchant data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
              <p className="mt-4 text-sm text-muted-foreground">Loading merchant dashboard...</p>
            </div>
          </div>
        </div>
      </Container>
    );
  }

  if (!merchant) {
    return (
      <Container>
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <Building2 className="h-16 w-16 text-muted mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-white mb-4">
              Setup Your Merchant Account
            </h2>
            <p className="text-muted mb-6">
              Create your merchant account to start accepting payments
            </p>
            <button
              onClick={() => router.push('/business/register')}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gold px-6 py-3 text-sm font-medium text-black transition-colors hover:bg-gold/90"
            >
              Create Merchant Account
            </button>
          </div>
        </div>
      </Container>
    );
  }

  const statusColor = merchant.status === 'active' ? 'text-green-400' : 
                     merchant.status === 'pending' ? 'text-yellow-400' : 'text-red-400';

  return (
    <Container>
      <div className="max-w-7xl mx-auto py-12">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-muted mb-8">
          <button onClick={() => router.push('/business')} className="hover:text-gold">
            Business Hub
          </button>
          <span>/</span>
          <span className="text-white">Merchant Dashboard</span>
        </nav>

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-heading text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
                {merchant.business_name}
              </h1>
              <p className="mt-3 text-lg text-muted">
                Your merchant dashboard
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor}`}>
                {merchant.status.charAt(0).toUpperCase() + merchant.status.slice(1)}
              </span>
              {merchant.is_verified && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-gold/20 text-gold">
                  Verified
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="luxury-border rounded-xl bg-card/40 p-6 backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-lg bg-gold/20">
                  <DollarSign className="h-6 w-6 text-gold" />
                </div>
                <span className="text-sm text-muted">Total Revenue</span>
              </div>
              <p className="text-2xl font-bold text-white">
                ${stats.total_revenue.toFixed(2)}
              </p>
            </div>

            <div className="luxury-border rounded-xl bg-card/40 p-6 backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-lg bg-gold/20">
                  <FileText className="h-6 w-6 text-gold" />
                </div>
                <span className="text-sm text-muted">Total Payments</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {stats.total_payments}
              </p>
            </div>

            <div className="luxury-border rounded-xl bg-card/40 p-6 backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-lg bg-gold/20">
                  <Users className="h-6 w-6 text-gold" />
                </div>
                <span className="text-sm text-muted">Customers</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {stats.total_customers}
              </p>
            </div>

            <div className="luxury-border rounded-xl bg-card/40 p-6 backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-lg bg-gold/20">
                  <BarChart3 className="h-6 w-6 text-gold" />
                </div>
                <span className="text-sm text-muted">Invoices</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {stats.total_invoices}
              </p>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="luxury-border rounded-3xl bg-card/40 p-8 backdrop-blur-xl mb-8">
          <h2 className="text-xl font-semibold text-white mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/dashboard/invoices')}
              className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-card/30 hover:border-gold/50 transition-colors text-left"
            >
              <div className="p-3 rounded-lg bg-gold/20">
                <FileText className="h-6 w-6 text-gold" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white">Create Invoice</h3>
                <p className="text-sm text-muted">Send payment request</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted" />
            </button>

            <button
              onClick={() => router.push('/merchant/wallets')}
              className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-card/30 hover:border-gold/50 transition-colors text-left"
            >
              <div className="p-3 rounded-lg bg-gold/20">
                <Wallet className="h-6 w-6 text-gold" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white">Wallets</h3>
                <p className="text-sm text-muted">Payment addresses</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted" />
            </button>

            <button
              onClick={() => router.push('/dashboard/settings')}
              className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-card/30 hover:border-gold/50 transition-colors text-left"
            >
              <div className="p-3 rounded-lg bg-gold/20">
                <Settings className="h-6 w-6 text-gold" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white">Settings</h3>
                <p className="text-sm text-muted">Configuration</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted" />
            </button>

            <button
              onClick={() => router.push('/dashboard/customers')}
              className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-card/30 hover:border-gold/50 transition-colors text-left"
            >
              <div className="p-3 rounded-lg bg-gold/20">
                <Users className="h-6 w-6 text-gold" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white">Customers</h3>
                <p className="text-sm text-muted">Customer management</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted" />
            </button>

            <button
              onClick={() => router.push('/dashboard/payments')}
              className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-card/30 hover:border-gold/50 transition-colors text-left"
            >
              <div className="p-3 rounded-lg bg-gold/20">
                <DollarSign className="h-6 w-6 text-gold" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white">Payments</h3>
                <p className="text-sm text-muted">Transaction history</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted" />
            </button>
          </div>
        </div>

        {/* Developer Resources Section */}
        <div className="luxury-border rounded-3xl bg-card/40 p-8 backdrop-blur-xl mb-8">
          <h2 className="text-xl font-semibold text-white mb-6">Developer Resources</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Looking to integrate Nexar Network into your application? Visit our Developer Center for API documentation, SDKs, and integration guides.
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => router.push('/business/api')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gold/30 bg-gold/10 text-gold hover:bg-gold/20 transition-colors text-sm font-medium"
            >
              <Globe className="h-4 w-4" />
              <span>API Documentation</span>
            </button>
            <button
              onClick={() => router.push('/business/sdks')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gold/30 bg-gold/10 text-gold hover:bg-gold/20 transition-colors text-sm font-medium"
            >
              <Zap className="h-4 w-4" />
              <span>SDKs & Tools</span>
            </button>
            <button
              onClick={() => router.push('/docs')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gold/30 bg-gold/10 text-gold hover:bg-gold/20 transition-colors text-sm font-medium"
            >
              <FileText className="h-4 w-4" />
              <span>Full Documentation</span>
            </button>
          </div>
        </div>

        {/* Merchant Info */}
        <div className="luxury-border rounded-3xl bg-card/40 p-8 backdrop-blur-xl">
          <h2 className="text-xl font-semibold text-white mb-6">Business Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted mb-2">Business Name</p>
              <p className="text-white">{merchant.business_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted mb-2">Business Type</p>
              <p className="text-white">{merchant.business_type || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm text-muted mb-2">Created</p>
              <p className="text-white">{new Date(merchant.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text text-muted mb-2">Merchant ID</p>
              <p className="text-white font-mono text-sm">{merchant.id}</p>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}