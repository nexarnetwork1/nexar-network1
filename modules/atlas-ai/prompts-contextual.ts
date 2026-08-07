/**
 * Contextual assist prompts — maps UI actions to ATLAS AI capabilities.
 */

import type { AiCapability } from "./types";

export type AiAssistSurface =
  | "post"
  | "comment"
  | "message"
  | "company"
  | "marketplace"
  | "job"
  | "search";

export type AiAssistAction =
  | "generate_post"
  | "rewrite"
  | "improve_writing"
  | "summarize"
  | "translate"
  | "fix_grammar"
  | "generate_hashtags"
  | "generate_title"
  | "continue_writing"
  | "rewrite_comment"
  | "summarize_thread"
  | "generate_reply"
  | "improve_comment"
  | "reply_suggestions"
  | "summarize_conversation"
  | "translate_message"
  | "improve_message"
  | "company_description"
  | "company_mission"
  | "company_vision"
  | "company_announcement"
  | "hiring_post"
  | "product_description"
  | "seo_title"
  | "seo_keywords"
  | "specifications"
  | "marketing_text"
  | "job_description"
  | "required_skills"
  | "responsibilities"
  | "interview_questions"
  | "search_assist";

const BASE_RULES =
  "You are ATLAS AI, the platform assistant for NEXAR NETWORK. Be concise, professional, and actionable. Never invent private financial data, internal credentials, or confidential business metrics. Output only the requested content without preamble.";

type AssistPrompt = {
  capability: AiCapability;
  system: string;
  buildUser: (text: string, context?: Record<string, unknown>) => string;
};

export const ASSIST_ACTION_LABELS: Record<AiAssistAction, string> = {
  generate_post: "Generate post",
  rewrite: "Rewrite",
  improve_writing: "Improve writing",
  summarize: "Summarize",
  translate: "Translate",
  fix_grammar: "Fix grammar",
  generate_hashtags: "Generate hashtags",
  generate_title: "Generate title",
  continue_writing: "Continue writing",
  rewrite_comment: "Rewrite comment",
  summarize_thread: "Summarize thread",
  generate_reply: "Generate reply",
  improve_comment: "Improve comment",
  reply_suggestions: "Reply suggestions",
  summarize_conversation: "Summarize conversation",
  translate_message: "Translate message",
  improve_message: "Improve message",
  company_description: "Company description",
  company_mission: "Mission statement",
  company_vision: "Vision statement",
  company_announcement: "Announcement",
  hiring_post: "Hiring post",
  product_description: "Product description",
  seo_title: "SEO title",
  seo_keywords: "SEO keywords",
  specifications: "Specifications",
  marketing_text: "Marketing text",
  job_description: "Job description",
  required_skills: "Required skills",
  responsibilities: "Responsibilities",
  interview_questions: "Interview questions",
  search_assist: "AI search assist",
};

