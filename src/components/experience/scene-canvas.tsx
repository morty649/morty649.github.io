"use client";

import { readAudio } from "@/components/experience/audio";
import { useExperience } from "@/components/experience/experience-provider";
import { createScene } from "@/components/experience/scenes";
import type { SceneFrame, ScenePalette } from "@/components/experience/types";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import * as THREE from "three";

// Matches the site's tokens in globals.css (brand teal #8eb1c2 / #a0c8dc).
const PALETTES: Record<"light" | "dark", ScenePalette> = {
  light: { dark: false, ink: "#1d2730", brand: "#8eb1c2", brandDeep: "#4f7f92", faint: "#c3d3db" },
  dark: { dark: true, ink: "#e8f1f5", brand: "#a0c8dc", brandDeep: "#6fa3b8", faint: "#3b4b56" },
};

type Pose = { x: number; y: number; scale: number; opacity: number };

/**
 * Where the scene sits on each screen. x and y are fractions of the half viewport, so
 * x = -0.55 puts the centre a little over halfway to the left edge.
 */
function poseFor(pathname: string, gate: boolean): Pose {
  if (pathname.startsWith("/write")) return { x: 0, y: 0, scale: 1, opacity: 0 };
  if (gate) return { x: 0, y: 0.17, scale: 0.92, opacity: 1 };
  if (pathname === "/") return { x: 0, y: 0, scale: 1.55, opacity: 0.75 };
  return { x: -0.6, y: 0, scale: 1.9, opacity: 0.5 };
}

export default function SceneCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pathname = usePathname();
  const { gate } = useExperience();
  const { resolvedTheme } = useTheme();
  const gateRef = useRef(gate);
  const poseRef = useRef<Pose>(poseFor(pathname, gate));
  const paletteRef = useRef<ScenePalette>(PALETTES.light);
  const controls = useRef<{ setPalette: (palette: ScenePalette) => void; redraw: () => void } | null>(null);

  useEffect(() => {
    gateRef.current = gate;
    poseRef.current = poseFor(pathname, gate);
    if (canvasRef.current?.dataset.ready) canvasRef.current.style.opacity = String(poseRef.current.opacity);
    controls.current?.redraw();
  }, [pathname, gate]);

  useEffect(() => {
    paletteRef.current = PALETTES[resolvedTheme === "dark" ? "dark" : "light"];
    controls.current?.setPalette(paletteRef.current);
    controls.current?.redraw();
  }, [resolvedTheme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" });
    } catch {
      return; // No WebGL: the site is complete without the scene.
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lowPower =
      window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768 || (navigator.hardwareConcurrency ?? 8) <= 4;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowPower ? 1.5 : 2));
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 0, 6);
    const rings = createScene({ quality: lowPower ? "low" : "high", reducedMotion, palette: paletteRef.current });
    const holder = new THREE.Group();
    holder.add(rings.object);
    scene.add(holder);

    let halfWidth = 1;
    let halfHeight = 1;
    let baseScale = 1;
    const resize = () => {
      const { innerWidth: width, innerHeight: height } = window;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      halfHeight = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
      halfWidth = halfHeight * camera.aspect;
      baseScale = 0.72 * Math.min(halfWidth, halfHeight);
    };
    resize();

    const pose = { ...poseRef.current };
    const placeHolder = (ease: number) => {
      const target = poseRef.current;
      pose.x += (target.x - pose.x) * ease;
      pose.y += (target.y - pose.y) * ease;
      pose.scale += (target.scale - pose.scale) * ease;
      holder.position.set(pose.x * halfWidth, pose.y * halfHeight, 0);
      holder.scale.setScalar(baseScale * pose.scale);
    };

    const target = new THREE.Vector2();
    let lastMove = performance.now();
    let rawSpeed = 0;
    let pointerSeen = false;
    const frame: SceneFrame = {
      time: 0,
      delta: 0,
      pointer: new THREE.Vector2(),
      pointerSpeed: 0,
      ray: new THREE.Ray(),
      audio: readAudio(),
      intro: gateRef.current ? 1 : 0,
    };
    const raycaster = new THREE.Raycaster();
    const pointerRaycaster = new THREE.Raycaster();

    const onPointerMove = (event: PointerEvent) => {
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = -(event.clientY / window.innerHeight) * 2 + 1;
      const now = performance.now();
      const elapsed = Math.max(16, now - lastMove);
      rawSpeed = Math.min(1, rawSpeed + (Math.hypot(x - target.x, y - target.y) / elapsed) * 40);
      target.set(x, y);
      lastMove = now;
      // Start the smoothed pointer where the pointer first appears, not with a sweep from the centre.
      if (!pointerSeen) frame.pointer.copy(target);
      pointerSeen = true;
    };
    const onPointerDown = (event: PointerEvent) => {
      onPointerMove(event);
      // Only clicks on the bare page reach the scene, never clicks on cards, links, or buttons.
      if (!rings.onPointerDown || (event.target as Element).closest("a, button, input, textarea, select, .glass-card")) return;
      raycaster.setFromCamera(target, camera);
      rings.onPointerDown(raycaster);
    };

    const clock = new THREE.Clock();
    const render = () => {
      const delta = Math.min(clock.getDelta(), 0.1);
      if (poseRef.current.opacity === 0) return;
      frame.delta = delta;
      frame.time += delta;
      frame.pointer.lerp(target, 1 - Math.exp(-delta * 4));
      pointerRaycaster.setFromCamera(frame.pointer, camera);
      frame.ray.copy(pointerRaycaster.ray);
      rawSpeed *= Math.exp(-delta * 2.5);
      frame.pointerSpeed = rawSpeed;
      frame.audio = readAudio();
      frame.intro += ((gateRef.current ? 1 : 0) - frame.intro) * (1 - Math.exp(-delta * 1.5));
      placeHolder(1 - Math.exp(-delta * 1.8));
      rings.update(frame);
      renderer.render(scene, camera);
    };

    // Reduced motion: draw still frames, only when something changes.
    const drawStill = () => {
      frame.intro = gateRef.current ? 1 : 0;
      placeHolder(1);
      rings.update(frame);
      renderer.render(scene, camera);
    };

    controls.current = {
      setPalette: (palette) => rings.setPalette(palette),
      redraw: () => {
        if (reducedMotion) drawStill();
      },
    };

    const onResize = () => {
      resize();
      if (reducedMotion) drawStill();
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });

    if (reducedMotion) drawStill();
    else renderer.setAnimationLoop(render);

    // Fade in after the first frame so the canvas never flashes half-built.
    requestAnimationFrame(() => {
      canvas.dataset.ready = "true";
      canvas.style.opacity = String(poseRef.current.opacity);
    });

    return () => {
      renderer.setAnimationLoop(null);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      controls.current = null;
      rings.dispose();
      renderer.dispose();
      delete canvas.dataset.ready;
    };
  }, []);

  return <canvas ref={canvasRef} className="experience-canvas" aria-hidden="true" />;
}
