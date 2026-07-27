"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Customer {
  id: string;
  email: string | null;
  phone: string | null;
  full_name: string | null;
  total_orders: number;
  total_spent: number;
  created_at: string;
}

export default function DashboardCustomers() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('session_token');
      if (!token) {
        router.push('/business');
        return;
      }

      const response = await fetch('/api/customers', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/business');
          return;
        }
        throw new Error('Failed to fetch customers');
      }

      const data = await response.json();
      if (data.success) {
        setCustomers(data.customers);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
            <p className="mt-4 text-sm text-muted-foreground">Loading customers...</p>
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
            Customers
          </h1>
          <p className="mt-3 text-lg text-muted">
            Manage your customer base and payment methods
          </p>
        </div>

        <div className="luxury-border rounded-3xl bg-card/40 p-8 backdrop-blur-xl">
          {error ? (
            <div className="text-center py-12">
              <p className="text-muted mb-4">{error}</p>
              <button
                onClick={fetchCustomers}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-gold px-6 py-3 text-sm font-medium text-black transition-colors hover:bg-gold/90"
              >
                Retry
              </button>
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted">No customers found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-white">Customer</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-white">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-white">Total Orders</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-white">Total Spent</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-white">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.id} className="border-b border-border/50 hover:bg-card/20">
                      <td className="py-3 px-4 text-sm text-white">
                        {customer.full_name || 'Unknown'}
                      </td>
                      <td className="py-3 px-4 text-sm text-white">
                        {customer.email || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-sm text-white">
                        {customer.total_orders}
                      </td>
                      <td className="py-3 px-4 text-sm text-white">
                        ${customer.total_spent.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted">
                        {new Date(customer.created_at).toLocaleDateString()}
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
