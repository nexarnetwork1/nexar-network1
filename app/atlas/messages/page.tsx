import { auth } from "@/auth";
import { AtlasGuestGate } from "@/components/atlas/app/AtlasGuestGate";
import { MessagingInterface } from "@/components/atlas/app/MessagingInterface";
import { fetchAtlasInboxAction } from "@/modules/atlas-connect/atlas-actions";

type PageProps = {
  searchParams: Promise<{ conversation?: string }>;
};

export default async function AtlasMessagesPage({ searchParams }: PageProps) {
  const session = await auth();
  const { conversation: initialConversationId } = await searchParams;

  if (!session?.user?.id) {
    return (
      <AtlasGuestGate
        title="Messages"
        description="Sign in to access ATLAS Connect messaging across your workspaces."
        redirect="/atlas/messages"
      />
    );
  }

  const conversations = await fetchAtlasInboxAction().catch(() => []);

  return (
    <div className="py-2">
      <MessagingInterface
        conversations={conversations}
        initialConversationId={initialConversationId}
        currentUserId={session.user.id}
      />
    </div>
  );
}
