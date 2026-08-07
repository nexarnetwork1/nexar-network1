# Sprint 2.2 — Profiles & Network

**Date:** August 7, 2026  
**Branch:** `authjs-migration`  
**Status:** Complete  
**Typecheck:** `npm run typecheck` — **PASS**

---

## Objective

Turn the existing ATLAS profile system into a complete professional social identity and finish network interactions (follow, connect, search) without redesigning architecture or touching out-of-scope modules.

---

## Scope respected (not modified)

- Homepage, Presale, Marketplace, Business Dashboard, Wallet, AI, Jobs, Events
- Feed architecture and `SocialFeed` implementation (FeedPostCard reused read-only for profile Posts tab)

---

## Backend (extended, not replaced)

### `modules/atlas-network/types.ts`
- `NetworkProfileData`, `NetworkProfileView`, `NetworkSearchResult`
- `is_incoming_pending` on profile view for connection request UX

### `modules/atlas-network/validators.ts`
- `updatePersonProfileSchema` — profile edit validation
- `searchNetworkSchema` — people / companies / posts search
- `connectionIdSchema`
- Removed duplicate `postMediaSchema` definition

### `modules/atlas-network/repository.ts`
- Profile: `updateNetworkProfileRecord`, `updatePersonProfileRecord`, `getPersonProfileByNetworkProfileId`, `getProfileView`
- Follow: `isFollowing`, `deleteFollowRecord`, follower/following count helpers, `listFollowers`, `listFollowing`
- Connections: `getConnectionById`, `getConnectionBetweenProfiles`, `listConnections`, `listPendingConnectionRequests`, `countConnections`
- Discovery: `searchNetworkProfiles`, `searchNetworkPosts`, `getSuggestedProfiles`, `getSuggestedCompanies`, `getMutualConnections`, `getActivitiesForProfile`

### `modules/atlas-network/service.ts`
- `unfollowTarget`, `updatePersonNetworkProfile`, `declineConnection`, `removeConnection`
- `followTarget` now increments follower's `following_count`

### `modules/atlas-network/actions.ts`
- Profile: `getNetworkProfileViewAction`, `updateNetworkProfileAction`
- Network: `followProfileAction`, `unfollowProfileAction`, `requestConnectionAction`, `acceptConnectionAction`, `declineConnectionAction`, `removeConnectionAction`
- Search & tabs: `searchNetworkAction`, `fetchProfilePostsAction`, `fetchProfileActivityAction`, `fetchProfileConnectionsAction`, `fetchPendingConnectionsAction`, `fetchProfileFollowersAction`, `fetchProfileFollowingAction`, `fetchMutualConnectionsAction`
- Fixed `acceptConnectionAction` authorization (recipient-only) and void return bug

### `domains/events/catalog.ts`
- Added: `network.follow_removed`, `network.profile_updated`, `network.connection_declined`

---

## UI components (new)

| Component | Path | Purpose |
|-----------|------|---------|
| `ProfileHeader` | `components/atlas/app/profile/ProfileHeader.tsx` | Cover, avatar, stats, follow/connect/edit actions |
| `ProfileView` | `components/atlas/app/profile/ProfileView.tsx` | Tabbed profile (Posts, Media, Documents, Activity, About, Connections, Companies) |
| `ProfileEditForm` | `components/atlas/app/profile/ProfileEditForm.tsx` | Edit all profile fields, upload avatar/cover, localStorage autosave draft |
| `FollowButton` | `components/atlas/app/network/FollowButton.tsx` | Follow/unfollow with auth modal for guests |
| `ConnectButton` | `components/atlas/app/network/ConnectButton.tsx` | Connect, accept, decline, remove connection |
| `NetworkSearchBar` | `components/atlas/app/network/NetworkSearchBar.tsx` | Reusable search input → `/atlas/search` |
| `NetworkSearchPage` | `components/atlas/app/network/NetworkSearchPage.tsx` | People / companies / posts search UI |
| `PendingConnectionRequests` | `components/atlas/app/network/PendingConnectionRequests.tsx` | Incoming requests on own profile |

