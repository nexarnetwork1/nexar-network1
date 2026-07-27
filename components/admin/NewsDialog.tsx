"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { createNews } from "@/lib/actions/news";
import { useState } from "react";

export default function NewsDialog() {
const [open, setOpen] = useState(false);

const [title, setTitle] = useState("");
const [excerpt, setExcerpt] = useState("");
const [content, setContent] = useState("");
const [status, setStatus] = useState("published");
const [image, setImage] = useState<File | null>(null);
const [loading, setLoading] = useState(false);

async function handleSave() {
  try {
    setLoading(true);

    await createNews({
      title,
      excerpt,
      content,
      status,
      image,
    });

    alert("News published successfully.");

    setOpen(false);

    setTitle("");
    setExcerpt("");
    setContent("");
    setStatus("published");
    setImage(null);

  } catch (error) {
  console.error(error);

  if (error instanceof Error) {
    alert(error.message);
  } else {
    alert(JSON.stringify(error));
  }
} finally {
  setLoading(false);
}
}
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="rounded-xl bg-yellow-400 px-5 py-3 font-bold text-black transition hover:bg-yellow-300 hover:scale-[1.02]">
          + Add News
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />

        <Dialog.Content
          className="
          fixed
          left-1/2
          top-1/2
          z-50
          w-[95vw]
          max-w-3xl
          max-h-[90vh]
          -translate-x-1/2
          -translate-y-1/2
          overflow-y-auto
          rounded-2xl
          border
          border-yellow-500/20
          bg-[#111111]
          p-4
          shadow-2xl
          sm:p-6
          lg:p-8
        "
        >
          <Dialog.Title className="text-2xl font-bold text-white sm:text-3xl">
            Add News
          </Dialog.Title>

          <p className="mt-2 text-sm text-zinc-400 sm:text-base">
            Publish a new article to the Nexar Network website.
          </p>

          <div className="mt-8 space-y-5">

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                News Title
              </label>

            <input
  type="text"
  value={title}
  onChange={(e) => setTitle(e.target.value)}
  placeholder="Enter news title..."
  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white placeholder:text-zinc-500 outline-none transition focus:border-yellow-400"
/>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Short Description
              </label>

             <textarea
  rows={4}
  value={excerpt}
  onChange={(e) => setExcerpt(e.target.value)}
  placeholder="Short description..."
  className="w-full resize-none rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white placeholder:text-zinc-500 outline-none transition focus:border-yellow-400"
/>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Full Article
              </label>

              <textarea
  rows={8}
  value={content}
  onChange={(e) => setContent(e.target.value)}
  placeholder="Write the full article..."
  className="w-full resize-none rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white placeholder:text-zinc-500 outline-none transition focus:border-yellow-400"
/>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Featured Image
              </label>

            <input
  type="file"
  accept="image/*"
  onChange={(e) => setImage(e.target.files?.[0] ?? null)}
  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-white file:mr-4 file:rounded-lg file:border-0 file:bg-yellow-400 file:px-4 file:py-2 file:font-semibold file:text-black hover:file:bg-yellow-300"
/>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Status
              </label>

            <select
  value={status}
  onChange={(e) => setStatus(e.target.value)}
  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-yellow-400"
>
  <option value="draft">Draft</option>
  <option value="published">Published</option>
</select>
            </div>

          </div>

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

            <Dialog.Close asChild>
              <button className="rounded-xl border border-zinc-700 px-6 py-3 text-white transition hover:bg-zinc-800">
                Cancel
              </button>
            </Dialog.Close>

           <button
  onClick={handleSave}
  disabled={loading}
  className="rounded-xl bg-yellow-400 px-6 py-3 font-bold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
>
  {loading ? "Saving..." : "Save News"}
</button>

          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
