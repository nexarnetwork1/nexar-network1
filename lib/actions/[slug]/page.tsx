import { supabaseServer } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function NewsArticlePage({ params }: Props) {
  const { slug } = await params;

  const supabase = await supabaseServer();
  const { data: article } = await supabase
    .from("news")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!article) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-24">
     <div className="mb-10">
  <p className="mb-2 text-yellow-400">Image URL:</p>

  <a
    href={article.image}
    target="_blank"
    className="break-all text-blue-400 underline"
  >
    {article.image}
  </a>

  <img
  src={article.image}
  alt={article.title}
  referrerPolicy="no-referrer"
  loading="eager"
  style={{
    width: "100%",
    height: "420px",
    objectFit: "cover",
    border: "2px solid red",
    display: "block",
  }}
  onError={(e) => {
    console.log("Image failed:", article.image);
    console.log(e);
  }}
/>
</div>

      <h1 className="text-5xl font-bold text-white">
        {article.title}
      </h1>

      {article.excerpt && (
        <p className="mt-6 text-xl text-zinc-300">
          {article.excerpt}
        </p>
      )}

      <div className="mt-10 whitespace-pre-line text-lg leading-8 text-zinc-400">
        {article.content}
      </div>

      <Link
        href="/news"
        className="mt-12 inline-flex rounded-xl bg-yellow-400 px-6 py-3 font-semibold text-black"
      >
        ← Back to News
      </Link>
    </main>
  );
}
