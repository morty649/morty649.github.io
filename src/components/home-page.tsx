"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Award, ChevronDown, Network } from "lucide-react";
import { PostCard } from "@/components/post-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ListedPost } from "@/lib/blog";
import {
  ADDITIONAL_PROJECTS,
  CREDENTIALS,
  EDUCATION,
  EXPERIENCE,
  FEATURED_PROJECTS,
  RESEARCH,
  SITE,
} from "@/data/portfolio";

const BlurFade = dynamic(() => import("@/components/magicui/blur-fade").then((mod) => mod.default), { ssr: false });
const BlurFadeText = dynamic(() => import("@/components/magicui/blur-fade-text").then((mod) => mod.default), { ssr: false });
const ContactOrbiting = dynamic(() => import("@/components/contact-orbiting").then((mod) => mod.ContactOrbiting), { ssr: false });
const HomeGraph = dynamic(() => import("@/components/home-graph").then((mod) => mod.HomeGraph), { ssr: false });
const ProjectCard = dynamic(() => import("@/components/project-card").then((mod) => mod.ProjectCard), { ssr: false });
const TechStack = dynamic(() => import("@/components/tech-stack").then((mod) => mod.TechStack), { ssr: false });
const TimelineItem = dynamic(() => import("@/components/resume-card").then((mod) => mod.TimelineItem), { ssr: false });
const UnifiedGraph = dynamic(() => import("@/components/unified-graph").then((mod) => mod.UnifiedGraph), { ssr: false });

const BLUR_FADE_DELAY = 0.04;

function GlassCard({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <BlurFade delay={delay}>
      <div className={`glass-card p-6 md:p-8 ${className}`}>{children}</div>
    </BlurFade>
  );
}

