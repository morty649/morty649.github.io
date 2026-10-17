import { PROJECTS, SITE } from "@/data/portfolio";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
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
    ...projectRoutes,
  ];
}
