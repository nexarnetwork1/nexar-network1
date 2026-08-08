"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  MoreVertical,
  Phone,
  Video,
  Paperclip,
  Send,
  Users,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useCommerceAuth } from "@/components/commerce/auth/NexarCommerceAuthProvider";
import { AiAssistMenu } from "@/components/atlas/ai/AiAssistMenu";
import Link from "next/link";
import { ATLAS_ECOSYSTEM_LINKS } from "@/config/atlas-app-nav";
import type { AtlasInboxConversation, AtlasMessageView } from "@/modules/atlas-connect/atlas-actions";
import {
  fetchAtlasMessagesAction,
  markAtlasConversationReadAction,
  sendAtlasMessageAction,
} from "@/modules/atlas-connect/atlas-actions";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";

interface MessagingInterfaceProps {
  conversations: AtlasInboxConversation[];
  initialConversationId?: string;
  currentUserId: string;
}

function displayTitle(conversation: AtlasInboxConversation) {
  return conversation.title ?? conversation.workspaceName ?? "Conversation";
}

function ConnectMessageRealtime({
  conversationId,
  currentUserId,
  onMessage,
}: {
  conversationId: string;
  currentUserId: string;
  onMessage: (message: AtlasMessageView) => void;
}) {
  useRealtimeSubscription<{
    id: string;
    conversation_id: string;
    body: string | null;
    sender_user_id: string | null;
    sent_at: string;
  }>(`connect-messages:${conversationId}`, {
    table: "atlas_connect_messages",
    filter: `conversation_id=eq.${conversationId}`,
    event: "INSERT",
    onInsert: (row) => {
      onMessage({
        id: row.id,
        body: row.body,
        senderUserId: row.sender_user_id,
        sentAt: row.sent_at,
        isOwn: row.sender_user_id === currentUserId,
      });
    },
  });
  return null;
}

