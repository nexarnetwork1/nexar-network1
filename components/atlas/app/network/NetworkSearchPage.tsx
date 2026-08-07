"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Building2, Briefcase, Calendar, FileText, MessageSquare, Package, Search, Store, User } from "lucide-react";
import type { NetworkEvent } from "@/modules/atlas-network/types";
import { JobCard } from "@/components/atlas/jobs/JobCard";
import { EventCard } from "@/components/atlas/events/EventCard";
import { cn } from "@/lib/utils/cn";
import type { NetworkFeedPost, NetworkProfile } from "@/modules/atlas-network/types";
import type {
  EnrichedMarketplaceListing,
  MarketplaceStorefront,
} from "@/modules/atlas-marketplace/types";
import { searchNetworkAction } from "@/modules/atlas-network/actions";
import { NetworkSearchBar } from "@/components/atlas/app/network/NetworkSearchBar";
import { AiAssistMenu } from "@/components/atlas/ai/AiAssistMenu";
import { MarketplaceListingCard } from "@/components/atlas/marketplace/MarketplaceListingCard";
import { MARKETPLACE_ROUTES } from "@/modules/marketplace/shared/constants";
import type { ConnectSearchHit } from "@/modules/atlas-connect/search";

type SearchType =
  | "all"
  | "people"
  | "companies"
  | "posts"
  | "products"
  | "stores"
  | "jobs"
  | "events"
  | "messages";

const TYPE_OPTIONS: {
  id: SearchType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "all", label: "All", icon: Search },
  { id: "people", label: "People", icon: User },
  { id: "companies", label: "Companies", icon: Building2 },
  { id: "jobs", label: "Jobs", icon: Briefcase },
  { id: "events", label: "Events", icon: Calendar },
  { id: "products", label: "Products", icon: Package },
  { id: "stores", label: "Stores", icon: Store },
  { id: "posts", label: "Posts", icon: FileText },
  { id: "messages", label: "Messages", icon: MessageSquare },
];

