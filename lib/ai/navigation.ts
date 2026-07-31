import {
  filterActionsForRole,
  pickActionsForPage,
  pickActionsForTopic,
  NAVIGATION_ACTIONS,
} from "@/modules/ai/global-assistant/navigation-actions";
import { NAVIGATION_ALIASES } from "@/modules/ai/site-knowledge";
import type { AssistantAction, AssistantUserRole } from "@/modules/ai/global-assistant/types";
import type { GlobalAssistantAction } from "@/modules/ai/types";

export {
  filterActionsForRole,
  pickActionsForPage,
  pickActionsForTopic,
  NAVIGATION_ACTIONS,
} from "@/modules/ai/global-assistant/navigation-actions";

const NAVIGATION_VERBS =
  /^(?:take me to|go to|open|navigate to|show me|visit|bring me to|launch)\s+/i;

function normalize(text: string): string {
  return text.toLowerCase().trim();
}

export function resolveNavigationHref(query: string): string | null {
  const stripped = query.replace(NAVIGATION_VERBS, "").trim();
  const target = normalize(stripped);

  if (NAVIGATION_ALIASES[target]) return NAVIGATION_ALIASES[target];

  for (const [alias, href] of Object.entries(NAVIGATION_ALIASES)) {
    if (target.includes(alias)) return href;
  }

  for (const action of NAVIGATION_ACTIONS) {
    if (action.label.toLowerCase().includes(target) || target.includes(action.label.toLowerCase())) {
      return action.href;
    }
  }

  return null;
}

export function buildSuggestedActions(
  role: AssistantUserRole,
  options: {
    topic?: string;
    pageType?: string;
    content?: string;
    limit?: number;
  },
): GlobalAssistantAction[] {
  const { topic, pageType, content, limit = 5 } = options;
  let actions: AssistantAction[] = [];

  if (topic) {
    actions = pickActionsForTopic(topic, role, limit);
  } else if (pageType) {
    actions = pickActionsForPage(pageType, role);
  }

  if (actions.length < 2 && content) {
    const lower = content.toLowerCase();
    for (const action of NAVIGATION_ACTIONS) {
      if (action.roles && !action.roles.includes(role)) continue;
      const matched = action.keywords?.some((kw) => lower.includes(kw));
      if (matched && !actions.some((a) => a.href === action.href)) {
        actions.push(action);
      }
    }
  }

  if (actions.length < 2) {
    actions = filterActionsForRole(role, limit);
  }

  return actions.slice(0, limit).map(({ label, href, kind, prompt }) => ({
    label,
    href,
    kind,
    prompt,
  }));
}

export function detectNavigationIntent(message: string): string | null {
  if (NAVIGATION_VERBS.test(message) || normalize(message).startsWith("open ")) {
    return resolveNavigationHref(message);
  }
  return null;
}
