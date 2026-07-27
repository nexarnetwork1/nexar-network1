"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Building2, 
  FileText, 
  DollarSign, 
  Users, 
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock
} from "lucide-react";

interface AdminStats {
  total_merchants: number;
  active_merchants: number;
  total_invoices: number;
  total_payments: number;
  total_revenue: number;
  pending_approvals: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      const token = localStorage.getItem('admin_session_token');
      if (!token) {
        setError('Admin authentication required');
        setLoading(false);
        return;
      }

      // Fetch merchants count
      const merchantsResponse = await fetch('/api/admin/merchants', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      // Fetch invoices count
      const invoicesResponse = await fetch('/api/admin/invoices', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      // Fetch payments count
      const paymentsResponse = await fetch('/api/admin/payments', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      let adminStats: AdminStats = {
        total_merchants: 0,
        active_merchants: 0,
        total_invoices: 0,
        total_payments: 0,
        total_revenue: 0,
        pending_approvals: 0,
      };

      if (merchantsResponse.ok) {
        const merchantsData = await merchantsResponse.json();
        if (merchantsData.success) {
          adminStats.total_merchants = merchantsData.merchants?.length || 0;
          adminStats.active_merchants = merchantsData.merchants?.filter((m: any) => m.status === 'active').length || 0;
          adminStats.pending_approvals = merchantsData.merchants?.filter((m: any) => m.status === 'pending').length || 0;
        }
      }

      if (invoicesResponse.ok) {
        const invoicesData = await invoicesResponse.json();
        if (invoicesData.success) {
          adminStats.total_invoices = invoicesData.invoices?.length || 0;
        }
      }

      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        if (paymentsData.success) {
          adminStats.total_payments = paymentsData.payments?.length || 0;
          adminStats.total_revenue = paymentsData.payments?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0;
        }
      }

      setStats(adminStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admin statistics');
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    {
      title: "Merchants",
      value: stats?.total_merchants || 0,
      href: "/admin/merchants",
      color: "from-blue-500/20 to-blue-500/5",
      icon: Building2,
      subtitle: `${stats?.active_merchants || 0} active`,
    },
    {
      title: "Invoices",
      value: stats?.total_invoices || 0,
      href: "/admin/invoices",
      color: "from-purple-500/20 to-purple-500/5",
      icon: FileText,
      subtitle: "All time",
    },
    {
      title: "Payments",
      value: stats?.total_payments || 0,
      href: "/admin/payments",
      color: "from-green-500/20 to-green-500/5",
      icon: DollarSign,
      subtitle: `$${(stats?.total_revenue || 0).toFixed(2)} revenue`,
    },
    {
      title: "Pending",
      value: stats?.pending_approvals || 0,
      href: "/admin/merchants",
      color: "from-yellow-500/20 to-yellow-500/5",
      icon: Clock,
      subtitle: "Approvals needed",
    },
  ];

  if (loading) {
    return (
      <main className="min-h-screen bg-[#09090b] text-white">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-yellow-400 border-t-transparent" />
              <p className="mt-4 text-sm text-zinc-400">Loading admin dashboard...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#09090b] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-yellow-400">
              Nexar CMS
            </h1>
            <p className="mt-2 text-zinc-400">
              Welcome back, Founder 👋
            </p>
          </div>
          <button
            onClick={fetchAdminStats}
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

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className={`rounded-2xl border border-white/10 bg-gradient-to-br ${card.color} p-6 transition hover:scale-[1.02]`}
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-zinc-400">{card.title}</p>
                <card.icon className="h-5 w-5 text-yellow-400" />
              </div>

              <h2 className="text-5xl font-bold">
                {card.value}
              </h2>
              <p className="mt-2 text-sm text-zinc-400">
                {card.subtitle}
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-white/10 bg-zinc-900 p-6">
            <h2 className="text-xl font-semibold text-yellow-400">
              System Status
            </h2>

            <div className="mt-6 space-y-4">
              <Status label="Website" value="Online" />
              <Status label="Database" value="Connected" />
              <Status label="Authentication" value="Working" />
              <Status label="Payment Engine" value="Active" />
              <Status label="Exchange Rates" value="Live" />
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-zinc-900 p-6">
            <h2 className="text-xl font-semibold text-yellow-400">
              Quick Actions
            </h2>

            <div className="mt-6 grid gap-3">
              <Quick href="/admin/news" text="Manage News" />
              <Quick href="/admin/announcements" text="Manage Announcements" />
              <Quick href="/admin/merchants" text="Manage Merchants" />
              <Quick href="/admin/invoices" text="View Invoices" />
              <Quick href="/admin/payments" text="View Payments" />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function Status({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-zinc-950 p-4">
      <span>{label}</span>
      <span className="flex items-center gap-2 font-semibold text-green-400">
        <CheckCircle2 className="h-4 w-4" />
        {value}
      </span>
    </div>
  );
}

function Quick({
  href,
  text,
}: {
  href: string;
  text: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 transition hover:bg-yellow-500/20"
    >
      {text}
    </Link>
  );
}