export function NetworkSearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const initialType = (searchParams.get("type") as SearchType) ?? "all";

  const [query, setQuery] = useState(initialQuery);
  const [type, setType] = useState<SearchType>(initialType);
  const [profiles, setProfiles] = useState<NetworkProfile[]>([]);
  const [posts, setPosts] = useState<NetworkFeedPost[]>([]);
  const [listings, setListings] = useState<EnrichedMarketplaceListing[]>([]);
  const [storefronts, setStorefronts] = useState<MarketplaceStorefront[]>([]);
  const [jobs, setJobs] = useState<NetworkFeedPost[]>([]);
  const [events, setEvents] = useState<NetworkEvent[]>([]);
  const [messages, setMessages] = useState<ConnectSearchHit[]>([]);
  const [searched, setSearched] = useState(false);
  const [aiAssist, setAiAssist] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const runSearch = (q: string, t: SearchType) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    startTransition(async () => {
      try {
        const result = await searchNetworkAction({ query: trimmed, type: t });
        setProfiles(result.profiles);
        setPosts(result.posts);
        setListings(result.listings ?? []);
        setStorefronts(result.storefronts ?? []);
        setJobs(result.jobs ?? []);
        setEvents(result.events ?? []);
        setMessages(result.messages ?? []);
        setSearched(true);
      } catch {
        setProfiles([]);
        setPosts([]);
        setListings([]);
        setStorefronts([]);
        setJobs([]);
        setEvents([]);
        setMessages([]);
        setSearched(true);
      }
    });
  };

  useEffect(() => {
    if (initialQuery.trim()) {
      runSearch(initialQuery, initialType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resultSummary = searched
    ? `${profiles.length} profiles, ${jobs.length} jobs, ${events.length} events, ${listings.length} products, ${messages.length} messages, ${posts.length} posts`
    : undefined;

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Search ATLAS Network</h1>
        <p className="text-sm text-muted">
          Find people, companies, jobs, events, products, stores, messages, and posts
        </p>
      </div>

      <div className="space-y-3">
        <NetworkSearchBar
          query={query}
          onQueryChange={setQuery}
          onSubmit={(q) => runSearch(q, type)}
        />
        <div className="flex flex-wrap gap-2">
          {TYPE_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setType(opt.id);
                  if (query.trim()) runSearch(query, opt.id);
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors",
                  type === opt.id
                    ? "border-gold/40 bg-gold/10 text-gold"
                    : "border-white/10 text-muted hover:text-white",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {opt.label}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          disabled={pending || !query.trim()}
          onClick={() => runSearch(query, type)}
          className="px-4 py-2 rounded-lg bg-gold text-background text-sm font-medium disabled:opacity-50"
        >
          {pending ? "Searching…" : "Search"}
        </button>
        <AiAssistMenu
          surface="search"
          text={query}
          context={{ resultSummary }}
          onApply={(content) => setAiAssist(content)}
          label="AI search assist"
        />
      </div>

      {aiAssist && (
        <div className="p-4 rounded-xl border border-gold/20 bg-gold/5 text-sm whitespace-pre-wrap">
          <p className="text-xs text-gold mb-2 font-medium">AI search suggestions</p>
          {aiAssist}
        </div>
      )}

      {searched && (
        <div className="space-y-6">
          {(type === "all" || type === "people" || type === "companies") && (
            <section>
              <h2 className="font-semibold mb-3">
                {type === "companies" ? "Companies" : type === "people" ? "People" : "Profiles"}
              </h2>
              {profiles.length === 0 ? (
                <p className="text-sm text-muted">No profiles found.</p>
              ) : (
                <div className="space-y-2">
                  {profiles.map((p) => (
                    <Link
                      key={p.id}
                      href={`/atlas/network/${p.slug}`}
                      className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5 hover:border-gold/20"
                    >
                      <div className="h-10 w-10 rounded-full bg-gold/10 overflow-hidden">
                        {p.avatar_url ? (
                          <img src={p.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{p.display_name}</p>
                        <p className="text-xs text-muted truncate">
                          @{p.slug} · {p.subject_type}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          )}

          {(type === "all" || type === "products") && (
            <section>
              <h2 className="font-semibold mb-3">Products</h2>
              {listings.length === 0 ? (
                <p className="text-sm text-muted">No products found.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {listings.map((listing, index) => (
                    <MarketplaceListingCard key={listing.id} listing={listing} index={index} />
                  ))}
                </div>
              )}
            </section>
          )}

          {(type === "all" || type === "stores") && (
            <section>
              <h2 className="font-semibold mb-3">Stores</h2>
              {storefronts.length === 0 ? (
                <p className="text-sm text-muted">No stores found.</p>
              ) : (
                <div className="space-y-2">
                  {storefronts.map((store) => (
                    <Link
                      key={store.id}
                      href={MARKETPLACE_ROUTES.store(store.slug)}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl border border-white/10 bg-white/5 hover:border-gold/20"
                    >
                      <div className="min-w-0">
                        <p className="font-medium truncate">{store.display_name}</p>
                        {store.tagline && (
                          <p className="text-xs text-muted truncate">{store.tagline}</p>
                        )}
                        <p className="text-xs text-muted mt-1">
                          {store.listing_count} listings · {store.follower_count} followers
                        </p>
                      </div>
                      <Store className="h-4 w-4 text-gold shrink-0" />
                    </Link>
                  ))}
                </div>
              )}
            </section>
          )}

          {(type === "all" || type === "jobs") && (
            <section>
              <h2 className="font-semibold mb-3">Jobs</h2>
              {jobs.length === 0 ? (
                <p className="text-sm text-muted">No jobs found.</p>
              ) : (
                <div className="space-y-3">
                  {jobs.map((job) => (
                    <JobCard key={job.id} job={job} compact />
                  ))}
                </div>
              )}
            </section>
          )}

          {(type === "all" || type === "events") && (
            <section>
              <h2 className="font-semibold mb-3">Events</h2>
              {events.length === 0 ? (
                <p className="text-sm text-muted">No events found.</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {events.map((event) => (
                    <EventCard key={event.id} event={event} compact />
                  ))}
                </div>
              )}
            </section>
          )}

          {(type === "all" || type === "messages") && (
            <section>
              <h2 className="font-semibold mb-3">Messages</h2>
              {messages.length === 0 ? (
                <p className="text-sm text-muted">
                  {type === "messages"
                    ? "Sign in with workspace access to search messages."
                    : "No messages found."}
                </p>
              ) : (
                <div className="space-y-2">
                  {messages.map((hit) => (
                    <Link
                      key={hit.entityId}
                      href={
                        hit.conversationId
                          ? `/atlas/messages?conversation=${hit.conversationId}`
                          : "/atlas/messages"
                      }
                      className="block p-3 rounded-xl border border-white/10 bg-white/5 hover:border-gold/20"
                    >
                      <p className="text-sm line-clamp-2">{hit.title}</p>
                      {hit.snippet && hit.snippet !== hit.title && (
                        <p className="text-xs text-muted mt-1 line-clamp-2">{hit.snippet}</p>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </section>
          )}

          {(type === "all" || type === "posts") && (
            <section>
              <h2 className="font-semibold mb-3">Posts</h2>
              {posts.length === 0 ? (
                <p className="text-sm text-muted">No posts found.</p>
              ) : (
                <div className="space-y-3">
                  {posts.map((post) => (
                    <div key={post.id} className="p-4 rounded-xl border border-white/10 bg-white/5">
                      {post.author && (
                        <Link
                          href={`/atlas/network/${post.author.slug}`}
                          className="text-sm text-gold hover:underline"
                        >
                          {post.author.display_name}
                        </Link>
                      )}
                      {post.title && <p className="font-medium mt-1">{post.title}</p>}
                      {post.body && (
                        <p className="text-sm text-muted mt-1 line-clamp-3">{post.body}</p>
                      )}
                      {post.post_type === "product" && (
                        <p className="text-xs text-gold mt-2">Product post</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
