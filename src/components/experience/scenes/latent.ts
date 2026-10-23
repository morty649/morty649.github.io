import type { CreateScene, SceneFrame, ScenePalette } from "@/components/experience/types";
import * as THREE from "three";

/**
 * "Latent world": a world model drawn as nested shells. Every shell is woven from many rings
 * that each move on their own (a rocking stack of latitudes, a drifting fan of meridians, an
 * inclined fan turning the other way), so the lines keep crossing into fresh moiré. At the centre a
 * small cluster of points, the latent state, drifts between a few attractor shapes. The pointer
 * parts the rings like a probe; each shell yields on its own spring and settles back, the inner
 * shells a little later than the outer ones. Data samples drift in from outside and fade as they
 * reach the model. Everything animates on the GPU from a handful of uniforms: four draw calls.
 */

type Tone = (palette: ScenePalette) => THREE.Color;
type Shell = {
  radius: number;
  lat: number;
  mer: number;
  inc: number;
  segments: number;
  /** Per-line opacity on the light and the dark theme. */
  alpha: [light: number, dark: number];
  tone: Tone;
  /** Small tilt of the shell's pole away from the shared pole (Euler x, z) and its own slow spin (rad/s). */
  tilt: [number, number];
  spin: number;
  /** How strongly, and how quickly (spring rad/s), the shell yields to the pointer. */
  give: number;
  stiffness: number;
};

const mix = (a: string, b: string, t: number) => new THREE.Color(a).lerp(new THREE.Color(b), t);

// Outer shells barely there, inner shells denser and deeper teal. Same ring count on a smaller
// radius packs the lines tighter, so depth reads as density.
const SHELLS: Shell[] = [
  { radius: 1, lat: 52, mer: 28, inc: 12, segments: 200, alpha: [0.19, 0.13], tone: (p) => mix(p.faint, p.brand, 0.5), tilt: [0, 0], spin: 0.012, give: 1, stiffness: 7 },
  { radius: 0.68, lat: 46, mer: 24, inc: 10, segments: 168, alpha: [0.24, 0.16], tone: (p) => mix(p.faint, p.brand, 0.85), tilt: [0.09, -0.05], spin: -0.017, give: 0.95, stiffness: 6 },
  { radius: 0.46, lat: 40, mer: 20, inc: 9, segments: 136, alpha: [0.31, 0.2], tone: (p) => mix(p.brand, p.brandDeep, 0.4), tilt: [-0.07, 0.1], spin: 0.023, give: 0.85, stiffness: 5 },
  { radius: 0.31, lat: 34, mer: 18, inc: 8, segments: 112, alpha: [0.39, 0.24], tone: (p) => mix(p.brand, p.brandDeep, 0.8), tilt: [0.12, 0.05], spin: -0.03, give: 0.75, stiffness: 4.2 },
  { radius: 0.21, lat: 28, mer: 14, inc: 6, segments: 96, alpha: [0.46, 0.28], tone: (p) => (p.dark ? mix(p.brand, p.ink, 0.35) : mix(p.brandDeep, p.ink, 0.25)), tilt: [-0.1, -0.08], spin: 0.037, give: 0.6, stiffness: 3.4 },
];

const PROBES = 8;
const PROBE_RADIUS = 0.17;
const PROBE_SPACING = 0.13;
const DAMPING = 0.5;
/** Reduced motion and the first frame use this moment, chosen so the still frame is composed. */
const STILL_TIME = 15.5;
const STAGE_SECONDS = 13;
const STAGE_HOLD = 7;
const LATENT_SHAPES = 5;

// Small deterministic PRNG so every visit sees the same world.
function prng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const COLOR_OUT = /* glsl */ `
  #include <colorspace_fragment>
`;

// ---------------------------------------------------------------- rings

