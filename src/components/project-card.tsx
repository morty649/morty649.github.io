import type { Project } from "@/data/portfolio";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, Github } from "lucide-react";
import Link from "next/link";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Card className="flex h-full flex-col overflow-hidden border border-white/50 bg-white/60 p-0 shadow-lg shadow-black/5 backdrop-blur-md transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl hover:shadow-black/10 dark:border-white/10 dark:bg-white/5 dark:shadow-black/20 dark:hover:shadow-black/30">
      <Link href={`/projects/${project.slug}/`} className="block cursor-pointer">
        <div className="project-card-cover">
          <span className="rounded-full border border-white/30 bg-white/20 px-2.5 py-1 text-[10px] font-medium text-foreground/70 backdrop-blur-sm dark:bg-black/10">
            {project.category}
          </span>
          <span className="font-mono text-[10px] text-foreground/55">{project.status}</span>
        </div>
      </Link>

      <CardHeader>
        <div className="space-y-2">
          <CardTitle className="text-base">
            <Link href={`/projects/${project.slug}/`} className="hover:text-primary">
              {project.shortTitle}
            </Link>
          </CardTitle>
          <time className="font-sans text-xs text-muted-foreground">{project.period}</time>
          <p className="text-pretty font-sans text-xs leading-relaxed text-muted-foreground">
            {project.summary}
          </p>
        </div>
      </CardHeader>

      <CardContent className="mt-auto flex flex-col">
        <div className="mt-2 flex flex-wrap gap-1">
          {project.technologies.slice(0, 5).map((technology) => (
            <Badge className="px-1 py-0 text-[10px]" variant="secondary" key={technology}>
              {technology}
            </Badge>
          ))}
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap gap-1 pb-content-md">
        {project.links.map((source) => (
          <a href={source.url} target="_blank" rel="noopener noreferrer" key={source.url}>
            <Badge className="flex gap-1.5 px-2 py-1 text-[10px]">
              {source.label === "GitHub" ? <Github className="size-3" /> : <ArrowUpRight className="size-3" />}
              {source.label}
            </Badge>
          </a>
        ))}
        <Link href={`/projects/${project.slug}/`}>
          <Badge variant="outline" className="flex gap-1.5 px-2 py-1 text-[10px]">
            <ArrowUpRight className="size-3" />
            Details
          </Badge>
        </Link>
      </CardFooter>
    </Card>
  );
}
