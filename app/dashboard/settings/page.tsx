"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Settings, User, Building2, Bell, Shield, CreditCard, Globe, Save, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";

interface Merchant {
  id: string;
  business_name: string;
  business_type: string | null;
  business_email: string | null;
  business_phone: string | null;
  business_address: string | null;
  business_city: string | null;
  business_country: string | null;
  business_zip: string | null;
  is_verified: boolean;
  created_at: string;
}

export default function MerchantSettingsPage() {
  const router = useRouter();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  const [formData, setFormData] = useState({
    business_name: "",
    business_type: "",
    business_email: "",
    business_phone: "",
    business_address: "",
    business_city: "",
    business_country: "",
    business_zip: "",
  });

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

      const response = await fetch('/api/merchants', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/business/login');
          return;
        }
        throw new Error('Failed to fetch merchant data');
      }

      const data = await response.json();
      if (data.success) {
        setMerchant(data.merchant);
        setFormData({
          business_name: data.merchant.business_name || "",
          business_type: data.merchant.business_type || "",
          business_email: data.merchant.business_email || "",
          business_phone: data.merchant.business_phone || "",
          business_address: data.merchant.business_address || "",
          business_city: data.merchant.business_city || "",
          business_country: data.merchant.business_country || "",
          business_zip: data.merchant.business_zip || "",
        });
      }
    } catch (err) {
      console.error('Failed to load merchant data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);

    try {
      const token = localStorage.getItem('session_token');
      const response = await fetch('/api/merchants/settings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSuccess(true);
          setTimeout(() => setSuccess(false), 3000);
          await fetchMerchantData();
        }
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
              <p className="mt-4 text-sm text-muted-foreground">Loading settings...</p>
            </div>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="max-w-7xl mx-auto py-12">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-muted mb-8">
          <Link href="/dashboard" className="hover:text-gold">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-white">Settings</span>
        </nav>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
            Settings
          </h1>
          <p className="mt-3 text-lg text-muted">
            Manage your merchant account settings
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === "profile"
                ? "bg-gold text-black"
                : "bg-card/40 text-white hover:bg-card/60"
            }`}
          >
            <User className="h-4 w-4 inline mr-2" />
            Profile
          </button>
          <button
            onClick={() => setActiveTab("business")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === "business"
                ? "bg-gold text-black"
                : "bg-card/40 text-white hover:bg-card/60"
            }`}
          >
            <Building2 className="h-4 w-4 inline mr-2" />
            Business Info
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === "notifications"
                ? "bg-gold text-black"
                : "bg-card/40 text-white hover:bg-card/60"
            }`}
          >
            <Bell className="h-4 w-4 inline mr-2" />
            Notifications
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === "security"
                ? "bg-gold text-black"
                : "bg-card/40 text-white hover:bg-card/60"
            }`}
          >
            <Shield className="h-4 w-4 inline mr-2" />
            Security
          </button>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 rounded-lg border border-green-500/50 bg-green-500/10 text-green-400 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            <span>Settings saved successfully</span>
          </div>
        )}

        {/* Tab Content */}
        <div className="luxury-border rounded-3xl bg-card/40 p-8 backdrop-blur-xl">
          {activeTab === "profile" && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white mb-6">Profile Settings</h2>
              
              <div>
                <label className="block text-sm text-muted mb-2">Business Name</label>
                <input
                  type="text"
                  value={formData.business_name}
                  onChange={(e) => setFormData({...formData, business_name: e.target.value})}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background/50 text-white focus:border-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-muted mb-2">Business Type</label>
                <select
                  value={formData.business_type}
                  onChange={(e) => setFormData({...formData, business_type: e.target.value})}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background/50 text-white focus:border-gold focus:outline-none"
                >
                  <option value="">Select business type</option>
                  <option value="retail">Retail</option>
                  <option value="services">Services</option>
                  <option value="ecommerce">E-commerce</option>
                  <option value="technology">Technology</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-muted mb-2">Business Email</label>
                <input
                  type="email"
                  value={formData.business_email}
                  onChange={(e) => setFormData({...formData, business_email: e.target.value})}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background/50 text-white focus:border-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-muted mb-2">Business Phone</label>
                <input
                  type="tel"
                  value={formData.business_phone}
                  onChange={(e) => setFormData({...formData, business_phone: e.target.value})}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background/50 text-white focus:border-gold focus:outline-none"
                />
              </div>
            </div>
          )}

          {activeTab === "business" && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white mb-6">Business Information</h2>
              
              <div>
                <label className="block text-sm text-muted mb-2">Business Address</label>
                <input
                  type="text"
                  value={formData.business_address}
                  onChange={(e) => setFormData({...formData, business_address: e.target.value})}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background/50 text-white focus:border-gold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-muted mb-2">City</label>
                  <input
                    type="text"
                    value={formData.business_city}
                    onChange={(e) => setFormData({...formData, business_city: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background/50 text-white focus:border-gold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-muted mb-2">Country</label>
                  <input
                    type="text"
                    value={formData.business_country}
                    onChange={(e) => setFormData({...formData, business_country: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background/50 text-white focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-muted mb-2">ZIP/Postal Code</label>
                <input
                  type="text"
                  value={formData.business_zip}
                  onChange={(e) => setFormData({...formData, business_zip: e.target.value})}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background/50 text-white focus:border-gold focus:outline-none"
                />
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white mb-6">Notification Settings</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-card/30">
                  <div>
                    <h3 className="text-white font-medium">Email Notifications</h3>
                    <p className="text-sm text-muted-foreground">Receive email updates for payment events</p>
                  </div>
                  <div className="w-12 h-6 bg-gold rounded-full relative">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-black rounded-full" />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-card/30">
                  <div>
                    <h3 className="text-white font-medium">Webhook Notifications</h3>
                    <p className="text-sm text-muted-foreground">Send webhook events to your server</p>
                  </div>
                  <div className="w-12 h-6 bg-gold rounded-full relative">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-black rounded-full" />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-card/30">
                  <div>
                    <h3 className="text-white font-medium">SMS Notifications</h3>
                    <p className="text-sm text-muted-foreground">Receive SMS for important events</p>
                  </div>
                  <div className="w-12 h-6 bg-card/50 rounded-full relative">
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white mb-6">Security Settings</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-card/30">
                  <div>
                    <h3 className="text-white font-medium">Two-Factor Authentication</h3>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                  </div>
                  <Link
                    href="/dashboard/settings"
                    className="text-gold text-sm font-medium hover:text-gold/80"
                  >
                    Enable
                  </Link>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-card/30">
                  <div>
                    <h3 className="text-white font-medium">API Keys</h3>
                    <p className="text-sm text-muted-foreground">Manage your API credentials</p>
                  </div>
                  <Link
                    href="/merchant/api-keys"
                    className="text-gold text-sm font-medium hover:text-gold/80"
                  >
                    Manage
                  </Link>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-card/30">
                  <div>
                    <h3 className="text-white font-medium">Change Password</h3>
                    <p className="text-sm text-muted-foreground">Update your account password</p>
                  </div>
                  <Link
                    href="/dashboard/settings"
                    className="text-gold text-sm font-medium hover:text-gold/80"
                  >
                    Change
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="mt-8 pt-6 border-t border-border">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gold text-black font-medium hover:bg-gold/90 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Container>
  );
}