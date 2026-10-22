import { PostCard } from "@/components/post-card";
import { SITE } from "@/data/portfolio";
import { getPosts } from "@/lib/blog";
import { ArrowLeft, Rss } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Blog",
  description: `Writing by ${SITE.name} on world models, continual learning, and reinforcement learning.`,
  alternates: {
    canonical: "/blog/",
    types: { "application/rss+xml": "/feed.xml" },
  },
};

export default function BlogPage() {
  const posts = getPosts();

  return (
    <main id="main-content" className="space-y-6 py-section-lg">
      <Link className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary" href="/">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back home
      </Link>

      <header className="glass-card hero-glass p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Writing</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Blog.</h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
          Longer write-ups on experiments, results, and the papers behind them.
        </p>
        <a
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/55 px-4 py-2 text-sm font-medium transition-colors hover:border-primary/40 hover:text-primary"
          href="/feed.xml"
        >
          <Rss className="size-4" aria-hidden="true" />
          RSS feed
        </a>
      </header>

      <section className="glass-card p-6 md:p-8">
        {posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">No posts yet. The first one is on its way.</p>
        )}
      </section>
    </main>
  );
}
