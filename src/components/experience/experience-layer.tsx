"use client";

import { IntroGate } from "@/components/experience/intro-gate";
import dynamic from "next/dynamic";

// three.js is large, so it loads after the page and never blocks the content.
const SceneCanvas = dynamic(() => import("@/components/experience/scene-canvas"), { ssr: false });

export function ExperienceLayer() {
  return (
    <>
      <SceneCanvas />
      <IntroGate />
    </>
  );
}
