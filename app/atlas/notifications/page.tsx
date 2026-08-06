import Link from "next/link";
import { Bell, Heart, MessageSquare, Users, Briefcase, Calendar } from "lucide-react";
import { getPersonProfileByUserId } from "@/modules/atlas-network/repository";
import { auth } from "@/auth";
import { AtlasGuestGate } from "@/components/atlas/app/AtlasGuestGate";

export default async function AtlasNotificationsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <AtlasGuestGate
        title="Notifications"
        description="Sign in to see reactions, comments, and network activity."
        redirect="/atlas/notifications"
      />
    );
  }

  const person = await getPersonProfileByUserId(session.user.id);

  const items = [
    { icon: Heart, title: "Reactions & mentions", description: "When someone reacts to your posts.", href: "/atlas" },
    { icon: MessageSquare, title: "Comments", description: "Replies on your posts.", href: "/atlas" },
    { icon: Users, title: "Network", description: "Connections and followers.", href: "/atlas/network" },
    { icon: Briefcase, title: "Jobs", description: "Applications and job updates.", href: "/atlas/jobs" },
    { icon: Calendar, title: "Events", description: "Event registrations and reminders.", href: "/atlas/events" },
  ];

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="h-6 w-6 text-gold" />
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-muted">Activity across your ATLAS network</p>
        </div>
      </div>

      {person ? (
        <div className="space-y-3">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                href={item.href}
                className="flex items-start gap-4 p-4 rounded-xl border border-white/10 bg-white/5 hover:border-gold/20 transition-colors"
              >
                <div className="h-10 w-10 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-gold" />
                </div>
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted mt-0.5">{item.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="p-8 rounded-xl border border-white/10 bg-white/5 text-center">
          <p className="text-muted">Create your first post to activate notifications.</p>
          <Link href="/atlas/create-post" className="inline-block mt-4 text-gold hover:underline text-sm">
            Get started
          </Link>
        </div>
      )}
    </div>
  );
}