const PROMPTS: Record<AiAssistAction, AssistPrompt> = {
  generate_post: {
    capability: "generate_content",
    system: `${BASE_RULES} Write an engaging professional social post.`,
    buildUser: (text, ctx) =>
      `Topic or notes:\n${text || "(none)"}\n${ctx?.companyName ? `Company: ${ctx.companyName}\n` : ""}Write a complete post.`,
  },
  rewrite: {
    capability: "generate_content",
    system: `${BASE_RULES} Rewrite the text while preserving meaning.`,
    buildUser: (text) => `Rewrite:\n${text}`,
  },
  improve_writing: {
    capability: "optimize",
    system: `${BASE_RULES} Improve clarity, tone, and professionalism.`,
    buildUser: (text) => `Improve:\n${text}`,
  },
  summarize: {
    capability: "summarize",
    system: `${BASE_RULES} Summarize key points briefly.`,
    buildUser: (text) => `Summarize:\n${text}`,
  },
  translate: {
    capability: "translate",
    system: `${BASE_RULES} Translate accurately; preserve tone.`,
    buildUser: (text, ctx) =>
      `Translate to ${(ctx?.targetLocale as string) ?? "English"}:\n${text}`,
  },
  fix_grammar: {
    capability: "optimize",
    system: `${BASE_RULES} Fix grammar and spelling only; minimal edits.`,
    buildUser: (text) => `Fix grammar:\n${text}`,
  },
  generate_hashtags: {
    capability: "generate_content",
    system: `${BASE_RULES} Return 5-10 relevant hashtags, space-separated.`,
    buildUser: (text) => `Generate hashtags for:\n${text}`,
  },
  generate_title: {
    capability: "generate_content",
    system: `${BASE_RULES} Return 3 title options, one per line.`,
    buildUser: (text) => `Generate titles for:\n${text}`,
  },
  continue_writing: {
    capability: "generate_content",
    system: `${BASE_RULES} Continue the text naturally for 2-4 sentences.`,
    buildUser: (text) => `Continue:\n${text}`,
  },
  rewrite_comment: {
    capability: "generate_content",
    system: `${BASE_RULES} Rewrite as a concise professional comment.`,
    buildUser: (text) => `Rewrite comment:\n${text}`,
  },
  summarize_thread: {
    capability: "summarize",
    system: `${BASE_RULES} Summarize the discussion thread.`,
    buildUser: (text, ctx) =>
      `Thread:\n${text}\n${ctx?.thread ? `\nAdditional:\n${ctx.thread}` : ""}`,
  },
  generate_reply: {
    capability: "generate_content",
    system: `${BASE_RULES} Write one thoughtful reply comment.`,
    buildUser: (text, ctx) =>
      `Post/context:\n${ctx?.parentComment ?? text}\n${text ? `Draft:\n${text}` : ""}`,
  },
  improve_comment: {
    capability: "optimize",
    system: `${BASE_RULES} Improve the comment tone and clarity.`,
    buildUser: (text) => `Improve comment:\n${text}`,
  },
  reply_suggestions: {
    capability: "recommend",
    system: `${BASE_RULES} Suggest 3 short reply options, numbered 1-3.`,
    buildUser: (text, ctx) =>
      `Conversation:\n${ctx?.conversation ?? text}\nDraft: ${text || "(empty)"}`,
  },
  summarize_conversation: {
    capability: "summarize",
    system: `${BASE_RULES} Summarize the conversation with action items.`,
    buildUser: (text, ctx) => `Conversation:\n${ctx?.conversation ?? text}`,
  },
  translate_message: {
    capability: "translate",
    system: `${BASE_RULES} Translate the message.`,
    buildUser: (text, ctx) =>
      `Translate to ${(ctx?.targetLocale as string) ?? "English"}:\n${text}`,
  },
  improve_message: {
    capability: "optimize",
    system: `${BASE_RULES} Improve message clarity and professionalism.`,
    buildUser: (text) => `Improve message:\n${text}`,
  },
  company_description: {
    capability: "generate_content",
    system: `${BASE_RULES} Write a professional company description (2-3 paragraphs).`,
    buildUser: (text, ctx) =>
      `Company: ${ctx?.companyName ?? "Business"}\nIndustry: ${ctx?.industry ?? "General"}\nNotes:\n${text}`,
  },
  company_mission: {
    capability: "generate_content",
    system: `${BASE_RULES} Write a concise mission statement (1-2 sentences).`,
    buildUser: (text, ctx) =>
      `Company: ${ctx?.companyName ?? "Business"}\nContext:\n${text}`,
  },
  company_vision: {
    capability: "generate_content",
    system: `${BASE_RULES} Write a forward-looking vision statement.`,
    buildUser: (text, ctx) =>
      `Company: ${ctx?.companyName ?? "Business"}\nContext:\n${text}`,
  },
  company_announcement: {
    capability: "generate_content",
    system: `${BASE_RULES} Write a professional company announcement post.`,
    buildUser: (text, ctx) =>
      `Company: ${ctx?.companyName ?? "Business"}\nTopic:\n${text}`,
  },
  hiring_post: {
    capability: "generate_content",
    system: `${BASE_RULES} Write a hiring announcement for ATLAS Network.`,
    buildUser: (text, ctx) =>
      `Role: ${ctx?.jobTitle ?? "Open role"}\nDetails:\n${text}`,
  },
  product_description: {
    capability: "generate_content",
    system: `${BASE_RULES} Write a compelling marketplace product description with bullet benefits.`,
    buildUser: (text, ctx) =>
      `Product: ${ctx?.productName ?? text}\nDetails:\n${text}`,
  },
  seo_title: {
    capability: "generate_content",
    system: `${BASE_RULES} Return an SEO-optimized title under 60 characters.`,
    buildUser: (text) => `Product/topic:\n${text}`,
  },
  seo_keywords: {
    capability: "extract",
    system: `${BASE_RULES} Return comma-separated SEO keywords (8-12).`,
    buildUser: (text) => `Topic:\n${text}`,
  },
  specifications: {
    capability: "extract",
    system: `${BASE_RULES} Return product specifications as a bullet list.`,
    buildUser: (text) => `Product info:\n${text}`,
  },
  marketing_text: {
    capability: "generate_content",
    system: `${BASE_RULES} Write short marketing copy with headline and CTA.`,
    buildUser: (text) => `Product/service:\n${text}`,
  },
  job_description: {
    capability: "generate_content",
    system: `${BASE_RULES} Write a complete job description with role overview.`,
    buildUser: (text, ctx) =>
      `Title: ${ctx?.jobTitle ?? "Role"}\nNotes:\n${text}`,
  },
  required_skills: {
    capability: "extract",
    system: `${BASE_RULES} List required skills as bullet points.`,
    buildUser: (text, ctx) =>
      `Role: ${ctx?.jobTitle ?? "Role"}\nContext:\n${text}`,
  },
  responsibilities: {
    capability: "generate_content",
    system: `${BASE_RULES} List key responsibilities as bullet points.`,
    buildUser: (text, ctx) =>
      `Role: ${ctx?.jobTitle ?? "Role"}\nContext:\n${text}`,
  },
  interview_questions: {
    capability: "generate_content",
    system: `${BASE_RULES} Provide 8 interview questions, numbered.`,
    buildUser: (text, ctx) =>
      `Role: ${ctx?.jobTitle ?? "Role"}\nContext:\n${text}`,
  },
  search_assist: {
    capability: "search",
    system: `${BASE_RULES} Help refine the search query and suggest 3 related searches. Be brief.`,
    buildUser: (text, ctx) =>
      `Query: ${text}\n${ctx?.resultSummary ? `Results summary: ${ctx.resultSummary}` : ""}`,
  },
};

export function buildAssistPrompt(input: {
  action: AiAssistAction;
  text: string;
  context?: Record<string, unknown>;
}): { capability: AiCapability; system: string; user: string } {
  const prompt = PROMPTS[input.action];
  return {
    capability: prompt.capability,
    system: prompt.system,
    user: prompt.buildUser(input.text, input.context),
  };
}

export const SURFACE_ACTIONS: Record<AiAssistSurface, AiAssistAction[]> = {
  post: [
    "generate_post",
    "rewrite",
    "improve_writing",
    "summarize",
    "translate",
    "fix_grammar",
    "generate_hashtags",
    "generate_title",
    "continue_writing",
  ],
  comment: ["rewrite_comment", "summarize_thread", "generate_reply", "improve_comment"],
  message: [
    "reply_suggestions",
    "summarize_conversation",
    "translate_message",
    "improve_message",
  ],
  company: [
    "company_description",
    "company_mission",
    "company_vision",
    "company_announcement",
    "hiring_post",
    "product_description",
  ],
  marketplace: [
    "product_description",
    "seo_title",
    "seo_keywords",
    "specifications",
    "marketing_text",
  ],
  job: ["job_description", "required_skills", "responsibilities", "interview_questions"],
  search: ["search_assist"],
};
