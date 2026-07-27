import NewsDialog from "@/components/admin/NewsDialog";

export default function NewsPage() {
  return (
    <div className="space-y-8">

      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            News
          </h1>

          <p className="mt-2 text-zinc-400">
            Manage all website news.
          </p>
        </div>

        <NewsDialog />

      </div>

      <div className="overflow-hidden rounded-2xl border border-yellow-500/20 bg-zinc-900/40">

        <div className="border-b border-yellow-500/20 px-6 py-5">
          <h2 className="text-xl font-semibold text-white">
            Published News
          </h2>
        </div>

        <div className="flex h-80 items-center justify-center p-8">

          <div className="text-center">

            <div className="text-6xl">
                📰
            </div>

            <h3 className="mt-5 text-2xl font-bold text-white">
              No News Yet
            </h3>

            <p className="mt-3 text-zinc-400">
              Click &quot;Add News&quot; to publish your first article.
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}
