"use client";

import { ModeToggle } from "@/components/mode-toggle";
import { SITE } from "@/data/portfolio";
import type { PostMeta } from "@/lib/blog";
import { cn, formatPostDate, slugify } from "@/lib/utils";
import {
  Archive,
  Bold,
  Check,
  CodeXml,
  ExternalLink,
  FilePlus2,
  Heading2,
  ImagePlus,
  Italic,
  Link2,
  LoaderCircle,
  PenLine,
  Save,
  Send,
  Sigma,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type EditorPost = {
  slug: string;
  title: string;
  date: string;
  updated?: string;
  summary: string;
  tags: string;
  draft: boolean;
  body: string;
};

type Link = { href: string; label: string };

type Status =
  | { kind: "idle" }
  | { kind: "working"; message: string }
  | { kind: "done"; message: string; link?: Link }
  | { kind: "error"; message: string; link?: Link };

type Deployment = { sha: string; startedAt: number; commits: string[]; doneMessage: string; doneLink: Link };

type SaveResult = { saved: true; sha: string | null; commits: string[]; publishError?: string };

const SITE_HOST = SITE.url.replace(/^https?:\/\//, "");
const DEPLOY_TIMEOUT_MS = 10 * 60 * 1000;

function today() {
  const now = new Date();
  return [now.getFullYear(), now.getMonth() + 1, now.getDate()].map((part) => String(part).padStart(2, "0")).join("-");
}

function emptyPost(): EditorPost {
  return { slug: "", title: "", date: today(), summary: "", tags: "", draft: true, body: "" };
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function api<T>(
  action: string,
  options: { query?: Record<string, string>; json?: unknown; file?: Blob } = {}
): Promise<T> {
  const url = `/api/writer/?${new URLSearchParams({ action, ...options.query })}`;
  const init: RequestInit =
    options.json !== undefined || options.file !== undefined
      ? {
          method: "POST",
          headers: options.file ? { "x-writer": "1" } : { "x-writer": "1", "content-type": "application/json" },
          body: options.file ?? JSON.stringify(options.json),
        }
      : { cache: "no-store" };
  const response = await fetch(url, init);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? `Request failed (${response.status})`);
  return data as T;
}

function ToolButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {children}
    </button>
  );
}

function StatusLink({ link }: { link?: Link }) {
  return link ? (
    <a className="inline-flex items-center gap-1 font-medium underline underline-offset-4" href={link.href} target="_blank" rel="noreferrer">
      {link.label}
      <ExternalLink className="size-3" aria-hidden="true" />
    </a>
  ) : null;
}

