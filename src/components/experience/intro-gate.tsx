"use client";

import { useExperience } from "@/components/experience/experience-provider";
import { SITE } from "@/data/portfolio";
import { usePathname } from "next/navigation";

// Visible only while <html data-gate> is set (see GATE_SCRIPT), so it never flashes for
// visitors who skip the intro. Clicking anywhere enters with sound.
export function IntroGate() {
  const { enter } = useExperience();
  const pathname = usePathname();

  if (pathname !== "/") return null;

  return (
    <div className="intro-gate" onClick={() => enter(true)}>
      <div className="flex flex-col items-center gap-4 text-center">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            enter(true);
          }}
          className="intro-gate-title text-lg font-light lowercase tracking-[0.32em] text-foreground/75 transition-colors hover:text-foreground md:text-xl"
        >
          step into the world model
        </button>
        <p className="text-[11px] lowercase tracking-[0.28em] text-muted-foreground">
          {SITE.name} · sound on
        </p>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            enter(false);
          }}
          className="mt-2 text-[11px] lowercase tracking-[0.2em] text-muted-foreground/70 underline decoration-border underline-offset-4 transition-colors hover:text-foreground"
        >
          enter quietly
        </button>
      </div>
    </div>
  );
}
