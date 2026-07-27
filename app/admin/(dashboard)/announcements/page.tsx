"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Bell, 
  Plus, 
  Search, 
  Filter, 
  Edit,
  Trash2,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle
} from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'urgent' | 'maintenance';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'info' as 'info' | 'warning' | 'urgent' | 'maintenance',
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const token = localStorage.getItem('admin_session_token');
      if (!token) {
        setError('Admin authentication required');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/admin/announcements', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch announcements');
      }

      const data = await response.json();
      if (data.success) {
        setAnnouncements(data.announcements);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!formData.title || !formData.content) {
      setError('Title and content are required');
      return;
    }

    try {
      const token = localStorage.getItem('admin_session_token');
      const response = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create announcement');
      }

      const data = await response.json();
      if (data.success) {
        setShowCreateModal(false);
        setFormData({
          title: '',
          content: '',
          type: 'info',
        });
        await fetchAnnouncements();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create announcement');
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const token = localStorage.getItem('admin_session_token');
      const response = await fetch(`/api/admin/announcements/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_active: !isActive,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update announcement');
      }

      await fetchAnnouncements();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update announcement');
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) {
      return;
    }

    try {
      const token = localStorage.getItem('admin_session_token');
      const response = await fetch(`/api/admin/announcements/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete announcement');
      }

      await fetchAnnouncements();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete announcement');
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'info':
        return 'text-blue-400 bg-blue-500/20';
      case 'warning':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'urgent':
        return 'text-red-400 bg-red-500/20';
      case 'maintenance':
        return 'text-purple-400 bg-purple-500/20';
      default:
        return 'text-zinc-400 bg-zinc-500/20';
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#09090b] text-white">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-yellow-400 border-t-transparent" />
              <p className="mt-4 text-sm text-zinc-400">Loading announcements...</p>
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
              Announcement Management
            </h1>
            <p className="mt-2 text-zinc-400">
              Create and manage platform announcements
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={fetchAnnouncements}
              className="inline-flex items-center gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-4 py-2 text-sm font-medium text-yellow-400 transition hover:bg-yellow-500/20"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-yellow-500 px-4 py-2 text-sm font-medium text-black transition hover:bg-yellow-400"
            >
              <Plus className="h-4 w-4" />
              Create Announcement
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg border border-red-500/50 bg-red-500/10 text-red-400">
            {error}
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="rounded-2xl border border-white/10 bg-zinc-900 p-8 max-w-lg w-full">
              <h2 className="text-xl font-semibold text-white mb-6">Create Announcement</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Announcement title"
                    className="w-full px-4 py-3 rounded-lg border border-white/10 bg-zinc-800 text-white focus:border-yellow-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                    className="w-full px-4 py-3 rounded-lg border border-white/10 bg-zinc-800 text-white focus:border-yellow-400 focus:outline-none"
                  >
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="urgent">Urgent</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Content</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    placeholder="Announcement content"
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-white/10 bg-zinc-800 text-white focus:border-yellow-400 focus:outline-none resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({
                      title: '',
                      content: '',
                      type: 'info',
                    });
                  }}
                  className="flex-1 px-6 py-3 rounded-lg border border-white/10 text-white hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAnnouncement}
                  className="flex-1 px-6 py-3 rounded-lg bg-yellow-500 text-black hover:bg-yellow-400"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Announcements List */}
        <div className="rounded-2xl border border-white/10 bg-zinc-900 p-6">
          {announcements.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Announcements Yet</h3>
              <p className="text-zinc-400">
                Create your first announcement to inform users
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="p-6 rounded-xl border border-white/10 bg-zinc-800/50">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(announcement.type)}`}>
                        {announcement.type}
                      </span>
                      {announcement.is_active ? (
                        <span className="flex items-center gap-1 text-green-400 text-sm">
                          <CheckCircle2 className="h-4 w-4" />
                          Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-zinc-400 text-sm">
                          <XCircle className="h-4 w-4" />
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleActive(announcement.id, announcement.is_active)}
                        className="p-2 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                        title={announcement.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {announcement.is_active ? (
                          <XCircle className="h-4 w-4" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteAnnouncement(announcement.id)}
                        className="p-2 rounded-lg hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-white mb-2">
                    {announcement.title}
                  </h3>
                  <p className="text-zinc-400 mb-4">
                    {announcement.content}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-zinc-500">
                    <span>Created: {new Date(announcement.created_at).toLocaleString()}</span>
                    {announcement.updated_at !== announcement.created_at && (
                      <span>Updated: {new Date(announcement.updated_at).toLocaleString()}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}