"use client";

import { useState } from "react";
import { Search, MoreVertical, Phone, Video, Paperclip, Send, Users } from "lucide-react";
import { useSession } from "next-auth/react";
import { PremiumAuthModal } from "@/components/premium/PremiumAuthModal";
import Link from "next/link";

interface Conversation {
  id: string;
  participants?: any[];
  messages?: any[];
  updated_at?: string;
}

interface MessagingInterfaceProps {
  conversations: Conversation[];
}

export function MessagingInterface({ conversations }: MessagingInterfaceProps) {
  const { data: session } = useSession();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  const handleInteraction = () => {
    if (!session) {
      setShowAuthModal(true);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Conversations List */}
      <div className="w-80 border-r border-white/10 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">Messages</h1>
            <button className="p-2 rounded-lg hover:bg-white/5 transition-colors">
              <Users className="h-5 w-5" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input
              type="text"
              placeholder="Search messages..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-muted focus:outline-none focus:border-gold/50 transition-colors text-sm"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length > 0 ? (
            conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => setSelectedConversation(conversation)}
                className={`w-full p-4 border-b border-white/10 hover:bg-white/5 transition-colors text-left ${
                  selectedConversation?.id === conversation.id ? "bg-white/5" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gold/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-gold/30" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">
                      {conversation.participants?.[0]?.user?.name || "Conversation"}
                    </p>
                    <p className="text-sm text-muted truncate">
                      Last message...
                    </p>
                  </div>
                  <span className="text-xs text-muted">
                    {conversation.updated_at ? new Date(conversation.updated_at).toLocaleDateString() : "Today"}
                  </span>
                </div>
              </button>
            ))
          ) : (
            <div className="p-8 text-center">
              <p className="text-muted mb-4">No conversations yet</p>
              <button
                onClick={handleInteraction}
                className="px-4 py-2 rounded-lg bg-gold/10 border border-gold/30 text-gold text-sm font-medium hover:bg-gold/20 transition-colors"
              >
                Start a conversation
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gold/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-gold/30" />
                </div>
                <div>
                  <p className="font-semibold">
                    {selectedConversation.participants?.[0]?.user?.name || "Conversation"}
                  </p>
                  <p className="text-xs text-muted">Online</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <Phone className="h-5 w-5 text-muted" />
                </button>
                <button className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <Video className="h-5 w-5 text-muted" />
                </button>
                <button className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <MoreVertical className="h-5 w-5 text-muted" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="flex justify-center">
                <span className="text-xs text-muted bg-white/5 px-3 py-1 rounded-full">
                  Today
                </span>
              </div>
              <div className="flex justify-start">
                <div className="max-w-xs lg:max-w-md p-3 rounded-2xl rounded-tl-none bg-white/10">
                  <p className="text-sm">Hello! How can I help you today?</p>
                </div>
              </div>
              <div className="flex justify-end">
                <div className="max-w-xs lg:max-w-md p-3 rounded-2xl rounded-tr-none bg-gold/20 border border-gold/30">
                  <p className="text-sm">I have a question about your services.</p>
                </div>
              </div>
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-white/10">
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <Paperclip className="h-5 w-5 text-muted" />
                </button>
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-muted focus:outline-none focus:border-gold/50 transition-colors"
                />
                <button className="p-2 rounded-lg bg-gold/10 border border-gold/30 text-gold hover:bg-gold/20 transition-colors">
                  <Send className="h-5 w-5" />
                </button>
              </div>
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

      {showAuthModal && (
        <PremiumAuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      )}
    </div>
  );
}
