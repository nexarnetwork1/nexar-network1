import {
  getContactMessages,
  markContactMessageReadAction,
  archiveContactMessageAction,
} from "@/modules/contact/actions";
import { formatDateTime } from "@/utils/format";
import { Button } from "@/components/ui/Button";

export default async function AdminContactMessagesPage() {
  const messages = await getContactMessages();

  return (
    <div>
      <h1 className="text-3xl font-bold text-yellow-400">Contact messages</h1>
      <p className="mt-2 text-zinc-400">Inbound messages from the public contact form</p>

      <div className="mt-8 space-y-4">
        {messages.map((m) => (
          <article
            key={m.id}
            className={`rounded-2xl border p-6 ${
              m.status === "new"
                ? "border-yellow-500/30 bg-zinc-900"
                : "border-white/10 bg-zinc-900/50"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-medium">{m.subject}</p>
                <p className="mt-1 text-sm text-zinc-400">
                  {m.name} · {m.email}
                </p>
                <p className="mt-1 text-xs text-zinc-500">{formatDateTime(m.created_at)}</p>
              </div>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs capitalize text-zinc-400">
                {m.status}
              </span>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
              {m.message}
            </p>
            {m.status === "new" && (
              <div className="mt-4 flex gap-2">
                <form action={markContactMessageReadAction}>
                  <input type="hidden" name="id" value={m.id} />
                  <Button type="submit" variant="secondary" size="sm">
                    Mark read
                  </Button>
                </form>
                <form action={archiveContactMessageAction}>
                  <input type="hidden" name="id" value={m.id} />
                  <Button type="submit" variant="ghost" size="sm">
                    Archive
                  </Button>
                </form>
              </div>
            )}
          </article>
        ))}
        {messages.length === 0 && (
          <p className="text-zinc-500">No contact messages yet.</p>
        )}
      </div>
    </div>
  );
}
