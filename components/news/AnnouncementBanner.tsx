"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, X, ArrowRight } from "lucide-react";
import { getLatestNews } from "@/lib/actions/news";

type News = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  image: string;
};

export default function AnnouncementBanner() {
  const [closed, setClosed] = useState(false);
  const [news, setNews] = useState<News | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNews() {
      const latest = await getLatestNews();
      setNews(latest);
      setLoading(false);
    }

    loadNews();
  }, []);

  if (closed || loading || !news) return null;

  return (
    <section className="relative z-40 border-b border-yellow-500/20 bg-gradient-to-r from-yellow-500/10 via-zinc-900 to-zinc-900">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">

        <div className="flex items-start gap-4">

          <div className="rounded-full bg-yellow-500/15 p-3">
            <Bell className="h-6 w-6 text-yellow-400" />
          </div>

          <div>

            <div className="mb-2 inline-flex rounded-full bg-red-500 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
              Latest News
            </div>

            <h2 className="text-lg font-bold text-white">
              {news.title}
            </h2>

            {news.excerpt && (
              <p className="mt-1 text-sm text-zinc-300">
                {news.excerpt}
              </p>
            )}

            <Link
              href={`/news/${news.slug}`}
              className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-yellow-400 transition hover:text-yellow-300"
            >
              Read More
              <ArrowRight className="h-4 w-4" />
            </Link>

          </div>

        </div>

        <button
          onClick={() => setClosed(true)}
          className="rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

      </div>
    </section>
  );
}
