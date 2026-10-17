"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowLeft, Grid3X3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SKILLS } from "@/data/portfolio";

const allSkills = SKILLS.flatMap((group) => group.items);

function SkillPill({ name, expanded = false }: { name: string; expanded?: boolean }) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/5 text-center font-medium text-foreground/75 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-primary/30 hover:text-foreground ${
        expanded ? "min-h-20 px-4 py-3 text-sm" : "mx-2 min-h-12 px-4 text-xs"
      }`}
    >
      {name}
    </div>
  );
}

export const TechStack = ({ delay = 0 }: { delay?: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [showAll, setShowAll] = useState(false);
  const marqueeSkills = [...allSkills, ...allSkills];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.8, delay }}
      className="space-y-content-md"
    >
      <div className="flex flex-col items-center justify-center space-y-4 text-center">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Tech Stack.</h2>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
            Tools listed in my latest resume, grouped by how I use them.
          </p>
        </div>
      </div>

      {!showAll ? (
        <>
          <div className="relative w-full overflow-hidden py-8">
            <div className="absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-background via-background/80 to-transparent" />
            <div className="absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-background via-background/80 to-transparent" />
            <motion.div
              className="flex w-max items-center"
              animate={{ x: ["0%", "-50%"] }}
              transition={{ repeat: Infinity, duration: 42, ease: "linear" }}
            >
              {marqueeSkills.map((skill, index) => (
                <SkillPill key={`${skill}-${index}`} name={skill} />
              ))}
            </motion.div>
          </div>
          <div className="flex justify-center">
            <Button variant="outline" size="icon" onClick={() => setShowAll(true)} title="Show all technologies" aria-label="Show all technologies">
              <Grid3X3 className="size-4" />
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="space-y-8 py-6">
            {SKILLS.map((group, groupIndex) => (
              <motion.div
                key={group.group}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: groupIndex * 0.08 }}
                className="space-y-4"
              >
                <h3 className="text-center text-sm font-semibold text-muted-foreground">{group.group}</h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {group.items.map((skill) => (
                    <SkillPill key={skill} name={skill} expanded />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
          <div className="flex justify-center">
            <Button variant="outline" size="icon" onClick={() => setShowAll(false)} title="Back to scrolling view" aria-label="Back to scrolling view">
              <ArrowLeft className="size-4" />
            </Button>
          </div>
        </>
      )}
    </motion.div>
  );
};
