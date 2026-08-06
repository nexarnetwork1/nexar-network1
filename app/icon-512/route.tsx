import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";

/** PWA / high-res icon — official ATLAS lockup on matte black. */
export async function GET() {
  const path = join(process.cwd(), "public/brand/atlas/atlas-icon-512.png");
  const body = await readFile(path);
  return new Response(body, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
