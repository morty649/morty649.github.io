// Server side of the local writer (`pnpm write`). Never imported by the exported site.
import { execFile } from "child_process";
import fs from "fs";
import path from "path";
import { promisify } from "util";
import { SITE } from "@/data/portfolio";
import { DATE_PATTERN, POSTS_DIR, SLUG_PATTERN, getPosts, readPostFile, renderMarkdown } from "@/lib/blog";
import { slugify } from "@/lib/utils";

const ROOT = process.cwd();
const IMAGES_DIR = path.join(ROOT, "public", "images", "blog");
const IMAGE_TYPES = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".mp4", ".webm"]);
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

export type EditablePost = {
  slug: string;
  title: string;
  date: string;
  updated?: string;
  summary: string;
  tags: string[];
  draft: boolean;
  body: string;
};

export type DeployState = "queued" | "running" | "success" | "failure" | "cancelled" | "unknown";

const execFileAsync = promisify(execFile);

async function git(...args: string[]) {
  try {
    const { stdout } = await execFileAsync("git", args, {
      cwd: ROOT,
      // Fail instead of hanging on a credential prompt nobody can see.
      env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
    });
    return stdout.trim();
  } catch (error) {
    const stderr = (error as { stderr?: string }).stderr?.trim();
    throw new Error(stderr ? stderr.replace(/^(fatal|error): /gm, "") : String(error));
  }
}

function assertSlug(slug: string) {
  if (!SLUG_PATTERN.test(slug)) {
    throw new Error("The URL slug can only use lowercase letters, numbers, and single hyphens.");
  }
}

function postPath(slug: string) {
  return path.join(POSTS_DIR, `${slug}.md`);
}

function toFile(post: EditablePost) {
  // JSON strings are valid YAML, which keeps quotes and colons in titles safe.
  const lines = ["---", `title: ${JSON.stringify(post.title)}`, `date: ${post.date}`];
  if (post.updated) lines.push(`updated: ${post.updated}`);
  lines.push(`summary: ${JSON.stringify(post.summary)}`);
  if (post.tags.length > 0) lines.push(`tags: ${JSON.stringify(post.tags)}`);
  if (post.draft) lines.push("draft: true");
  lines.push("---", "", post.body.trim(), "");
  return lines.join("\n");
}

export function listPosts() {
  return getPosts();
}

export function loadPost(slug: string): EditablePost {
  assertSlug(slug);
  const { meta, content } = readPostFile(`${slug}.md`);
  return {
    slug,
    title: meta.title,
    date: meta.date,
    updated: meta.updated,
    summary: meta.summary,
    tags: [...meta.tags],
    draft: meta.draft,
    body: content.replace(/^\s*\n/, ""),
  };
}

export function renderPreview(markdown: string) {
  return renderMarkdown(markdown);
}

export function savePost(input: EditablePost, isNew: boolean) {
  const post: EditablePost = {
    ...input,
    title: input.title.trim(),
    summary: input.summary.trim(),
    tags: Array.from(new Set(input.tags.map((tag) => tag.trim()).filter(Boolean))),
  };

  assertSlug(post.slug);
  if (!post.title) throw new Error("Add a title.");
  if (!post.summary) throw new Error("Add a one-sentence summary. It shows on cards, in search results, and in RSS.");
  if (!DATE_PATTERN.test(post.date)) throw new Error("Pick a date.");
  if (!post.body.trim()) throw new Error("The post is empty.");

  const file = postPath(post.slug);
  if (isNew && fs.existsSync(file)) {
    throw new Error(`A post already lives at /blog/${post.slug}/. Change the title or slug.`);
  }

  fs.mkdirSync(POSTS_DIR, { recursive: true });
  fs.writeFileSync(file, toFile(post));
  readPostFile(`${post.slug}.md`);
}

export function saveImage(slug: string, name: string, data: Buffer) {
  assertSlug(slug);
  const rawExtension = path.extname(name);
  const extension = rawExtension.toLowerCase();
  if (!IMAGE_TYPES.has(extension)) {
    throw new Error(`Unsupported file type. Use one of: ${Array.from(IMAGE_TYPES).join(", ")}`);
  }
  if (data.length > MAX_UPLOAD_BYTES) {
    throw new Error("That file is over 20 MB. Compress it first so the site stays fast.");
  }

  const directory = path.join(IMAGES_DIR, slug);
  const base = slugify(path.basename(name, rawExtension)) || "image";
  fs.mkdirSync(directory, { recursive: true });

  let fileName = `${base}${extension}`;
  for (let copy = 1; fs.existsSync(path.join(directory, fileName)); copy += 1) {
    fileName = `${base}-${copy}${extension}`;
  }

  fs.writeFileSync(path.join(directory, fileName), data);
  return `/images/blog/${slug}/${fileName}`;
}

