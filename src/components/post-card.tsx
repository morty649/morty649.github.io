import type { PostMeta } from "@/lib/blog";
import { formatPostDate } from "@/lib/utils";
import Link from "next/link";

export function PostCard({ post }: { post: PostMeta }) {
  return (
    <Link
      href={`/blog/${post.slug}/`}
      className="group block rounded-2xl border border-border/40 bg-white/40 p-5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/30 dark:bg-white/5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <time dateTime={post.date}>{formatPostDate(post.date)}</time>
        <span className="flex items-center gap-2">
          {post.draft ? (
            <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-300">
              Draft
            </span>
          ) : null}
          {post.readingMinutes} min read
        </span>
      </div>
      <h3 className="mt-2 text-base font-semibold leading-snug transition-colors group-hover:text-primary">
        {post.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{post.summary}</p>
      {post.tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <span key={tag} className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </Link>
  );
}
