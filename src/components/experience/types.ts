import type * as THREE from "three";

export type ScenePalette = {
  dark: boolean;
  /** Strongest line colour: near-black on the light theme, near-white on the dark one. */
  ink: string;
  /** The site's brand teal, and a deeper teal for accents. */
  brand: string;
  brandDeep: string;
  /** Lines and particles that should almost dissolve into the page. */
  faint: string;
};

export type AudioReading = {
  /** Overall loudness, normalised to roughly 0..1 against the recent peak. */
  level: number;
  low: number;
  mid: number;
  high: number;
};

export type SceneFrame = {
  /** Seconds since the scene started. */
  time: number;
  /** Seconds since the previous frame, clamped to 0.1. */
  delta: number;
  /** Smoothed pointer (mouse or touch) in normalised device coordinates, -1..1. */
  pointer: THREE.Vector2;
  /** Smoothed pointer speed, roughly 0..1. Decays to 0 when the pointer rests. */
  pointerSpeed: number;
  audio: AudioReading;
  /** 1 while the intro screen is showing, easing to 0 after the visitor enters. */
  intro: number;
};

export type SceneOptions = {
  quality: "high" | "low";
  reducedMotion: boolean;
  palette: ScenePalette;
};

export interface RingScene {
  /** Should fit inside a sphere of radius 1 centred on the origin; the canvas scales and places it. */
  object: THREE.Object3D;
  update(frame: SceneFrame): void;
  setPalette(palette: ScenePalette): void;
  /** Called with a raycaster aimed at the pointer when the visitor presses on the page background. */
  onPointerDown?(raycaster: THREE.Raycaster): void;
  dispose(): void;
}

export type CreateScene = (options: SceneOptions) => RingScene;
