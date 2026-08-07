# Sprint 2.7 — ATLAS Jobs & Events Integration Report

**Date:** 2026-08-07  
**Status:** Complete  
**Typecheck:** `npm run typecheck` — PASS

## Objective

Complete and integrate the existing Jobs and Events capabilities (embedded in `modules/atlas-network`) into the native ATLAS experience. No new modules, tables, or duplicate APIs.

---

## Jobs Integration Status

| Feature | Status |
|---------|--------|
| Company job listings | ✅ `fetchCompanyJobsAction` with `featured` / `open` filters; company Jobs tab |
| Featured jobs | ✅ Metadata `is_featured`; featured section on `/atlas/jobs` and company page |
| Latest jobs | ✅ `getJobPostsFiltered({ filter: "latest" })` |
| Recommended jobs | ✅ Heuristic sort (featured + application count) |
| Job categories | ✅ Metadata `category` + `JOB_CATEGORIES` constant; filter on jobs page |
| Job search | ✅ `searchNetworkJobs` + `fetchJobsAction` |
| Job filters | ✅ Employment type, category, open-only on jobs browse UI |
| Saved jobs | ✅ Reuses feed `localStorage` bookmarks; `/atlas/jobs/saved` |
| Apply flow | ✅ Existing `JobApplyForm`; server-side duplicate check |
| Application status | ✅ `status` on metadata applications; `/atlas/jobs/applications` |
| Company hiring badge | ✅ "We're hiring" on `CompanyProfileHeader` when open jobs exist |
| Feed job posts | ✅ Rich `JobPostPreview` in `FeedPostCard`; jobs use `createNetworkPost` + timeline |
| Notifications | ✅ `network.job_posted`, `network.job_applied`, `network.job_application_updated`, `network.interview_invited` |

---

## Events Integration Status

| Feature | Status |
|---------|--------|
| Upcoming events | ✅ Existing + enhanced browse UI |
| Past events | ✅ `getPastEvents`; past tab on `/atlas/events` |
| Company events | ✅ Company Events tab with `EventCard` |
| Online events | ✅ Filter + `meeting_url` in event metadata |
| Physical events | ✅ Location + physical filter |
| Event registration | ✅ Existing flow + server-side registered check |
| Calendar view | ✅ Month navigation on events page |
| Reminder support | ✅ `setEventReminderAction` + metadata reminders + notification |
| Feed event posts | ✅ Enhanced event preview in `FeedPostCard` |
| Notifications | ✅ `network.event_registered`, `network.event_reminder` |

---

## Files Modified

### Backend
| File | Change |
|------|--------|
| `modules/atlas-network/repository.ts` | Job/event search, filters, past events, applications, reminders, hiring helpers |
| `modules/atlas-network/actions.ts` | Job create via `createNetworkPost`, notifications, search extension, fetch actions |
| `modules/atlas-network/validators.ts` | Job category, event meeting URL, search schemas, application status |
| `modules/atlas-network/service.ts` | (unchanged this sprint — job create moved to actions) |
| `domains/events/catalog.ts` | Network job/event domain events |
| `modules/atlas-core/types.ts` | `NOTIFICATION_HUB_EVENTS` + search index for jobs/events |

### Shared helpers
| File | Change |
|------|--------|
| `lib/atlas/job-categories.ts` | **New** — category constants |
| `lib/atlas/job-utils.ts` | **New** — job metadata helpers, application status labels |

### UI — Jobs
| File | Change |
|------|--------|
| `components/atlas/jobs/JobCard.tsx` | **New** |
| `components/atlas/jobs/JobsBrowseClient.tsx` | **New** — featured/recommended/latest, filters, saved |
| `components/atlas/jobs/SavedJobsPageClient.tsx` | **New** |
| `app/atlas/jobs/page.tsx` | Browse sections + client filters |
| `app/atlas/jobs/[id]/page.tsx` | Hiring badge, category, applied state |
| `app/atlas/jobs/saved/page.tsx` | **New** |
| `app/atlas/jobs/applications/page.tsx` | **New** |
| `components/atlas/app/JobPostForm.tsx` | Category field |
| `components/atlas/app/JobApplyForm.tsx` | Initial applied state, applications link |

### UI — Events
| File | Change |
|------|--------|
| `components/atlas/events/EventCard.tsx` | **New** |
| `components/atlas/events/EventsBrowseClient.tsx` | **New** — upcoming/past, calendar nav, filters |
| `app/atlas/events/page.tsx` | Client browse |
| `app/atlas/events/[id]/page.tsx` | Registered check, meeting URL, host link |
| `components/atlas/app/EventCreateForm.tsx` | Meeting URL for online events |
| `components/atlas/app/EventRegisterForm.tsx` | Reminder button, join link |

### Integration surfaces
| File | Change |
|------|--------|
| `components/atlas/app/feed/FeedPostCard.tsx` | Rich job/event post cards |
| `components/atlas/app/PostComposer.tsx` | Links to job/event creation |
| `components/atlas/app/company/CompanyProfileView.tsx` | Job/event cards, hiring counts |
| `components/atlas/app/company/CompanyProfileHeader.tsx` | Hiring badge, open jobs / events counts |
| `components/atlas/app/profile/ProfileView.tsx` | Pass hiring props to company view |
| `components/atlas/app/network/NetworkSearchPage.tsx` | Jobs & Events search tabs |
| `app/atlas/network/[slug]/page.tsx` | Hiring + event counts for companies |
| `app/atlas/notifications/page.tsx` | Real notifications from `notifications` table |

---

## Repositories Reused (no duplicates)

| Repository | Usage |
|------------|--------|
| `modules/atlas-network/repository` | Posts, events, jobs, search, applications, reminders |
| `modules/atlas-network/service` | `createNetworkPost`, `recordBusinessActivity` |
| `modules/atlas-network/actions` | All server actions (extended, not replaced) |
| `modules/notifications/repository` | `getUserNotifications`, `createNotification` via hub |
| `modules/atlas-core/service` | `fanOutNotificationFromEvent`, `dispatchNotificationHub` |
| `components/atlas/app/feed/feed-utils` | Saved jobs via `SAVED_POSTS_KEY` |

---

## Remaining Work

1. **Employer applicant inbox** — `updateJobApplicationStatusAction` exists but no company UI to review applicants or send interview invites.
2. **Scheduled event reminders** — Reminder metadata + notification on set; no cron/edge job to fire reminders before `starts_at`.
3. **Company-scoped job/event create** — Forms don't pass `businessId` from company context URL yet.
4. **Dedicated jobs/events DB tables** — Still post/event metadata model per charter (no migration by design).
5. **Resume upload on apply** — Message-only applications.
6. **iCal / external calendar export** — Not implemented.
7. **Pulse job recommendations** — `entityType: "job"` in pulse exists; not wired to jobs browse recommended section beyond local heuristic.
8. **Historical jobs** — Pre-sprint jobs lack `hiring_status: "open"` in metadata until reposted.

---

## Quality

- No new database tables or migrations.
- No duplicate Jobs/Events modules or APIs.
- Jobs now emit `network.post_created` (via `createNetworkPost`) for feed/timeline parity with events.
- TypeScript strict check passes.
