import { PROJECTS, SITE, getProject } from "@/data/portfolio";
import { ArrowLeft, ArrowUpRight, CheckCircle2, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type ProjectPageProps = {
  params: { slug: string };
};

export function generateStaticParams() {
  return PROJECTS.map((project) => ({ slug: project.slug }));
}

export function generateMetadata({ params }: ProjectPageProps): Metadata {
  const project = getProject(params.slug);

  if (!project) {
    return { title: "Project not found" };
  }

  return {
    title: project.shortTitle,
    description: project.summary,
    alternates: { canonical: `/projects/${project.slug}/` },
    openGraph: {
      type: "article",
      url: `${SITE.url}/projects/${project.slug}/`,
      title: `${project.shortTitle} - ${SITE.name}`,
      description: project.summary,
    },
  };
}

export default function ProjectPage({ params }: ProjectPageProps) {
  const project = getProject(params.slug);

  if (!project) {
    notFound();
  }

  const projectJsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: project.summary,
    creator: { "@type": "Person", name: SITE.name, url: SITE.url },
    url: `${SITE.url}/projects/${project.slug}/`,
    keywords: project.technologies.join(", "),
  };

  return (
    <main id="main-content" className="space-y-6 py-section-lg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(projectJsonLd) }}
      />

      <Link className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary" href="/#projects">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to selected work
      </Link>

      <header className="glass-card hero-glass p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-foreground/80">{project.status}</span>
          <span className="font-mono text-xs text-muted-foreground">
            {project.period} · {project.category}
          </span>
        </div>
        <h1 className="mt-7 text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          {project.title}
        </h1>
        <p className="mt-6 text-base leading-7 text-muted-foreground sm:text-lg">
          {project.summary}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {project.links.map((link) => (
            <a
              className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/55 px-4 py-2 text-sm font-medium transition-colors hover:border-primary/40 hover:text-primary"
              href={link.url}
              target="_blank"
              rel="noreferrer"
              key={link.url}
            >
              {link.label}
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </a>
          ))}
        </div>
      </header>

      <section className="glass-card p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">The problem</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">Why build this?</h2>
        <p className="mt-4 text-base leading-7 text-muted-foreground">{project.problem}</p>
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        <section className="glass-card p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Approach</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">How it works</h2>
          <ul className="mt-7 space-y-4">
            {project.approach.map((item) => (
              <li className="flex gap-3 text-sm leading-6 text-muted-foreground" key={item}>
                <CheckCircle2 className="mt-1 size-4 shrink-0 text-primary" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="glass-card p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Outcome</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">What came out of it</h2>
          <ul className="mt-7 space-y-4">
            {project.outcomes.map((item) => (
              <li className="flex gap-3 text-sm leading-6 text-muted-foreground" key={item}>
                <CheckCircle2 className="mt-1 size-4 shrink-0 text-primary" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="glass-card p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Technology</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">Tools used deliberately</h2>
          </div>
          <div className="flex max-w-xl flex-wrap gap-2">
            {project.technologies.map((technology) => (
              <span className="rounded-full border border-border/60 bg-background/55 px-3 py-1 text-xs text-muted-foreground" key={technology}>{technology}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="flex flex-col justify-between gap-6 border-t border-border/70 pt-8 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Source and evidence</p>
          <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
            The claims on this page are limited to the project repository, model page, public demo, and resume record.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {project.links.map((link) => (
            <a className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline" href={link.url} target="_blank" rel="noreferrer" key={link.url}>
              {link.label}
              <ExternalLink className="size-3.5" aria-hidden="true" />
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
