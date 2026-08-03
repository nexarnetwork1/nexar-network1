import { Inbox } from "lucide-react";
import {
  getContactMessages,
  markContactMessageReadAction,
  archiveContactMessageAction,
} from "@/modules/contact/actions";
import { formatDateTime } from "@/utils/format";
import { Button } from "@/components/ui/Button";
import {
  DashboardActions,
  DashboardCard,
  DashboardEmptyState,
  DashboardSection,
} from "@/components/dashboard";

export default async function AdminContactMessagesPage() {
  const messages = await getContactMessages();

  return (
    <div className="space-y-8">
      <DashboardSection
        as="div"
        level="h1"
        title="Contact messages"
        headingClassName="text-gold"
        description="Inbound messages from the public contact form"
      />

      {messages.length === 0 ? (
        <DashboardEmptyState
          icon={<Inbox className="h-5 w-5" aria-hidden />}
          title="No contact messages yet"
          description="Messages submitted through the public contact form will land here."
        />
      ) : (
        <div className="space-y-4">
          {messages.map((m) => (
            <DashboardCard
              as="article"
              key={m.id}
              className={m.status === "new" ? "border-gold/20 bg-gold/5" : undefined}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{m.subject}</p>
                  <p className="mt-1 break-words text-sm text-muted">
                    {m.name} · {m.email}
                  </p>
                  <p className="mt-1 text-xs text-muted">{formatDateTime(m.created_at)}</p>
                </div>
                <span className="shrink-0 rounded-full border border-border px-3 py-1 text-xs capitalize text-muted">
                  {m.status}
                </span>
              </div>
              <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-relaxed text-white/80">
                {m.message}
              </p>
              {m.status === "new" && (
                <DashboardActions className="mt-4">
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
                </DashboardActions>
              )}
            </DashboardCard>
          ))}
        </div>
      )}
    </div>
  );
}