export function HomePage({ latestPosts }: { latestPosts: readonly ListedPost[] }) {
  const [aboutExpanded, setAboutExpanded] = useState(false);
  const [archiveExpanded, setArchiveExpanded] = useState(false);
  const [showProjectsGraph, setShowProjectsGraph] = useState(false);

  return (
    <main id="main-content" className="flex min-h-[100dvh] flex-col space-y-6 py-section-lg">
      <section id="hero">
        <GlassCard delay={BLUR_FADE_DELAY} className="hero-glass overflow-hidden">
          <div className="w-full py-8 md:py-12">
            <div className="flex flex-col items-center space-y-8 text-center">
              <BlurFade delay={BLUR_FADE_DELAY * 2}>
                <div className="relative">
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 blur-md" />
                  <Avatar className="relative size-28 border-2 border-white/60 shadow-2xl md:size-32">
                    <AvatarImage alt={SITE.name} src={SITE.avatarPath} className="object-cover" />
                    <AvatarFallback>{SITE.initials}</AvatarFallback>
                  </Avatar>
                </div>
              </BlurFade>

              <div className="max-w-3xl space-y-4">
                <BlurFadeText
                  delay={BLUR_FADE_DELAY * 3}
                  className="bg-gradient-to-b from-foreground via-foreground to-foreground/60 bg-clip-text text-5xl font-bold tracking-tight md:text-6xl lg:text-7xl"
                  yOffset={8}
                  text={`Hi, I'm ${SITE.firstName}.`}
                />
                <BlurFade delay={BLUR_FADE_DELAY * 4}>
                  <p className="text-sm font-light tracking-wide text-muted-foreground/70 md:text-base">
                    @{SITE.handle} · {SITE.title}
                  </p>
                </BlurFade>
              </div>

              <BlurFade delay={BLUR_FADE_DELAY * 5}>
                <p className="max-w-xl text-lg font-light leading-relaxed text-muted-foreground md:text-xl">
                  {SITE.description}
                </p>
              </BlurFade>

              <BlurFade delay={BLUR_FADE_DELAY * 6}>
                <div className="flex flex-wrap items-center justify-center gap-3 text-base text-muted-foreground md:text-lg">
                  <a
                    href="#research"
                    className="font-medium text-primary underline decoration-primary/30 underline-offset-4 transition-colors hover:text-primary/80"
                  >
                    Current research
                  </a>
                  <span aria-hidden="true">·</span>
                  <Link
                    href="/blog/"
                    className="font-medium text-primary underline decoration-primary/30 underline-offset-4 transition-colors hover:text-primary/80"
                  >
                    Blog
                  </Link>
                  <span aria-hidden="true">·</span>
                  <Link
                    href="/resume/"
                    className="font-medium text-primary underline decoration-primary/30 underline-offset-4 transition-colors hover:text-primary/80"
                  >
                    Resume
                  </Link>
                </div>
              </BlurFade>
            </div>
          </div>
        </GlassCard>
      </section>

      <section id="graph">
        <GlassCard delay={BLUR_FADE_DELAY * 7} className="p-4 md:p-6">
          <div className="relative">
            {showProjectsGraph ? <UnifiedGraph showProjects /> : <HomeGraph />}
            <button
              type="button"
              onClick={() => setShowProjectsGraph((current) => !current)}
              className="absolute bottom-4 right-4 z-30 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-xs font-medium text-primary backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-primary/20"
              aria-pressed={showProjectsGraph}
            >
              <Network className="size-3.5" aria-hidden="true" />
              <span>{showProjectsGraph ? "Sections Only" : "With Projects"}</span>
            </button>
          </div>
        </GlassCard>
      </section>

      <section id="about">
        <GlassCard delay={BLUR_FADE_DELAY * 10}>
          <div className="space-y-content-md">
            <div className="flex flex-col items-center gap-3 text-center">
              <h2 className="text-2xl font-bold">About.</h2>
              <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
                {SITE.intro}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {SITE.interests.map((interest) => (
                  <span
                    key={interest}
                    className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary"
                  >
                    {interest}
                  </span>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setAboutExpanded((current) => !current)}
                className="flex items-center gap-1.5 rounded-full bg-white/50 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm transition-all hover:bg-white/70 hover:text-foreground dark:bg-white/10 dark:hover:bg-white/20"
                aria-expanded={aboutExpanded}
              >
                {aboutExpanded ? "Hide" : "Read more"}
                <ChevronDown className={`size-3.5 transition-transform ${aboutExpanded ? "rotate-180" : ""}`} />
              </button>
            </div>

            <AnimatePresence>
              {aboutExpanded ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                  className="overflow-hidden"
                >
                  <div className="mx-auto max-w-xl space-y-content-sm pt-2 text-sm leading-relaxed text-muted-foreground">
                    <p>
                      I am in the final year of a B.Tech in Computer Science and Engineering at IIIT (RGUKT) Basar. Over summer 2026 I was an AI Research Intern at Scaled Focus through the Activate AI Fellowship.
                    </p>
                    <p>
                      I care most about systems that keep learning after they ship. A world model that adapts at test time, or an agent trained on outcomes that arrive later, can drift, forget, or learn to game its reward. I want to measure those failures and design training that avoids them.
                    </p>
                    <p>
                      I work empirically and keep a numbered lab notebook: every run has a question, a setup, the numbers, and a verdict. I set a kill criterion before each pilot, and I report negative results too.
                    </p>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </GlassCard>
      </section>

      <section id="research">
        <GlassCard delay={BLUR_FADE_DELAY * 11}>
          <div className="space-y-6">
            <div className="space-y-3 text-center">
              <h2 className="text-2xl font-bold">Research.</h2>
              <p className="mx-auto max-w-lg text-sm leading-relaxed text-muted-foreground md:text-base">
                What I am working on now: world models, JEPA, and the rewards that train systems after deployment.
              </p>
            </div>
            <div className="space-y-4">
              {RESEARCH.map((thread, index) => (
                <BlurFade key={thread.title} delay={0.05 + index * 0.05}>
                  <article className="rounded-2xl border border-border/40 bg-white/40 p-5 text-left dark:bg-white/5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">{thread.period}</span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                          thread.status === "In progress"
                            ? "bg-primary/15 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {thread.status}
                      </span>
                    </div>
                    <h3 className="mt-2 text-base font-semibold leading-snug">{thread.title}</h3>
                    <p className="mt-2 text-sm italic leading-relaxed text-muted-foreground">{thread.question}</p>
                    <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground">
                      {thread.findings.map((finding) => (
                        <li key={finding}>{finding}</li>
                      ))}
                    </ul>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {thread.tags.map((tag) => (
                        <span key={tag} className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </article>
                </BlurFade>
              ))}
            </div>
          </div>
        </GlassCard>
      </section>

      {latestPosts.length > 0 ? (
        <section id="writing">
          <GlassCard delay={BLUR_FADE_DELAY * 12}>
            <div className="space-y-6">
              <div className="space-y-3 text-center">
                <h2 className="text-2xl font-bold">Writing.</h2>
                <p className="mx-auto max-w-lg text-sm leading-relaxed text-muted-foreground md:text-base">
                  Longer write-ups on experiments, results, and the papers behind them.
                </p>
              </div>
              <div className="space-y-4">
                {latestPosts.map((post, index) => (
                  <BlurFade key={post.slug} delay={0.05 + index * 0.05}>
                    <PostCard post={post} />
                  </BlurFade>
                ))}
              </div>
              <div className="flex justify-center">
                <Link
                  href="/blog/"
                  className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary backdrop-blur-sm transition-all hover:bg-primary/20"
                >
                  All posts
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </GlassCard>
        </section>
      ) : null}

      <section id="work">
        <GlassCard delay={BLUR_FADE_DELAY * 13}>
          <div className="space-y-6">
            <h2 className="text-center text-2xl font-bold">Experience.</h2>
            <div className="divide-y divide-border/20">
              {EXPERIENCE.map((work, index) => (
                <BlurFade key={work.company} delay={BLUR_FADE_DELAY * 14 + index * 0.02}>
                  <TimelineItem
                    altText={work.company}
                    title={work.company}
                    subtitle={`${work.role} · ${work.location}`}
                    href={work.href}
                    period={work.period}
                    bullets={work.bullets}
                    isLast={index === EXPERIENCE.length - 1}
                  />
                </BlurFade>
              ))}
            </div>
          </div>
        </GlassCard>
      </section>

      <section id="education">
        <GlassCard delay={BLUR_FADE_DELAY * 16}>
          <div className="space-y-6">
            <h2 className="text-center text-2xl font-bold">Education.</h2>
            <div className="divide-y divide-border/20">
              {EDUCATION.map((education, index) => (
                <BlurFade key={`${education.degree}-${education.period}`} delay={BLUR_FADE_DELAY * 17 + index * 0.02}>
                  <TimelineItem
                    altText={education.school}
                    title={education.school}
                    subtitle={education.degree}
                    period={education.period}
                    description={education.details}
                    isLast={index === EDUCATION.length - 1}
                  />
                </BlurFade>
              ))}
            </div>
          </div>
        </GlassCard>
      </section>

      <section id="tech-stack">
        <GlassCard delay={BLUR_FADE_DELAY * 19} className="p-4 md:p-6">
          <TechStack />
        </GlassCard>
      </section>

      <section id="projects">
        <GlassCard delay={BLUR_FADE_DELAY * 21}>
          <div className="space-y-6">
            <div className="space-y-3 text-center">
              <h2 className="text-2xl font-bold">Selected work.</h2>
              <p className="mx-auto max-w-lg text-sm leading-relaxed text-muted-foreground md:text-base">
                Earlier work on RL post-training, agents, and retrieval.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {FEATURED_PROJECTS.map((project, index) => (
                <BlurFade key={project.slug} delay={0.05 + index * 0.05}>
                  <ProjectCard project={project} />
                </BlurFade>
              ))}
            </div>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setArchiveExpanded((current) => !current)}
                className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary backdrop-blur-sm transition-all hover:bg-primary/20"
                aria-expanded={archiveExpanded}
              >
                {archiveExpanded ? "Hide additional work" : "View additional work"}
                <ChevronDown className={`size-4 transition-transform ${archiveExpanded ? "rotate-180" : ""}`} />
              </button>
            </div>

            <AnimatePresence>
              {archiveExpanded ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 gap-4 pt-1 sm:grid-cols-2">
                    {ADDITIONAL_PROJECTS.map((project) => (
                      <ProjectCard key={project.slug} project={project} />
                    ))}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </GlassCard>
      </section>

      <section id="credentials">
        <GlassCard delay={BLUR_FADE_DELAY * 24}>
          <div className="space-y-6 text-center">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Recognition.</h2>
              <p className="text-sm text-muted-foreground">A verified milestone connected to my current work.</p>
            </div>
            {CREDENTIALS.map((credential) => (
              <a
                key={credential.title}
                href={credential.href}
                target="_blank"
                rel="noopener noreferrer"
                className="mx-auto flex max-w-xl items-start gap-4 rounded-2xl border border-primary/10 bg-primary/5 p-5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/30"
              >
                <Award className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                <span>
                  <strong className="block text-sm">{credential.title}</strong>
                  <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                    {credential.issuer} · {credential.detail}
                  </span>
                </span>
              </a>
            ))}
          </div>
        </GlassCard>
      </section>

      <GlassCard delay={BLUR_FADE_DELAY * 27} className="p-4 md:p-6">
        <ContactOrbiting />
      </GlassCard>
    </main>
  );
}
