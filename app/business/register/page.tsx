"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Building2, Mail, Lock, User, ArrowRight, Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    business_name: '',
    business_type: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Register user
      const registerResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
        }),
      });

      if (!registerResponse.ok) {
        const data = await registerResponse.json();
        throw new Error(data.error || 'Registration failed');
      }

      const registerData = await registerResponse.json();
      
      // Store session token
      if (registerData.session?.token) {
        localStorage.setItem('session_token', registerData.session.token);
        localStorage.setItem('user_id', registerData.user.id);
      }

      // Create merchant
      const merchantResponse = await fetch('/api/merchants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${registerData.session.token}`,
        },
        body: JSON.stringify({
          business_name: formData.business_name,
          business_type: formData.business_type,
        }),
      });

      if (!merchantResponse.ok) {
        // If merchant creation fails, still redirect to business dashboard
        // where they can set up their merchant account
        router.push('/business/merchant-dashboard');
        return;
      }

      // Registration successful, redirect to business dashboard
      router.push('/business/merchant-dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <div className="max-w-md mx-auto py-20">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold/20 mb-4">
            <Building2 className="h-8 w-8 text-gold" />
          </div>
          <h1 className="font-heading text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
            Create Account
          </h1>
          <p className="mt-3 text-lg text-muted">
            Start accepting payments in minutes
          </p>
        </div>

        <div className="luxury-border rounded-3xl bg-card/40 p-8 backdrop-blur-xl">
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-white mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted" />
                <input
                  id="full_name"
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background/50 text-white placeholder:text-muted focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted" />
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background/50 text-white placeholder:text-muted focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
                  placeholder="you@company.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-12 py-3 rounded-lg border border-border bg-background/50 text-white placeholder:text-muted focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="business_name" className="block text-sm font-medium text-white mb-2">
                Business Name
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted" />
                <input
                  id="business_name"
                  type="text"
                  required
                  value={formData.business_name}
                  onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background/50 text-white placeholder:text-muted focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
                  placeholder="Acme Inc."
                />
              </div>
            </div>

            <div>
              <label htmlFor="business_type" className="block text-sm font-medium text-white mb-2">
                Business Type (Optional)
              </label>
              <select
                id="business_type"
                value={formData.business_type}
                onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-border bg-background/50 text-white focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
              >
                <option value="">Select business type</option>
                <option value="retail">Retail</option>
                <option value="services">Services</option>
                <option value="software">Software</option>
                <option value="ecommerce">E-commerce</option>
                <option value="other">Other</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gold px-8 py-4 text-sm font-medium text-black transition-colors hover:bg-gold/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span>Creating Account...</span>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted">
              Already have an account?{' '}
              <a href="/business/login" className="text-gold hover:text-gold/80">
                Sign in
              </a>
            </p>
          </div>
        </div>
      </div>
    </Container>
  );
}