export function Writer() {
  const [posts, setPosts] = useState<PostMeta[]>([]);
  const [actionsUrl, setActionsUrl] = useState<string | null>(null);
  const [post, setPost] = useState<EditorPost>(emptyPost);
  const [savedSlug, setSavedSlug] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [deployment, setDeployment] = useState<Deployment | null>(null);
  const [runUrl, setRunUrl] = useState<string>();
  const [now, setNow] = useState(() => Date.now());
  const [mounted, setMounted] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRequest = useRef(0);

  const busy = status.kind === "working";
  const isNew = savedSlug === null;

  const refreshPosts = useCallback(async () => {
    try {
      const data = await api<{ posts: PostMeta[]; actionsUrl: string | null }>("list");
      setPosts(data.posts);
      setActionsUrl(data.actionsUrl);
    } catch (error) {
      setStatus({ kind: "error", message: errorMessage(error) });
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    void refreshPosts();
  }, [refreshPosts]);

  // Render the preview with the same Markdown pipeline the site uses.
  useEffect(() => {
    const request = ++previewRequest.current;
    const timer = setTimeout(async () => {
      try {
        const { html } = await api<{ html: string }>("preview", { json: { body: post.body } });
        if (request === previewRequest.current) setPreviewHtml(html);
      } catch {
        // Keep the last good preview while the Markdown is mid-edit.
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [post.body]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // Follow the GitHub Actions run for the pushed commit until the site is live.
  useEffect(() => {
    if (!deployment) return;
    const actionsLink = actionsUrl ? { href: actionsUrl, label: "Open GitHub Actions" } : undefined;
    const tick = setInterval(() => setNow(Date.now()), 1000);
    const poll = setInterval(async () => {
      if (Date.now() - deployment.startedAt > DEPLOY_TIMEOUT_MS) {
        setDeployment(null);
        setStatus({ kind: "error", message: "Pushed, but the deploy has not finished after 10 minutes.", link: actionsLink });
        return;
      }
      try {
        const { state, url } = await api<{ state: string; url?: string }>("status", { query: { sha: deployment.sha } });
        if (state === "success") {
          setDeployment(null);
          setStatus({ kind: "done", message: deployment.doneMessage, link: deployment.doneLink });
        } else if (state === "failure") {
          setDeployment(null);
          setStatus({
            kind: "error",
            message: "The GitHub build failed, so the live site did not change.",
            link: url ? { href: url, label: "See what broke" } : actionsLink,
          });
        } else if (state === "cancelled") {
          setDeployment(null);
          setStatus({ kind: "done", message: "A newer push replaced this deploy; it will carry this post too.", link: actionsLink });
        } else if (url) {
          setRunUrl(url);
        }
      } catch {
        // Network hiccup; try again on the next tick.
      }
    }, 5000);
    return () => {
      clearInterval(tick);
      clearInterval(poll);
    };
  }, [deployment, actionsUrl]);

  function update<K extends keyof EditorPost>(field: K, value: EditorPost[K]) {
    setPost((current) => {
      const next = { ...current, [field]: value };
      if (field === "title" && isNew && !slugTouched) next.slug = slugify(String(value));
      return next;
    });
    setDirty(true);
  }

  async function openPost(slug: string | null) {
    if (busy || (dirty && !window.confirm("Discard your unsaved changes?"))) return;
    try {
      const loaded = slug ? (await api<{ post: EditorPost & { tags: string[] } }>("load", { query: { slug } })).post : null;
      setPost(loaded ? { ...loaded, tags: loaded.tags.join(", ") } : emptyPost());
      setSavedSlug(slug);
      setSlugTouched(slug !== null);
      setDirty(false);
      setStatus({ kind: "idle" });
    } catch (error) {
      setStatus({ kind: "error", message: errorMessage(error) });
    }
  }

  async function save(publish: boolean) {
    if (busy) return;
    const next = { ...post, slug: post.slug.replace(/^-+|-+$/g, ""), draft: publish ? false : post.draft };
    if (publish && !window.confirm(`Publish "${next.title.trim() || "Untitled"}" to ${SITE_HOST}?`)) return;

    setStatus({ kind: "working", message: publish ? "Saving, committing, and pushing to GitHub…" : "Saving…" });
    try {
      const result = await api<SaveResult>("save", {
        json: { post: { ...next, tags: next.tags.split(",") }, isNew, publish },
      });
      setPost(next);
      setSavedSlug(next.slug);
      setSlugTouched(true);
      setDirty(false);
      void refreshPosts();

      const liveUrl = `${SITE.url}/blog/${next.slug}/`;
      if (result.publishError) {
        setStatus({ kind: "error", message: `Saved, but not published: ${result.publishError}` });
      } else if (!publish) {
        setStatus({
          kind: "done",
          message: next.draft ? "Draft saved. Only you can see it." : "Saved on this machine. Publish to update the live post.",
        });
      } else if (result.sha) {
        setRunUrl(undefined);
        setDeployment({
          sha: result.sha,
          startedAt: Date.now(),
          commits: result.commits,
          doneMessage: `Live on ${SITE_HOST}.`,
          doneLink: { href: liveUrl, label: "Open post" },
        });
        setStatus({ kind: "idle" });
      } else {
        setStatus({ kind: "done", message: "Nothing new to publish; the site already has this version.", link: { href: liveUrl, label: "Open post" } });
      }
    } catch (error) {
      setStatus({ kind: "error", message: errorMessage(error) });
    }
  }

  // Shared ending for Unpublish and Delete: follow the deploy, or say why nothing was pushed.
  function followRemoval(result: SaveResult, liveMessage: string, localMessage: string) {
    if (result.publishError) {
      setStatus({ kind: "error", message: `${localMessage} The live site did not change: ${result.publishError}` });
    } else if (result.sha) {
      setRunUrl(undefined);
      setDeployment({
        sha: result.sha,
        startedAt: Date.now(),
        commits: result.commits,
        doneMessage: liveMessage,
        doneLink: { href: `${SITE.url}/blog/`, label: "Open blog" },
      });
      setStatus({ kind: "idle" });
    } else {
      setStatus({ kind: "done", message: localMessage });
    }
  }

  async function unpublish() {
    if (busy || savedSlug === null) return;
    if (!window.confirm(`Take "${post.title}" off ${SITE_HOST}?\n\nIt stays here as a draft, so you can edit it and publish again later.`)) return;

    setStatus({ kind: "working", message: "Unpublishing…" });
    try {
      const result = await api<SaveResult>("unpublish", { json: { slug: savedSlug } });
      setPost((current) => ({ ...current, draft: true }));
      void refreshPosts();
      followRemoval(result, `Taken off ${SITE_HOST}. It is a draft again.`, "It is a draft again on this machine.");
    } catch (error) {
      setStatus({ kind: "error", message: errorMessage(error) });
    }
  }

  async function remove() {
    if (busy || savedSlug === null) return;
    const where = post.draft ? "from this machine" : `from this machine and from ${SITE_HOST}`;
    if (!window.confirm(`Delete "${post.title}" and its images ${where}?\n\nThis cannot be undone from the editor.`)) return;

    setStatus({ kind: "working", message: "Deleting…" });
    try {
      const result = await api<SaveResult>("delete", { json: { slug: savedSlug } });
      setPost(emptyPost());
      setSavedSlug(null);
      setSlugTouched(false);
      setDirty(false);
      void refreshPosts();
      followRemoval(result, `Deleted from ${SITE_HOST}.`, "Deleted.");
    } catch (error) {
      setStatus({ kind: "error", message: errorMessage(error) });
    }
  }

  // Cmd/Ctrl+S saves from anywhere on the page.
  const saveRef = useRef(save);
  saveRef.current = save;
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "s") {
        event.preventDefault();
        void saveRef.current(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function replaceSelection(text: string, select: [number, number] = [text.length, text.length]) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { selectionStart: start, selectionEnd: end } = textarea;
    textarea.focus();
    // insertText keeps the browser's undo history (Cmd+Z); fall back to setting the value.
    if (!document.execCommand("insertText", false, text)) {
      update("body", textarea.value.slice(0, start) + text + textarea.value.slice(end));
    }
    requestAnimationFrame(() => textarea.setSelectionRange(start + select[0], start + select[1]));
  }

  function selectedText(placeholder: string) {
    const textarea = textareaRef.current;
    return textarea?.value.slice(textarea.selectionStart, textarea.selectionEnd) || placeholder;
  }

  function wrap(before: string, after: string, placeholder: string) {
    const selected = selectedText(placeholder);
    replaceSelection(`${before}${selected}${after}`, [before.length, before.length + selected.length]);
  }

  // Headings, code fences, and images need their own paragraph to render as blocks.
  function insertBlock(text: string, select: [number, number]) {
    const before = textareaRef.current?.value.slice(0, textareaRef.current.selectionStart) ?? "";
    const gap = before === "" || before.endsWith("\n\n") ? "" : before.endsWith("\n") ? "\n" : "\n\n";
    replaceSelection(`${gap}${text}\n`, [gap.length + select[0], gap.length + select[1]]);
  }

  async function uploadFiles(files: File[]) {
    if (!post.slug) {
      setStatus({ kind: "error", message: "Add a title first. Images are stored under the post's URL." });
      return;
    }
    setSlugTouched(true);
    for (const file of files) {
      setStatus({ kind: "working", message: `Uploading ${file.name}…` });
      try {
        const { url } = await api<{ url: string }>("upload", {
          query: { slug: post.slug, name: file.name || "image.png" },
          file,
        });
        insertBlock(`![Describe the image](${url})`, [2, 20]);
        setStatus({ kind: "done", message: `Added ${url}. Replace the selected text with a short description.` });
      } catch (error) {
        setStatus({ kind: "error", message: errorMessage(error) });
        return;
      }
    }
  }

  function mediaFiles(list: FileList | null | undefined) {
    return Array.from(list ?? []).filter((file) => file.type.startsWith("image/") || file.type.startsWith("video/"));
  }

  const words = post.body.trim() ? post.body.trim().split(/\s+/).length : 0;
  const tags = post.tags.split(",").map((tag) => tag.trim()).filter(Boolean);
  const deployElapsed = deployment ? Math.max(0, Math.floor((now - deployment.startedAt) / 1000)) : 0;

  // Rendered into <body> so the editor sits above the site's dock and narrow page column.
  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-40 flex flex-col bg-background text-foreground">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border/70 px-4 py-3">
        <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-2 font-semibold" title="Open the local site">
          <PenLine className="size-4 text-primary" aria-hidden="true" />
          Writer
        </a>

        <select
          className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm lg:hidden"
          value={savedSlug ?? ""}
          onChange={(event) => openPost(event.target.value || null)}
          aria-label="Choose a post"
        >
          <option value="">New post</option>
          {posts.map((item) => (
            <option key={item.slug} value={item.slug}>
              {item.draft ? "Draft: " : ""}
              {item.title}
            </option>
          ))}
        </select>

        <div className="flex min-w-0 flex-1 items-center gap-2 text-xs" role="status" aria-live="polite">
          {status.kind === "working" ? (
            <>
              <LoaderCircle className="size-3.5 shrink-0 animate-spin text-primary" aria-hidden="true" />
              <span className="text-muted-foreground">{status.message}</span>
            </>
          ) : status.kind === "error" ? (
            <>
              <TriangleAlert className="size-3.5 shrink-0 text-red-600 dark:text-red-400" aria-hidden="true" />
              <span className="text-red-700 dark:text-red-300">{status.message}</span>
              <StatusLink link={status.link} />
            </>
          ) : deployment ? (
            <>
              <LoaderCircle className="size-3.5 shrink-0 animate-spin text-primary" aria-hidden="true" />
              <span className="text-muted-foreground">
                Pushed {deployment.commits.length} commit{deployment.commits.length === 1 ? "" : "s"}. GitHub is building the site (
                {Math.floor(deployElapsed / 60)}:{String(deployElapsed % 60).padStart(2, "0")}, usually about a minute).
              </span>
              <StatusLink link={runUrl ? { href: runUrl, label: "Watch" } : undefined} />
            </>
          ) : status.kind === "done" ? (
            <>
              <Check className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              <span>{status.message}</span>
              <StatusLink link={status.link} />
            </>
          ) : dirty ? (
            <span className="text-muted-foreground">Unsaved changes</span>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {!isNew && !post.draft ? (
            <button
              type="button"
              onClick={unpublish}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
              title={`Take this post off ${SITE_HOST} and keep it as a draft`}
            >
              <Archive className="size-4" aria-hidden="true" />
              Unpublish
            </button>
          ) : null}
          {!isNew ? (
            <button
              type="button"
              onClick={remove}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-600 disabled:opacity-50 dark:hover:text-red-400"
              title="Delete this post and its images"
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Delete
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => save(false)}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full border border-border/70 px-4 py-2 text-sm font-medium transition-colors hover:border-primary/50 hover:text-primary disabled:opacity-50"
            title="Save to this machine (Cmd+S)"
          >
            <Save className="size-4" aria-hidden="true" />
            {post.draft ? "Save draft" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => save(true)}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-85 disabled:opacity-50"
            title={`Commit, push, and deploy to ${SITE_HOST}`}
          >
            <Send className="size-4" aria-hidden="true" />
            {post.draft ? "Publish" : "Publish changes"}
          </button>
          <ModeToggle />
        </div>
      </header>

      <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[15rem_minmax(0,1fr)_minmax(0,1fr)] lg:overflow-hidden">
        <aside className="hidden min-h-0 overflow-y-auto border-r border-border/70 p-3 lg:block">
          <button
            type="button"
            onClick={() => openPost(null)}
            className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm font-medium transition-colors hover:border-primary/50 hover:text-primary"
          >
            <FilePlus2 className="size-4" aria-hidden="true" />
            New post
          </button>
          <ul className="mt-3 space-y-1">
            {posts.map((item) => (
              <li key={item.slug}>
                <button
                  type="button"
                  onClick={() => openPost(item.slug)}
                  className={cn(
                    "w-full rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted/70",
                    savedSlug === item.slug && "bg-primary/10"
                  )}
                >
                  <span className="block truncate text-sm font-medium">{item.title}</span>
                  <span className="mt-0.5 block text-[11px] text-muted-foreground">
                    {item.draft ? <span className="text-amber-700 dark:text-amber-300">Draft</span> : "Published"} ·{" "}
                    {formatPostDate(item.date)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <a
            className="mt-4 inline-flex items-center gap-1 px-3 text-xs text-muted-foreground hover:text-primary"
            href={`${SITE.url}/blog/`}
            target="_blank"
            rel="noreferrer"
          >
            Live blog <ExternalLink className="size-3" aria-hidden="true" />
          </a>
        </aside>

        <section className="flex min-h-[70vh] flex-col border-b border-border/70 lg:min-h-0 lg:overflow-y-auto lg:border-b-0 lg:border-r">
          <div className="space-y-3 border-b border-border/70 p-4">
            <input
              value={post.title}
              onChange={(event) => update("title", event.target.value)}
              placeholder="Post title"
              aria-label="Title"
              className="w-full bg-transparent text-2xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground/50"
            />
            <textarea
              value={post.summary}
              onChange={(event) => update("summary", event.target.value)}
              placeholder="One-sentence summary. Shown on cards, in search results, and in RSS."
              aria-label="Summary"
              rows={2}
              className="w-full resize-none bg-transparent text-sm leading-relaxed text-muted-foreground outline-none placeholder:text-muted-foreground/50"
            />
            <div className="grid gap-2 text-xs sm:grid-cols-[1.4fr_0.8fr_1.2fr]">
              <label className="space-y-1">
                <span className="text-muted-foreground">URL {isNew ? "" : "(fixed once saved)"}</span>
                <span className="flex items-center rounded-lg border border-border/70 px-2 py-1.5 focus-within:border-primary/60">
                  <span className="text-muted-foreground">/blog/</span>
                  <input
                    value={post.slug}
                    disabled={!isNew}
                    onChange={(event) => {
                      setSlugTouched(true);
                      update("slug", event.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/-{2,}/g, "-"));
                    }}
                    placeholder="from-the-title"
                    className="min-w-0 flex-1 bg-transparent outline-none disabled:text-muted-foreground"
                  />
                </span>
              </label>
              <label className="space-y-1">
                <span className="text-muted-foreground">Date</span>
                <input
                  type="date"
                  value={post.date}
                  onChange={(event) => update("date", event.target.value)}
                  className="w-full rounded-lg border border-border/70 bg-transparent px-2 py-1.5 outline-none focus:border-primary/60"
                />
              </label>
              <label className="space-y-1">
                <span className="text-muted-foreground">Tags, comma separated</span>
                <input
                  value={post.tags}
                  onChange={(event) => update("tags", event.target.value)}
                  placeholder="JEPA, World models"
                  className="w-full rounded-lg border border-border/70 bg-transparent px-2 py-1.5 outline-none focus:border-primary/60"
                />
              </label>
            </div>
          </div>

          <div className="sticky top-0 z-10 flex items-center gap-0.5 border-b border-border/70 bg-background/95 px-3 py-1.5 backdrop-blur">
            <ToolButton
              label="Heading"
              onClick={() => {
                const text = selectedText("Heading");
                insertBlock(`## ${text}`, [3, 3 + text.length]);
              }}
            >
              <Heading2 className="size-4" />
            </ToolButton>
            <ToolButton label="Bold (Cmd+B)" onClick={() => wrap("**", "**", "bold text")}>
              <Bold className="size-4" />
            </ToolButton>
            <ToolButton label="Italic (Cmd+I)" onClick={() => wrap("*", "*", "italic text")}>
              <Italic className="size-4" />
            </ToolButton>
            <ToolButton label="Link" onClick={() => wrap("[", "](https://)", "link text")}>
              <Link2 className="size-4" />
            </ToolButton>
            <ToolButton
              label="Code block"
              onClick={() => {
                const code = selectedText("code");
                insertBlock("```python\n" + code + "\n```", [10, 10 + code.length]);
              }}
            >
              <CodeXml className="size-4" />
            </ToolButton>
            <ToolButton label="Inline math ($...$; use $$...$$ for a display equation)" onClick={() => wrap("$", "$", "x^2")}>
              <Sigma className="size-4" />
            </ToolButton>
            <ToolButton label="Add image or video (you can also paste or drop)" onClick={() => fileInputRef.current?.click()}>
              <ImagePlus className="size-4" />
            </ToolButton>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/mp4,video/webm"
              multiple
              hidden
              onChange={(event) => {
                void uploadFiles(mediaFiles(event.target.files));
                event.target.value = "";
              }}
            />
            <span className="ml-auto text-[11px] text-muted-foreground">
              {words} words · {Math.max(1, Math.round(words / 200))} min read
            </span>
          </div>

          <textarea
            ref={textareaRef}
            value={post.body}
            onChange={(event) => update("body", event.target.value)}
            onKeyDown={(event) => {
              if (!(event.metaKey || event.ctrlKey)) return;
              if (event.key === "b") {
                event.preventDefault();
                wrap("**", "**", "bold text");
              } else if (event.key === "i") {
                event.preventDefault();
                wrap("*", "*", "italic text");
              }
            }}
            onPaste={(event) => {
              const files = mediaFiles(event.clipboardData.files);
              if (files.length > 0) {
                event.preventDefault();
                void uploadFiles(files);
              }
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              const files = mediaFiles(event.dataTransfer.files);
              if (files.length > 0) {
                event.preventDefault();
                void uploadFiles(files);
              }
            }}
            placeholder={"Write in Markdown.\n\nPaste or drop images straight in. $math$ and ```code``` work like on the site."}
            aria-label="Post body in Markdown"
            spellCheck
            className="min-h-[24rem] flex-1 resize-none bg-transparent p-4 font-mono text-sm leading-relaxed outline-none placeholder:text-muted-foreground/50"
          />
        </section>

        <section className="min-h-0 bg-muted/20 p-4 lg:overflow-y-auto lg:p-6" aria-label="Preview">
          <div className="mx-auto max-w-3xl space-y-4">
            <p className="text-center text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Preview</p>
            <header className="glass-card hero-glass p-6">
              <p className="font-mono text-xs text-muted-foreground">
                {post.date ? formatPostDate(post.date) : "No date"} · {Math.max(1, Math.round(words / 200))} min read
                {post.draft ? " · Draft" : ""}
              </p>
              <h1 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-tight">
                {post.title || "Untitled post"}
              </h1>
              {post.summary ? <p className="mt-4 text-base leading-7 text-muted-foreground">{post.summary}</p> : null}
              {tags.length > 0 ? (
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span key={tag} className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </header>
            <article
              className="post-body glass-card prose prose-neutral max-w-none p-6 dark:prose-invert sm:p-8"
              dangerouslySetInnerHTML={{
                __html: previewHtml || '<p class="text-muted-foreground">Start writing and the post appears here.</p>',
              }}
            />
          </div>
        </section>
      </div>
    </div>,
    document.body
  );
}
