# ATLAS Connect — Business Collaboration Platform

**Collaboration engine of ATLAS by NEXAR NETWORK**

> Connect is **not** a chat application. It is the collaboration platform where conversations become business actions — linking people, companies, products, documents, and workflows.

---

## Mission

Every business owns an ATLAS Connect workspace. Communication flows through channels and conversations that convert into tasks, leads, orders, invoices, meetings, and CRM opportunities.

---

## Architecture

| Layer | Location |
|-------|----------|
| Bounded context | `atlasConnect` (`id: atlas_connect`) |
| Module | `modules/atlas-connect/` |
| Database | `atlas_connect_*` |
| Port | `AtlasConnectPort` |
| Smart actions | `modules/atlas-connect/actions.ts` |
| AI contracts | `modules/atlas-connect/ai.ts` |
| Search contracts | `modules/atlas-connect/search.ts` |
| Notifications | `modules/atlas-connect/notifications.ts` |
| Security | `modules/atlas-connect/security.ts` |
| Realtime contracts | `modules/atlas-connect/realtime.ts` |
| Event handlers | `modules/atlas-connect/events.ts` |

### vs Network / Pulse

| | **Network** | **Pulse** | **Connect** |
|---|-------------|-----------|-------------|
| Purpose | Business social graph | Intelligence feed | Collaboration platform |
| Owns | Profiles, connections, posts | Feed items, trending | Workspaces, channels, meetings, tasks |
| Messaging | Legacy social DM tables (`Conversation`/`Message`) | — | Prefixed `Connect*` collaboration messages |

Connect never owns Business, Product, or Order masters — it **references** them via `atlas_connect_entity_references`.

---

## Root Entities

| Entity | Table |
|--------|-------|
| Workspace | `atlas_connect_workspaces` |
| WorkspaceMember | `atlas_connect_workspace_members` |
| Department / Team | `departments`, `teams` |
| Channel | `atlas_connect_channels` |
| Conversation | `atlas_connect_conversations` (`conversation_kind` covers business/customer/supplier/partner/department/project/support) |
| Participant | `atlas_connect_participants` |
| Message | `atlas_connect_messages` (voice/video via `message_type` + attachments) |
| Thread / Reaction / Attachment | `threads`, `message_reactions`, `attachments` |
| Announcement / PinnedMessage | `announcements`, `pinned_messages` |
| Meeting / Call | `meetings`, `calls` |
| Task / Approval | `tasks`, `approvals` |
| EntityReference | `entity_references` (quotation, invoice, order, payment, product…) |
| CalendarEvent | `calendar_events` |
| SharedFile | `shared_files` |
| MessageAction | `message_actions` (convert message → business entity) |
| AuditLog | `audit_logs` |
| NotificationPrefs | `notification_prefs` |
| DeviceSession | `device_sessions` |

---

## Channel Types

`general` · `sales` · `support` · `finance` · `hr` · `marketing` · `operations` · `development` · `management` · `announcements` · `marketplace` · `projects` · `private` · `public`

Default provisioned: General, Announcements, Sales, Support, Finance, HR, Marketplace.

---

## Message Types

Text, Image, Video, Voice, PDF, Document, Spreadsheet, Presentation, Product, Service, Marketplace Listing, Quotation, Invoice, Purchase Order, Payment Link, Wallet Transfer, Task, Calendar Event, Location, AI Response (+ Announcement, System).

---

## Smart Business Actions

`suggestMessageActions()` / `primaryActionForMessageType()` / `convertMessageAction()` map messages →:

| Action | Behavior |
|--------|----------|
| Task | Creates `atlas_connect_tasks` |
| Calendar Event | Creates `atlas_connect_calendar_events` |
| Lead / Customer / Supplier / Employee / Order / Invoice / CRM Opportunity / Business Note | Logged in `message_actions` with `pendingExternalCreate` — owning context creates master |

---

## Meetings & Calls

- Schedule / start / end meetings (`connect.meeting_*` events)
- Voice & video calls (`atlas_connect_calls`)
- Recording URL field + webinar-ready metadata
- Calendar integration via `calendar_events`

---

## AI Contracts

`CONNECT_AI_CAPABILITIES`: conversation/meeting summary, translation, suggested replies, task/decision extraction, generate quotation/contract/invoice, recommend next actions.

Stub: `createConnectAiStubResult()`. Heuristic: `recommendNextActionsFromMessage()`.

---

## Search

Scopes: messages, meetings, files, businesses, employees, products, orders, invoices, customers.

