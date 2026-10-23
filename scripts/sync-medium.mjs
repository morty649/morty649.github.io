// Pulls Medium stories into content/medium.json so /blog can list them next to local posts.
// Medium's feed only carries the latest 10 stories, so stories saved earlier are kept after
// they fall out of it. A story missing from the feed while it should still be inside that
// window was deleted on Medium, so it is dropped here too.
// The deploy workflow runs this before every build; locally: `pnpm sync:medium`.
import fs from "node:fs";
import path from "node:path";

const FEED_URL = "https://medium.com/feed/@mortylogs";
const FEED_SIZE = 10;
const SUMMARY_LENGTH = 200;
const WORDS_PER_MINUTE = 200;
const OUT_FILE = path.join(process.cwd(), "content", "medium.json");

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

function decode(text) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (entity, code) => {
    if (code[0] === "#") {
      const value = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return String.fromCodePoint(value);
    }
    return ENTITIES[code.toLowerCase()] ?? entity;
  });
}

function stripTags(html) {
  return decode(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function field(item, tag) {
  const match = item.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`));
  return match ? match[1].trim() : "";
}

// The first sentence or two of the story, cut on a word boundary.
function summarise(html) {
  const paragraphs = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map((match) => stripTags(match[1])).filter(Boolean);
  const text = paragraphs.join(" ");
  if (text.length <= SUMMARY_LENGTH) return text;
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [];
  let summary = "";
  for (const sentence of sentences) {
    if ((summary + sentence).length > SUMMARY_LENGTH) break;
    summary += sentence;
  }
  if (summary.trim()) return summary.trim();
  return `${text.slice(0, SUMMARY_LENGTH).replace(/\s+\S*$/, "")}…`;
}

function parseFeed(xml) {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(([, item]) => {
    const content = field(item, "content:encoded");
    const published = new Date(field(item, "pubDate")).toISOString();
    const words = stripTags(content).split(/\s+/).filter(Boolean).length;
    return {
      id: field(item, "guid").split("/").pop(),
      title: decode(field(item, "title")),
      url: field(item, "link").split("?")[0],
      published,
      date: published.slice(0, 10),
      summary: summarise(content),
      tags: [...item.matchAll(/<category>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/category>/g)].map((match) => decode(match[1])),
      readingMinutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
    };
  });
}

function readSaved() {
  try {
    return JSON.parse(fs.readFileSync(OUT_FILE, "utf8"));
  } catch {
    return [];
  }
}

async function main() {
  let xml;
  try {
    const response = await fetch(FEED_URL, { headers: { "User-Agent": "morty649.github.io medium sync" } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    xml = await response.text();
  } catch (error) {
    console.warn(`Medium sync skipped, keeping saved posts: ${error.message}`);
    return;
  }
  // An error or challenge page would otherwise look like "every story was deleted".
  if (!xml.includes("<channel>")) {
    console.warn("Medium sync skipped, keeping saved posts: the response was not an RSS feed");
    return;
  }

  const fresh = parseFeed(xml);
  const freshIds = new Set(fresh.map((post) => post.id));
  const oldestFresh = fresh.reduce((oldest, post) => (post.published < oldest ? post.published : oldest), "￿");
  // A short feed holds every story, so anything missing from it was deleted.
  const kept = fresh.length < FEED_SIZE ? [] : readSaved().filter((post) => !freshIds.has(post.id) && post.published < oldestFresh);
  const posts = [...fresh, ...kept].sort((a, b) => b.published.localeCompare(a.published));

  const next = `${JSON.stringify(posts, null, 2)}\n`;
  const previous = fs.existsSync(OUT_FILE) ? fs.readFileSync(OUT_FILE, "utf8") : "";
  if (next === previous) {
    console.log(`Medium sync: no changes (${posts.length} posts)`);
    return;
  }
  fs.writeFileSync(OUT_FILE, next);
  console.log(`Medium sync: saved ${posts.length} posts to content/medium.json`);
}

await main();
