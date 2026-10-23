import fs from "fs";
import matter from "gray-matter";
import path from "path";
import rehypeKatex from "rehype-katex";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

export type PostMeta = {
  slug: string;
  title: string;
  date: string;
  updated?: string;
  summary: string;
  tags: readonly string[];
  draft: boolean;
  readingMinutes: number;
};

export type Post = PostMeta & { html: string };

/** A story written on Medium: listed on /blog next to local posts, but it links out. */
export type MediumPost = PostMeta & { url: string };

export type ListedPost = PostMeta | MediumPost;

export const POSTS_DIR = path.join(process.cwd(), "content", "blog");
// Written by scripts/sync-medium.mjs; absent until the first sync.
const MEDIUM_FILE = path.join(process.cwd(), "content", "medium.json");
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const WORDS_PER_MINUTE = 200;

// Drafts show up in `pnpm dev` and are left out of production builds.
const SHOW_DRAFTS = process.env.NODE_ENV !== "production";

// YAML parses an unquoted 2026-10-23 into a Date, so accept both forms.
function readDate(value: unknown, file: string, field: string) {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "string" && DATE_PATTERN.test(value)) {
    return value;
  }
  throw new Error(`content/blog/${file}: "${field}" must be a date like 2026-10-23`);
}

/** Parses and validates one file in content/blog, throwing a readable error if it is malformed. */
export function readPostFile(file: string) {
  const slug = path.basename(file, ".md");
  if (!SLUG_PATTERN.test(slug)) {
    throw new Error(
      `content/blog/${file}: file names become URLs, so use lowercase words joined by hyphens (e.g. my-first-post.md)`
    );
  }

  const { data, content } = matter(fs.readFileSync(path.join(POSTS_DIR, file), "utf8"));

  if (typeof data.title !== "string" || !data.title.trim()) {
    throw new Error(`content/blog/${file}: frontmatter needs a "title"`);
  }
  if (typeof data.summary !== "string" || !data.summary.trim()) {
    throw new Error(`content/blog/${file}: frontmatter needs a one-sentence "summary"`);
  }

  const meta: PostMeta = {
    slug,
    title: data.title.trim(),
    date: readDate(data.date, file, "date"),
    updated: data.updated ? readDate(data.updated, file, "updated") : undefined,
    summary: data.summary.trim(),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    draft: data.draft === true,
    readingMinutes: Math.max(1, Math.round(content.split(/\s+/).length / WORDS_PER_MINUTE)),
  };

  return { meta, content };
}

function readAllPosts() {
  if (!fs.existsSync(POSTS_DIR)) {
    return [];
  }

  return fs
    .readdirSync(POSTS_DIR)
    .filter((file) => path.extname(file) === ".md")
    .map(readPostFile)
    .filter(({ meta }) => SHOW_DRAFTS || !meta.draft)
    .sort((a, b) => b.meta.date.localeCompare(a.meta.date) || a.meta.title.localeCompare(b.meta.title));
}

/** Published posts, newest first. Reads frontmatter only, so it is cheap to call. */
export function getPosts(): PostMeta[] {
  return readAllPosts().map(({ meta }) => meta);
}

type SavedMediumPost = {
  id: string;
  title: string;
  url: string;
  date: string;
  summary: string;
  tags: string[];
  readingMinutes: number;
};

function getMediumPosts(): MediumPost[] {
  if (!fs.existsSync(MEDIUM_FILE)) {
    return [];
  }

  const saved: SavedMediumPost[] = JSON.parse(fs.readFileSync(MEDIUM_FILE, "utf8"));
  return saved.map((post) => ({
    slug: `medium-${post.id}`,
    title: post.title,
    date: post.date,
    summary: post.summary,
    tags: post.tags,
    draft: false,
    readingMinutes: post.readingMinutes,
    url: post.url,
  }));
}

/** Local and Medium posts together, newest first, for the blog index, the homepage and RSS. */
export function getListedPosts(): ListedPost[] {
  return [...getPosts(), ...getMediumPosts()].sort(
    (a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title)
  );
}

export function isMediumPost(post: ListedPost): post is MediumPost {
  return "url" in post;
}

export async function getPost(slug: string): Promise<Post | undefined> {
  const entry = readAllPosts().find(({ meta }) => meta.slug === slug);

  if (!entry) {
    return undefined;
  }

  return { ...entry.meta, html: await renderMarkdown(entry.content) };
}

export async function renderMarkdown(markdown: string) {
  const html = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype, {
      allowDangerousHtml: true,
      // Naming sr-only here also makes Tailwind generate the class for the footnotes label.
      footnoteLabelProperties: { className: ["sr-only"] },
      // U+FE0E keeps the back arrow as text instead of an emoji on macOS and iOS.
      footnoteBackContent: "↩︎",
    })
    .use(rehypeRaw)
    .use(rehypeSlug)
    .use(rehypeKatex)
    .use(rehypePrettyCode, {
      theme: { light: "github-light", dark: "github-dark" },
      keepBackground: false,
      defaultLang: { block: "plaintext" },
    })
    .use(rehypeStringify)
    .process(markdown);

  return html.toString();
}
