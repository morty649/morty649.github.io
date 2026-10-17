"use client";

import { Dock, DockIcon } from "@/components/magicui/dock";
import { ModeToggle } from "@/components/mode-toggle";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SITE } from "@/data/portfolio";
import { cn } from "@/lib/utils";
import { Braces, FileText, Github, Home, Linkedin } from "lucide-react";
import Link from "next/link";

const navigation = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/resume/", icon: FileText, label: "Resume" },
];

const social = [
  { href: SITE.social.github, icon: Github, label: "GitHub" },
  { href: SITE.social.linkedin, icon: Linkedin, label: "LinkedIn" },
  { href: SITE.social.leetcode, icon: Braces, label: "LeetCode" },
];

const dockLinkClass = cn(
  buttonVariants({ variant: "ghost", size: "icon" }),
  "size-12 rounded-xl transition-all duration-200 hover:bg-white/50 dark:hover:bg-white/10"
);

export default function Navbar() {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 mx-auto mb-4 flex h-full max-h-14 origin-bottom">
      <div className="fixed inset-x-0 bottom-0 h-16 w-full bg-gradient-to-t from-background/80 to-transparent backdrop-blur-md" />
      <Dock className="glass-navbar pointer-events-auto relative z-50 mx-auto flex h-full min-h-full items-center rounded-2xl px-2 transform-gpu">
        {navigation.map((item) => (
          <DockIcon key={item.href}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href={item.href} className={dockLinkClass} aria-label={item.label}>
                  <item.icon className="size-4" />
                </Link>
              </TooltipTrigger>
              <TooltipContent className="glass-card border-none"><p>{item.label}</p></TooltipContent>
            </Tooltip>
          </DockIcon>
        ))}

        <Separator orientation="vertical" className="h-full opacity-30" />

        {social.map((item) => (
          <DockIcon key={item.label}>
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={dockLinkClass}
                  aria-label={item.label}
                >
                  <item.icon className="size-4" />
                </a>
              </TooltipTrigger>
              <TooltipContent className="glass-card border-none"><p>{item.label}</p></TooltipContent>
            </Tooltip>
          </DockIcon>
        ))}

        <Separator orientation="vertical" className="h-full py-2 opacity-30" />

        <DockIcon>
          <Tooltip>
            <TooltipTrigger asChild><ModeToggle /></TooltipTrigger>
            <TooltipContent className="glass-card border-none"><p>Theme</p></TooltipContent>
          </Tooltip>
        </DockIcon>
      </Dock>
    </div>
  );
}
