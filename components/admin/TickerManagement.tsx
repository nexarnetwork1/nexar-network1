"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { TickerAnnouncement } from "@/types";
import {
  createTickerAnnouncementAction,
  deleteTickerAnnouncementAction,
  reorderTickerAnnouncementsAction,
  toggleTickerAnnouncementAction,
  updateTickerAnnouncementAction,
} from "@/modules/ticker/actions";
import { formatDateTime } from "@/utils/format";

type Props = {
  initialAnnouncements: TickerAnnouncement[];
};

type FormState = {
  message: string;
  isEnabled: boolean;
  priority: number;
  startsAt: string;
  endsAt: string;
};

const emptyForm: FormState = {
  message: "",
  isEnabled: true,
  priority: 0,
  startsAt: "",
  endsAt: "",
};

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function scheduleLabel(item: TickerAnnouncement): string {
  if (!item.starts_at && !item.ends_at) return "Always on";
  if (item.starts_at && item.ends_at) {
    return `${formatDateTime(item.starts_at)} → ${formatDateTime(item.ends_at)}`;
  }
  if (item.starts_at) return `From ${formatDateTime(item.starts_at)}`;
  return `Until ${formatDateTime(item.ends_at!)}`;
}

function isCurrentlyActive(item: TickerAnnouncement): boolean {
  if (!item.is_enabled) return false;
  const now = Date.now();
  if (item.starts_at && new Date(item.starts_at).getTime() > now) return false;
  if (item.ends_at && new Date(item.ends_at).getTime() < now) return false;
  return true;
}

