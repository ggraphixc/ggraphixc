import { getPublishedBlog, getSettings } from "@/lib/data";

export const dynamic = "force-static";
export const revalidate = 300;

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://ggraphixc.vercel.app";

function escXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const [posts, s] = await Promise.all([getPublishedBlog(), getSettings().catch(() => null)]);
  const brand = s?.brand_name || "ggraphixc";
  const designer = s?.designer_name || "Godson Otobo";

  const items = posts
    .map((p) => {
      const url = `${BASE}/blog/${p.slug}`;
      const date = new Date(p.created_at).toUTCString();
      return `    <item>
      <title>${escXml(p.title)}</title>
      <link>${url}</link>
      <guid>${url}</guid>
      <pubDate>${date}</pubDate>
      ${p.tags ? `<category>${escXml(p.tags)}</category>` : ""}
      ${p.excerpt ? `<description>${escXml(p.excerpt)}</description>` : ""}
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escXml(brand)} — Design Notes</title>
    <link>${BASE}/blog</link>
    <description>Design notes, brand systems, and process from ${escXml(designer)} (${escXml(brand)}).</description>
    <atom:link href="${BASE}/feed.xml" rel="self" type="application/rss+xml" />
    <language>en</language>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300"
    }
  });
}
