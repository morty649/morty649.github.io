"use client";

import * as audio from "@/components/experience/audio";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const ENTERED_KEY = "experience-entered";

/**
 * Runs in <head> before the first paint: on the homepage, the first visit of a browser
 * session gets the intro screen. Crawlers, reduced-motion visitors, and no-JS visitors
 * go straight to the content.
 */
export const GATE_SCRIPT = `(function(){try{var d=document.documentElement;if(location.pathname==="/"&&!sessionStorage.getItem("${ENTERED_KEY}")&&!matchMedia("(prefers-reduced-motion: reduce)").matches&&!/bot|crawl|spider|lighthouse|headless/i.test(navigator.userAgent)){d.setAttribute("data-gate","")}}catch(e){}})()`;

type Experience = {
  /** True while the intro screen is showing. */
  gate: boolean;
  soundOn: boolean;
  enter: (withSound: boolean) => void;
  toggleSound: () => void;
};

const ExperienceContext = createContext<Experience>({
  gate: false,
  soundOn: false,
  enter: () => undefined,
  toggleSound: () => undefined,
});

export function ExperienceProvider({ children }: { children: React.ReactNode }) {
  const [gate, setGate] = useState(false);
  const [soundOn, setSoundOn] = useState(false);

  useEffect(() => {
    setGate(document.documentElement.hasAttribute("data-gate"));
    const unsubscribe = audio.subscribe(setSoundOn);
    const onVisibility = () => audio.setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      unsubscribe();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const enter = useCallback((withSound: boolean) => {
    document.documentElement.removeAttribute("data-gate");
    try {
      sessionStorage.setItem(ENTERED_KEY, "1");
    } catch {
      // Without storage the intro simply shows again next time.
    }
    setGate(false);
    if (withSound) void audio.play();
  }, []);

  const toggleSound = useCallback(() => {
    if (audio.isPlaying()) audio.stop();
    else void audio.play();
  }, []);

  const value = useMemo(() => ({ gate, soundOn, enter, toggleSound }), [gate, soundOn, enter, toggleSound]);
  return <ExperienceContext.Provider value={value}>{children}</ExperienceContext.Provider>;
}

export function useExperience() {
  return useContext(ExperienceContext);
}
