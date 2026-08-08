"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  getConversationsForUser,
  getMessagesByConversation,
  updateParticipantLastRead,
  type ConnectInboxConversation,
} from "./repository";
import { sendMessage } from "./service";

export type AtlasInboxConversation = ConnectInboxConversation;

export type AtlasMessageView = {
  id: string;
  body: string | null;
  senderUserId: string | null;
  sentAt: string;
  isOwn: boolean;
};

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Sign in required");
  return session.user.id;
}

export async function fetchAtlasInboxAction(): Promise<AtlasInboxConversation[]> {
  const userId = await requireUserId();
  return getConversationsForUser(userId, 50);
}

export async function fetchAtlasMessagesAction(input: {
  conversationId: string;
  limit?: number;
}): Promise<AtlasMessageView[]> {
  const userId = await requireUserId();
  const messages = await getMessagesByConversation(input.conversationId, input.limit ?? 50);

  return messages
    .slice()
    .reverse()
    .map((message) => ({
      id: message.id,
      body: message.body,
      senderUserId: message.sender_user_id,
      sentAt: message.sent_at,
      isOwn: message.sender_user_id === userId,
    }));
}

export async function sendAtlasMessageAction(input: {
  conversationId: string;
  body: string;
}): Promise<{ success: boolean; messageId?: string }> {
  const userId = await requireUserId();
  const trimmed = input.body.trim();
  if (!trimmed) throw new Error("Message cannot be empty");

  const message = await sendMessage({
    conversationId: input.conversationId,
    senderUserId: userId,
    messageType: "text",
    body: trimmed,
  });

  revalidatePath("/atlas/messages");
  return { success: true, messageId: message.id };
}

export async function markAtlasConversationReadAction(
  conversationId: string,
): Promise<void> {
  const userId = await requireUserId();
  await updateParticipantLastRead(conversationId, userId);
  revalidatePath("/atlas/messages");
}
