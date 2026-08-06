# ATLAS Pulse — Business Intelligence Feed

**Real-time activity engine of ATLAS by NEXAR NETWORK**

> Pulse is **not** social media. It is the intelligence layer that aggregates everything happening across Business, Network, Marketplace, and AI into a single business-first feed.

---

## Mission

Every ecosystem event flows through Pulse. Pulse becomes the **homepage of every business** — showing updates, launches, sales, hires, partnerships, insights, and trends in real time.

---

## Architecture

| Layer | Location |
|-------|----------|
| Bounded context | `atlasPulse` (`id: atlas_pulse`) |
| Module | `modules/atlas-pulse/` |
| Database | `atlas_pulse_*` |
| Port | `AtlasPulsePort` |
| Ranking | `modules/atlas-pulse/ranking.ts` |
| Recommendations | `modules/atlas-pulse/recommendations.ts` |
| Event ingestion | `modules/atlas-pulse/events.ts` |

### vs ATLAS Network

| | **Network** | **Pulse** |
|---|-------------|-----------|
| Purpose | Business Social Network | Business Intelligence Feed |
| Analogy | Professional graph & posts | Activity engine & trending |
| Owns | Profiles, connections, posts (social DM tables: legacy) | Feed items, trending, recommendations |

Network posts can **source** Pulse items (`source: atlas_network`). Pulse never owns Business master data.

---

## Root Entities

| Entity | Table |
|--------|-------|
| Feed | `atlas_pulse_feeds` |
| FeedItem | `atlas_pulse_feed_items` |
| Timeline | `atlas_pulse_timelines` |
| Activity | `atlas_pulse_activities` |
| BusinessUpdate | `atlas_pulse_business_updates` |
| Announcement | `atlas_pulse_announcements` |
| Article | `atlas_pulse_articles` |
| BusinessInsight | `atlas_pulse_insights` |
| Trending* | `trending_topics`, `trending_businesses`, `trending_products`, `trending_services` |
| Hashtag / Mention | `hashtags`, `mentions` |
| Bookmark / Collection | `bookmarks`, `collections` |
| Reaction / Comment / Share | `reactions`, `comments`, `shares` |
| Recommendation | `recommendations` |
| FeedPreference / Category | `feed_preferences`, `feed_categories` |
| Analytics / Sponsored | `item_analytics`, `sponsored_items` |

---

## Pulse Sources (event ingestion)

Configured in `PULSE_EVENT_MAP` (`modules/atlas-pulse/types.ts`):

- Business verification, store created/activated
- Product created/published
- Marketplace sales (`order.paid`)
- Network posts & company pages
- Employee hired, partner accepted, job published

All platform events can be extended without schema changes via `payload` JSONB.

---

## Ranking Engine

`computeTrendingScore()` — time-decayed engagement with recency boost:

- Inputs: views, reactions, comments, shares, bookmarks, age
- Used for feed ordering and trending tables
- Replaceable with ML without API changes

---

## Recommendation Engine

`scoreRecommendations()` — rules-based foundation:

- Industry match, network connections, marketplace activity, purchase history
- Outputs scored rows in `atlas_pulse_recommendations`
- AI learning layer plugs in via same port

---

## Domain Events

| Event | When |
|-------|------|
| `pulse.feed_item_created` | Item ingested |
| `pulse.activity_recorded` | Activity logged |
| `pulse.trending_updated` | Trending score refresh |
| `pulse.recommendations_updated` | Recommendations generated |
| `pulse.article_published` | Long-form article |
| `pulse.insight_generated` | AI insight |
| `pulse.sponsored_created` | Sponsored content |

---

## Permissions

| Permission | Purpose |
|------------|---------|
| `pulse:feed:read` | View feeds |
| `pulse:feed:manage` | Manage business timeline |
| `pulse:post:create` | Create pulse items |
| `pulse:article:publish` | Publish articles |
| `pulse:trending:read` | Discovery/trending |
| `pulse:analytics:read` | Engagement metrics |
| `pulse:sponsor` | Sponsored content |

---

## API Contract

```typescript
interface AtlasPulsePort {
  getBusinessFeed(businessId, limit?): Promise<PulseFeedItemRecord[]>;
  getDiscoveryFeed(limit?): Promise<PulseFeedItemRecord[]>;
  getTimeline(businessId): Promise<PulseTimelineRecord | null>;
  ingestEvent(event): Promise<PulseFeedItemRecord | null>;
}
```

REST / GraphQL / Realtime / SDK / Mobile — ports first; transport layer in Phase 4+.

---

## Auto-Provisioning

On `businesses` INSERT:

1. DB trigger creates Pulse feed + timeline + welcome feed item
2. App `ensureBusinessPulse()` mirrors idempotently
3. Platform discovery feed exists at bootstrap

---

## UI Roadmap

1. **Pulse homepage** — business dashboard default
2. **Discovery / Explore** — trending, recommended companies
3. **Timeline view** — per-business activity stream
4. **Article reader** — long-form categories
5. **Insights panel** — AI summaries & reports
6. **Analytics dashboard** — views, reach, engagement
7. **Sponsored content admin** — boost business/product/event
8. **Collections & bookmarks** — research folders
9. **Global search** — posts, businesses, products, articles
10. **Realtime subscriptions** — WebSocket/SSE feed updates

---

## Related

- [ATLAS Constitution](./ATLAS.md)
- [ATLAS Network](./ATLAS-NETWORK.md)