const RING_VERTEX = /* glsl */ `
  // position: (angle along the ring, line weight, shell index)
  attribute vec4 aRing;   // polar angle of the ring's normal, its azimuth, offset along the normal, azimuth drift (rad/s)
  attribute vec3 aWobble; // rocking amplitude (rad), frequency (rad/s), phase

  uniform float uTime;
  uniform mat3 uShellRot[${SHELLS.length}];
  uniform float uShellRadius[${SHELLS.length}];
  uniform vec3 uShellColor[${SHELLS.length}];
  uniform float uShellAlpha[${SHELLS.length}];
  uniform vec4 uProbe[${PROBES}];
  uniform float uProbeAmp[${SHELLS.length * PROBES}];
  uniform float uLevel;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    int shell = int(position.z + 0.5);
    float rock = aWobble.x * sin(uTime * aWobble.y + aWobble.z);
    float polar = aRing.x + rock;
    float azimuth = aRing.y + aRing.w * uTime + rock * 0.6;
    vec3 n = vec3(sin(polar) * cos(azimuth), sin(polar) * sin(azimuth), cos(polar));

    // Branchless orthonormal basis around n (Duff et al. 2017).
    float s = n.z >= 0.0 ? 1.0 : -1.0;
    float a = -1.0 / (s + n.z);
    float b = n.x * n.y * a;
    vec3 u = vec3(1.0 + s * n.x * n.x * a, s * b, -s * n.x);
    vec3 v = vec3(b, s + n.y * n.y * a, -n.y);

    float d = aRing.z;
    float r = sqrt(max(0.0, 1.0 - d * d));
    float radius = uShellRadius[shell];
    vec3 p = uShellRot[shell] * ((n * d + r * (cos(position.x) * u + sin(position.x) * v)) * radius);

    // Pointer probes part the rings: a smooth radial push that never folds the lines over.
    vec2 push = vec2(0.0);
    float touched = 0.0;
    for (int i = 0; i < ${PROBES}; i++) {
      vec4 probe = uProbe[i];
      float amp = uProbeAmp[shell * ${PROBES} + i];
      vec2 delta = p.xy - probe.xy;
      float g = exp(-dot(delta, delta) / (probe.w * probe.w));
      push += delta * (amp * g);
      touched += abs(amp) * g;
    }
    p.xy += push;
    p.z -= touched * 0.12 * radius;

    // Back hemisphere a little fainter for depth; touched rings light up slightly.
    float front = smoothstep(-radius, radius, p.z);
    vAlpha = uShellAlpha[shell] * position.y * mix(0.6, 1.0, front) * (1.0 + 0.7 * min(touched, 1.0)) * (1.0 + 0.25 * uLevel);
    vColor = uShellColor[shell];
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const RING_FRAGMENT = /* glsl */ `
  uniform float uOpacity;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    gl_FragColor = vec4(vColor, min(vAlpha * uOpacity, 1.0));
    ${COLOR_OUT}
  }
