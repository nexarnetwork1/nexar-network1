import { supabaseServer } from "@/lib/supabase/server";
import Link from "next/link";

export default async function NewsPage() {
  const supabase = await supabaseServer();
  const { data: news } = await supabase
    .from("news")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-7xl px-6 py-24">
      <div className="mb-12">
        <h1 className="text-5xl font-bold text-white">
          Nexar News
        </h1>

        <p className="mt-4 text-zinc-400">
          Latest announcements and updates from Nexar Network.
        </p>
      </div>

      {!news || news.length === 0 ? (
        <div className="rounded-2xl border border-yellow-500/20 bg-zinc-900/40 p-10 text-center">
          <div className="text-6xl">📰</div>

          <h2 className="mt-6 text-3xl font-bold text-white">
            No News Yet
          </h2>

          <p className="mt-3 text-zinc-400">
            Check back soon for the latest updates.
          </p>
        </div>
      ) : (
        <div className="grid gap-8">
          {news.map((item) => (
            <article
              key={item.id}
              className="overflow-hidden rounded-2xl border border-yellow-500/20 bg-zinc-900/40"
            >
              {item.image && (
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-72 w-full object-cover"
                />
              )}

              <div className="p-8">
                <h2 className="text-3xl font-bold text-white">
                  {item.title}
                </h2>

                {item.excerpt && (
                  <p className="mt-4 text-zinc-300">
                    {item.excerpt}
                  </p>
                )}

                {item.content && (
                  <div className="mt-6 whitespace-pre-line text-zinc-400">
                    {item.content}
                  </div>
                )}

                <div className="mt-8">
                  <Link
                    href="/"
                    className="inline-flex rounded-xl bg-yellow-400 px-5 py-3 font-semibold text-black transition hover:bg-yellow-300"
                  >
                    ← Back to Home
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