export function MessagingInterface({
  conversations: initialConversations,
  initialConversationId,
  currentUserId,
}: MessagingInterfaceProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { openCommerceAuth } = useCommerceAuth();
  const [conversations, setConversations] = useState(initialConversations);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialConversationId ?? initialConversations[0]?.id ?? null,
  );
  const [messages, setMessages] = useState<AtlasMessageView[]>([]);
  const [messageDraft, setMessageDraft] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [, startTransition] = useTransition();

  const selectedConversation = conversations.find((c) => c.id === selectedId) ?? null;

  const handleInteraction = () => {
    if (!session) {
      openCommerceAuth({
        mode: "signin",
        redirect: "/atlas/messages",
        message: "Sign in to message on ATLAS",
      });
    }
  };

  const loadMessages = useCallback(async (conversationId: string) => {
    setLoadingMessages(true);
    try {
      const rows = await fetchAtlasMessagesAction({ conversationId });
      setMessages(rows);
      await markAtlasConversationReadAction(conversationId);
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c)),
      );
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId) void loadMessages(selectedId);
  }, [selectedId, loadMessages]);

  const handleSend = async () => {
    if (!selectedId || !messageDraft.trim() || sending) return;
    setSending(true);
    const body = messageDraft.trim();
    setMessageDraft("");

    const optimistic: AtlasMessageView = {
      id: `temp-${Date.now()}`,
      body,
      senderUserId: currentUserId,
      sentAt: new Date().toISOString(),
      isOwn: true,
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      await sendAtlasMessageAction({ conversationId: selectedId, body });
      startTransition(() => router.refresh());
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setMessageDraft(body);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {selectedId ? (
        <ConnectMessageRealtime
          conversationId={selectedId}
          currentUserId={currentUserId}
          onMessage={(message) => {
            setMessages((prev) => {
              if (prev.some((m) => m.id === message.id)) return prev;
              return [...prev, message];
            });
            if (message.senderUserId !== currentUserId) {
              void markAtlasConversationReadAction(selectedId);
            }
          }}
        />
      ) : null}

      <div className="h-[calc(100dvh-4rem)] flex flex-col md:flex-row overflow-hidden">
        <div
          className={`${
            selectedConversation ? "hidden md:flex" : "flex"
          } w-full md:w-80 md:shrink-0 border-r border-border flex-col min-h-0 bg-chrome`}
        >
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold">Messages</h1>
              <button type="button" className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                <Users className="h-5 w-5" />
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <input
                type="text"
                placeholder="Search messages..."
                onFocus={() => router.push("/atlas/search?type=messages")}
                readOnly
                className="w-full nxr-input pl-10 cursor-pointer"
              />
            </div>
          </div>

          <nav className="px-4 pb-3 flex flex-wrap gap-2 border-b border-border" aria-label="ATLAS ecosystem">
            {ATLAS_ECOSYSTEM_LINKS.filter((link) => link.href !== "/atlas/messages").map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs px-2.5 py-1 rounded-full border border-white/10 text-muted hover:text-white hover:border-gold/20 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex-1 overflow-y-auto">
            {conversations.length > 0 ? (
              conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => setSelectedId(conversation.id)}
                  className={`w-full p-4 border-b border-border hover:bg-white/[0.04] transition-colors duration-150 text-left ${
                    selectedId === conversation.id ? "bg-white/[0.04]" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gold/10 flex items-center justify-center">
                      <Users className="h-6 w-6 text-gold/30" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{displayTitle(conversation)}</p>
                      <p className="text-sm text-muted truncate">
                        {conversation.lastMessagePreview ?? "No messages yet"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-xs text-muted">
                        {conversation.lastMessageAt
                          ? new Date(conversation.lastMessageAt).toLocaleDateString()
                          : "—"}
                      </span>
                      {conversation.unreadCount > 0 && (
                        <span className="text-[10px] font-bold bg-gold text-black rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center">
                          {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-8 text-center">
                <p className="text-muted mb-4">No conversations yet</p>
                <p className="text-sm text-muted mb-4">
                  Workspace messages appear here when your business uses ATLAS Connect.
                </p>
                <button
                  type="button"
                  onClick={handleInteraction}
                  className="px-4 py-2 rounded-lg bg-gold/10 border border-gold/30 text-gold text-sm font-medium hover:bg-gold/20 transition-colors"
                >
                  Sign in to connect
                </button>
              </div>
            )}
          </div>
        </div>

        <div
          className={`${
            selectedConversation ? "flex" : "hidden md:flex"
          } flex-1 flex-col min-h-0 min-w-0`}
        >
          {selectedConversation ? (
            <>
              <div className="p-4 border-b border-border flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => setSelectedId(null)}
                    className="md:hidden p-2 -ml-2 rounded-lg hover:bg-white/5 transition-colors shrink-0"
                    aria-label="Back to conversations"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <div className="h-10 w-10 rounded-full bg-gold/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-gold/30" />
                  </div>
                  <div>
                    <p className="font-semibold">{displayTitle(selectedConversation)}</p>
                    <p className="text-xs text-muted">{selectedConversation.workspaceName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                    <Phone className="h-5 w-5 text-muted" />
                  </button>
                  <button type="button" className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                    <Video className="h-5 w-5 text-muted" />
                  </button>
                  <button type="button" className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                    <MoreVertical className="h-5 w-5 text-muted" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loadingMessages ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gold" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-sm text-muted py-8">No messages yet. Say hello.</div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isOwn ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md p-3 rounded-2xl text-sm ${
                          message.isOwn
                            ? "rounded-tr-none bg-gold/20 border border-gold/30"
                            : "rounded-tl-none bg-surface-2 border border-border"
                        }`}
                      >
                        {message.body}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 border-t border-border space-y-2">
                <div className="flex items-center gap-2">
                  <button type="button" className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                    <Paperclip className="h-5 w-5 text-muted" />
                  </button>
                  <input
                    type="text"
                    value={messageDraft}
                    onChange={(e) => setMessageDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void handleSend();
                      }
                    }}
                    placeholder="Type a message..."
                    className="flex-1 nxr-input"
                  />
                  <button
                    type="button"
                    onClick={() => void handleSend()}
                    disabled={sending || !messageDraft.trim()}
                    className="p-2 rounded-lg bg-gold/10 border border-gold/30 text-gold hover:bg-gold/20 transition-colors disabled:opacity-50"
                  >
                    {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  </button>
                </div>
                {session && (
                  <AiAssistMenu
                    surface="message"
                    text={messageDraft}
                    context={{
                      conversation: messages.map((m) => m.body ?? "").join("\n"),
                    }}
                    onApply={(content) => setMessageDraft(content)}
                    label="AI assist"
                  />
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Users className="h-16 w-16 text-muted mx-auto mb-4" />
                <p className="text-muted mb-2">Select a conversation</p>
                <p className="text-sm text-muted">Choose a conversation from the list to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
