import { SITE } from "@/data/portfolio";
import { getListedPosts, isMediumPost } from "@/lib/blog";

export const dynamic = "force-static";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function GET() {
  const items = getListedPosts()
    .map((post) => {
      const url = isMediumPost(post) ? post.url : `${SITE.url}/blog/${post.slug}/`;
      const categories = post.tags.map((tag) => `<category>${escapeXml(tag)}</category>`).join("");
      return `<item><title>${escapeXml(post.title)}</title><link>${url}</link><guid>${url}</guid><pubDate>${new Date(`${post.date}T00:00:00Z`).toUTCString()}</pubDate><description>${escapeXml(post.summary)}</description>${categories}</item>`;
    })
    .join("");

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>${escapeXml(SITE.name)}</title>
<link>${SITE.url}/blog/</link>
<description>${escapeXml(SITE.description)}</description>
<language>en</language>
<atom:link href="${SITE.url}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
</channel>
</rss>`;

  return new Response(feed, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