`;

function buildRings(quality: "high" | "low", random: () => number) {
  const density = quality === "high" ? 1 : 0.55;
  const positions: number[] = [];
  const rings: number[] = [];
  const wobbles: number[] = [];

  SHELLS.forEach((shell, shellIndex) => {
    const segments = Math.round(shell.segments * (quality === "high" ? 1 : 0.65));
    const addRing = (ring: [number, number, number, number], wobble: [number, number, number], weight: number) => {
      for (let segment = 0; segment < segments; segment += 1) {
        for (const end of [segment, segment + 1]) {
          positions.push((end / segments) * Math.PI * 2, weight, shellIndex);
          rings.push(...ring);
          wobbles.push(...wobble);
        }
      }
    };

    // A stack of latitudes that rocks like a slow wave travelling pole to pole.
    const lat = Math.max(6, Math.round(shell.lat * density));
    const wave = random() * Math.PI * 2;
    for (let k = 0; k < lat; k += 1) {
      const polar = (Math.PI * (k + 0.5)) / lat;
      addRing([0.0001, wave, Math.cos(polar), 0.04], [0.03, 0.3, wave + k * 0.36], 1);
    }

    // A fan of meridians, each drifting at its own rate, so they gather and part.
    const mer = Math.max(4, Math.round(shell.mer * density));
    for (let k = 0; k < mer; k += 1) {
      const drift = 0.025 * (1 + (random() - 0.5) * 0.5);
      addRing([Math.PI / 2, (Math.PI * k) / mer, 0, drift], [0.02, 0.2 + random() * 0.15, random() * 6.28], 0.85);
    }

    // An inclined fan turning the other way, which weaves the diagonals.
    const inc = Math.max(3, Math.round(shell.inc * density));
    for (let k = 0; k < inc; k += 1) {
      const drift = -0.02 * (1 + (random() - 0.5) * 0.4);
      addRing([1.08, (Math.PI * 2 * k) / inc, 0, drift], [0.02, 0.18 + random() * 0.12, random() * 6.28], 0.6);
    }
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("aRing", new THREE.Float32BufferAttribute(rings, 4));
  geometry.setAttribute("aWobble", new THREE.Float32BufferAttribute(wobbles, 3));
  return geometry;
}

// ---------------------------------------------------------------- latent core

const LATENT_VERTEX = /* glsl */ `
  attribute vec3 aB;
  attribute vec3 aC;
  attribute vec3 aD;
  attribute vec3 aE;
  attribute vec4 aSeed; // stagger, size, phase, brightness

  uniform float uTime;
  uniform float uStage;
  uniform float uMix;
  uniform float uLow;
  uniform float uPx;
  uniform mat3 uCoreRot;

  varying float vBright;

  vec3 shape(float k) {
    if (k < 0.5) return position;
    if (k < 1.5) return aB;
    if (k < 2.5) return aC;
    if (k < 3.5) return aD;
    return aE;
  }

  void main() {
    // Points leave one attractor for the next a little out of step, on slightly curved paths.
    float f = clamp((uMix - aSeed.x * 0.45) / 0.55, 0.0, 1.0);
    f = f * f * (3.0 - 2.0 * f);
    vec3 p = mix(shape(uStage), shape(mod(uStage + 1.0, ${LATENT_SHAPES}.0)), f);
    vec3 bend = vec3(sin(aSeed.z * 7.1), cos(aSeed.z * 3.7), sin(aSeed.z * 5.3));
    p += bend * sin(3.14159 * f) * 0.028;
    p += 0.003 * vec3(sin(uTime * 0.9 + aSeed.z * 11.0), sin(uTime * 1.1 + aSeed.z * 17.0), sin(uTime * 0.7 + aSeed.z * 23.0));
    p = uCoreRot * p * (1.0 + 0.1 * uLow);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float scale = length(modelViewMatrix[0].xyz);
    // Capped so the cluster stays a constellation of fine points when the scene is enlarged.
    gl_PointSize = min(aSeed.y * (1.0 + 0.35 * uLow) * scale * projectionMatrix[1][1] * uPx / -mv.z, uPx * 0.0085);
    vBright = aSeed.w;
    gl_Position = projectionMatrix * mv;
  }
`;

const LATENT_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uCore;
  uniform float uOpacity;
  varying float vBright;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float body = 1.0 - smoothstep(0.35, 1.0, d);
    float heart = 1.0 - smoothstep(0.0, 0.45, d);
    gl_FragColor = vec4(mix(uColor, uCore, heart * 0.6), body * vBright * uOpacity);
    ${COLOR_OUT}
  }
`;

const GLOW_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv * 2.0 - 1.0;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const GLOW_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uAlpha;
  varying vec2 vUv;
  void main() {
    float r = length(vUv);
    float a = exp(-r * r * 4.5) * (1.0 - smoothstep(0.8, 1.0, r));
    gl_FragColor = vec4(uColor, a * uAlpha);
    ${COLOR_OUT}
  }
