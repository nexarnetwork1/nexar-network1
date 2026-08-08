import { readFileSync } from "node:fs";
import { join } from "node:path";

type WhitepaperSection = {
  id: string;
  title: string;
  body: string;
};

let cachedSections: WhitepaperSection[] | null = null;

function loadSections(): WhitepaperSection[] {
  if (cachedSections) return cachedSections;

  const filePath = join(process.cwd(), "public", "whitepaper.txt");
  let text: string;
  try {
    text = readFileSync(filePath, "utf8");
  } catch {
    cachedSections = [];
    return cachedSections;
  }

  const sections: WhitepaperSection[] = [];
  const blocks = text.split(/={10,}/).map((b) => b.trim()).filter(Boolean);

  for (const block of blocks) {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;

    const titleLine = lines[0];
    const numbered = titleLine.match(/^(\d+)\.\s+(.+)/);
    const title = numbered ? numbered[2] : titleLine;
    const id = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const body = lines.slice(numbered ? 1 : 1).join("\n").slice(0, 2400);
    if (body.length > 80) {
      sections.push({ id, title, body });
    }
  }

  cachedSections = sections;
  return sections;
}

function scoreSection(section: WhitepaperSection, query: string): number {
  const q = query.toLowerCase();
  const terms = q.split(/\s+/).filter((t) => t.length > 2);
  let score = 0;
  const haystack = `${section.title} ${section.body}`.toLowerCase();
  for (const term of terms) {
    if (haystack.includes(term)) score += 2;
  }
  if (haystack.includes(q)) score += 5;
  return score;
}

/** Search official whitepaper.txt sections (verified source only). */
export function searchWhitepaperSections(query: string, limit = 3): WhitepaperSection[] {
  const sections = loadSections();
  if (!sections.length || !query.trim()) return [];

  return sections
    .map((section) => ({ section, score: scoreSection(section, query) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ section }) => section);
}

export function formatWhitepaperSectionsForModel(sections: WhitepaperSection[]): string {
  if (!sections.length) {
    return "No matching whitepaper section found in the official document.";
  }
  return sections
    .map(
      (s) =>
        `### Whitepaper — ${s.title}\n${s.body.slice(0, 1200)}${s.body.length > 1200 ? "…" : ""}`,
    )
    .join("\n\n");
}