export function TickerManagement({ initialAnnouncements }: Props) {
  const router = useRouter();
  const [items, setItems] = useState(initialAnnouncements);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function startEdit(item: TickerAnnouncement) {
    setEditingId(item.id);
    setForm({
      message: item.message,
      isEnabled: item.is_enabled,
      priority: item.priority,
      startsAt: toLocalInput(item.starts_at),
      endsAt: toLocalInput(item.ends_at),
    });
  }

  function buildFormData(data: FormState): FormData {
    const fd = new FormData();
    fd.set("message", data.message);
    fd.set("isEnabled", data.isEnabled ? "true" : "false");
    fd.set("priority", String(data.priority));
    if (data.startsAt) fd.set("startsAt", data.startsAt);
    if (data.endsAt) fd.set("endsAt", data.endsAt);
    return fd;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const fd = buildFormData(form);
      const result = editingId
        ? await updateTickerAnnouncementAction(editingId, fd)
        : await createTickerAnnouncementAction(fd);

      if (!result.success) {
        toast.error(result.error ?? "Failed to save announcement");
        return;
      }

      toast.success(editingId ? "Announcement updated" : "Announcement added");
      resetForm();
      router.refresh();
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this announcement?")) return;
    startTransition(async () => {
      const result = await deleteTickerAnnouncementAction(id);
      if (!result.success) {
        toast.error(result.error ?? "Failed to delete");
        return;
      }
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("Announcement deleted");
      router.refresh();
    });
  }

  async function handleToggle(id: string, enabled: boolean) {
    startTransition(async () => {
      const result = await toggleTickerAnnouncementAction(id, enabled);
      if (!result.success) {
        toast.error(result.error ?? "Failed to update status");
        return;
      }
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, is_enabled: enabled } : i))
      );
      router.refresh();
    });
  }

  function handleDragStart(id: string) {
    setDraggingId(id);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  async function handleDrop(targetId: string) {
    if (!draggingId || draggingId === targetId) {
      setDraggingId(null);
      return;
    }

    const current = [...items];
    const fromIndex = current.findIndex((i) => i.id === draggingId);
    const toIndex = current.findIndex((i) => i.id === targetId);
    if (fromIndex < 0 || toIndex < 0) {
      setDraggingId(null);
      return;
    }

    const [moved] = current.splice(fromIndex, 1);
    current.splice(toIndex, 0, moved);
    const reordered = current.map((item, index) => ({ ...item, sort_order: index }));
    setItems(reordered);
    setDraggingId(null);

    startTransition(async () => {
      const result = await reorderTickerAnnouncementsAction(reordered.map((i) => i.id));
      if (!result.success) {
        toast.error(result.error ?? "Failed to reorder");
        setItems(initialAnnouncements);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/40">
        <div className="border-b border-white/10 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Announcements</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Drag to reorder. Active items appear in the public ticker between static messages.
          </p>
        </div>

        {items.length === 0 ? (
          <div className="flex h-48 items-center justify-center p-8 text-center text-zinc-400">
            No ticker announcements yet. Add one using the form.
          </div>
        ) : (
          <ul className="divide-y divide-white/5">
            {items.map((item) => (
              <li
                key={item.id}
                draggable
                onDragStart={() => handleDragStart(item.id)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(item.id)}
                onDragEnd={() => setDraggingId(null)}
                className={`flex items-start gap-4 px-6 py-4 transition ${
                  draggingId === item.id ? "opacity-50" : ""
                }`}
              >
                <button
                  type="button"
                  aria-label="Drag to reorder"
                  className="mt-1 cursor-grab text-zinc-500 hover:text-yellow-400 active:cursor-grabbing"
                >
                  <GripVertical className="h-5 w-5" />
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-white">{item.message}</p>
                    {item.priority > 0 && (
                      <span className="rounded-full bg-yellow-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-yellow-400">
                        Priority {item.priority}
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                        isCurrentlyActive(item)
                          ? "bg-emerald-500/15 text-emerald-400"
                          : item.is_enabled
                            ? "bg-amber-500/15 text-amber-400"
                            : "bg-zinc-700/50 text-zinc-400"
                      }`}
                    >
                      {isCurrentlyActive(item)
                        ? "Live"
                        : item.is_enabled
                          ? "Scheduled"
                          : "Disabled"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">{scheduleLabel(item)}</p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <label className="flex items-center gap-2 text-xs text-zinc-400">
                    <input
                      type="checkbox"
                      checked={item.is_enabled}
                      disabled={pending}
                      onChange={(e) => handleToggle(item.id, e.target.checked)}
                      className="rounded border-zinc-600"
                    />
                    Enabled
                  </label>
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-yellow-400"
                    aria-label="Edit announcement"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    disabled={pending}
                    className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-red-400"
                    aria-label="Delete announcement"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-white/10 bg-zinc-900/40 p-6">
        <h2 className="text-lg font-semibold text-white">
          {editingId ? "Edit announcement" : "Add announcement"}
        </h2>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="text-xs text-zinc-400">Message</label>
            <textarea
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              rows={3}
              maxLength={500}
              required
              placeholder="e.g. 🎉 New merchant stores launching this week"
              className="mt-1 w-full resize-none rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none focus:border-yellow-400"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400">Priority (optional, higher shows first)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={form.priority}
              onChange={(e) => setForm((f) => ({ ...f, priority: Number(e.target.value) }))}
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none focus:border-yellow-400"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400">Start date (optional)</label>
            <input
              type="datetime-local"
              value={form.startsAt}
              onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none focus:border-yellow-400"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400">End date (optional)</label>
            <input
              type="datetime-local"
              value={form.endsAt}
              onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none focus:border-yellow-400"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={form.isEnabled}
              onChange={(e) => setForm((f) => ({ ...f, isEnabled: e.target.checked }))}
              className="rounded border-zinc-600"
            />
            Enabled
          </label>

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-xl bg-yellow-400 px-5 py-2.5 text-sm font-bold text-black disabled:opacity-50"
            >
              {pending ? "Saving…" : editingId ? "Save changes" : "Add announcement"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-zinc-700 px-5 py-2.5 text-sm text-white hover:bg-zinc-800"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}
