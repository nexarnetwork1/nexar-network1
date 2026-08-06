# ATLAS AI — Business Intelligence Engine

**Operating intelligence of ATLAS by NEXAR NETWORK**

> ATLAS AI is **not** a chatbot. It is the intelligence layer that understands the business, connects modules, and automates operations — provider-agnostic and LLM-ready.

---

## Mission

Every business owns an ATLAS AI workspace with specialized agents, memory, knowledge, workflows, and insights. AI is native across Business, Marketplace, Wallet, CRM, Finance, Inventory, Network, Connect, and Pulse.

---

## Architecture

| Layer | Location |
|-------|----------|
| Bounded context | `atlasAi` (`id: atlas_ai`) |
| Module | `modules/atlas-ai/` |
| Database | `atlas_ai_*` |
| Port | `AtlasAiPort` |
| Agents | `modules/atlas-ai/agents.ts` |
| Memory | `modules/atlas-ai/memory.ts` |
| Vector | `modules/atlas-ai/vector.ts` |
| Workflows | `modules/atlas-ai/workflows.ts` |
| Event handlers | `modules/atlas-ai/events.ts` |

Legacy `modules/ai` assistant stubs remain under context `ai` until absorbed — new intelligence features belong in `atlasAi`.

### vs Network / Pulse / Connect

| | **Network** | **Pulse** | **Connect** | **AI** |
|---|-------------|-----------|-------------|--------|
| Purpose | Social graph | Intelligence feed | Collaboration | Operating intelligence |
| Owns | Profiles, posts | Feed items | Workspaces, channels | Agents, memory, workflows, insights |

AI never owns Business/Product/Order masters — it indexes references into knowledge/vector stores and orchestrates via ports.

---

## Root Entities

| Entity | Table |
|--------|-------|
| AIWorkspace | `atlas_ai_workspaces` |
| BusinessContext | `atlas_ai_business_contexts` |
| AIAgent | `atlas_ai_agents` |
| Conversation / Message | `atlas_ai_conversations`, `atlas_ai_messages` |
| Memory | `atlas_ai_memories` |
| Knowledge / VectorDocument | `atlas_ai_knowledge_items`, `atlas_ai_vector_documents` |
| Embedding / Model | `atlas_ai_embeddings`, `atlas_ai_models` |
| Prompt / Template | `atlas_ai_prompts`, `atlas_ai_prompt_templates` |
| Tool | `atlas_ai_tools` |
| Workflow / Automation | `atlas_ai_workflows`, `atlas_ai_automations` |
| Task / PlannedAction / Execution | `tasks`, `planned_actions`, `executions` |
| Insight / Recommendation / Prediction / Report | respective tables |
| CreditLedger | `atlas_ai_credit_ledger` |

---

## System Agents

CEO · Sales · Marketing · Finance · HR · Support · Legal · Operations · Inventory · Analytics · Developer

Capability routing: `selectAgentForCapability()` in `agents.ts`.

---

## Capabilities

generate_content · summarize · translate · analyze · predict · forecast · recommend · search · classify · extract · automate · optimize

Business automation templates (system prompts): quotations, contracts, invoices, emails, reports, business plans, product descriptions, marketing campaigns, job posts.

---

## Workflows

Default **Order Created Pipeline**:

1. Notify Team → 2. Generate Invoice → 3. Update Analytics → 4. Update CRM → 5. Notify Customer → 6. Schedule Follow-up

Triggered by `order.placed` / `order.paid`. Side-effects plug into owning modules via ports (foundation executes + records steps).

---

## Memory & Vector

- Scopes: user · business · conversation · workspace · long_term
- Vector: JSONB + `pgvector(1536)` HNSW; `stubEmbed()` for foundation tests
- Semantic search = lexical knowledge + cosine ranking

---

## Domain Events

| Event | When |
|-------|------|
| `ai.workspace_created` | Workspace provisioned |
| `ai.conversation_created` | AI session opened |
| `ai.task_created` | Capability task created |
| `ai.insight_generated` | Insight stored |
| `ai.prediction_generated` | Prediction stored |
| `ai.report_generated` | Report stored |
| `ai.recommendation_created` | Recommendation stored |
| `ai.workflow_executed` | Workflow run completed |
| `ai.automation_executed` | Automation fired |

Ingested: `business.created`, `order.placed`, `order.paid`, `invoice.issued`, `payment.confirmed`, `employee.hired`, `product.published`.

---

## Permissions

`ai:workspace:*` · `ai:agent:*` · `ai:conversation:*` · `ai:memory:*` · `ai:knowledge:*` · `ai:workflow:*` · `ai:automation:manage` · `ai:insight:read` · `ai:prediction:read` · `ai:report:generate` · `ai:search` · `ai:credits:use` (+ legacy `ai:use`)

---

## API Contract

```typescript
interface AtlasAiPort {
  getWorkspace(businessId): Promise<AiWorkspaceRecord | null>;
  ensureWorkspace(input): Promise<AiWorkspaceRecord>;
  listAgents(workspaceId): Promise<AiAgentRecord[]>;
  startConversation(input): Promise<AiConversationRecord>;
  runCapability(input): Promise<{ taskId; executionId; stubOutput }>;
  semanticSearch(input): Promise<{ lexical; vector }>;
  generateInsight(input): Promise<AiInsightRecord>;
  executeWorkflow(input): Promise<{ executionId }>;
}
```

REST / GraphQL / Realtime / SDK / Streaming — ports first; LLM provider adapters later.

---

## Monetization

`ai_credits_balance` + plans: free · credits · premium · enterprise · private_models

Features: AI Credits · Premium AI · Enterprise AI · Private Models · Business Agents · Custom Agents · Automation Packs

---

## Auto-Provisioning

On `businesses` INSERT:

1. DB trigger creates workspace, business context, 11 system agents, order-created workflow + automation
2. App `ensureBusinessAi()` mirrors idempotently
3. Business Hub calls ensure after create

---

## UI Roadmap

1. AI workspace home — agents + credits
2. Agent console — capability runner
3. Conversation studio — streaming (provider-backed)
4. Knowledge browser — index & search
5. Workflow designer — visual steps
6. Insights dashboard — forecasts & health score
7. Memory inspector — scoped memories
8. Automation packs marketplace
9. Model / provider settings (BYO / private)
10. Report gallery

---

## Related

- [ATLAS Constitution](./ATLAS.md)
- [ATLAS Connect](./ATLAS-CONNECT.md)
- [ATLAS Pulse](./ATLAS-PULSE.md)
- [ATLAS Network](./ATLAS-NETWORK.md)
