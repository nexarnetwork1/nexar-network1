# Sprint 2.1 — ATLAS Feed Core

**Date:** August 7, 2026  
**Scope:** ATLAS Network social feed (`/atlas`) only  
**Status:** TypeScript check passed (`npm run typecheck`)

---

## Objective

Transform the existing ATLAS feed into a production-ready social feed while preserving architecture, reusing `modules/atlas-network` backend, and gating guest interactions through the existing commerce auth modal (no redirects).

---

## Files Modified

| File | Change |
|------|--------|
| `app/atlas/page.tsx` | Pass `initialHasMore` to feed for pagination |
| `components/atlas/app/SocialFeed.tsx` | Refactored to use feed subcomponents, infinite scroll, error state |
| `components/atlas/app/PostComposer.tsx` | Full composer polish (drag-drop, visibility, drafts, emoji, etc.) |
| `modules/atlas-network/actions.ts` | Added read-only `fetchNetworkFeedAction` (pagination wrapper) |

## Files Created

| File | Purpose |
|------|---------|
| `components/atlas/app/feed/feed-utils.ts` | Timestamps, visibility, comment tree, drafts, saved posts, reaction totals |
| `components/atlas/app/feed/feed-rich-text.tsx` | Hashtag / mention rendering |
| `components/atlas/app/feed/AutoResizeTextarea.tsx` | Auto-growing composer textarea |
| `components/atlas/app/feed/EmojiPicker.tsx` | Lightweight emoji popover |
| `components/atlas/app/feed/FeedSkeleton.tsx` | Feed loading skeletons |
| `components/atlas/app/feed/PostMediaGallery.tsx` | Image grid, lightbox, video, PDF preview, document download |
| `components/atlas/app/feed/ReactionPicker.tsx` | Like / Celebrate / Support picker |
| `components/atlas/app/feed/PostMenu.tsx` | Copy link, share, save, report menu |
| `components/atlas/app/feed/CommentThread.tsx` | Nested replies, emoji, load more replies |
| `components/atlas/app/feed/FeedPostCard.tsx` | Full post card with actions and metadata |

---

## Components Updated

### PostComposer (`/atlas/create-post`)

| Requirement | Status |
|-------------|--------|
| Text | ✅ |
| Images / multiple images | ✅ Multi-select + grid preview |
| Video | ✅ |
| PDF / documents | ✅ |
| Polls | ✅ 2–6 options |
| Company announcement | ✅ |
| Drag & drop upload | ✅ `react-dropzone` |
| File picker | ✅ |
| Media preview / remove | ✅ |
| Character counter | ✅ 10,000 max (schema-aligned) |
| Auto-resize textarea | ✅ |
| Emoji picker | ✅ |
| Visibility selector | ✅ Uses `visibility` on create actions |
| Draft support | ✅ localStorage auto-save + manual save |

### FeedPostCard + SocialFeed

| Requirement | Status |
|-------------|--------|
| Avatar, username, company, verified, timestamp | ✅ |
| Edited badge | ✅ `updated_at` vs `created_at` |
| Visibility label | ✅ |
| Post menu | ✅ Copy link, share, save, report |
| Body + hashtags/mentions styling | ✅ Client-side highlight |
| Image gallery + lightbox + lazy load | ✅ |
| Video native player | ✅ |
| PDF preview + download | ✅ iframe + download link |
| Document icon + download | ✅ |
| Like / Celebrate / Support | ✅ `togglePostReactionAction` |
| Comment / reply | ✅ Nested via `parentId` |
| Share / save / copy link | ✅ Web Share API + clipboard |
| Report | ⚠️ UI + toast (no server API yet) |
| Infinite scroll | ✅ `fetchNetworkFeedAction` + intersection observer |
| Skeleton loading | ✅ |
| Empty state | ✅ |
| Error state + retry | ✅ |
| Guest browse / modal on interact | ✅ `openCommerceAuth` |

### CommentThread

| Requirement | Status |
|-------------|--------|
| Nested replies | ✅ Tree from flat list |
| Mentions display | ✅ Styled in body |
| Emoji in comments | ✅ |
| Edit own comment | ❌ No backend action |
| Delete own comment | ❌ No backend action |
| Load more replies | ✅ Per-thread expand |

---

## Backend Reused (unchanged logic)

All write paths use existing server actions:

- `createAtlasPostAction` — text, media, announcement (+ `visibility`)
- `createAtlasPollPostAction` — polls (+ `visibility`)
- `uploadNetworkMediaAction` — Supabase `product-images` bucket
- `addPostCommentAction` — comments + `parentId` for replies
- `togglePostReactionAction` — like / celebrate / support / etc.
- `votePollAction` — poll votes

Read paths:

- `getNetworkPosts` (SSR on `/atlas`) — initial 20 posts
- `fetchNetworkFeedAction` (new read wrapper) — paginated load more

Repository / service / validators / DB schema were **not** modified.

---

## Guest Permissions

- Guests can browse `/atlas` (public posts SSR).
- All protected actions (react, comment, vote, compose, save) call `openCommerceAuth({ mode: "signin", redirect, message })` — **modal only, no redirect away**.

---

## Responsive

Feed layout preserved: `max-w-2xl` centered column, existing `AtlasAppShell` unchanged. Composer and post cards use responsive grids and flex-wrap for mobile/tablet/desktop.

---

## Remaining Work for Feed

1. **Comment edit / delete** — needs `updateCommentAction` / `deleteCommentAction` + repository methods (schema has `deleted_at`).
2. **Post edit / delete** — no update/delete post actions yet.
3. **Server-side bookmarks & reports** — `atlas_network_bookmarks` / `atlas_network_reports` tables exist; need repository + actions (save currently uses localStorage).
4. **Server-side share / repost** — `atlas_network_shares` table unused.
5. **Hashtag / mention persistence** — parsing is UI-only; `atlas_network_hashtags`, `atlas_network_mentions` unused.
6. **Comment reaction UI** — backend supports comment reactions; no picker on comments yet.
7. **Poll vote refresh** — vote succeeds but counts refresh only on page reload (no optimistic poll update).
8. **Draft sync to server** — drafts are client localStorage only; `publish: false` exists in repo but not exposed in actions.
9. **Post detail route** — `/atlas/posts/[id]` for deep links (hash `#post-{id}` works on feed only).
10. **RBAC enforcement** — `domains/permissions/matrix.ts` network permissions not checked in actions yet.
11. **Initial feed loading skeleton** — SSR renders posts immediately; skeleton shows only on infinite scroll load.

---

## Verification

```bash
npm run typecheck   # ✅ exit 0
# npm run build     # intentionally not run per sprint instructions
```

---

## Architecture Notes

- No Nexar marketing pages modified.
- Jobs, Events, Marketplace, Business, Wallet, Presale, Auth modules untouched.
- Feed logic extracted into `components/atlas/app/feed/*` without duplicating domain rules.
- Single feed data source: `modules/atlas-network` → Supabase `atlas_network_*` tables.
