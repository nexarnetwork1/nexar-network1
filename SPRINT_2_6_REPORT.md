# Sprint 2.6 — ATLAS AI Integration

**Date:** August 7, 2026  
**Branch:** `authjs-migration`  
**Status:** Complete  
**Typecheck:** `npm run typecheck` — **PASS**

---

## Objective

Transform existing ATLAS AI into a platform-wide contextual assistant embedded across ATLAS surfaces — **not** a separate ChatGPT page or parallel AI module.

---

## Architecture (extended, not replaced)

| Layer | Approach |
|-------|----------|
| **AI engine** | Extended `modules/atlas-ai/` — `runCapability` now uses real OpenAI via `lib/ai/openai` when configured |
| **Prompts** | New `prompts-contextual.ts` maps UI actions → existing `AiCapability` enum |
| **LLM adapter** | New `llm.ts` reuses `createOpenAIClient`, `getOpenAIModel`, `isOpenAIConfigured` |
| **Server edge** | New `actions.ts` → `contextualAssistAction` with auth + RBAC + rate limit |
| **UI** | Reusable `AiAssistMenu` component wired into existing composers/forms |
| **Global assistant** | Unchanged `NexarAssistant` + `/api/assistant/stream` |

**No new AI module. No new chat application. No duplicate services.**

---

## Files modified / added

### Backend (`modules/atlas-ai/`)

| File | Change |
|------|--------|
| `prompts-contextual.ts` | **NEW** — All sprint action prompts + surface groupings |
| `llm.ts` | **NEW** — OpenAI completion adapter (demo fallback) |
| `actions.ts` | **NEW** — `contextualAssistAction` with permissions |
| `service.ts` | `runCapability` returns real `output` + `mode`; uses LLM when `assistAction` in context |
| `index.ts` | Export `contextualAssistAction` |

### Contracts

| File | Change |
|------|--------|
| `domains/contracts/ports.ts` | `AtlasAiPort.runCapability` returns `output` + backward-compat `stubOutput` |

### UI

| File | Integration |
|------|-------------|
| `components/atlas/ai/AiAssistMenu.tsx` | **NEW** — Reusable contextual AI dropdown |
| `components/atlas/app/PostComposer.tsx` | Post AI + Product AI (marketplace surface) |
| `components/atlas/app/feed/CommentThread.tsx` | Comment + reply AI |
| `components/atlas/app/MessagingInterface.tsx` | Message compose AI |
| `components/atlas/app/profile/ProfileEditForm.tsx` | Company/profile description AI |
| `components/atlas/app/JobPostForm.tsx` | Job posting AI |
| `components/atlas/app/network/NetworkSearchPage.tsx` | AI search assist (augments existing search) |

---

## AI integrations completed

### Posts (Post Composer)
| Action | Status |
|--------|--------|
| Generate Post | ✅ |
| Rewrite | ✅ |
| Improve Writing | ✅ |
| Summarize | ✅ |
| Translate | ✅ |
| Fix Grammar | ✅ |
| Generate Hashtags | ✅ |
| Generate Title | ✅ |
| Continue Writing | ✅ |

### Comments (Comment Thread)
| Action | Status |
|--------|--------|
| Rewrite Comment | ✅ |
| Summarize Thread | ✅ |
| Generate Reply | ✅ |
| Improve Writing | ✅ |

### Messages (Messaging Interface)
| Action | Status |
|--------|--------|
| Reply Suggestions | ✅ |
| Summarize Conversation | ✅ |
| Translate | ✅ |
| Improve Message | ✅ |

### Companies (Profile Edit)
| Action | Status |
|--------|--------|
| Generate Company Description | ✅ |
| Generate Mission | ✅ |
| Generate Vision | ✅ |
| Generate Announcement | ✅ |
| Generate Hiring Post | ✅ |
| Generate Product Description | ✅ |

### Marketplace (Post Composer — Product AI)
| Action | Status |
|--------|--------|
| Generate Product Description | ✅ |
| SEO Title | ✅ |
| SEO Keywords | ✅ |
| Specifications | ✅ |
| Marketing Text | ✅ |

### Jobs (Job Post Form)
| Action | Status |
|--------|--------|
| Generate Job Description | ✅ |
| Required Skills | ✅ |
| Responsibilities | ✅ |
| Interview Questions | ✅ |

### Search (Network Search)
| Action | Status |
|--------|--------|
| AI search assistant | ✅ (augments existing `searchNetworkAction`; does not replace it) |

---

## Existing services reused

| Service / Module | Reuse |
|------------------|-------|
| `modules/atlas-ai/service.ts` | `runCapability`, `getBusinessAiWorkspace`, credit ledger |
| `modules/atlas-ai/agents.ts` | `selectAgentForCapability` routing |
| `lib/ai/openai.ts` | `createOpenAIClient`, `getOpenAIModel`, `isOpenAIConfigured` |
| `lib/ai/rate-limit.ts` | `checkAssistantRateLimit` |
| `lib/auth/permissions.ts` | `requirePermission(profile, "ai:use")` |
| `modules/business-hub/repository.ts` | `getMembership` for business-scoped AI |
| `modules/ai/actions.ts` | Unchanged global assistant (complementary) |
| `domains/permissions/matrix.ts` | `ai:use`, `ai:agent:use`, `ai:credits:use` |

---

## Permissions verified

| Check | Implementation |
|-------|----------------|
| Auth required | `contextualAssistAction` rejects unauthenticated users |
| `ai:use` permission | Enforced via `requirePermission` |
| Business-scoped actions | `company`, `marketplace`, `job` surfaces require active business membership (or platform admin) |
| Rate limiting | IP rate limit via existing `checkAssistantRateLimit` |
| Data exposure | AI only receives user-provided text + explicit context props — **no** private message DB reads, financial records, or internal business data injected server-side |
| Prompt guardrails | System prompts instruct model not to invent private financial/confidential data |

---

## How it works

1. User clicks **ATLAS AI** menu on an existing surface (composer, comment, etc.)
2. Client calls `contextualAssistAction({ surface, action, text, context, businessId? })`
3. Server validates auth, permissions, surface-action allowlist, rate limit
4. If `businessId` + AI workspace exists → `runCapability` (credits deducted)
5. Else → `generateAssistCompletion` (user-level assist)
6. OpenAI used when `OPENAI_API_KEY` + `OPENAI_MODEL` configured; otherwise demo text
7. Result applied to the active field via `onApply` callback

---

## QA

```bash
npm run typecheck   # PASS (exit 0)
# npm run build     # NOT run per sprint instructions
```

---

## Remaining AI work (optional, out of sprint scope)

- Wire `AiAssistMenu` into Business Dashboard product forms (explicitly out of scope)
- Replace Connect AI stubs (`createConnectAiStubResult`) with `contextualAssistAction` when messaging backend is live
- Enforce `ai:credits:use` before workspace capability runs
- Load prompt templates from `atlas_ai_prompt_templates` DB table
- Implement `network.post_created` → `indexKnowledge` event handler
- Streaming in-context assists (reuse `/api/assistant/stream` pattern)
- `/dashboard/ai` workspace UI (documented in `docs/ATLAS-AI.md`, still placeholder)
- Real embedding provider (replace `stubEmbed` in vector search)
- Bridge `generateMerchantAssistantAction` → `contextualAssistAction` for legacy callers

---

*Sprint 2.6 embeds ATLAS AI across the platform using the existing pillar module — no parallel chatbot, no architecture redesign.*