---

## Pages (new / upgraded)

| Route | File | Notes |
|-------|------|-------|
| `/atlas/network/[slug]` | `app/atlas/network/[slug]/page.tsx` | Public profile view by slug |
| `/atlas/profile` | `app/atlas/profile/page.tsx` | Upgraded to shared `ProfileView` |
| `/atlas/profile/edit` | `app/atlas/profile/edit/page.tsx` | Profile editing |
| `/atlas/search` | `app/atlas/search/page.tsx` | Network search |

---

## Wiring

- **`app/atlas/layout.tsx`** — loads `getSuggestedProfiles` for right sidebar
- **`AtlasAppBar`** — functional `NetworkSearchBar`; mobile search → `/atlas/search`
- **`AtlasRightSidebar`** — profile links + `FollowButton` on suggestions
- **`app/atlas/network/page.tsx`** — Search CTA links to `/atlas/search`

---

## Profile capabilities

| Field | Storage | Edit |
|-------|---------|------|
| Profile photo | `avatar_url` | Upload via `uploadNetworkMediaAction` |
| Cover photo | `cover_url` | Upload via `uploadNetworkMediaAction` |
| Display name | `display_name` | Yes |
| Username | `slug` | Read-only (existing slug) |
| Headline, Bio | columns | Yes |
| Location, Website, Wallet | `profile_data` JSONB | Yes |
| Skills, Experience, Education, Certificates | person profile JSONB arrays | Yes |
| Languages, Social links | `profile_data` JSONB | Yes |
| Company | `current_position` / company profile | Display |
| Followers / Following / Connections | counts + lists | Via network actions |
| Activity | `atlas_network_activities` | Activity tab |

---

## Network capabilities

| Action | Status |
|--------|--------|
| Follow / Unfollow | Server actions + `FollowButton` |
| Connect / Remove | Server actions + `ConnectButton` |
| Suggested users | `getSuggestedProfiles` in layout sidebar |
| Suggested companies | Repository ready (`getSuggestedCompanies`) |
| Mutual connections | `fetchMutualConnectionsAction` (API ready) |
| Connection requests | `PendingConnectionRequests` + accept/decline on profile |
| Accept / Reject request | `acceptConnectionAction` / `declineConnectionAction` |

---

## Permissions

- **Guests:** Can view public profiles (`privacy === "public"`)
- **Guests:** Follow/connect opens existing commerce auth modal (`openCommerceAuth`)
- **Private profiles:** Hidden unless owner, follower, or accepted connection

---

## Search

- **People** — `searchNetworkProfiles` with `subject_type: user`
- **Companies** — `searchNetworkProfiles` with `subject_type: business`
- **Posts** — `searchNetworkPosts`
- Single backend path via `searchNetworkAction`; no duplicate repositories

---

## Responsive

Existing ATLAS app shell layout preserved (desktop sidebar, tablet, mobile app bar + bottom nav). Profile components use responsive flex/grid breakpoints.

---

## Validation & QA

```bash
npm run typecheck   # PASS (exit 0)
# npm run build     # NOT run per sprint instructions
```

---

## Files touched (summary)

**Module:** `types.ts`, `validators.ts`, `repository.ts`, `service.ts`, `actions.ts`  
**Domain:** `domains/events/catalog.ts`  
**Components:** 8 new under `components/atlas/app/profile/` and `network/`  
**Pages:** 4 under `app/atlas/`  
**Shell:** `AtlasAppBar.tsx`, `AtlasRightSidebar.tsx`, `AtlasAppShell.tsx`, `app/atlas/layout.tsx`

---

## Follow-ups (optional, out of sprint scope)

- Expose mutual connections count on profile header (action exists)
- Suggested companies block in sidebar (repository exists)
- Username/slug edit with uniqueness check
- Image crop UI (no prior implementation found)
- Dedicated notifications entry for connection requests

---

*Sprint 2.2 completes professional profiles and network interactions on top of the existing ATLAS Network module.*