/** The post file plus its image folder, relative to the repo root. */
export function postFiles(slug: string) {
  assertSlug(slug);
  const files = [path.relative(ROOT, postPath(slug))];
  const images = path.join(IMAGES_DIR, slug);
  if (fs.existsSync(images)) files.push(path.relative(ROOT, images));
  return files;
}

export async function publishPost(slug: string) {
  const { meta } = readPostFile(`${slug}.md`);
  if (meta.draft) throw new Error("This post is still marked as a draft.");
  return pushChanges(postFiles(slug), `Blog: ${meta.title}`);
}

/** Turns a published post back into a draft. Returns its title for the commit message. */
export function markDraft(slug: string) {
  const post = loadPost(slug);
  if (post.draft) throw new Error("This post is already a draft.");
  fs.writeFileSync(postPath(slug), toFile({ ...post, draft: true }));
  return post.title;
}

/** Deletes the post and its images from disk. Returns its title for the commit message. */
export function removePost(slug: string) {
  const { meta } = readPostFile(`${slug}.md`);
  fs.rmSync(postPath(slug));
  fs.rmSync(path.join(IMAGES_DIR, slug), { recursive: true, force: true });
  return meta.title;
}

/**
 * Commits only the given post files (additions, edits, or deletions), then pushes to
 * origin/main, which GitHub Actions deploys. Other uncommitted work is left alone.
 */
export async function pushChanges(files: string[], message: string) {
  // A draft that was never committed has nothing on GitHub to change, so skip git entirely.
  const known: string[] = [];
  for (const file of files) {
    if (fs.existsSync(path.join(ROOT, file)) || (await git("ls-files", "--", file))) known.push(file);
  }
  if (known.length === 0) {
    return { sha: null, commits: [] };
  }

  await git("add", "--all", "--", ...known);
  const hasChanges = await git("diff", "--cached", "--quiet", "--", ...known).then(
    () => false,
    () => true
  );
  if (hasChanges) {
    await git("commit", "--quiet", "--only", "-m", message, "--", ...known);
  }

  await git("fetch", "--quiet", "origin", "main");
  const upToDate = await git("merge-base", "--is-ancestor", "origin/main", "HEAD").then(
    () => true,
    () => false
  );
  if (!upToDate) {
    throw new Error(
      "GitHub has commits this machine does not. Your change is committed locally; run `git pull --rebase origin main` in the repo, then try again."
    );
  }

  const commits = (await git("log", "--format=%s", "origin/main..HEAD")).split("\n").filter(Boolean);
  if (commits.length === 0) {
    return { sha: null, commits };
  }

  await git("push", "--quiet", "origin", "HEAD:main");
  return { sha: await git("rev-parse", "HEAD"), commits };
}

async function githubRepo() {
  const remote = await git("remote", "get-url", "origin");
  return remote.match(/github\.com[:/]([^/]+\/[^/]+?)(?:\.git)?$/)?.[1] ?? null;
}

export async function getDeployLinks() {
  const repo = await githubRepo();
  return { actionsUrl: repo ? `https://github.com/${repo}/actions` : null, siteUrl: SITE.url };
}

export async function deployStatus(sha: string): Promise<{ state: DeployState; url?: string }> {
  if (!/^[0-9a-f]{40}$/.test(sha)) throw new Error("Invalid commit id.");
  const repo = await githubRepo();
  if (!repo) return { state: "unknown" };

  const response = await fetch(`https://api.github.com/repos/${repo}/actions/runs?head_sha=${sha}&per_page=1`, {
    headers: { Accept: "application/vnd.github+json", "User-Agent": "blog-writer" },
    cache: "no-store",
  });
  if (!response.ok) return { state: "unknown" };

  const { workflow_runs: runs } = (await response.json()) as {
    workflow_runs: { status: string; conclusion: string | null; html_url: string }[];
  };
  const run = runs[0];
  if (!run) return { state: "queued" };
  if (run.status !== "completed") return { state: "running", url: run.html_url };
  if (run.conclusion === "success" || run.conclusion === "cancelled") return { state: run.conclusion, url: run.html_url };
  return { state: "failure", url: run.html_url };
}