`;

function gaussian(random: () => number) {
  const u = Math.max(1e-6, random());
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(Math.PI * 2 * random());
}

/** Five attractor shapes a latent state might settle into: clusters, a manifold, a roll, a rollout. */
function buildLatent(count: number, random: () => number) {
  const shapes = Array.from({ length: LATENT_SHAPES }, () => new Float32Array(count * 3));
  const seeds = new Float32Array(count * 4);
  const tetra = [
    [1, 1, 1],
    [1, -1, -1],
    [-1, 1, -1],
    [-1, -1, 1],
  ].map(([x, y, z]) => new THREE.Vector3(x, y, z).normalize().multiplyScalar(0.088));
  const tilt = new THREE.Euler(0.55, 0.2, 0.1);
  const v = new THREE.Vector3();
  const put = (shape: number, index: number, vector: THREE.Vector3) => vector.toArray(shapes[shape], index * 3);
  const jitter = (spread: number) => new THREE.Vector3(gaussian(random), gaussian(random), gaussian(random)).multiplyScalar(spread);

  for (let i = 0; i < count; i += 1) {
    const u = i / count;
    // 0: two clusters
    const side = i % 2 === 0 ? 1 : -1;
    put(0, i, v.set(side * 0.078, side * 0.014, 0).add(jitter(0.019)));
    // 1: a ring-shaped manifold
    const angle = u * Math.PI * 2 + gaussian(random) * 0.02;
    const radial = 0.1 + gaussian(random) * 0.006;
    put(1, i, v.set(Math.cos(angle) * radial, Math.sin(angle) * radial, gaussian(random) * 0.006).applyEuler(tilt));
    // 2: four clusters on a tetrahedron
    put(2, i, v.copy(tetra[i % 4]).add(jitter(0.012)));
    // 3: a swiss roll, the classic curled sheet
    const roll = 1.5 * Math.PI * (1 + 2 * random());
    const height = (random() - 0.5) * 0.14;
    put(3, i, v.set((roll * Math.cos(roll)) / 118, height, (roll * Math.sin(roll)) / 118));
    // 4: a rollout, one trajectory through time
    const turn = u * Math.PI * 3.2;
    put(4, i, v.set(Math.cos(turn) * 0.065, (u - 0.5) * 0.2, Math.sin(turn) * 0.065).add(jitter(0.003)));

    seeds.set([random(), 0.0065 + random() * 0.005, random() * 100, 0.55 + random() * 0.45], i * 4);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(shapes[0], 3));
  geometry.setAttribute("aB", new THREE.BufferAttribute(shapes[1], 3));
  geometry.setAttribute("aC", new THREE.BufferAttribute(shapes[2], 3));
  geometry.setAttribute("aD", new THREE.BufferAttribute(shapes[3], 3));
  geometry.setAttribute("aE", new THREE.BufferAttribute(shapes[4], 3));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 4));
  return geometry;
}

// ---------------------------------------------------------------- data samples

const SAMPLE_VERTEX = /* glsl */ `
  // position: the axis this sample orbits around
  attribute vec4 aData; // start angle, radial phase, radial speed, size
  attribute vec2 aKind; // angular speed, framed (0 or 1)

  uniform float uTime;
  uniform float uPx;

  varying float vAlpha;
  varying float vFramed;

  void main() {
    vec3 k = normalize(position);
    vec3 ref = abs(k.y) < 0.9 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
    vec3 a = normalize(cross(k, ref));
    vec3 b = cross(k, a);
    float angle = aData.x + aKind.x * uTime;
    // Samples drift inward and fade as they reach the model, then a new one appears outside.
    float f = fract(aData.y + aData.z * uTime);
    float rho = mix(1.5, 1.06, f);
    vec3 p = (cos(angle) * a + sin(angle) * b) * rho;
    vAlpha = smoothstep(0.0, 0.18, f) * (1.0 - smoothstep(0.7, 1.0, f));
    vFramed = aKind.y;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float scale = length(modelViewMatrix[0].xyz);
    gl_PointSize = max(1.5, aData.w * scale * projectionMatrix[1][1] * uPx / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const SAMPLE_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAlpha;
  varying float vFramed;
  void main() {
    vec2 q = abs(gl_PointCoord - 0.5) * 2.0;
    float d = max(q.x, q.y);
    // Plain samples are soft squares; a few carry a faint frame, like a labelled example.
    float plain = 1.0 - smoothstep(0.45, 1.0, d);
    float framed = max(1.0 - smoothstep(0.28, 0.4, d), 0.22 * (1.0 - smoothstep(0.85, 1.0, d)));
    gl_FragColor = vec4(uColor, mix(plain, framed, vFramed) * vAlpha * uOpacity);
    ${COLOR_OUT}
  }
`;

function buildSamples(count: number, random: () => number) {
  const axes = new Float32Array(count * 3);
  const data = new Float32Array(count * 4);
  const kinds = new Float32Array(count * 2);
  const axis = new THREE.Vector3();
  for (let i = 0; i < count; i += 1) {
    axis.randomDirection().toArray(axes, i * 3);
    const framed = random() < 0.08 ? 1 : 0;
    data.set([random() * Math.PI * 2, random(), 0.012 + random() * 0.014, framed ? 0.022 + random() * 0.008 : 0.005 + random() * 0.006], i * 4);
    kinds.set([(random() < 0.5 ? -1 : 1) * (0.025 + random() * 0.05), framed], i * 2);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(axes, 3));
  geometry.setAttribute("aData", new THREE.BufferAttribute(data, 4));
  geometry.setAttribute("aKind", new THREE.BufferAttribute(kinds, 2));
  return geometry;
}

// ---------------------------------------------------------------- scene

export const createScene: CreateScene = ({ quality, reducedMotion, palette }) => {
  const random = prng(649);
  const group = new THREE.Group();
  const noRaycast = () => undefined;
  const pixelHalfHeight = { value: 450 };
  const bufferSize = new THREE.Vector2();
  const measure = (renderer: THREE.WebGLRenderer) => {
    renderer.getDrawingBufferSize(bufferSize);
    pixelHalfHeight.value = bufferSize.y / 2;
  };

  // Rings
  const ringUniforms = {
    uTime: { value: STILL_TIME },
    uShellRot: { value: SHELLS.map(() => new THREE.Matrix3()) },
    uShellRadius: { value: SHELLS.map((shell) => shell.radius) },
    uShellColor: { value: SHELLS.map(() => new THREE.Color()) },
    uShellAlpha: { value: SHELLS.map(() => 0) },
    uProbe: { value: Array.from({ length: PROBES }, () => new THREE.Vector4(9, 9, 0, PROBE_RADIUS)) },
    uProbeAmp: { value: new Float32Array(SHELLS.length * PROBES) },
    uLevel: { value: 0 },
    uOpacity: { value: 1 },
  };
  const ringGeometry = buildRings(quality, random);
  const ringMaterial = new THREE.ShaderMaterial({
    uniforms: ringUniforms,
    vertexShader: RING_VERTEX,
    fragmentShader: RING_FRAGMENT,
    transparent: true,
    depthWrite: false,
    depthTest: false,
  });
  const rings = new THREE.LineSegments(ringGeometry, ringMaterial);
  rings.frustumCulled = false;
  rings.raycast = noRaycast;
  rings.renderOrder = 1;

  // Glow behind the latent core: a luminous clearing in the light theme, a soft light in the dark.
  const glowUniforms = { uColor: { value: new THREE.Color() }, uAlpha: { value: 0 } };
  const glowGeometry = new THREE.PlaneGeometry(0.44, 0.44);
  const glowMaterial = new THREE.ShaderMaterial({
    uniforms: glowUniforms,
    vertexShader: GLOW_VERTEX,
    fragmentShader: GLOW_FRAGMENT,
    transparent: true,
    depthWrite: false,
    depthTest: false,
  });
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  glow.frustumCulled = false;
  glow.raycast = noRaycast;
  glow.renderOrder = 2;

  // Latent points
  const latentUniforms = {
    uTime: { value: STILL_TIME },
    uStage: { value: 0 },
    uMix: { value: 0 },
    uLow: { value: 0 },
    uPx: pixelHalfHeight,
    uCoreRot: { value: new THREE.Matrix3() },
    uColor: { value: new THREE.Color() },
    uCore: { value: new THREE.Color() },
    uOpacity: { value: 1 },
  };
  const latentGeometry = buildLatent(quality === "high" ? 280 : 160, random);
  const latentMaterial = new THREE.ShaderMaterial({
    uniforms: latentUniforms,
    vertexShader: LATENT_VERTEX,
    fragmentShader: LATENT_FRAGMENT,
    transparent: true,
    depthWrite: false,
    depthTest: false,
  });
  const latent = new THREE.Points(latentGeometry, latentMaterial);
  latent.frustumCulled = false;
  latent.raycast = noRaycast;
  latent.renderOrder = 4;
  latent.onBeforeRender = measure;

  // Data samples
  const sampleUniforms = {
    uTime: { value: STILL_TIME },
    uPx: pixelHalfHeight,
    uColor: { value: new THREE.Color() },
    uOpacity: { value: 1 },
  };
  const sampleGeometry = buildSamples(quality === "high" ? 150 : 90, random);
  const sampleMaterial = new THREE.ShaderMaterial({
    uniforms: sampleUniforms,
    vertexShader: SAMPLE_VERTEX,
    fragmentShader: SAMPLE_FRAGMENT,
    transparent: true,
    depthWrite: false,
    depthTest: false,
  });
  const samples = new THREE.Points(sampleGeometry, sampleMaterial);
  samples.frustumCulled = false;
  samples.raycast = noRaycast;
  samples.renderOrder = 3;
  samples.onBeforeRender = measure;

  group.add(glow, rings, samples, latent);

  // ---- palette
  const setPalette = (next: ScenePalette) => {
    SHELLS.forEach((shell, index) => {
      ringUniforms.uShellColor.value[index].copy(shell.tone(next));
      ringUniforms.uShellAlpha.value[index] = shell.alpha[next.dark ? 1 : 0];
    });
    if (next.dark) {
      glowUniforms.uColor.value.copy(mix(next.brand, next.ink, 0.2));
      latentUniforms.uColor.value.copy(mix(next.brand, next.ink, 0.45));
      latentUniforms.uCore.value.set(next.ink);
      sampleUniforms.uColor.value.copy(mix(next.brand, next.ink, 0.2));
    } else {
      glowUniforms.uColor.value.copy(mix("#ffffff", next.brand, 0.12));
      latentUniforms.uColor.value.copy(mix(next.brandDeep, next.ink, 0.35));
      latentUniforms.uCore.value.copy(mix(next.brandDeep, next.ink, 0.75));
      sampleUniforms.uColor.value.copy(mix(next.brand, next.brandDeep, 0.5));
    }
    const glowBlend = next.dark ? THREE.AdditiveBlending : THREE.NormalBlending;
    glowMaterial.blending = glowBlend;
    latentMaterial.blending = glowBlend;
    dark = next.dark;
  };
  let dark = palette.dark;
  setPalette(palette);

  // ---- motion state
  const shellQuat = new THREE.Quaternion();
  const tiltQuat = SHELLS.map((shell) => new THREE.Quaternion().setFromEuler(new THREE.Euler(shell.tilt[0], 0, shell.tilt[1])));
  const spinQuat = new THREE.Quaternion();
  const globalQuat = new THREE.Quaternion();
  const globalEuler = new THREE.Euler();
  // The pole all shells share, tipped toward the viewer so the latitudes read as ellipses.
  const poleQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.62, 0, 0.28));
  const matrix = new THREE.Matrix4();
  const zAxis = new THREE.Vector3(0, 0, 1);
  const coreEuler = new THREE.Euler();
  const breathPhase = SHELLS.map(() => random() * Math.PI * 2);
  const breath = SHELLS.map(() => 0);
  let coreLow = 0;
  let level = 0;

  // ---- pointer probes: each one parts the rings around a spot, then springs back
  const probeAmp = ringUniforms.uProbeAmp.value;
  const probeVel = new Float32Array(SHELLS.length * PROBES);
  const probeTarget = new Float32Array(PROBES);
  const probes = ringUniforms.uProbe.value;
  const hit = new THREE.Vector3();
  let current = 0;
  let activity = 0;
  let lastX = 0;
  let lastY = 0;
  let primed = false;

  const followPointer = (frame: SceneFrame) => {
    const ray = frame.ray;
    if (Math.abs(ray.direction.z) < 1e-4) return;
    // Where the pointer ray crosses the plane through the model's centre, in model units.
    group.getWorldPosition(hit);
    const distance = (hit.z - ray.origin.z) / ray.direction.z;
    hit.copy(ray.direction).multiplyScalar(distance).add(ray.origin);
    group.worldToLocal(hit);
    const presence = 1 - THREE.MathUtils.smoothstep(Math.hypot(hit.x, hit.y), 1.0, 1.35);

    const moved = primed ? Math.hypot(hit.x - lastX, hit.y - lastY) : 0;
    primed = true;
    lastX = hit.x;
    lastY = hit.y;
    activity = Math.min(1, activity + moved * 3.2) * Math.exp(-frame.delta * 0.75);

    const probe = probes[current];
    const gap = Math.hypot(hit.x - probe.x, hit.y - probe.y);
    if (gap > PROBE_SPACING) {
      // Leave this probe behind to relax, and pick the quietest one to follow the pointer.
      let quietest = -1;
      let quiet = Infinity;
      for (let j = 0; j < PROBES; j += 1) {
        if (j === current) continue;
        let energy = 0;
        for (let s = 0; s < SHELLS.length; s += 1) energy = Math.max(energy, Math.abs(probeAmp[s * PROBES + j]) + Math.abs(probeVel[s * PROBES + j]) * 0.2);
        if (energy < quiet) {
          quiet = energy;
          quietest = j;
        }
      }
      if (quiet < 0.05) {
        current = quietest;
        probes[current].set(hit.x, hit.y, 0, PROBE_RADIUS);
      } else {
        // Every probe is still busy: drag this one along instead of making a new dent pop.
        const pull = (gap - PROBE_SPACING) / gap;
        probe.x += (hit.x - probe.x) * pull;
        probe.y += (hit.y - probe.y) * pull;
      }
    } else {
      const ease = 1 - Math.exp(-frame.delta * 5);
      probe.x += (hit.x - probe.x) * ease;
      probe.y += (hit.y - probe.y) * ease;
    }
    for (let j = 0; j < PROBES; j += 1) probeTarget[j] = j === current ? presence * activity : 0;
  };

  const settleProbes = (delta: number) => {
    const steps = Math.max(1, Math.ceil(delta / 0.016));
    const dt = delta / steps;
    for (let step = 0; step < steps; step += 1) {
      SHELLS.forEach((shell, s) => {
        const omega = shell.stiffness;
        for (let j = 0; j < PROBES; j += 1) {
          const index = s * PROBES + j;
          const accel = omega * omega * (probeTarget[j] * shell.give * 0.85 - probeAmp[index]) - 2 * DAMPING * omega * probeVel[index];
          probeVel[index] += accel * dt;
          probeAmp[index] += probeVel[index] * dt;
        }
      });
    }
  };

  const update = (frame: SceneFrame) => {
    const t = reducedMotion ? STILL_TIME : frame.time + STILL_TIME;
    const delta = reducedMotion ? 0 : frame.delta;

    if (!reducedMotion && delta > 0) {
      followPointer(frame);
      settleProbes(delta);
    }

    // Music: inner shells catch the breath first and it travels outward.
    const low = frame.audio.low;
    level += (frame.audio.level - level) * (1 - Math.exp(-delta * 2));
    coreLow += (low - coreLow) * (1 - Math.exp(-delta * 4));

    globalEuler.set(0.015 * t - frame.pointer.y * 0.1, 0.04 * t + frame.pointer.x * 0.14, 0);
    globalQuat.setFromEuler(globalEuler).multiply(poleQuat);
    SHELLS.forEach((shell, s) => {
      breath[s] += (low - breath[s]) * (1 - Math.exp(-delta * (1.4 + s * 0.9)));
      ringUniforms.uShellRadius.value[s] = shell.radius * (1 + 0.006 * Math.sin(0.55 * t + breathPhase[s]) + 0.022 * breath[s]);
      spinQuat.setFromAxisAngle(zAxis, shell.spin * t);
      shellQuat.copy(globalQuat).multiply(tiltQuat[s]).multiply(spinQuat);
      ringUniforms.uShellRot.value[s].setFromMatrix4(matrix.makeRotationFromQuaternion(shellQuat));
    });

    ringUniforms.uTime.value = t;
    ringUniforms.uLevel.value = level;
    ringUniforms.uOpacity.value = 1 + 0.15 * frame.intro;

    // The latent state holds a shape, then drifts to the next.
    const cycle = t / STAGE_SECONDS;
    const local = (cycle - Math.floor(cycle)) * STAGE_SECONDS;
    latentUniforms.uStage.value = Math.floor(cycle) % LATENT_SHAPES;
    latentUniforms.uMix.value = THREE.MathUtils.smoothstep(local, STAGE_HOLD, STAGE_SECONDS);
    latentUniforms.uTime.value = t;
    latentUniforms.uLow.value = coreLow;
    coreEuler.set(0.3 + 0.08 * t, 0.13 * t, 0.05 * t);
    latentUniforms.uCoreRot.value.setFromMatrix4(matrix.makeRotationFromEuler(coreEuler));
    latentUniforms.uOpacity.value = dark ? 0.9 : 0.95;
    glowUniforms.uAlpha.value = (dark ? 0.2 : 0.55) * (1 + 1.4 * coreLow) * (0.85 + 0.15 * frame.intro);

    sampleUniforms.uTime.value = t;
    sampleUniforms.uOpacity.value = dark ? 0.55 : 0.6;
  };

  update({
    time: 0,
    delta: 0,
    pointer: new THREE.Vector2(),
    pointerSpeed: 0,
    ray: new THREE.Ray(),
    audio: { level: 0, low: 0, mid: 0, high: 0 },
    intro: 1,
  });

  return {
    object: group,
    update,
    setPalette,
    dispose() {
      ringGeometry.dispose();
      ringMaterial.dispose();
      glowGeometry.dispose();
      glowMaterial.dispose();
      latentGeometry.dispose();
      latentMaterial.dispose();
      sampleGeometry.dispose();
      sampleMaterial.dispose();
    },
  };
};
