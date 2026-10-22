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

const POSTS_DIR = path.join(process.cwd(), "content", "blog");
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
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

function readPostFile(file: string) {
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

export async function getPost(slug: string): Promise<Post | undefined> {
  const entry = readAllPosts().find(({ meta }) => meta.slug === slug);

  if (!entry) {
    return undefined;
  }

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
    .process(entry.content);

  return { ...entry.meta, html: html.toString() };
}
