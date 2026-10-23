import "katex/dist/katex.min.css";
import { SITE } from "@/data/portfolio";
import { getPost, getPosts } from "@/lib/blog";
import { formatPostDate } from "@/lib/utils";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type PostPageProps = {
  params: { slug: string };
};

// `output: export` rejects a dynamic route with no params, so before the first post is
// published we emit one placeholder that renders the 404 page. "_" can never be a real slug.
const NO_POSTS_PLACEHOLDER = "_";

export function generateStaticParams() {
  const posts = getPosts();
  return posts.length > 0
    ? posts.map((post) => ({ slug: post.slug }))
    : [{ slug: NO_POSTS_PLACEHOLDER }];
}

export function generateMetadata({ params }: PostPageProps): Metadata {
  const post = getPosts().find((candidate) => candidate.slug === params.slug);

  if (!post) {
    return { title: "Post not found" };
  }

  return {
    title: post.title,
    description: post.summary,
    keywords: [...post.tags],
    alternates: {
      canonical: `/blog/${post.slug}/`,
      types: { "application/rss+xml": "/feed.xml" },
    },
    openGraph: {
      type: "article",
      url: `${SITE.url}/blog/${post.slug}/`,
      title: post.title,
      description: post.summary,
      publishedTime: post.date,
      modifiedTime: post.updated ?? post.date,
      authors: [SITE.name],
      tags: [...post.tags],
      images: [{ url: "/og.png", width: 1200, height: 630, alt: `${SITE.name} portfolio` }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.summary,
      images: ["/og.png"],
    },
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const post = await getPost(params.slug);

  if (!post) {
    notFound();
  }

  const posts = getPosts();
  const index = posts.findIndex((candidate) => candidate.slug === post.slug);
  const newer = posts[index - 1];
  const older = posts[index + 1];

  const postJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.summary,
    datePublished: post.date,
    dateModified: post.updated ?? post.date,
    author: { "@type": "Person", name: SITE.name, url: SITE.url },
    url: `${SITE.url}/blog/${post.slug}/`,
    keywords: post.tags.join(", "),
  };

  return (
    <main id="main-content" className="space-y-6 py-section-lg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(postJsonLd) }}
      />

      <Link className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary" href="/blog/">
        <ArrowLeft className="size-4" aria-hidden="true" />
        All posts
      </Link>

      <header className="glass-card hero-glass p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-3">
          {post.draft ? (
            <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
              Draft, hidden in production
            </span>
          ) : null}
          <span className="font-mono text-xs text-muted-foreground">
            <time dateTime={post.date}>{formatPostDate(post.date)}</time> · {post.readingMinutes} min read
            {post.updated ? <> · Updated <time dateTime={post.updated}>{formatPostDate(post.updated)}</time></> : null}
          </span>
        </div>
        <h1 className="mt-6 text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          {post.title}
        </h1>
        <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">{post.summary}</p>
        {post.tags.length > 0 ? (
          <div className="mt-6 flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <span key={tag} className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </header>

      <article
        className="post-body glass-card prose prose-neutral max-w-none p-6 dark:prose-invert sm:p-10"
        dangerouslySetInnerHTML={{ __html: post.html }}
      />

      {newer || older ? (
        <nav className="grid gap-4 sm:grid-cols-2" aria-label="More posts">
          {older ? (
            <Link className="glass-card group p-5" href={`/blog/${older.slug}/`}>
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <ArrowLeft className="size-3.5" aria-hidden="true" /> Older
              </span>
              <span className="mt-2 block text-sm font-semibold leading-snug group-hover:text-primary">{older.title}</span>
            </Link>
          ) : <span className="hidden sm:block" />}
          {newer ? (
            <Link className="glass-card group p-5 text-right" href={`/blog/${newer.slug}/`}>
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                Newer <ArrowRight className="size-3.5" aria-hidden="true" />
              </span>
              <span className="mt-2 block text-sm font-semibold leading-snug group-hover:text-primary">{newer.title}</span>
            </Link>
          ) : null}
        </nav>
      ) : null}
    </main>
  );
}
