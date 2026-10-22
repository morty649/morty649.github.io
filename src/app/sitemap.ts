import { PROJECTS, SITE } from "@/data/portfolio";
import { getPosts } from "@/lib/blog";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getPosts();
  const postRoutes = posts.map((post) => ({
    url: `${SITE.url}/blog/${post.slug}/`,
    lastModified: new Date(post.updated ?? post.date),
    changeFrequency: "yearly" as const,
    priority: 0.7,
  }));

  const projectRoutes = PROJECTS.map((project) => ({
    url: `${SITE.url}/projects/${project.slug}/`,
    lastModified: new Date("2026-07-31"),
    changeFrequency: "monthly" as const,
    priority: project.featured ? 0.8 : 0.65,
  }));

  return [
    {
      url: SITE.url,
      lastModified: new Date("2026-07-31"),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${SITE.url}/resume/`,
      lastModified: new Date("2026-07-31"),
      changeFrequency: "monthly",
      priority: 0.75,
    },
    {
      url: `${SITE.url}/blog/`,
      lastModified: new Date(posts[0]?.date ?? "2026-10-23"),
      changeFrequency: "weekly",
      priority: 0.75,
    },
    ...projectRoutes,
    ...postRoutes,
  ];
}