FTS indexes on message body, file names, announcements. Port: `search()`. Ranking: `rankSearchHits()`.

---

## Notifications

Channels: realtime, push, email, desktop, mention, priority alerts.

Prefs table + `resolveDeliveryChannels()` / `buildNotificationEnvelope()`.

---

## Security

- Encryption-ready columns: `is_encrypted`, `encryption_key_id` on messages & attachments
- Malware scan status on attachments
- Audit logs + permission audit helpers
- Device / session history table
- Spam assessment: `assessMessageSpam()`

---

## Realtime Contracts

Transport-agnostic channel names (WebSocket / SSE / Supabase Realtime):

```
connect:workspace:{id}
connect:conversation:{id}
connect:user:{id}
connect:meeting:{id}
connect:presence:{id}
```

Events: `message.sent`, `meeting.started`, `task.created`, `typing.*`, `presence.updated`, …

---

## Domain Events

| Event | When |
|-------|------|
| `connect.workspace_created` | Workspace provisioned |
| `connect.channel_created` | Channel created |
| `connect.conversation_created` | Conversation opened |
| `connect.message_sent` | Message sent |
| `connect.task_created` | Message → task |
| `connect.meeting_scheduled` / `started` / `ended` | Meetings |
| `connect.invoice_shared` / `order_shared` | Commerce shares |
| `connect.payment_requested` / `payment_completed` | Payments |

Ingested ecosystem events (`CONNECT_EVENT_HANDLERS`): `business.created`, `order.paid`, `invoice.issued`, `payment.confirmed`, `employee.hired`, `partner.accepted`.

---

## Permissions

| Permission | Purpose |
|------------|---------|
| `connect:workspace:read` / `manage` | Workspace access |
| `connect:channel:*` | Channel create/manage |
| `connect:conversation:*` | Conversations |
| `connect:message:*` | Send / read / react |
| `connect:task:*` / `approval:manage` | Tasks & approvals |
| `connect:meeting:*` | Schedule / join |
| `connect:file:*` | Shared files |
| `connect:action:convert` | Smart business actions |
| `connect:audit:read` | Audit trail |
| `connect:search` | Global Connect search |

Participant roles: owner, admin, manager, department_manager, finance, sales, hr, support, employee, guest.

---

## API Contract

```typescript
interface AtlasConnectPort {
  getWorkspace(businessId): Promise<ConnectWorkspaceRecord | null>;
  ensureWorkspace(input): Promise<ConnectWorkspaceRecord>;
  listChannels(workspaceId): Promise<ConnectChannelRecord[]>;
  listConversations(workspaceId, limit?): Promise<ConnectConversationRecord[]>;
  getMessages(conversationId, limit?): Promise<ConnectMessageRecord[]>;
  sendMessage(input): Promise<ConnectMessageRecord>;
  createConversation(input): Promise<ConnectConversationRecord>;
  scheduleMeeting(input): Promise<{ meetingId }>;
  convertToTask(input): Promise<{ taskId }>;
  search(input): Promise<ConnectSearchHitRecord[]>;
  suggestActions(message): Promise<ConnectSuggestedAction[]>;
  getPrimaryAction(messageType): Promise<string | null>;
}
```

REST / GraphQL / WebSocket / SDK / Mobile — ports first; transport in later phases.

---

## Monetization Hooks

`is_premium` on workspaces + `ConnectMonetizationFeature`:

- enterprise_collaboration · premium_workspaces · advanced_ai · large_file_storage · business_channels · video_meetings · ai_credits

---

## Auto-Provisioning

On `businesses` INSERT:

1. DB trigger `businesses_ensure_connect` creates workspace, members, **7 default channels**, General conversation, welcome message
2. App `ensureBusinessConnect()` mirrors idempotently (backfills missing channels)
3. Business Hub service calls ensure after create

---

## UI Roadmap

1. **Workspace home** — channels + recent conversations
2. **Channel / conversation view** — threaded messages with entity cards
3. **Smart action bar** — convert message → task/lead/invoice
4. **Meetings** — schedule, join, voice/video rooms
5. **Shared files browser** — contracts, invoices, catalogs
6. **Approvals inbox** — pending decisions
7. **Project channels** — tasks, milestones, timeline
8. **AI assist panel** — summaries, suggested replies, extraction
9. **Global Connect search** — messages, files, meetings, people
10. **Realtime presence** — typing, online, priority alerts

---

## Related

- [ATLAS Constitution](./ATLAS.md)
- [ATLAS Network](./ATLAS-NETWORK.md)
- [ATLAS Pulse](./ATLAS-PULSE.md)
