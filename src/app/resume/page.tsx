import { PrintButton } from "@/components/print-button";
import {
  CREDENTIALS,
  EDUCATION,
  EXPERIENCE,
  FEATURED_PROJECTS,
  RESEARCH,
  SITE,
  SKILLS,
} from "@/data/portfolio";
import { ArrowLeft, Github, Linkedin, Mail } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Resume",
  description: `Web resume for ${SITE.name}, AI/ML engineer and researcher.`,
  alternates: { canonical: "/resume/" },
};

export default function ResumePage() {
  return (
    <main id="main-content" className="py-section-lg">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <Link className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary" href="/">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back home
        </Link>
        <PrintButton />
      </div>

      <article className="glass-card resume-sheet p-7 sm:p-10">
        <header className="flex flex-col justify-between gap-7 sm:flex-row sm:items-start">
          <div>
            <h1 className="text-4xl font-semibold tracking-[-0.045em]">{SITE.name}</h1>
            <p className="mt-2 font-medium text-primary">{SITE.title}</p>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">{SITE.description}</p>
          </div>
          <div className="grid gap-2 text-xs text-muted-foreground sm:text-right">
            <a className="inline-flex items-center gap-2 sm:justify-end" href={`mailto:${SITE.email}`}>
              <Mail className="size-3.5" aria-hidden="true" /> {SITE.email}
            </a>
            <a className="inline-flex items-center gap-2 sm:justify-end" href={SITE.social.github}>
              <Github className="size-3.5" aria-hidden="true" /> github.com/morty649
            </a>
            <a className="inline-flex items-center gap-2 sm:justify-end" href={SITE.social.linkedin}>
              <Linkedin className="size-3.5" aria-hidden="true" /> linkedin.com/in/maruthienugula
            </a>
          </div>
        </header>

        <section className="resume-rule mt-9 pt-6">
          <h2 className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-primary">Research</h2>
          {RESEARCH.map((thread) => (
            <div className="mt-5" key={thread.title}>
              <div className="flex flex-col justify-between gap-1 sm:flex-row">
                <h3 className="font-semibold">{thread.title}</h3>
                <p className="shrink-0 font-mono text-xs text-muted-foreground">{thread.period} · {thread.status}</p>
              </div>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-6 text-muted-foreground">
                {thread.findings.map((finding) => <li key={finding}>{finding}</li>)}
              </ul>
            </div>
          ))}
        </section>

        <section className="resume-rule mt-7 pt-6">
          <h2 className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-primary">Experience</h2>
          {EXPERIENCE.map((item) => (
            <div className="mt-5" key={item.company}>
              <div className="flex flex-col justify-between gap-1 sm:flex-row">
                <div>
                  <h3 className="font-semibold">{item.role}</h3>
                  <p className="text-sm font-medium text-muted-foreground">{item.company}</p>
                </div>
                <p className="font-mono text-xs text-muted-foreground">{item.period}</p>
              </div>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-6 text-muted-foreground">
                {item.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
              </ul>
            </div>
          ))}
        </section>

        <section className="resume-rule mt-7 pt-6">
          <h2 className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-primary">Selected projects</h2>
          <div className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2">
            {FEATURED_PROJECTS.map((project) => (
              <div key={project.slug}>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold">{project.shortTitle}</h3>
                  <span className="font-mono text-[10px] text-muted-foreground">{project.period}</span>
                </div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">{project.summary}</p>
                <p className="mt-2 text-[10px] font-medium text-primary">{project.technologies.slice(0, 4).join(" · ")}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="resume-rule mt-7 pt-6">
          <h2 className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-primary">Skills</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {SKILLS.map((skill) => (
              <p className="text-xs leading-5 text-muted-foreground" key={skill.group}>
                <strong className="text-foreground">{skill.group}:</strong> {skill.items.join(", ")}
              </p>
            ))}
          </div>
        </section>

        <section className="resume-rule mt-7 pt-6">
          <h2 className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-primary">Education & recognition</h2>
          <div className="mt-5 grid gap-7 sm:grid-cols-2">
            <div className="space-y-4">
              {EDUCATION.map((item) => (
                <div key={`${item.degree}-${item.period}`}>
                  <div className="flex justify-between gap-3">
                    <h3 className="text-sm font-semibold">{item.degree}</h3>
                    <span className="font-mono text-[10px] text-muted-foreground">{item.period}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{item.school}</p>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              {CREDENTIALS.map((credential) => (
                <div key={credential.title}>
                  <h3 className="text-sm font-semibold">{credential.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{credential.issuer} · {credential.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </article>
    </main>
  );
}
