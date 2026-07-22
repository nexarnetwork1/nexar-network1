import { supabase } from "@/lib/supabase/client";

export type NewsForm = {
  title: string;
  excerpt: string;
  content: string;
  status: string;
  image: File | null;
};

export async function createNews(data: NewsForm) {
  let imageUrl = "";

  if (data.image) {
    const fileName = `${Date.now()}-${data.image.name}`;

    const { error: uploadError } = await supabase.storage
      .from("news")
      .upload(fileName, data.image);

    if (uploadError) {
      console.error(uploadError);
      throw uploadError;
    }

    const { data: publicUrl } = supabase.storage
      .from("news")
      .getPublicUrl(fileName);

    imageUrl = publicUrl.publicUrl;
  }

  const slug = data.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const { error } = await supabase.from("news").insert({
    title: data.title,
    slug,
    excerpt: data.excerpt,
    content: data.content,
    image: imageUrl,
    status: data.status,
  });

  if (error) {
    console.error(error);
    throw error;
  }
}

export async function getLatestNews() {
  const { data, error } = await supabase
    .from("news")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error(error);
    return null;
  }

  return data;
}
