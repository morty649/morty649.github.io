# Maruthi Enugula - Portfolio

Personal portfolio for [Maruthi Enugula](https://github.com/morty649), focused on reinforcement learning, agentic AI, retrieval systems, and applied machine learning.

The site is built with Next.js, TypeScript, and Tailwind CSS, exported as a static site, and configured for the `morty649.github.io` GitHub Pages user site.

## Local development

```bash
pnpm install
pnpm dev
```

Create a production export with:

```bash
pnpm build
```

The static output is written to `out/`.

## Writing a blog post

Posts are Markdown files in `content/blog/`. The file name becomes the URL, so `content/blog/my-post.md` is published at `/blog/my-post/`.

```markdown
---
title: "Post title"
date: 2026-10-23
summary: "One sentence for cards, search results, and the RSS feed."
tags: ["JEPA", "World models"]
draft: true
---

Write the post here.
```

- `title`, `date`, and `summary` are required; the build stops with a clear message if one is missing.
- `draft: true` shows the post in `pnpm dev` and keeps it out of the production build. Delete the line to publish.
- `updated` (optional) records a later revision date.
- Posts support GitHub-flavoured Markdown, footnotes, highlighted code blocks, LaTeX math (`$inline$` and `$$display$$`), and raw HTML.
- Put images in `public/images/blog/<slug>/` and reference them as `/images/blog/<slug>/figure.png`.

`content/blog/writing-guide.md` is a draft that demonstrates every feature. Published posts appear on `/blog/`, in the homepage "Writing" section (latest three), in `sitemap.xml`, and in the RSS feed at `/feed.xml`.

## Deployment

The GitHub Actions workflow builds pull requests without publishing them and deploys pushes to `main` through GitHub Pages. It requires no personal access token and exposes no client-side secret.

## Content policy

Project descriptions are based on Maruthi's resumes, public repositories, model pages, demos, and professional profiles. Unverified performance metrics are intentionally omitted.

## Credits

The site adapts the interactive glass-card portfolio and Obsidian-style graph work from [Hailey Cheng's portfolio](https://github.com/heilcheng/portfolio), which itself credits the original portfolio foundation by [Dillion Verma](https://github.com/dillionverma/portfolio). The retained design patterns include the narrow card shell, ambient background, bottom dock, motion system, timeline treatment, and D3 graph interaction. Maruthi's content and project relationships replace the reference site's personal material.

The original MIT license is included.
