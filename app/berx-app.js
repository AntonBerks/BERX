/* BERX — GENERATED application shell. The world is the app. */
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// packages/spatial/src/tokens.ts
var BERX_V9_PERFORMANCE;
var init_tokens = __esm({
  "packages/spatial/src/tokens.ts"() {
    "use strict";
    BERX_V9_PERFORMANCE = {
      targetFps: 60,
      interactiveBudgetMs: 16.7,
      blurMaxLayersMobile: 3,
      simultaneous3DObjectsMobile: 80,
      videoAutoplayConcurrentMobile: 1
    };
  }
});

// packages/spatial/src/color.ts
function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}
function parseColor(input) {
  const value = input.trim();
  const hex3 = HEX3.exec(value);
  if (hex3) {
    return {
      r: parseInt(hex3[1] + hex3[1], 16),
      g: parseInt(hex3[2] + hex3[2], 16),
      b: parseInt(hex3[3] + hex3[3], 16),
      a: 1
    };
  }
  const hex6 = HEX6.exec(value);
  if (hex6) {
    return { r: parseInt(hex6[1], 16), g: parseInt(hex6[2], 16), b: parseInt(hex6[3], 16), a: 1 };
  }
  const fn = RGB_FN.exec(value);
  if (fn) {
    const alphaRaw = fn[4];
    return {
      r: clamp(parseFloat(fn[1]), 0, 255),
      g: clamp(parseFloat(fn[2]), 0, 255),
      b: clamp(parseFloat(fn[3]), 0, 255),
      a: alphaRaw === void 0 || alphaRaw === "" ? 1 : clamp(parseFloat(alphaRaw), 0, 1)
    };
  }
  return null;
}
var HEX3, HEX6, RGB_FN;
var init_color = __esm({
  "packages/spatial/src/color.ts"() {
    "use strict";
    HEX3 = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i;
    HEX6 = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;
    RGB_FN = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]*)\s*)?\)$/i;
  }
});

// packages/spatial/src/contract.ts
var init_contract = __esm({
  "packages/spatial/src/contract.ts"() {
    "use strict";
  }
});

// packages/spatial/src/atmosphere.ts
var init_atmosphere = __esm({
  "packages/spatial/src/atmosphere.ts"() {
    "use strict";
  }
});

// packages/spatial/src/materials.ts
var init_materials = __esm({
  "packages/spatial/src/materials.ts"() {
    "use strict";
  }
});

// packages/spatial/src/lighting.ts
var init_lighting = __esm({
  "packages/spatial/src/lighting.ts"() {
    "use strict";
  }
});

// packages/spatial/src/motion.ts
var init_motion = __esm({
  "packages/spatial/src/motion.ts"() {
    "use strict";
  }
});

// packages/spatial/src/performance.ts
var WATCH_BUDGET, ARVR_BUDGET;
var init_performance = __esm({
  "packages/spatial/src/performance.ts"() {
    "use strict";
    init_tokens();
    WATCH_BUDGET = {
      tier: "low",
      targetFps: 60,
      frameBudgetMs: BERX_V9_PERFORMANCE.interactiveBudgetMs,
      maxBlurLayers: 0,
      allow3D: false,
      allowAmbientMotion: false,
      allowParallax: false,
      maxConcurrentVideo: 0,
      max3DObjects: 0,
      listWindowSize: 8,
      lazyMedia: true
    };
    ARVR_BUDGET = {
      tier: "medium",
      /* 72Hz is the floor across current standalone headsets */
      targetFps: 72,
      frameBudgetMs: 13.9,
      /* screen-space blur is the first thing a stereo renderer cannot afford */
      maxBlurLayers: 0,
      allow3D: true,
      allowAmbientMotion: false,
      allowParallax: true,
      maxConcurrentVideo: 1,
      max3DObjects: BERX_V9_PERFORMANCE.simultaneous3DObjectsMobile,
      listWindowSize: 10,
      lazyMedia: true
    };
  }
});

// packages/spatial/src/focus.ts
var init_focus = __esm({
  "packages/spatial/src/focus.ts"() {
    "use strict";
  }
});

// packages/spatial/src/typography.ts
var SCALE, BERX_TYPE_ROLES;
var init_typography = __esm({
  "packages/spatial/src/typography.ts"() {
    "use strict";
    SCALE = {
      display: { fontSize: 34, lineHeight: 1.1, fontWeight: "800", letterSpacing: -0.6, textTransform: "none", plane: "D3", emphasis: "primary" },
      title: { fontSize: 24, lineHeight: 1.18, fontWeight: "700", letterSpacing: -0.35, textTransform: "none", plane: "D3", emphasis: "primary" },
      heading: { fontSize: 20, lineHeight: 1.25, fontWeight: "700", letterSpacing: -0.2, textTransform: "none", plane: "D3", emphasis: "primary" },
      subtitle: { fontSize: 17, lineHeight: 1.3, fontWeight: "600", letterSpacing: -0.1, textTransform: "none", plane: "D3", emphasis: "secondary" },
      body: { fontSize: 15, lineHeight: 1.5, fontWeight: "400", letterSpacing: 0, textTransform: "none", plane: "D3", emphasis: "primary" },
      callout: { fontSize: 15, lineHeight: 1.4, fontWeight: "600", letterSpacing: 0, textTransform: "none", plane: "D3", emphasis: "primary" },
      label: { fontSize: 13, lineHeight: 1.2, fontWeight: "600", letterSpacing: 0.4, textTransform: "none", plane: "D4", emphasis: "primary" },
      meta: { fontSize: 13, lineHeight: 1.35, fontWeight: "400", letterSpacing: 0.1, textTransform: "none", plane: "D3", emphasis: "secondary" },
      micro: { fontSize: 11, lineHeight: 1.2, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase", plane: "D4", emphasis: "tertiary" },
      numeric: { fontSize: 20, lineHeight: 1.1, fontWeight: "700", letterSpacing: -0.2, textTransform: "none", plane: "D3", emphasis: "primary" }
    };
    BERX_TYPE_ROLES = Object.keys(SCALE);
  }
});

// packages/spatial/src/scene.ts
var init_scene = __esm({
  "packages/spatial/src/scene.ts"() {
    "use strict";
  }
});

// packages/spatial/src/temporal.ts
function berxTemporalCursor(at = Math.floor(Date.now() / 1e3), horizonSeconds = BERX_DEFAULT_HORIZON_SECONDS) {
  return { at, horizonSeconds: Math.max(1, horizonSeconds) };
}
function berxTemporalBand(time, cursor) {
  if (!time) return "timeless";
  const { at, horizonSeconds } = cursor;
  if (time.startsAt !== void 0) {
    const ends = time.endsAt ?? time.startsAt;
    if (at >= time.startsAt - horizonSeconds && at <= ends + horizonSeconds) return "now";
    return at < time.startsAt ? "future" : "past";
  }
  if (time.at === void 0) return "timeless";
  if (Math.abs(at - time.at) <= horizonSeconds) return "now";
  return time.at > at ? "future" : "past";
}
function berxTemporalDistance(time, cursor) {
  if (!time) return 0;
  if (time.startsAt !== void 0) {
    const ends = time.endsAt ?? time.startsAt;
    if (cursor.at < time.startsAt) return time.startsAt - cursor.at;
    if (cursor.at > ends) return cursor.at - ends;
    return 0;
  }
  if (time.at === void 0) return 0;
  return Math.abs(cursor.at - time.at);
}
function berxProjectTemporal(time, cursor) {
  const band = berxTemporalBand(time, cursor);
  const distanceSeconds = berxTemporalDistance(time, cursor);
  if (band === "timeless") {
    return { band, distanceSeconds: 0, depthOffset: 0, presence: 1, energyScale: 1 };
  }
  const days = distanceSeconds / DAY;
  const reach = Math.log1p(days) * 4.2;
  const direction = band === "future" ? 1 : band === "past" ? -1 : 0;
  return {
    band,
    distanceSeconds,
    depthOffset: direction * reach,
    /* never fully gone: 0.22 is still visible, and still pickable */
    presence: Math.max(0.22, 1 / (1 + days * 0.55)),
    energyScale: band === "now" ? 1 : 0
  };
}
function berxApplyTemporal(object, cursor) {
  const projection = berxProjectTemporal(object.time, cursor);
  return {
    ...object,
    transform: {
      ...object.transform,
      position: { ...object.transform.position, z: object.transform.position.z + projection.depthOffset }
    },
    material: { ...object.material, opacity: object.material.opacity * projection.presence },
    /* an event that has ended stops being live; it does not stop existing */
    energy: object.energy * projection.energyScale
  };
}
var BERX_DEFAULT_HORIZON_SECONDS, DAY;
var init_temporal = __esm({
  "packages/spatial/src/temporal.ts"() {
    "use strict";
    BERX_DEFAULT_HORIZON_SECONDS = 3 * 3600;
    DAY = 86400;
  }
});

// packages/spatial/src/relational.ts
function berxStableAngle(id) {
  let hash = 2166136261;
  for (let i = 0; i < id.length; i++) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash / 4294967296 * Math.PI * 2;
}
function berxRelationalLayout(objects, relations, options = {}) {
  const rise = options.rise ?? 1.15;
  const positions = /* @__PURE__ */ new Map();
  if (objects.length === 0) return positions;
  const edges = /* @__PURE__ */ new Map();
  const add = (from, to, type, strength) => {
    const list = edges.get(from) ?? [];
    list.push({ other: to, type, strength });
    edges.set(from, list);
  };
  for (const relation2 of relations) {
    add(relation2.from, relation2.to, relation2.type, relation2.strength);
    add(relation2.to, relation2.from, relation2.type, relation2.strength);
  }
  for (const list of edges.values()) {
    list.sort((a, b) => b.strength - a.strength || a.other.localeCompare(b.other));
  }
  const byId = new Map(objects.map((o) => [o.id, o]));
  const placedAround = /* @__PURE__ */ new Map();
  const place = (id, at) => {
    positions.set(id, at);
  };
  const beside = (anchorId, id, type, strength) => {
    const origin = positions.get(anchorId);
    const radius = RELATION_RADIUS[type] / Math.max(0.25, Math.min(1, strength));
    const angle = berxStableAngle(id);
    const rank = placedAround.get(anchorId) ?? 0;
    placedAround.set(anchorId, rank + 1);
    const spread = radius + rank * 0.42;
    return {
      x: origin.x + Math.cos(angle) * spread,
      y: origin.y + Math.sin(angle * 1.7) * rise,
      z: origin.z + Math.sin(angle) * spread
    };
  };
  const grow = (seedId, seedAt) => {
    place(seedId, seedAt);
    const reachable = /* @__PURE__ */ new Set([seedId]);
    const queue = [seedId];
    while (queue.length > 0) {
      const current = queue.shift();
      for (const edge of edges.get(current) ?? []) {
        if (!byId.has(edge.other) || reachable.has(edge.other)) continue;
        reachable.add(edge.other);
        queue.push(edge.other);
      }
    }
    while (true) {
      let chosen;
      let fallback;
      for (const id of [...reachable].sort()) {
        if (positions.has(id)) continue;
        let bestPlaced;
        let bestAnyUnplaced = 0;
        for (const edge of edges.get(id) ?? []) {
          if (!byId.has(edge.other)) continue;
          if (positions.has(edge.other)) {
            if (!bestPlaced || edge.strength > bestPlaced.strength) {
              bestPlaced = { id, anchor: edge.other, type: edge.type, strength: edge.strength };
            }
          } else if (reachable.has(edge.other) && edge.strength > bestAnyUnplaced) {
            bestAnyUnplaced = edge.strength;
          }
        }
        if (!bestPlaced) continue;
        if (!fallback || bestPlaced.strength > fallback.strength) fallback = bestPlaced;
        if (bestAnyUnplaced > bestPlaced.strength) continue;
        if (!chosen || bestPlaced.strength > chosen.strength) chosen = bestPlaced;
      }
      const next = chosen ?? fallback;
      if (!next) break;
      place(next.id, beside(next.anchor, next.id, next.type, next.strength));
    }
  };
  const rootId = options.rootId && byId.has(options.rootId) ? options.rootId : [...byId.keys()].sort()[0];
  grow(rootId, { x: 0, y: 0, z: 0 });
  let island = 0;
  for (const object of [...byId.values()].sort((a, b) => a.id.localeCompare(b.id))) {
    if (positions.has(object.id)) continue;
    const angle = berxStableAngle(object.id);
    const ring = UNRELATED_RING + Math.floor(island / 8) * 4.5;
    island++;
    grow(object.id, {
      x: Math.cos(angle) * ring,
      y: Math.sin(angle * 1.7) * rise,
      z: Math.sin(angle) * ring
    });
  }
  return positions;
}
function berxRelationalWeight(id, relations) {
  let total = 0;
  for (const relation2 of relations) {
    if (relation2.from === id || relation2.to === id) total += Math.max(0, relation2.strength);
  }
  return total === 0 ? 0 : 1 - 1 / (1 + total);
}
var RELATION_RADIUS, UNRELATED_RING;
var init_relational = __esm({
  "packages/spatial/src/relational.ts"() {
    "use strict";
    RELATION_RADIUS = {
      /* contained things sit inside their container */
      contains: 1.6,
      /* a thing at a place stands with it */
      "located-at": 2.4,
      /* the author is the closest relation a moment has */
      "created-by": 2,
      attending: 3,
      messages: 2.2,
      shares: 3.4,
      related: 4
    };
    UNRELATED_RING = 9.5;
  }
});

// packages/spatial/src/worldLighting.ts
function berxWorldLighting() {
  return {
    /* #15191E: the room, bounced */
    ambient: rgb("#15191E"),
    ambientIntensity: 1.35,
    key: {
      direction: normalise({ x: 0.45, y: 0.72, z: 0.9 }),
      /* #F2F0EB: daylight-neutral pearl, not white */
      colour: rgb("#F2F0EB"),
      intensity: 1
    },
    points: []
  };
}
function berxResolvePointLights(lighting, at) {
  return lighting.points.map((light) => ({
    light,
    d: Math.hypot(light.position.x - at.x, light.position.y - at.y, light.position.z - at.z)
  })).filter(({ light, d }) => d <= light.range).sort((a, b) => a.d - b.d).slice(0, BERX_MAX_POINT_LIGHTS).map(({ light }) => light);
}
function berxEnergyLight(position, energy) {
  const e = Math.max(0, Math.min(1, energy));
  if (e <= 0.01) return void 0;
  return {
    position: { ...position },
    colour: rgb("#4FD6E8"),
    intensity: e * 1.6,
    range: 4 + e * 6
  };
}
var rgb, BERX_MAX_POINT_LIGHTS, normalise;
var init_worldLighting = __esm({
  "packages/spatial/src/worldLighting.ts"() {
    "use strict";
    init_color();
    rgb = (hex) => {
      const c = parseColor(hex);
      if (!c) throw new Error(`BERX 5D lighting: ${hex} is not a colour`);
      return [c.r / 255, c.g / 255, c.b / 255];
    };
    BERX_MAX_POINT_LIGHTS = 4;
    normalise = (v) => {
      const l = Math.hypot(v.x, v.y, v.z) || 1;
      return { x: v.x / l, y: v.y / l, z: v.z / l };
    };
  }
});

// packages/spatial/src/worldMaterials.ts
function berxWorldMaterial(name) {
  return BERX_WORLD_MATERIALS[name] ?? BERX_WORLD_MATERIALS.ceramic;
}
var rgb2, NONE, BERX_WORLD_MATERIALS;
var init_worldMaterials = __esm({
  "packages/spatial/src/worldMaterials.ts"() {
    "use strict";
    init_color();
    rgb2 = (hex) => {
      const c = parseColor(hex);
      if (!c) throw new Error(`BERX 5D material: ${hex} is not a colour`);
      return [c.r / 255, c.g / 255, c.b / 255];
    };
    NONE = [0, 0, 0];
    BERX_WORLD_MATERIALS = {
      /* the ground itself: near-black, smooth, and it holds a reflection */
      obsidian: { baseColor: rgb2("#07080A"), metalness: 0.08, roughness: 0.18, emission: NONE, opacity: 1, transmission: 0, ior: 1.5 },
      graphite: { baseColor: rgb2("#15191E"), metalness: 0.12, roughness: 0.52, emission: NONE, opacity: 1, transmission: 0, ior: 1.5 },
      /* people: bright, faintly waxy, not a mirror and not chalk */
      pearl: { baseColor: rgb2("#F2F0EB"), metalness: 0.04, roughness: 0.34, emission: NONE, opacity: 1, transmission: 0, ior: 1.5 },
      champagne: { baseColor: rgb2("#C9B58A"), metalness: 0.25, roughness: 0.3, emission: NONE, opacity: 1, transmission: 0, ior: 1.5 },
      /* a real metal: its own tint, no diffuse term */
      "soft-gold": { baseColor: rgb2("#C9B58A"), metalness: 0.92, roughness: 0.28, emission: NONE, opacity: 1, transmission: 0, ior: 1.5 },
      "dark-glass": { baseColor: rgb2("#0D1014"), metalness: 0, roughness: 0.08, emission: NONE, opacity: 0.68, transmission: 0.55, ior: 1.5 },
      ceramic: { baseColor: rgb2("#A7ADB4"), metalness: 0, roughness: 0.42, emission: NONE, opacity: 1, transmission: 0, ior: 1.45 },
      metal: { baseColor: rgb2("#6F767E"), metalness: 0.96, roughness: 0.24, emission: NONE, opacity: 1, transmission: 0, ior: 1.5 },
      /* cloth scatters: rough, dielectric, no visible highlight */
      fabric: { baseColor: rgb2("#1C2228"), metalness: 0, roughness: 0.88, emission: NONE, opacity: 1, transmission: 0, ior: 1.45 },
      /* a photograph is its own colour; the surface under it must not tint it */
      media: { baseColor: rgb2("#F2F0EB"), metalness: 0, roughness: 0.62, emission: NONE, opacity: 1, transmission: 0, ior: 1.5 },
      /* the only material that emits at rest, and only where energy puts it */
      energy: { baseColor: rgb2("#1C2228"), metalness: 0.1, roughness: 0.3, emission: rgb2("#4FD6E8"), opacity: 1, transmission: 0, ior: 1.5 }
    };
  }
});

// packages/spatial/src/spatialAudio.ts
var init_spatialAudio = __esm({
  "packages/spatial/src/spatialAudio.ts"() {
    "use strict";
  }
});

// packages/spatial/src/platform.ts
var init_platform = __esm({
  "packages/spatial/src/platform.ts"() {
    "use strict";
  }
});

// packages/spatial/src/platformTargets.ts
var init_platformTargets = __esm({
  "packages/spatial/src/platformTargets.ts"() {
    "use strict";
  }
});

// packages/spatial/src/spatialCamera.ts
var clamp2, lerp, copy, smoothstep, BerxSpatialCamera, BerxCameraTransition;
var init_spatialCamera = __esm({
  "packages/spatial/src/spatialCamera.ts"() {
    "use strict";
    clamp2 = (v, min, max) => Math.max(min, Math.min(max, v));
    lerp = (a, b, t) => a + (b - a) * t;
    copy = (v) => ({ x: v.x, y: v.y, z: v.z });
    smoothstep = (t) => t * t * (3 - 2 * t);
    BerxSpatialCamera = class {
      constructor(initial, limits) {
        this.velocity = { x: 0, y: 0, z: 0 };
        this.state = { position: copy(initial?.position ?? { x: 0, y: 0, z: 8 }), target: copy(initial?.target ?? { x: 0, y: 0, z: 0 }), rotation: { ...initial?.rotation ?? { x: 0, y: 0, z: 0 } }, fov: initial?.fov ?? 42, near: initial?.near ?? 0.1, far: initial?.far ?? 200 };
        this.baseTarget = copy(this.state.target);
        this.limits = { maxTiltDeg: limits?.maxTiltDeg ?? 2.5, maxDepth: limits?.maxDepth ?? 30, minFov: limits?.minFov ?? 28, maxFov: limits?.maxFov ?? 58 };
      }
      getState() {
        return { position: copy(this.state.position), target: copy(this.state.target), rotation: { ...this.state.rotation }, fov: this.state.fov, near: this.state.near, far: this.state.far };
      }
      /**
        * Put the camera somewhere.
        *
        * The field of view is clamped to the limits a screen's zoom may
        * reach — except when the caller says the value came from a device.
        * A headset's optics are not a zoom: a runtime that reports 100° per
        * eye is describing its lenses, and rendering the world at 58°
        * through them makes it the wrong size. `optics` is how a pose says
        * so, and nothing else may use it.
        */
      setState(next, source = {}) {
        this.state = { position: copy(next.position), target: copy(next.target), rotation: { ...next.rotation }, fov: source.optics === true ? next.fov : clamp2(next.fov, this.limits.minFov, this.limits.maxFov), near: next.near, far: next.far };
        this.baseTarget = copy(next.target);
      }
      applyInput(input) {
        this.velocity.x += input.panX * 0.18;
        this.velocity.y += input.panY * 0.18;
        this.velocity.z += input.depthDelta * 0.28;
        this.state.fov = clamp2(this.state.fov - input.pinch * 0.45, this.limits.minFov, this.limits.maxFov);
        if (input.motion) {
          const factor = clamp2(input.motion.intensity, 0, 1), tilt = this.limits.maxTiltDeg * factor;
          this.state.rotation.x = clamp2(input.motion.pitch * tilt, -this.limits.maxTiltDeg, this.limits.maxTiltDeg);
          this.state.rotation.z = clamp2(input.motion.roll * tilt, -this.limits.maxTiltDeg, this.limits.maxTiltDeg);
          this.state.rotation.y = clamp2(input.motion.yaw * tilt * 0.55, -this.limits.maxTiltDeg, this.limits.maxTiltDeg);
          const aim = 0.9 * factor;
          this.state.target = { x: this.baseTarget.x + clamp2(input.motion.roll, -1, 1) * aim, y: this.baseTarget.y - clamp2(input.motion.pitch, -1, 1) * aim, z: this.baseTarget.z };
        }
      }
      frame(deltaSeconds, reducedMotion = false) {
        const dt = clamp2(deltaSeconds, 0, 0.05), damping = Math.pow(1e-3, dt);
        this.state.position.x = clamp2(this.state.position.x + this.velocity.x * dt, -this.limits.maxDepth, this.limits.maxDepth);
        this.state.position.y = clamp2(this.state.position.y + this.velocity.y * dt, -this.limits.maxDepth, this.limits.maxDepth);
        this.state.position.z = clamp2(this.state.position.z + this.velocity.z * dt, -this.limits.maxDepth, this.limits.maxDepth);
        this.velocity.x *= damping;
        this.velocity.y *= damping;
        this.velocity.z *= damping;
        if (reducedMotion) {
          this.state.rotation.x = lerp(this.state.rotation.x, 0, 1 - damping);
          this.state.rotation.y = lerp(this.state.rotation.y, 0, 1 - damping);
          this.state.rotation.z = lerp(this.state.rotation.z, 0, 1 - damping);
          this.state.target = { ...this.baseTarget };
        }
      }
      poseForObject(position, scale = { x: 1, y: 1, z: 1 }, distance2) {
        const radius = Math.max(scale.x, scale.y, scale.z, 0.5), d = distance2 ?? Math.max(2.4, radius * 3.2);
        return { position: { x: position.x, y: position.y, z: position.z + d }, target: copy(position) };
      }
      moveToPose(pose, durationSeconds = 0.65) {
        return new BerxCameraTransition(this.getState(), pose, durationSeconds);
      }
      moveTo(target, durationSeconds = 0.65) {
        return this.moveToPose(this.poseForObject(target), durationSeconds);
      }
    };
    BerxCameraTransition = class {
      constructor(start, destination, duration) {
        this.start = start;
        this.destination = destination;
        this.elapsed = 0;
        this.duration = Math.max(1e-3, duration);
      }
      step(deltaSeconds) {
        this.elapsed = Math.min(this.duration, this.elapsed + Math.max(0, deltaSeconds));
        const t = smoothstep(this.elapsed / this.duration);
        return { position: { x: lerp(this.start.position.x, this.destination.position.x, t), y: lerp(this.start.position.y, this.destination.position.y, t), z: lerp(this.start.position.z, this.destination.position.z, t) }, target: { x: lerp(this.start.target.x, this.destination.target.x, t), y: lerp(this.start.target.y, this.destination.target.y, t), z: lerp(this.start.target.z, this.destination.target.z, t) }, rotation: { x: lerp(this.start.rotation.x, 0, t), y: lerp(this.start.rotation.y, 0, t), z: lerp(this.start.rotation.z, 0, t) }, fov: this.start.fov, near: this.start.near, far: this.start.far };
      }
      get done() {
        return this.elapsed >= this.duration;
      }
    };
  }
});

// packages/spatial/src/world.ts
var copyVec3, copyEuler, BerxSpatialWorld;
var init_world = __esm({
  "packages/spatial/src/world.ts"() {
    "use strict";
    copyVec3 = (v) => ({ ...v });
    copyEuler = (v) => ({ ...v });
    BerxSpatialWorld = class {
      constructor() {
        this.objects = /* @__PURE__ */ new Map();
        this.relations = /* @__PURE__ */ new Map();
        this.worldTime = 0;
      }
      upsertObject(object) {
        const now = Date.now();
        const existing = this.objects.get(object.id);
        this.objects.set(object.id, {
          ...object,
          createdAt: existing?.createdAt ?? object.createdAt ?? now,
          updatedAt: now,
          transform: {
            position: copyVec3(object.transform.position),
            rotation: copyEuler(object.transform.rotation),
            scale: copyVec3(object.transform.scale)
          },
          material: { ...object.material }
        });
      }
      removeObject(id) {
        this.objects.delete(id);
        for (const [relationId, relation2] of this.relations) {
          if (relation2.from === id || relation2.to === id) this.relations.delete(relationId);
        }
        if (this.activeObjectId === id) this.activeObjectId = void 0;
      }
      getObject(id) {
        const object = this.objects.get(id);
        return object ? { ...object, transform: { position: copyVec3(object.transform.position), rotation: copyEuler(object.transform.rotation), scale: copyVec3(object.transform.scale) } } : void 0;
      }
      setActiveObject(id) {
        if (id !== void 0 && !this.objects.has(id)) return;
        this.activeObjectId = id;
      }
      getActiveObject() {
        return this.activeObjectId ? this.getObject(this.activeObjectId) : void 0;
      }
      addRelation(relation2) {
        if (!this.objects.has(relation2.from) || !this.objects.has(relation2.to)) return;
        this.relations.set(relation2.id, { ...relation2 });
      }
      relatedTo(id) {
        const ids = /* @__PURE__ */ new Set();
        for (const relation2 of this.relations.values()) {
          if (relation2.from === id) ids.add(relation2.to);
          if (relation2.to === id) ids.add(relation2.from);
        }
        return [...ids].map((objectId) => this.getObject(objectId)).filter(Boolean);
      }
      tick(deltaSeconds) {
        this.worldTime += Math.max(0, deltaSeconds);
      }
      snapshot() {
        return {
          objects: [...this.objects.values()].map((object) => ({
            ...object,
            transform: {
              position: copyVec3(object.transform.position),
              rotation: copyEuler(object.transform.rotation),
              scale: copyVec3(object.transform.scale)
            },
            material: { ...object.material }
          })),
          relations: [...this.relations.values()].map((relation2) => ({ ...relation2 })),
          activeObjectId: this.activeObjectId,
          worldTime: this.worldTime
        };
      }
      restore(snapshot) {
        this.objects.clear();
        this.relations.clear();
        for (const object of snapshot.objects) this.upsertObject(object);
        for (const relation2 of snapshot.relations) this.addRelation(relation2);
        this.activeObjectId = snapshot.activeObjectId;
        this.worldTime = snapshot.worldTime;
      }
    };
  }
});

// packages/spatial/src/runtime5d.ts
var cloneCamera, cloneWorld, Berx5DRuntime;
var init_runtime5d = __esm({
  "packages/spatial/src/runtime5d.ts"() {
    "use strict";
    init_spatialCamera();
    init_world();
    cloneCamera = (c) => ({ position: { ...c.position }, target: { ...c.target }, rotation: { ...c.rotation }, fov: c.fov, near: c.near, far: c.far });
    cloneWorld = (w) => ({ ...w, camera: cloneCamera(w.camera) });
    Berx5DRuntime = class {
      constructor(options = {}) {
        this.history = [];
        this.world = new BerxSpatialWorld();
        this.camera = new BerxSpatialCamera();
        this.reducedMotion = options.reducedMotion === true;
        this.deviceMotionEnabled = options.deviceMotionEnabled !== false;
        this.transitionDuration = Math.max(0.01, options.transitionDuration ?? 0.65);
        this.currentWorld = { id: "root", enteredAt: Date.now(), camera: this.camera.getState() };
      }
      get worldState() {
        return { ...this.currentWorld, camera: this.camera.getState() };
      }
      get canGoBack() {
        return this.history.length > 0;
      }
      /** True while the camera is on its way somewhere. */
      get travelling() {
        return this.cameraTransition !== void 0;
      }
      get latestFrame() {
        return this.composeFrame();
      }
      composeFrame() {
        return { world: this.world.snapshot(), camera: this.camera.getState(), transition: this.transition ? { ...this.transition, fromCamera: cloneCamera(this.transition.fromCamera) } : void 0, reducedMotion: this.reducedMotion, deviceMotionEnabled: this.deviceMotionEnabled };
      }
      setAccessibility(options) {
        if (options.reducedMotion !== void 0) this.reducedMotion = options.reducedMotion;
      }
      setDeviceMotionEnabled(enabled) {
        this.deviceMotionEnabled = enabled;
      }
      registerObject(object) {
        this.world.upsertObject(object);
      }
      removeObject(id) {
        this.world.removeObject(id);
        if (this.currentWorld.focusObjectId === id) this.currentWorld.focusObjectId = void 0;
      }
      focus(objectId) {
        const object = this.world.getObject(objectId);
        if (!object) return false;
        this.world.setActiveObject(objectId);
        this.currentWorld.focusObjectId = objectId;
        const pose = this.camera.poseForObject(object.transform.position, object.transform.scale);
        this.beginCameraTransition(pose, this.reducedMotion ? 0.01 : this.transitionDuration);
        return true;
      }
      beginCameraTransition(pose, duration, toWorld = this.currentWorld) {
        const fromCamera = this.camera.getState();
        this.cameraTransition = this.camera.moveToPose(pose, duration);
        this.transition = { fromWorld: cloneWorld(this.currentWorld), toWorld: cloneWorld(toWorld), fromCamera, destination: { ...pose.position }, progress: 0, duration: Math.max(1e-3, duration) };
      }
      enterWorld(world, destination) {
        const previous = cloneWorld({ ...this.currentWorld, camera: this.camera.getState() });
        this.history.push(previous);
        this.currentWorld = { ...world, enteredAt: Date.now(), camera: this.camera.getState() };
        const object = destination ? void 0 : this.world.getActiveObject();
        const focus = destination ?? object?.transform.position ?? { x: 0, y: 0, z: 0 };
        const pose = object ? this.camera.poseForObject(object.transform.position, object.transform.scale) : this.camera.poseForObject(focus);
        this.beginCameraTransition(pose, this.reducedMotion ? 0.01 : this.transitionDuration, this.currentWorld);
      }
      back() {
        const previous = this.history.pop();
        if (!previous) return false;
        const from = cloneWorld({ ...this.currentWorld, camera: this.camera.getState() });
        this.currentWorld = cloneWorld(previous);
        this.world.setActiveObject(previous.focusObjectId);
        const pose = { position: cloneCamera(previous.camera).position, target: cloneCamera(previous.camera).target };
        const duration = this.reducedMotion ? 0.01 : this.transitionDuration;
        this.cameraTransition = this.camera.moveToPose(pose, duration);
        this.transition = { fromWorld: from, toWorld: cloneWorld(previous), fromCamera: this.camera.getState(), destination: { ...pose.position }, progress: 0, duration: Math.max(1e-3, duration) };
        return true;
      }
      input(input) {
        if (this.cameraTransition) return;
        this.camera.applyInput({ ...input, motion: this.deviceMotionEnabled ? input.motion : void 0 });
      }
      frame(deltaSeconds) {
        this.world.tick(deltaSeconds);
        if (this.cameraTransition) {
          const next = this.cameraTransition.step(deltaSeconds);
          this.camera.setState(next);
          if (this.transition) this.transition.progress = Math.min(1, this.transition.progress + Math.max(0, deltaSeconds) / this.transition.duration);
          if (this.cameraTransition.done) {
            this.cameraTransition = void 0;
            this.transition = void 0;
          }
        } else this.camera.frame(deltaSeconds, this.reducedMotion);
        this.currentWorld.camera = this.camera.getState();
        return this.composeFrame();
      }
    };
  }
});

// packages/spatial/src/spatialInteraction.ts
function hitTestSphere(ray, object) {
  if (!object.visible || !object.interactive) return;
  const center = object.transform.position;
  const radius = Math.max(object.transform.scale.x, object.transform.scale.y, object.transform.scale.z, 0.35);
  const oc = sub(ray.origin, center), b = dot(oc, ray.direction), c = dot(oc, oc) - radius * radius, disc = b * b - c;
  if (disc < 0) return;
  const root = Math.sqrt(disc), t0 = -b - root, t1 = -b + root, t = t0 >= 0 ? t0 : t1;
  if (t < 0) return;
  return { objectId: object.id, distance: t, point: { x: ray.origin.x + ray.direction.x * t, y: ray.origin.y + ray.direction.y * t, z: ray.origin.z + ray.direction.z * t } };
}
function pickSpatialObject(ray, objects) {
  let nearest;
  for (const object of objects) {
    const hit = hitTestSphere({ origin: ray.origin, direction: norm(ray.direction) }, object);
    if (hit && (!nearest || hit.distance < nearest.distance)) nearest = hit;
  }
  return nearest;
}
function interactionRadius(object) {
  return Math.max(object.transform.scale.x, object.transform.scale.y, object.transform.scale.z, 0.35);
}
function cameraBasis(camera) {
  const forward = norm(sub(camera.target, camera.position));
  const rightRaw = cross(forward, { x: 0, y: 1, z: 0 });
  if (len(rightRaw) < 1e-3) return;
  const right = norm(rightRaw);
  return { forward, right, up: cross(right, forward) };
}
function rayFromNdc(camera, ndcX, ndcY, aspect) {
  const basis = cameraBasis(camera);
  if (!basis) return;
  const { forward, right, up } = basis, tan = Math.tan(camera.fov * Math.PI / 360);
  return {
    origin: { ...camera.position },
    direction: norm({
      x: forward.x + right.x * ndcX * tan * aspect + up.x * ndcY * tan,
      y: forward.y + right.y * ndcX * tan * aspect + up.y * ndcY * tan,
      z: forward.z + right.z * ndcX * tan * aspect + up.z * ndcY * tan
    })
  };
}
var dot, sub, len, norm, cross;
var init_spatialInteraction = __esm({
  "packages/spatial/src/spatialInteraction.ts"() {
    "use strict";
    dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
    sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
    len = (v) => Math.hypot(v.x, v.y, v.z);
    norm = (v) => {
      const l = len(v) || 1;
      return { x: v.x / l, y: v.y / l, z: v.z / l };
    };
    cross = (a, b) => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });
  }
});

// packages/spatial/src/proximity.ts
function berxNear(at, objects, radius, options = {}) {
  return objects.filter((o) => o.visible && o.id !== options.exclude && distance(at, o.transform.position) <= radius).sort((a, b) => distance(at, a.transform.position) - distance(at, b.transform.position));
}
function berxWorldBounds(objects) {
  const visible = objects.filter((o) => o.visible);
  if (visible.length === 0) {
    const zero = { x: 0, y: 0, z: 0 };
    return { min: { ...zero }, max: { ...zero }, centre: { ...zero }, radius: 0 };
  }
  const min = { x: Infinity, y: Infinity, z: Infinity };
  const max = { x: -Infinity, y: -Infinity, z: -Infinity };
  for (const o of visible) {
    const r = interactionRadius(o);
    min.x = Math.min(min.x, o.transform.position.x - r);
    min.y = Math.min(min.y, o.transform.position.y - r);
    min.z = Math.min(min.z, o.transform.position.z - r);
    max.x = Math.max(max.x, o.transform.position.x + r);
    max.y = Math.max(max.y, o.transform.position.y + r);
    max.z = Math.max(max.z, o.transform.position.z + r);
  }
  const centre = { x: (min.x + max.x) / 2, y: (min.y + max.y) / 2, z: (min.z + max.z) / 2 };
  let radius = 0;
  for (const o of visible) {
    radius = Math.max(radius, distance(centre, o.transform.position) + interactionRadius(o));
  }
  return { min, max, centre, radius };
}
function berxClampToWorld(position, bounds, margin = 12) {
  const limit = bounds.radius + margin;
  const d = distance(position, bounds.centre);
  if (d <= limit || d === 0) return position;
  const scale = limit / d;
  return {
    x: bounds.centre.x + (position.x - bounds.centre.x) * scale,
    y: bounds.centre.y + (position.y - bounds.centre.y) * scale,
    z: bounds.centre.z + (position.z - bounds.centre.z) * scale
  };
}
var distance;
var init_proximity = __esm({
  "packages/spatial/src/proximity.ts"() {
    "use strict";
    init_spatialInteraction();
    distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  }
});

// packages/spatial/src/spatialAffordances.ts
function affordancesForObject(object, labels = {}) {
  const actions = primaryByKind[object.kind] ?? ["open"];
  return { objectId: object.id, affordances: actions.map((action, index) => ({ id: `${object.id}:${action}`, objectId: object.id, action, state: object.interactive ? "available" : "disabled", label: labels[action] ?? action, accessibilityLabel: labels[action] ?? action, priority: index, serverRequired: action !== "open" && action !== "focus" })) };
}
var primaryByKind;
var init_spatialAffordances = __esm({
  "packages/spatial/src/spatialAffordances.ts"() {
    "use strict";
    primaryByKind = {
      person: ["view-profile", "message", "follow"],
      moment: ["open", "like", "comment", "share", "save"],
      place: ["view-place", "directions", "reserve"],
      event: ["view-event", "attend", "share"],
      experience: ["view-experience", "reserve", "share"],
      community: ["view-community", "join", "share"],
      business: ["view-business", "directions", "reserve"],
      collection: ["open", "save", "share"],
      message: ["open", "reply", "react"],
      create: ["create-moment", "create-story", "create-post"]
    };
  }
});

// packages/spatial/src/xrPose.ts
function berxRotateByQuaternion(v, q) {
  const l = Math.hypot(q.x, q.y, q.z, q.w) || 1;
  const x = q.x / l;
  const y = q.y / l;
  const z = q.z / l;
  const w = q.w / l;
  const tx = 2 * (y * v.z - z * v.y);
  const ty = 2 * (z * v.x - x * v.z);
  const tz = 2 * (x * v.y - y * v.x);
  return {
    x: v.x + w * tx + (y * tz - z * ty),
    y: v.y + w * ty + (z * tx - x * tz),
    z: v.z + w * tz + (x * ty - y * tx)
  };
}
function berxCameraFromPose(pose, previous, minConfidence = BERX_MIN_POSE_CONFIDENCE) {
  if (pose.confidence !== void 0 && pose.confidence < minConfidence) return void 0;
  if (!Number.isFinite(pose.position.x) || !Number.isFinite(pose.position.y) || !Number.isFinite(pose.position.z)) return void 0;
  const forward = berxRotateByQuaternion({ x: 0, y: 0, z: -LOOK_DISTANCE }, pose.orientation);
  return {
    position: { ...pose.position },
    target: {
      x: pose.position.x + forward.x,
      y: pose.position.y + forward.y,
      z: pose.position.z + forward.z
    },
    /* the head's own roll, kept: a tilted head is a tilted world */
    rotation: berxEulerFromQuaternion(pose.orientation),
    fov: pose.fovDegrees > 0 ? pose.fovDegrees : previous.fov,
    near: previous.near,
    far: previous.far
  };
}
function berxStereoCamerasFromPose(views, previous, minConfidence = BERX_MIN_POSE_CONFIDENCE) {
  const left = berxCameraFromPose(views.left, previous, minConfidence);
  if (!left) return void 0;
  const right = views.right ? berxCameraFromPose(views.right, previous, minConfidence) : void 0;
  return { left, right };
}
function berxEulerFromQuaternion(q) {
  const l = Math.hypot(q.x, q.y, q.z, q.w) || 1;
  const x = q.x / l;
  const y = q.y / l;
  const z = q.z / l;
  const w = q.w / l;
  const sinPitch = Math.max(-1, Math.min(1, 2 * (w * x - y * z)));
  return {
    x: Math.asin(sinPitch),
    y: Math.atan2(2 * (w * y + x * z), 1 - 2 * (x * x + y * y)),
    z: Math.atan2(2 * (w * z + x * y), 1 - 2 * (x * x + z * z))
  };
}
var LOOK_DISTANCE, BERX_MIN_POSE_CONFIDENCE;
var init_xrPose = __esm({
  "packages/spatial/src/xrPose.ts"() {
    "use strict";
    LOOK_DISTANCE = 1;
    BERX_MIN_POSE_CONFIDENCE = 0.5;
  }
});

// packages/spatial/src/worldApp.ts
function regionForKind(kind) {
  switch (kind) {
    case "person":
      return "person";
    case "place":
    case "business":
      return "place";
    case "event":
      return "event";
    case "experience":
      return "experience";
    case "community":
      return "community";
    case "collection":
      return "collection";
    case "message":
      return "conversation";
    case "create":
      return "create";
    case "moment":
      return "now";
  }
}
var BERX_PERSISTENCE_VERSION, Berx5DWorldApp;
var init_worldApp = __esm({
  "packages/spatial/src/worldApp.ts"() {
    "use strict";
    init_runtime5d();
    init_temporal();
    init_relational();
    init_proximity();
    init_spatialAffordances();
    init_xrPose();
    BERX_PERSISTENCE_VERSION = 1;
    Berx5DWorldApp = class {
      constructor(options = {}) {
        this.relations = /* @__PURE__ */ new Map();
        this.mediaByObject = /* @__PURE__ */ new Map();
        /** Positions the relational layout decided; recomputed when R changes. */
        this.layout = /* @__PURE__ */ new Map();
        this.layoutDirty = false;
        this.history = [];
        this.options = options;
        this.viewerId = options.viewerId;
        this.runtime = new Berx5DRuntime({
          reducedMotion: options.reducedMotion,
          deviceMotionEnabled: options.deviceMotionEnabled,
          transitionDuration: options.transitionDuration
        });
        this.position = { region: "world", cursor: options.cursor ?? berxTemporalCursor() };
      }
      /* ---------------- the world ---------------- */
      /**
       * Put real entities into the world.
       *
       * Idempotent by spatial identity: ingesting the same place from NOW
       * and from a search updates one object rather than creating a
       * second. That is the whole reason identity is derived from the
       * server's guid.
       */
      ingest(entries) {
        for (const entry of entries) {
          this.runtime.registerObject(entry.object);
          if (entry.media && entry.media.length > 0) this.mediaByObject.set(entry.object.id, entry.media);
          for (const relation2 of entry.relations ?? []) this.relations.set(relation2.id, relation2);
        }
        this.layoutDirty = true;
      }
      /** Media the server sent for an object, for a renderer to upload. */
      mediaFor(objectId) {
        return this.mediaByObject.get(objectId) ?? [];
      }
      remove(objectId) {
        this.runtime.removeObject(objectId);
        this.mediaByObject.delete(objectId);
        for (const [id, relation2] of this.relations) {
          if (relation2.from === objectId || relation2.to === objectId) this.relations.delete(id);
        }
        this.layoutDirty = true;
      }
      /** The viewer. Everything is arranged around them, so it re-lays out. */
      setViewer(objectId) {
        if (this.viewerId === objectId) return;
        this.viewerId = objectId;
        this.layoutDirty = true;
      }
      get viewer() {
        return this.viewerId;
      }
      get allRelations() {
        return [...this.relations.values()];
      }
      /**
       * Recompute where everything stands from the relations between them.
       *
       * Deterministic: same graph, same coordinates, every time. Relations
       * whose ends are not both in the world are dropped rather than
       * placing entities against things that are not there.
       */
      relayout() {
        const snapshot = this.runtime.world.snapshot();
        const present = new Set(snapshot.objects.map((o) => o.id));
        const usable = [...this.relations.values()].filter((r) => present.has(r.from) && present.has(r.to));
        this.layout = berxRelationalLayout(snapshot.objects, usable, { rootId: this.viewerId });
        for (const object of snapshot.objects) {
          const at = this.layout.get(object.id);
          if (!at) continue;
          const weight = berxRelationalWeight(object.id, usable);
          const scale = 1 + weight * 0.45;
          this.runtime.registerObject({
            ...object,
            transform: {
              ...object.transform,
              position: { ...at },
              scale: {
                x: object.transform.scale.x * scale,
                y: object.transform.scale.y * scale,
                z: object.transform.scale.z * scale
              }
            }
          });
          for (const relation2 of usable) this.runtime.world.addRelation(relation2);
        }
        this.layoutDirty = false;
      }
      /* ---------------- time ---------------- */
      get cursor() {
        return { ...this.position.cursor };
      }
      /** Move the viewer through time. Entities move; nothing is filtered out. */
      setCursor(cursor) {
        this.position = { ...this.position, cursor: { ...cursor } };
        this.options.onPositionChange?.(this.worldPosition);
      }
      /** Scrub by a real number of seconds, in either direction. */
      scrubTime(seconds) {
        this.setCursor({ ...this.position.cursor, at: this.position.cursor.at + seconds });
      }
      /* ---------------- navigation, as travel ---------------- */
      get worldPosition() {
        return { ...this.position, cursor: { ...this.position.cursor } };
      }
      get canGoBack() {
        return this.runtime.canGoBack;
      }
      /**
       * Travel to an entity. The camera moves; nothing is replaced.
       *
       * The region is what the entity *is*, so arriving at a person is
       * being with that person rather than opening a profile. Returns
       * false when the entity is not in the world — which is a real
       * answer, not a reason to invent it.
       */
      travelTo(objectId, region) {
        const object = this.runtime.world.getObject(objectId);
        if (!object) return false;
        const target = region ?? regionForKind(object.kind);
        this.history.push(this.worldPosition);
        this.runtime.enterWorld({ id: `${target}:${objectId}`, focusObjectId: objectId, enteredAt: Date.now() }, object.transform.position);
        this.runtime.focus(objectId);
        this.position = { ...this.position, region: target, focusId: objectId };
        this.options.onPositionChange?.(this.worldPosition);
        return true;
      }
      /**
       * What is live right now, brightest first.
       *
       * Energy is only ever raised by a real server signal — a moment
       * still running, an event that has not ended — and the temporal
       * projection zeroes it for anything outside the cursor's horizon.
       * So this is a reading of the world, not a query against a feed:
       * scrub the cursor into last week and NOW is empty, because nothing
       * is happening then.
       */
      live() {
        return this.latestFrame.world.objects.filter((object) => object.visible && object.energy > 0.01).sort((a, b) => b.energy - a.energy);
      }
      /**
       * Go to what is happening.
       *
       * Returns false when nothing is, which is a real answer about the
       * world and not an empty list to render. NOW is a place; when it is
       * quiet, it is quiet.
       */
      travelToLive() {
        const [brightest] = this.live();
        if (!brightest) {
          this.enterRegion("now");
          return false;
        }
        return this.travelTo(brightest.id, "now");
      }
      /** Travel to a region without a particular entity in it. */
      enterRegion(region) {
        this.history.push(this.worldPosition);
        this.runtime.enterWorld({ id: region, enteredAt: Date.now() });
        this.position = { ...this.position, region, focusId: void 0 };
        this.options.onPositionChange?.(this.worldPosition);
      }
      /**
       * Return to where the viewer was — camera pose, focus, region and
       * temporal cursor together. Not a screen being rebuilt: the world
       * never went anywhere, so this is genuinely arriving back.
       */
      back() {
        const previous = this.history.pop();
        if (!this.runtime.back()) return false;
        if (previous) {
          this.position = previous;
          this.options.onPositionChange?.(this.worldPosition);
        }
        return true;
      }
      /**
       * The viewer's head, from an XR runtime.
       *
       * `dispatch({kind: 'pose'})` is the phone-tilt path: a small,
       * damped parallax on top of a camera the viewer is still driving.
       * This is the other thing entirely — ARKit, ARCore and OpenXR
       * report where the head actually is, and in a headset the camera is
       * the head. There is no damping and no blending, because a world
       * that lags a head is a world that makes people ill.
       *
       * Returns false when the runtime does not trust its own tracking,
       * and holds the camera it had rather than following a pose nobody
       * believes. A platform with no tracking never calls this.
       */
      setHeadPose(pose) {
        const next = berxCameraFromPose(pose, this.runtime.camera.getState());
        if (!next) return false;
        this.runtime.camera.setState(next, { optics: true });
        return true;
      }
      /**
       * Both eyes, from a headset that reports both.
       *
       * The left eye is the camera; the right is returned for the
       * renderer's second viewport. Both come from the runtime's own
       * poses, so the interpupillary distance and the per-eye optics are
       * the headset's rather than a constant BERX picked.
       */
      setHeadViews(views) {
        const cameras = berxStereoCamerasFromPose(views, this.runtime.camera.getState());
        if (!cameras) return void 0;
        this.runtime.camera.setState(cameras.left, { optics: true });
        return cameras;
      }
      /* ---------------- intents, from any device ---------------- */
      /**
       * One handler for every platform's input. A drag, a thumbstick, a
       * head turn and an arrow key arrive here as the same thing.
       */
      dispatch(intent) {
        switch (intent.kind) {
          case "pan":
            this.runtime.input({ panX: intent.x ?? 0, panY: intent.y ?? 0, depthDelta: 0, pinch: 0 });
            return;
          case "depth":
            this.runtime.input({ panX: 0, panY: 0, depthDelta: intent.amount ?? 0, pinch: 0 });
            return;
          case "zoom":
            this.runtime.input({ panX: 0, panY: 0, depthDelta: 0, pinch: intent.amount ?? 0 });
            return;
          case "pose":
            this.runtime.input({
              panX: 0,
              panY: 0,
              depthDelta: 0,
              pinch: 0,
              motion: { pitch: intent.x ?? 0, roll: intent.y ?? 0, yaw: intent.z ?? 0, intensity: intent.intensity ?? 0.65 }
            });
            return;
          case "time":
            this.scrubTime(intent.amount ?? 0);
            return;
          case "back":
            this.back();
            return;
          case "enter": {
            const active = this.runtime.world.getActiveObject();
            if (active) this.travelTo(active.id);
            return;
          }
          default:
            return;
        }
      }
      /**
       * Focus an entity without travelling to it — the difference between
       * looking at something and going to it.
       */
      focus(objectId) {
        const ok = this.runtime.focus(objectId);
        if (ok) {
          this.position = { ...this.position, focusId: objectId };
          this.options.onPositionChange?.(this.worldPosition);
        }
        return ok;
      }
      /**
       * Look at nothing in particular.
       *
       * A real state, not an absence of one: standing in a region with
       * nothing selected is how a world normally is, and it is when no
       * action ring is drawn.
       */
      blur() {
        this.runtime.world.setActiveObject(void 0);
        this.position = { ...this.position, focusId: void 0 };
        this.options.onPositionChange?.(this.worldPosition);
      }
      setAccessibility(options) {
        this.runtime.setAccessibility(options);
      }
      /* ---------------- being near things ---------------- */
      /**
       * What is within reach of the entity in focus.
       *
       * Real distance in the world, so it changes as the relations change
       * — the people around a place are the people the graph put there.
       */
      nearFocus(radius = 6) {
        const object = this.runtime.world.getActiveObject();
        if (!object) return [];
        return berxNear(object.transform.position, this.latestFrame.world.objects, radius, { exclude: object.id });
      }
      /** How big the world is, from what is actually in it. */
      get bounds() {
        return berxWorldBounds(this.latestFrame.world.objects);
      }
      /* ---------------- doing things ---------------- */
      /**
       * What can be done with the entity in focus.
       *
       * Only what the domain says that kind affords, and only what this
       * build can actually carry out — an affordance with nothing behind
       * it is a button that does nothing, which is worse than an absence.
       */
      affordances() {
        const object = this.runtime.world.getActiveObject();
        if (!object || !this.options.onAction) return [];
        return affordancesForObject(object, this.options.actionLabels).affordances.filter((a) => a.state !== "disabled");
      }
      /**
       * Do it, and let the server decide what happened.
       *
       * The world is updated from what comes back, never from what was
       * asked for: a like that the server refused must not leave a liked
       * object sitting in the world. A rejection is returned to the
       * caller rather than swallowed.
       */
      async act(affordanceId) {
        const object = this.runtime.world.getActiveObject();
        if (!object || !this.options.onAction) return false;
        const affordance = this.affordances().find((a) => a.id === affordanceId);
        if (!affordance) return false;
        if (affordance.action === "open") return this.travelTo(object.id);
        const updated = await this.options.onAction(affordance.action, object);
        if (updated) this.ingest([updated]);
        return true;
      }
      /* ---------------- persistence ---------------- */
      /**
       * Everything about where the viewer is, so they can come back to it.
       *
       * Not "the last route": the camera's exact pose, the region, what
       * was in focus, where in time they were standing, who the world is
       * arranged around, and the history behind them. Restoring this puts
       * someone back where they were, not on a page that looks similar.
       *
       * The world's entities are deliberately not in here. They come from
       * the server, and a stale copy of somebody's feed restored from disk
       * is exactly the fake data this whole runtime refuses — so the
       * entities are re-read and the *place* is restored around them.
       */
      persist() {
        return {
          version: BERX_PERSISTENCE_VERSION,
          viewerId: this.viewerId,
          position: this.worldPosition,
          camera: this.runtime.camera.getState(),
          history: this.history.map((p) => ({ ...p, cursor: { ...p.cursor } }))
        };
      }
      /**
       * Stand where you were standing.
       *
       * A focus that is no longer in the world is dropped rather than
       * pointed at nothing — people delete things, and a restored session
       * has to survive that. An unknown version is ignored entirely: a
       * half-understood pose is worse than starting at the origin.
       */
      restore(state) {
        if (!state || state.version !== BERX_PERSISTENCE_VERSION) return false;
        this.viewerId = state.viewerId;
        this.layoutDirty = true;
        this.history.length = 0;
        this.history.push(...state.history.map((p) => ({ ...p, cursor: { ...p.cursor } })));
        const focusExists = state.position.focusId ? Boolean(this.runtime.world.getObject(state.position.focusId)) : false;
        this.position = {
          region: state.position.region,
          focusId: focusExists ? state.position.focusId : void 0,
          cursor: { ...state.position.cursor }
        };
        this.runtime.camera.setState(state.camera);
        if (this.position.focusId) this.runtime.world.setActiveObject(this.position.focusId);
        this.options.onPositionChange?.(this.worldPosition);
        return true;
      }
      /* ---------------- the frame ---------------- */
      /**
       * The world as it stands, this instant, with all five dimensions
       * applied: relational positions, then the temporal projection that
       * pushes the past away and brings what is live forward.
       */
      frame(deltaSeconds) {
        if (this.layoutDirty) this.relayout();
        const base = this.runtime.frame(deltaSeconds);
        const bounds = berxWorldBounds(base.world.objects);
        if (bounds.radius > 0 && !this.runtime.travelling) {
          const clamped = berxClampToWorld(base.camera.position, bounds);
          if (clamped !== base.camera.position) {
            this.runtime.camera.setState({ ...base.camera, position: clamped });
          }
        }
        const cursor = this.position.cursor;
        return {
          ...base,
          camera: this.runtime.camera.getState(),
          world: {
            ...base.world,
            objects: base.world.objects.map((object) => berxApplyTemporal(object, cursor))
          }
        };
      }
      get latestFrame() {
        if (this.layoutDirty) this.relayout();
        const base = this.runtime.latestFrame;
        const cursor = this.position.cursor;
        return {
          ...base,
          world: { ...base.world, objects: base.world.objects.map((o) => berxApplyTemporal(o, cursor)) }
        };
      }
    };
  }
});

// packages/spatial/src/runtimeAssertions.ts
var init_runtimeAssertions = __esm({
  "packages/spatial/src/runtimeAssertions.ts"() {
    "use strict";
  }
});

// packages/spatial/src/renderer.ts
var init_renderer = __esm({
  "packages/spatial/src/renderer.ts"() {
    "use strict";
  }
});

// packages/spatial/src/socialActions.ts
var init_socialActions = __esm({
  "packages/spatial/src/socialActions.ts"() {
    "use strict";
  }
});

// packages/spatial/src/actionRing.ts
function berxActionRing(object, camera, affordances) {
  if (!object || affordances.length === 0) return [];
  const basis = cameraBasis(camera);
  if (!basis) return [];
  const radius = Math.max(object.transform.scale.x, object.transform.scale.y) * 0.5 + RING_GAP;
  const drop = object.transform.scale.y * 0.5 + SLOT_HEIGHT * 1.4;
  const spread = Math.min(Math.PI * 0.9, 0.42 * Math.max(1, affordances.length - 1));
  const start = -spread / 2;
  const step = affordances.length > 1 ? spread / (affordances.length - 1) : 0;
  return affordances.map((affordance, index) => {
    const angle = start + step * index;
    const across = Math.sin(angle) * radius * 1.35;
    const under = Math.cos(angle) * radius * 0.35;
    return {
      affordance,
      position: {
        x: object.transform.position.x + basis.right.x * across - basis.up.x * (drop + under),
        y: object.transform.position.y + basis.right.y * across - basis.up.y * (drop + under),
        z: object.transform.position.z + basis.right.z * across - basis.up.z * (drop + under)
      },
      halfHeight: SLOT_HEIGHT * 0.5
    };
  });
}
function pickActionSlot(slots, camera, rayDirection, aspect) {
  const basis = cameraBasis(camera);
  if (!basis) return void 0;
  let best;
  let bestDistance = Infinity;
  for (const slot of slots) {
    const d = {
      x: slot.position.x - camera.position.x,
      y: slot.position.y - camera.position.y,
      z: slot.position.z - camera.position.z
    };
    const along = d.x * basis.forward.x + d.y * basis.forward.y + d.z * basis.forward.z;
    if (along <= 0) continue;
    const scale = along / Math.max(1e-4, rayDirection.x * basis.forward.x + rayDirection.y * basis.forward.y + rayDirection.z * basis.forward.z);
    const hit = { x: rayDirection.x * scale, y: rayDirection.y * scale, z: rayDirection.z * scale };
    const dx = (hit.x - d.x) * basis.right.x + (hit.y - d.y) * basis.right.y + (hit.z - d.z) * basis.right.z;
    const dy = (hit.x - d.x) * basis.up.x + (hit.y - d.y) * basis.up.y + (hit.z - d.z) * basis.up.z;
    if (Math.abs(dx) <= slot.halfHeight * 4 * aspect && Math.abs(dy) <= slot.halfHeight * 1.6 && along < bestDistance) {
      bestDistance = along;
      best = slot;
    }
  }
  return best;
}
var RING_GAP, SLOT_HEIGHT;
var init_actionRing = __esm({
  "packages/spatial/src/actionRing.ts"() {
    "use strict";
    init_spatialInteraction();
    RING_GAP = 0.55;
    SLOT_HEIGHT = 0.26;
  }
});

// packages/spatial/src/frustum.ts
function berxFrustumPlanes(viewProjection) {
  const p = new Float32Array(24);
  const m = (r, c) => viewProjection[c * 4 + r];
  const set = (i, a, b, c, d) => {
    const l = Math.hypot(a, b, c) || 1;
    p[i * 4] = a / l;
    p[i * 4 + 1] = b / l;
    p[i * 4 + 2] = c / l;
    p[i * 4 + 3] = d / l;
  };
  set(0, m(3, 0) + m(0, 0), m(3, 1) + m(0, 1), m(3, 2) + m(0, 2), m(3, 3) + m(0, 3));
  set(1, m(3, 0) - m(0, 0), m(3, 1) - m(0, 1), m(3, 2) - m(0, 2), m(3, 3) - m(0, 3));
  set(2, m(3, 0) + m(1, 0), m(3, 1) + m(1, 1), m(3, 2) + m(1, 2), m(3, 3) + m(1, 3));
  set(3, m(3, 0) - m(1, 0), m(3, 1) - m(1, 1), m(3, 2) - m(1, 2), m(3, 3) - m(1, 3));
  set(4, m(3, 0) + m(2, 0), m(3, 1) + m(2, 1), m(3, 2) + m(2, 2), m(3, 3) + m(2, 3));
  set(5, m(3, 0) - m(2, 0), m(3, 1) - m(2, 1), m(3, 2) - m(2, 2), m(3, 3) - m(2, 3));
  return p;
}
function berxSphereInFrustum(planes, centre, radius) {
  for (let i = 0; i < 6; i++) {
    if (planes[i * 4] * centre.x + planes[i * 4 + 1] * centre.y + planes[i * 4 + 2] * centre.z + planes[i * 4 + 3] < -radius) {
      return false;
    }
  }
  return true;
}
function berxMultiplyMat4(a, b) {
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      let v = 0;
      for (let k = 0; k < 4; k++) v += a[k * 4 + r] * b[c * 4 + k];
      o[c * 4 + r] = v;
    }
  }
  return o;
}
function berxPerspective(fovDegrees, aspect, near, far) {
  const q = 1 / Math.tan(fovDegrees * Math.PI / 360);
  const nf = 1 / (near - far);
  const m = new Float32Array(16);
  m[0] = q / aspect;
  m[5] = q;
  m[10] = (far + near) * nf;
  m[11] = -1;
  m[14] = 2 * far * near * nf;
  return m;
}
function berxLookAt(position, target) {
  const sub2 = (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
  const norm2 = (v) => {
    const l = Math.hypot(v.x, v.y, v.z) || 1;
    return { x: v.x / l, y: v.y / l, z: v.z / l };
  };
  const cross2 = (a, b) => ({
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x
  });
  const z = norm2(sub2(position, target));
  const up = Math.abs(z.y) > 0.98 ? { x: 1, y: 0, z: 0 } : { x: 0, y: 1, z: 0 };
  const x = norm2(cross2(up, z));
  const y = cross2(z, x);
  const m = new Float32Array(16);
  m[0] = x.x;
  m[1] = y.x;
  m[2] = z.x;
  m[4] = x.y;
  m[5] = y.y;
  m[6] = z.y;
  m[8] = x.z;
  m[9] = y.z;
  m[10] = z.z;
  m[12] = -x.x * position.x - x.y * position.y - x.z * position.z;
  m[13] = -y.x * position.x - y.y * position.y - y.z * position.z;
  m[14] = -z.x * position.x - z.y * position.y - z.z * position.z;
  m[15] = 1;
  return m;
}
var init_frustum = __esm({
  "packages/spatial/src/frustum.ts"() {
    "use strict";
  }
});

// packages/spatial/src/geometry.ts
function geometryForEntity(kind) {
  return { ...specs[kind] };
}
function geometryScale(spec) {
  return { x: spec.width ?? spec.radius ?? 1, y: spec.height ?? spec.radius ?? 1, z: spec.depth ?? spec.radius ?? 1 };
}
var specs;
var init_geometry = __esm({
  "packages/spatial/src/geometry.ts"() {
    "use strict";
    specs = {
      person: { kind: "orb", radius: 0.72, segments: 32, bevel: 0.08 },
      moment: { kind: "surface", width: 1.9, height: 2.35, depth: 0.045, bevel: 0.08 },
      place: { kind: "portal", width: 1.8, height: 2.1, depth: 0.22, bevel: 0.14 },
      event: { kind: "ring", radius: 0.95, segments: 48, emissive: 0.12 },
      experience: { kind: "frame", width: 1.9, height: 1.4, depth: 0.18, bevel: 0.1 },
      community: { kind: "node", radius: 0.86, segments: 24 },
      business: { kind: "stack", width: 1.7, height: 1.15, depth: 0.45, bevel: 0.1 },
      collection: { kind: "stack", width: 1.6, height: 1.05, depth: 0.34, bevel: 0.1 },
      message: { kind: "message", width: 1.55, height: 0.72, depth: 0.12, bevel: 0.16 },
      create: { kind: "create", radius: 0.82, segments: 40, emissive: 0.08 }
    };
  }
});

// packages/spatial/src/spatialPresentation.ts
function presentationForKind(kind, object) {
  const m = materials[kind];
  const energy = Math.max(0, Math.min(1, object?.energy ?? 0));
  const lit = energy * m.amount;
  return {
    base: [...m.base],
    /* zero at rest: an object that is not live emits nothing */
    emissive: [m.glow[0] * lit, m.glow[1] * lit, m.glow[2] * lit]
  };
}
var shaderRgb, BERX_5D_DNA, materials;
var init_spatialPresentation = __esm({
  "packages/spatial/src/spatialPresentation.ts"() {
    "use strict";
    init_color();
    shaderRgb = (hex) => {
      const c = parseColor(hex);
      if (!c) throw new Error(`BERX 5D DNA: ${hex} is not a colour`);
      return [c.r / 255, c.g / 255, c.b / 255];
    };
    BERX_5D_DNA = {
      ink: shaderRgb("#07080A"),
      slate: shaderRgb("#0D1014"),
      graphite: shaderRgb("#15191E"),
      steel: shaderRgb("#1C2228"),
      pearl: shaderRgb("#F2F0EB"),
      mist: shaderRgb("#A7ADB4"),
      shadow: shaderRgb("#6F767E"),
      gold: shaderRgb("#C9B58A"),
      /** BERX Energy. Emitted with energy, never a base. */
      energy: shaderRgb("#4FD6E8")
    };
    materials = {
      /* people carry the light in this world */
      person: { base: BERX_5D_DNA.pearl, glow: BERX_5D_DNA.energy, amount: 0.08 },
      /* a moment is live only while it is live */
      moment: { base: BERX_5D_DNA.mist, glow: BERX_5D_DNA.energy, amount: 0.1 },
      /* architecture, lit rather than lighting — until something is
         happening inside it, which is what NOW is */
      place: { base: BERX_5D_DNA.steel, glow: BERX_5D_DNA.energy, amount: 0.07 },
      /* gold is for what is happening — the warm end of the DNA */
      event: { base: BERX_5D_DNA.gold, glow: BERX_5D_DNA.gold, amount: 0.08 },
      experience: { base: BERX_5D_DNA.gold, glow: BERX_5D_DNA.gold, amount: 0.06 },
      community: { base: BERX_5D_DNA.mist, glow: BERX_5D_DNA.energy, amount: 0.05 },
      business: { base: BERX_5D_DNA.steel, glow: BERX_5D_DNA.gold, amount: 0.05 },
      collection: { base: BERX_5D_DNA.graphite, glow: BERX_5D_DNA.energy, amount: 0.04 },
      message: { base: BERX_5D_DNA.mist, glow: BERX_5D_DNA.energy, amount: 0.06 },
      /* creating is a focus moment, and focus is where energy belongs */
      create: { base: BERX_5D_DNA.steel, glow: BERX_5D_DNA.energy, amount: 0.18 }
    };
  }
});

// packages/spatial/src/drawList.ts
function berxEyeCamera(camera, ipd, sign) {
  const basis = cameraBasis(camera);
  if (!basis) return camera;
  const o = ipd * 0.5 * sign;
  return {
    ...camera,
    position: {
      x: camera.position.x + basis.right.x * o,
      y: camera.position.y + basis.right.y * o,
      z: camera.position.z + basis.right.z * o
    },
    target: {
      x: camera.target.x + basis.right.x * o,
      y: camera.target.y + basis.right.y * o,
      z: camera.target.z + basis.right.z * o
    }
  };
}
function berxBuildDrawList(frame, options) {
  const c = frame.camera;
  const width = Math.max(1, Math.floor(options.width));
  const height = Math.max(1, Math.floor(options.height));
  const projection = berxPerspective(c.fov, width / height, c.near, c.far);
  const view = berxLookAt(c.position, c.target);
  const planes = berxFrustumPlanes(berxMultiplyMat4(projection, view));
  const all = frame.world.objects.filter((o) => o.visible);
  const inFrustum = all.filter((o) => berxSphereInFrustum(planes, o.transform.position, radiusOf(o)));
  const focused = frame.world.activeObjectId;
  const eye = c.position;
  const opaque = inFrustum.filter((o) => o.material.opacity >= 1).sort((a, b) => {
    if (a.id === focused) return -1;
    if (b.id === focused) return 1;
    return distanceTo(eye, a) - distanceTo(eye, b);
  });
  const blended = inFrustum.filter((o) => o.material.opacity < 1).sort((a, b) => distanceTo(eye, b) - distanceTo(eye, a));
  const max = Math.max(1, Math.floor(options.maxObjects ?? frame.world.objects.length));
  const drawn = [...opaque, ...blended].slice(0, max);
  const lighting = options.lighting ?? berxWorldLighting();
  const energyLights = [];
  for (const o of inFrustum) {
    const light = berxEnergyLight(o.transform.position, o.energy);
    if (light) energyLights.push(light);
  }
  const litWorld = { ...lighting, points: [...lighting.points, ...energyLights] };
  let lodReduced = 0;
  const items = drawn.map((o) => {
    const spec = geometryForEntity(o.kind);
    const presentation = presentationForKind(o.kind, o);
    const material = berxWorldMaterial(o.material.material);
    const distance2 = distanceTo(eye, o);
    const lod = distance2 > BERX_LOD_DISTANCE ? 1 : 0;
    if (lod === 1) lodReduced++;
    return {
      id: o.id,
      kind: o.kind,
      primitive: spec.kind,
      lod,
      model: modelMatrix(o.transform.position, o.transform.scale, o.transform.rotation),
      base: [...presentation.base],
      /* the palette decides the colour; the material decides how the
         surface behaves. Neither is guessed from the other. */
      emissive: [
        presentation.emissive[0] + material.emission[0] * o.energy,
        presentation.emissive[1] + material.emission[1] * o.energy,
        presentation.emissive[2] + material.emission[2] * o.energy
      ],
      /* the object's own state is authoritative: a screen may have
         changed a value since the named material was resolved */
      metalness: o.material.metalness,
      roughness: o.material.roughness,
      opacity: o.material.opacity,
      transmission: o.material.transmission,
      pointLights: berxResolvePointLights(litWorld, o.transform.position),
      media: options.mediaFor?.(o.id),
      label: o.label,
      distance: distance2
    };
  });
  const basis = cameraBasis(c);
  const labels = [];
  if (basis) {
    const named = drawn.filter((o) => o.label !== void 0 && o.label.trim().length > 0);
    for (const o of named.sort((a, b) => distanceTo(eye, b) - distanceTo(eye, a))) {
      const distance2 = distanceTo(eye, o);
      if (distance2 > BERX_LABEL_FADE_END) continue;
      const halfHeight = BERX_LABEL_HEIGHT * 0.5;
      const above = o.transform.scale.y * 0.5 + halfHeight * 1.6;
      const fade = distance2 <= BERX_LABEL_FADE_START ? 1 : 1 - (distance2 - BERX_LABEL_FADE_START) / (BERX_LABEL_FADE_END - BERX_LABEL_FADE_START);
      labels.push({
        id: o.id,
        text: o.label,
        position: {
          x: o.transform.position.x + basis.up.x * above,
          y: o.transform.position.y + basis.up.y * above,
          z: o.transform.position.z + basis.up.z * above
        },
        halfHeight,
        alpha: fade * o.material.opacity,
        distance: distance2
      });
    }
  }
  return {
    width,
    height,
    projection: Array.from(projection),
    view: Array.from(view),
    camera: { ...c.position },
    clearColor: [...BERX_WORLD_CLEAR],
    ambient: [
      lighting.ambient[0] * lighting.ambientIntensity,
      lighting.ambient[1] * lighting.ambientIntensity,
      lighting.ambient[2] * lighting.ambientIntensity
    ],
    key: {
      direction: { ...lighting.key.direction },
      colour: [...lighting.key.colour],
      intensity: lighting.key.intensity * (options.ambientMotion === false ? 0.85 : 1)
    },
    items,
    labels,
    actionSlots: berxActionRing(
      frame.world.objects.find((o) => o.id === frame.world.activeObjectId),
      c,
      options.affordances ?? []
    ),
    basis: basis ? { right: { ...basis.right }, up: { ...basis.up } } : void 0,
    stats: {
      visible: all.length,
      inFrustum: inFrustum.length,
      budgetCut: Math.max(0, inFrustum.length - drawn.length),
      lodReduced
    }
  };
}
var BERX_LOD_DISTANCE, BERX_WORLD_CLEAR, BERX_LABEL_HEIGHT, BERX_LABEL_FADE_START, BERX_LABEL_FADE_END, modelMatrix, radiusOf, distanceTo;
var init_drawList = __esm({
  "packages/spatial/src/drawList.ts"() {
    "use strict";
    init_actionRing();
    init_frustum();
    init_geometry();
    init_spatialInteraction();
    init_spatialPresentation();
    init_worldMaterials();
    init_worldLighting();
    BERX_LOD_DISTANCE = 18;
    BERX_WORLD_CLEAR = [7 / 255, 8 / 255, 10 / 255];
    BERX_LABEL_HEIGHT = 0.34;
    BERX_LABEL_FADE_START = 14;
    BERX_LABEL_FADE_END = 26;
    modelMatrix = (p, s, r) => {
      const cx = Math.cos(r.x);
      const sx = Math.sin(r.x);
      const cy = Math.cos(r.y);
      const sy = Math.sin(r.y);
      const cz = Math.cos(r.z);
      const sz = Math.sin(r.z);
      const m = new Array(16).fill(0);
      m[0] = cy * cz * s.x;
      m[1] = cy * sz * s.x;
      m[2] = -sy * s.x;
      m[4] = (sx * sy * cz - cx * sz) * s.y;
      m[5] = (sx * sy * sz + cx * cz) * s.y;
      m[6] = sx * cy * s.y;
      m[8] = (cx * sy * cz + sx * sz) * s.z;
      m[9] = (cx * sy * sz - sx * cz) * s.z;
      m[10] = cx * cy * s.z;
      m[12] = p.x;
      m[13] = p.y;
      m[14] = p.z;
      m[15] = 1;
      return m;
    };
    radiusOf = (o) => Math.max(o.transform.scale.x, o.transform.scale.y, o.transform.scale.z) * 0.75;
    distanceTo = (eye, o) => Math.hypot(o.transform.position.x - eye.x, o.transform.position.y - eye.y, o.transform.position.z - eye.z);
  }
});

// packages/spatial/src/launch/fullMax5DLaunchGate.ts
var init_fullMax5DLaunchGate = __esm({
  "packages/spatial/src/launch/fullMax5DLaunchGate.ts"() {
    "use strict";
  }
});

// packages/spatial/src/mediaSurface.ts
function createMediaSurface(object, media) {
  return {
    ...media,
    objectId: object.id,
    aspectRatio: media.aspectRatio > 0 ? media.aspectRatio : 1,
    opacity: Math.max(0, Math.min(1, media.opacity))
  };
}
var init_mediaSurface = __esm({
  "packages/spatial/src/mediaSurface.ts"() {
    "use strict";
  }
});

// packages/spatial/src/index.ts
var init_src = __esm({
  "packages/spatial/src/index.ts"() {
    "use strict";
    init_tokens();
    init_color();
    init_contract();
    init_atmosphere();
    init_materials();
    init_lighting();
    init_motion();
    init_performance();
    init_focus();
    init_typography();
    init_scene();
    init_temporal();
    init_relational();
    init_worldLighting();
    init_worldMaterials();
    init_spatialAudio();
    init_platform();
    init_platformTargets();
    init_worldApp();
    init_world();
    init_spatialCamera();
    init_runtime5d();
    init_runtimeAssertions();
    init_renderer();
    init_spatialInteraction();
    init_socialActions();
    init_spatialAffordances();
    init_actionRing();
    init_proximity();
    init_frustum();
    init_drawList();
    init_xrPose();
    init_fullMax5DLaunchGate();
    init_geometry();
    init_spatialPresentation();
    init_mediaSurface();
  }
});

// packages/spatial-web/src/primitiveGeometry.ts
function createBox(width = 1, height = 1, depth = 1) {
  const x = width / 2, y = height / 2, z = depth / 2;
  const v = [];
  const faces = [
    [-x, -y, z, x, -y, z, x, y, z, -x, y, z, 0, 0, 1],
    [x, -y, -z, -x, -y, -z, -x, y, -z, x, y, -z, 0, 0, -1],
    [-x, y, z, x, y, z, x, y, -z, -x, y, -z, 0, 1, 0],
    [-x, -y, -z, x, -y, -z, x, -y, z, -x, -y, z, 0, -1, 0],
    [x, -y, z, x, -y, -z, x, y, -z, x, y, z, 1, 0, 0],
    [-x, -y, -z, -x, -y, z, -x, y, z, -x, y, -z, -1, 0, 0]
  ];
  for (const f of faces) {
    for (let i = 0; i < 4; i++) push(v, f[i * 3], f[i * 3 + 1], f[i * 3 + 2], f[12], f[13], f[14]);
  }
  const q = [];
  for (let i = 0; i < 6; i++) {
    const o = i * 4;
    q.push(o, o + 1, o + 2, o, o + 2, o + 3);
  }
  return { vertices: new Float32Array(v), indices: new Uint16Array(q) };
}
function createSphere(radius = 1, segments = 24, rings = 16) {
  const v = [];
  const q = [];
  for (let y = 0; y <= rings; y++) {
    const py = y / rings * Math.PI;
    const sy = Math.cos(py), sr = Math.sin(py);
    for (let x = 0; x <= segments; x++) {
      const a = x / segments * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
      push(v, radius * sr * c, radius * sy, radius * sr * s, sr * c, sy, sr * s);
    }
  }
  for (let y = 0; y < rings; y++) for (let x = 0; x < segments; x++) {
    const a = y * (segments + 1) + x, b = a + 1, c = a + segments + 1, d = c + 1;
    q.push(a, b, c, b, d, c);
  }
  return { vertices: new Float32Array(v), indices: new Uint16Array(q) };
}
function createRing(outer = 1, inner = 0.72, segments = 48) {
  const v = [];
  const q = [];
  for (let i = 0; i < segments; i++) {
    const a = i / segments * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
    push(v, outer * c, outer * s, 0, 0, 0, 1);
    push(v, inner * c, inner * s, 0, 0, 0, 1);
  }
  const back = segments * 2;
  for (let i = 0; i < segments; i++) {
    const a = i / segments * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
    push(v, outer * c, outer * s, 0, 0, 0, -1);
    push(v, inner * c, inner * s, 0, 0, 0, -1);
  }
  for (let i = 0; i < segments; i++) {
    const n = (i + 1) % segments, a = i * 2, b = a + 1, c = n * 2, d = c + 1;
    q.push(a, c, b, b, c, d);
  }
  for (let i = 0; i < segments; i++) {
    const n = (i + 1) % segments, a = back + i * 2, b = a + 1, c = back + n * 2, d = c + 1;
    q.push(a, b, c, b, d, c);
  }
  return { vertices: new Float32Array(v), indices: new Uint16Array(q) };
}
function createFrame(width = 1, height = 1, bar = 0.12) {
  const parts = [createBox(width, bar, 0.12), createBox(width, bar, 0.12), createBox(bar, height, 0.12), createBox(bar, height, 0.12)];
  const v = [];
  const q = [];
  const poses = [[0, height / 2, 0], [0, -height / 2, 0], [-width / 2, 0, 0], [width / 2, 0, 0]];
  for (let p = 0; p < parts.length; p++) {
    const m = parts[p], base = v.length / 6, [ox, oy, oz] = poses[p];
    for (let i = 0; i < m.vertices.length; i += 6) push(v, m.vertices[i] + ox, m.vertices[i + 1] + oy, m.vertices[i + 2] + oz, m.vertices[i + 3], m.vertices[i + 4], m.vertices[i + 5]);
    for (const idx of m.indices) q.push(base + idx);
  }
  return { vertices: new Float32Array(v), indices: new Uint16Array(q) };
}
var push;
var init_primitiveGeometry = __esm({
  "packages/spatial-web/src/primitiveGeometry.ts"() {
    "use strict";
    push = (a, x, y, z, nx, ny, nz) => {
      a.push(x, y, z, nx, ny, nz);
    };
  }
});

// packages/spatial-web/src/mediaTextures.ts
function decode(uri) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`BERX 5D: media failed to load (${uri})`));
    image.src = uri;
  });
}
var DEFAULT_BUDGET, BerxMediaTextureCache;
var init_mediaTextures = __esm({
  "packages/spatial-web/src/mediaTextures.ts"() {
    "use strict";
    DEFAULT_BUDGET = 64;
    BerxMediaTextureCache = class {
      constructor(gl, options = {}) {
        this.loaded = /* @__PURE__ */ new Map();
        /** In flight, so a URI drawn every frame is requested once. */
        this.pending = /* @__PURE__ */ new Set();
        /** Failed, so a broken URL is not retried sixty times a second. */
        this.failed = /* @__PURE__ */ new Set();
        this.frame = 0;
        this.alive = true;
        this.gl = gl;
        this.budget = Math.max(1, options.budget ?? DEFAULT_BUDGET);
        this.onError = options.onError;
      }
      /** Called once per rendered frame, so eviction knows what is actually in use. */
      beginFrame() {
        this.frame++;
      }
      /**
       * The texture for a URI if it is resident, starting a load if it is
       * not. Returns undefined while loading and forever after a failure —
       * the caller draws the material colour, which is what an object with
       * no picture looks like.
       */
      get(uri) {
        const hit = this.loaded.get(uri);
        if (hit) {
          hit.lastUsedFrame = this.frame;
          return hit;
        }
        if (!this.pending.has(uri) && !this.failed.has(uri)) void this.load(uri);
        return void 0;
      }
      async load(uri) {
        this.pending.add(uri);
        try {
          const image = await decode(uri);
          if (!this.alive) return;
          const gl = this.gl;
          const texture = gl.createTexture();
          if (!texture) throw new Error("BERX 5D: texture allocation failed");
          gl.bindTexture(gl.TEXTURE_2D, texture);
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
          gl.generateMipmap(gl.TEXTURE_2D);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          const aniso = gl.getExtension("EXT_texture_filter_anisotropic");
          if (aniso) {
            const max = gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
            gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, max));
          }
          gl.bindTexture(gl.TEXTURE_2D, null);
          const height = image.height || 1;
          this.loaded.set(uri, { texture, aspectRatio: (image.width || 1) / height, lastUsedFrame: this.frame });
          this.evict();
        } catch (error) {
          this.failed.add(uri);
          this.onError?.(uri, error);
        } finally {
          this.pending.delete(uri);
        }
      }
      /**
       * Least recently drawn go first, down to the budget — and the budget
       * is met, not merely aimed at.
       *
       * Preferring to keep whatever is in the frame being composed is
       * right, and it cannot be absolute: with more textures visible at
       * once than the budget allows, every resident one is in use and
       * nothing is ever evictable, so the cap silently stops capping. The
       * budget exists to bound memory, so it wins: unused textures go
       * first, and if that is not enough the oldest in-use ones go too.
       * That thrashes — they reload next frame — which is the honest
       * symptom of a budget set below what the world is showing, and is
       * still preferable to unbounded GPU memory.
       */
      evict() {
        if (this.loaded.size <= this.budget) return;
        const byAge = [...this.loaded.entries()].sort((a, b) => a[1].lastUsedFrame - b[1].lastUsedFrame);
        const drop = (uri, entry) => {
          this.gl.deleteTexture(entry.texture);
          this.loaded.delete(uri);
        };
        for (const [uri, entry] of byAge) {
          if (this.loaded.size <= this.budget) return;
          if (entry.lastUsedFrame !== this.frame) drop(uri, entry);
        }
        for (const [uri, entry] of byAge) {
          if (this.loaded.size <= this.budget) return;
          if (this.loaded.has(uri)) drop(uri, entry);
        }
      }
      /** How many textures are resident. Real, for a host that reports budgets. */
      get residentCount() {
        return this.loaded.size;
      }
      /**
       * A lost context invalidates every handle. They are dropped rather
       * than deleted: calling into a dead context is undefined, and the
       * driver has already reclaimed the memory.
       */
      handleContextLost() {
        this.loaded.clear();
        this.pending.clear();
        this.failed.clear();
      }
      dispose() {
        this.alive = false;
        for (const entry of this.loaded.values()) this.gl.deleteTexture(entry.texture);
        this.loaded.clear();
        this.pending.clear();
        this.failed.clear();
      }
    };
  }
});

// packages/spatial-web/src/spatialText.ts
function berxRasteriseLabel(text, pixelHeight) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return void 0;
  const font = `500 ${pixelHeight}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  context.font = font;
  const clipped = text.length > 48 ? `${text.slice(0, 47)}\u2026` : text;
  const metrics = context.measureText(clipped);
  const padX = Math.ceil(pixelHeight * 0.35);
  const padY = Math.ceil(pixelHeight * 0.3);
  const width = Math.max(2, Math.ceil(metrics.width) + padX * 2);
  const height = pixelHeight + padY * 2;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return void 0;
  ctx.clearRect(0, 0, width, height);
  ctx.font = font;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.strokeStyle = "rgba(7,8,10,0.85)";
  ctx.lineWidth = Math.max(2, pixelHeight * 0.09);
  ctx.lineJoin = "round";
  ctx.strokeText(clipped, padX, height / 2);
  ctx.fillStyle = INK;
  ctx.fillText(clipped, padX, height / 2);
  return { canvas, aspect: width / height };
}
var DEFAULT_BUDGET2, DEFAULT_PIXEL_HEIGHT, INK, BerxSpatialTextAtlas;
var init_spatialText = __esm({
  "packages/spatial-web/src/spatialText.ts"() {
    "use strict";
    DEFAULT_BUDGET2 = 96;
    DEFAULT_PIXEL_HEIGHT = 64;
    INK = "#F2F0EB";
    BerxSpatialTextAtlas = class {
      constructor(gl, options = {}) {
        this.cache = /* @__PURE__ */ new Map();
        this.frame = 0;
        this.gl = gl;
        this.budget = Math.max(1, options.budget ?? DEFAULT_BUDGET2);
        this.pixelHeight = Math.max(16, options.pixelHeight ?? DEFAULT_PIXEL_HEIGHT);
      }
      beginFrame() {
        this.frame++;
      }
      /**
       * The texture for a label, rasterising it on first use.
       *
       * Synchronous: a 2D canvas draw of one line of text is a fraction
       * of a millisecond, and a label that appeared a frame late would
       * flicker every time the camera moved.
       */
      get(text) {
        const label = text.trim();
        if (label.length === 0) return void 0;
        const hit = this.cache.get(label);
        if (hit) {
          hit.lastUsedFrame = this.frame;
          return hit;
        }
        const raster = berxRasteriseLabel(label, this.pixelHeight);
        if (!raster) return void 0;
        const gl = this.gl;
        const texture = gl.createTexture();
        if (!texture) return void 0;
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, raster.canvas);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.bindTexture(gl.TEXTURE_2D, null);
        const entry = { texture, aspect: raster.aspect, lastUsedFrame: this.frame };
        this.cache.set(label, entry);
        this.evict();
        return entry;
      }
      /** Same rule as the media cache: the budget is met, not aimed at. */
      evict() {
        if (this.cache.size <= this.budget) return;
        const byAge = [...this.cache.entries()].sort((a, b) => a[1].lastUsedFrame - b[1].lastUsedFrame);
        for (const [key, entry] of byAge) {
          if (this.cache.size <= this.budget) return;
          if (entry.lastUsedFrame !== this.frame) {
            this.gl.deleteTexture(entry.texture);
            this.cache.delete(key);
          }
        }
        for (const [key, entry] of byAge) {
          if (this.cache.size <= this.budget) return;
          if (this.cache.has(key)) {
            this.gl.deleteTexture(entry.texture);
            this.cache.delete(key);
          }
        }
      }
      get residentCount() {
        return this.cache.size;
      }
      handleContextLost() {
        this.cache.clear();
      }
      dispose() {
        for (const entry of this.cache.values()) this.gl.deleteTexture(entry.texture);
        this.cache.clear();
      }
    };
  }
});

// packages/spatial-web/src/threeRuntime.ts
var threeRuntime_exports = {};
__export(threeRuntime_exports, {
  BerxThreeRuntimeRenderer: () => BerxThreeRuntimeRenderer
});
function shader(gl, t, s) {
  const x = gl.createShader(t);
  if (!x) throw Error("BERX 5D shader allocation failed");
  gl.shaderSource(x, s);
  gl.compileShader(x);
  if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) {
    const e = gl.getShaderInfoLog(x) || "shader error";
    gl.deleteShader(x);
    throw Error(e);
  }
  return x;
}
function program(gl, vs = V, fs = F) {
  const p = gl.createProgram();
  if (!p) throw Error("BERX 5D program allocation failed");
  const a = shader(gl, gl.VERTEX_SHADER, vs), b = shader(gl, gl.FRAGMENT_SHADER, fs);
  gl.attachShader(p, a);
  gl.attachShader(p, b);
  gl.linkProgram(p);
  gl.deleteShader(a);
  gl.deleteShader(b);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    const e = gl.getProgramInfoLog(p) || "program link error";
    gl.deleteProgram(p);
    throw Error(e);
  }
  return p;
}
function gpuMesh(gl, mesh) {
  const vao = gl.createVertexArray(), vbo = gl.createBuffer(), ibo = gl.createBuffer();
  if (!vao || !vbo || !ibo) throw Error("BERX 5D mesh allocation failed");
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, mesh.vertices, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW);
  gl.bindVertexArray(null);
  let halfX = 0, halfY = 0;
  for (let i = 0; i < mesh.vertices.length; i += 6) {
    halfX = Math.max(halfX, Math.abs(mesh.vertices[i]));
    halfY = Math.max(halfY, Math.abs(mesh.vertices[i + 1]));
  }
  return { vao, vbo, ibo, count: mesh.indices.length, halfX: halfX || 0.5, halfY: halfY || 0.5 };
}
function meshFor(kind, lod) {
  const far = lod === 1;
  switch (kind) {
    case "orb":
      return createSphere(0.5, far ? 10 : 24, far ? 7 : 16);
    case "ring":
      return createRing(0.62, 0.42, far ? 16 : 48);
    case "frame":
      return createFrame(1, 1, 0.12);
    case "surface":
      return createBox(1, 1, 0.06);
    case "portal":
      return createFrame(1, 1.2, 0.16);
    case "node":
      return createSphere(0.58, far ? 9 : 20, far ? 6 : 12);
    case "stack":
      return createBox(1, 1, 0.32);
    case "message":
      return createBox(1, 0.46, 0.12);
    case "create":
      return createSphere(0.58, far ? 11 : 28, far ? 7 : 18);
  }
}
var V, F, TV, TF, BerxThreeRuntimeRenderer;
var init_threeRuntime = __esm({
  "packages/spatial-web/src/threeRuntime.ts"() {
    "use strict";
    init_src();
    init_primitiveGeometry();
    init_mediaTextures();
    init_spatialText();
    V = `#version 300 es
precision highp float;layout(location=0)in vec3 p;layout(location=1)in vec3 n;uniform mat4 P,V,M;out vec3 N,W,L,LN;void main(){vec4 w=M*vec4(p,1.);W=w.xyz;N=mat3(M)*n;L=p;LN=n;gl_Position=P*V*w;}`;
    F = `#version 300 es
precision highp float;
in vec3 N,W,L,LN;
uniform vec3 CAM;                 // camera position, world space
uniform vec3 AMB;                 // ambient colour * intensity
uniform vec3 KEY_DIR, KEY_COL;    // directional key
uniform float KEY_I;
uniform vec3 PL_POS[4], PL_COL[4];
uniform float PL_I[4], PL_R[4];
uniform int PL_N;
uniform vec3 BASE, EMIT;
uniform float MET, ROUGH, OPAC, TRANS, HT;
uniform vec4 TS;
uniform sampler2D TEX;
out vec4 C;

const float PI = 3.14159265359;

// GGX / Trowbridge-Reitz normal distribution.
float D_GGX(float NoH, float a){ float a2=a*a; float d=NoH*NoH*(a2-1.)+1.; return a2/max(PI*d*d,1e-7); }
// Smith height-correlated visibility, already divided by 4*NoL*NoV.
float V_Smith(float NoV, float NoL, float a){
  float a2=a*a;
  float v=NoL*sqrt(NoV*NoV*(1.-a2)+a2);
  float l=NoV*sqrt(NoL*NoL*(1.-a2)+a2);
  return .5/max(v+l,1e-7);
}
vec3 F_Schlick(vec3 f0, float u){ float m=clamp(1.-u,0.,1.); float m2=m*m; return f0+(1.-f0)*(m2*m2*m); }

vec3 shade(vec3 n, vec3 v, vec3 l, vec3 radiance, vec3 diffuseColor, vec3 f0, float a){
  vec3 h=normalize(v+l);
  float NoL=max(dot(n,l),0.);
  if(NoL<=0.) return vec3(0.);
  float NoV=max(dot(n,v),1e-4);
  float NoH=max(dot(n,h),0.);
  float VoH=max(dot(v,h),0.);
  vec3 F=F_Schlick(f0,VoH);
  float Vis=V_Smith(NoV,NoL,a);
  float D=D_GGX(NoH,a);
  vec3 spec=F*(D*Vis);
  // energy that was not reflected is the only energy left to scatter
  vec3 kd=(1.-F);
  vec3 diff=kd*diffuseColor/PI;
  return (diff+spec)*radiance*NoL;
}

void main(){
  vec3 base=BASE;
  // media is a planar projection onto the face that points at you
  if(HT>.5 && normalize(LN).z>.5){
    vec2 uv=(L.xy/TS.xy)*.5*TS.zw+.5;
    if(uv.x>=0.&&uv.x<=1.&&uv.y>=0.&&uv.y<=1.) base=texture(TEX,uv).rgb;
  }
  vec3 n=normalize(N);
  vec3 v=normalize(CAM-W);
  float a=max(ROUGH*ROUGH,1e-3);
  // metals have no diffuse term and tint their reflection; dielectrics
  // reflect 4% white and keep their colour in the diffuse lobe
  vec3 diffuseColor=base*(1.-MET);
  vec3 f0=mix(vec3(.04),base,MET);

  vec3 lit=shade(n,v,normalize(KEY_DIR),KEY_COL*KEY_I,diffuseColor,f0,a);
  for(int i=0;i<4;i++){
    if(i>=PL_N) break;
    vec3 d=PL_POS[i]-W;
    float dist=length(d);
    if(dist>PL_R[i]) continue;
    // inverse-square, windowed so a light ends where its range says
    float win=clamp(1.-pow(dist/PL_R[i],4.),0.,1.);
    float atten=win*win/max(dist*dist,1e-4);
    lit+=shade(n,v,d/max(dist,1e-4),PL_COL[i]*PL_I[i]*atten,diffuseColor,f0,a);
  }
  // ambient stands in for the bounced room. It is not image-based
  // lighting and does not pretend to be: one term, applied to the
  // diffuse colour and to the grazing reflection.
  vec3 amb=AMB*(diffuseColor+f0*pow(1.-max(dot(n,v),0.),5.));
  vec3 colour=lit+amb+EMIT;
  // transmission lets the ground through a glass surface rather than
  // fading it to nothing
  float alpha=clamp(OPAC*(1.-TRANS*.55),.02,1.);
  C=vec4(colour,alpha);
}`;
    TV = `#version 300 es
precision highp float;layout(location=0)in vec2 q;uniform mat4 P,V;uniform vec3 C,R,U;uniform vec2 S;out vec2 T;void main(){T=q*.5+.5;vec3 w=C+R*(q.x*S.x)+U*(q.y*S.y);gl_Position=P*V*vec4(w,1.);}`;
    TF = `#version 300 es
precision highp float;in vec2 T;uniform sampler2D TEX;uniform float A;out vec4 C;void main(){vec4 t=texture(TEX,T);C=vec4(t.rgb,t.a*A);if(C.a<.01)discard;}`;
    BerxThreeRuntimeRenderer = class {
      constructor(canvas, options = {}) {
        this.kind = "webgl2";
        /* what this backend really does, and nothing it does not */
        this.capabilities = { perspective: true, depthBuffer: true, physicallyLitMaterials: true, shadows: false, postProcessing: false };
        this.meshes = /* @__PURE__ */ new Map();
        /** objectId -> the one media URI drawn on its face */
        this.media = /* @__PURE__ */ new Map();
        this.width = 1;
        this.height = 1;
        /** Metres tall a label stands. A real size in the world, not a screen size. */
        /** The world's standing light. Replaceable, so a region can relight itself. */
        this.lighting = berxWorldLighting();
        /**
         * What can be done with what is in focus.
         *
         * Set by the host each frame from the world. Empty when nothing is
         * focused, which is when no ring is drawn — there is no toolbar.
         */
        this.affordances = [];
        /** Where the ring stood last frame, so a tap can be tested against it. */
        this.slots = [];
        /** What the last frame actually cost. Measured during the draw. */
        this.stats = { visible: 0, inFrustum: 0, drawCalls: 0, triangles: 0, lodReduced: 0, budgetCut: 0, residentTextures: 0, residentLabels: 0, meshVariants: 0 };
        const gl = canvas.getContext("webgl2", { antialias: true, alpha: false, depth: true, powerPreference: "high-performance" });
        if (!gl) throw Error("BERX 5D requires WebGL2");
        this.gl = gl;
        this.program = program(gl);
        this.P = gl.getUniformLocation(this.program, "P");
        this.V = gl.getUniformLocation(this.program, "V");
        this.M = gl.getUniformLocation(this.program, "M");
        this.BASE = gl.getUniformLocation(this.program, "BASE");
        this.EMIT = gl.getUniformLocation(this.program, "EMIT");
        this.CAM = gl.getUniformLocation(this.program, "CAM");
        this.AMB = gl.getUniformLocation(this.program, "AMB");
        this.KEY_DIR = gl.getUniformLocation(this.program, "KEY_DIR");
        this.KEY_COL = gl.getUniformLocation(this.program, "KEY_COL");
        this.KEY_I = gl.getUniformLocation(this.program, "KEY_I");
        this.PL_POS = gl.getUniformLocation(this.program, "PL_POS");
        this.PL_COL = gl.getUniformLocation(this.program, "PL_COL");
        this.PL_I = gl.getUniformLocation(this.program, "PL_I");
        this.PL_R = gl.getUniformLocation(this.program, "PL_R");
        this.PL_N = gl.getUniformLocation(this.program, "PL_N");
        this.MET = gl.getUniformLocation(this.program, "MET");
        this.ROUGH = gl.getUniformLocation(this.program, "ROUGH");
        this.OPAC = gl.getUniformLocation(this.program, "OPAC");
        this.TRANS = gl.getUniformLocation(this.program, "TRANS");
        this.HT = gl.getUniformLocation(this.program, "HT");
        this.TS = gl.getUniformLocation(this.program, "TS");
        this.TEX = gl.getUniformLocation(this.program, "TEX");
        this.textures = new BerxMediaTextureCache(gl, { budget: options.textureBudget, onError: options.onMediaError });
        this.labels = new BerxSpatialTextAtlas(gl, { budget: options.labelBudget });
        this.labelProgram = program(gl, TV, TF);
        this.LP = gl.getUniformLocation(this.labelProgram, "P");
        this.LV = gl.getUniformLocation(this.labelProgram, "V");
        this.LC = gl.getUniformLocation(this.labelProgram, "C");
        this.LR = gl.getUniformLocation(this.labelProgram, "R");
        this.LU = gl.getUniformLocation(this.labelProgram, "U");
        this.LS = gl.getUniformLocation(this.labelProgram, "S");
        this.LA = gl.getUniformLocation(this.labelProgram, "A");
        this.LT = gl.getUniformLocation(this.labelProgram, "TEX");
        {
          const vao = gl.createVertexArray(), vbo = gl.createBuffer();
          if (!vao || !vbo) throw Error("BERX 5D label quad allocation failed");
          gl.bindVertexArray(vao);
          gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1]), gl.STATIC_DRAW);
          gl.enableVertexAttribArray(0);
          gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0);
          gl.bindVertexArray(null);
          this.labelQuad = { vao, vbo };
        }
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      }
      resize(w, h) {
        this.width = Math.max(1, w);
        this.height = Math.max(1, h);
        this.gl.viewport(0, 0, this.width, this.height);
      }
      getMesh(kind, lod) {
        const key = `${kind}:${lod}`;
        let m = this.meshes.get(key);
        if (!m) {
          m = gpuMesh(this.gl, meshFor(kind, lod));
          this.meshes.set(key, m);
        }
        return m;
      }
      /**
      * Draw the world. With `stereo`, draw it twice into two viewports —
      * the same objects, the same lights, the same budget, from two
      * cameras a real interpupillary distance apart.
      */
      render(frame, options = {}) {
        const gl = this.gl;
        if (options.stereo) {
          const basis = cameraBasis(frame.camera);
          const half = Math.max(1, Math.floor(this.width / 2));
          const shift = (sign) => {
            if (!basis) return frame;
            const o = options.stereo.ipd * 0.5 * sign;
            return { ...frame, camera: {
              ...frame.camera,
              position: { x: frame.camera.position.x + basis.right.x * o, y: frame.camera.position.y + basis.right.y * o, z: frame.camera.position.z + basis.right.z * o },
              target: { x: frame.camera.target.x + basis.right.x * o, y: frame.camera.target.y + basis.right.y * o, z: frame.camera.target.z + basis.right.z * o }
            } };
          };
          gl.viewport(0, 0, this.width, this.height);
          gl.clearColor(BERX_WORLD_CLEAR[0], BERX_WORLD_CLEAR[1], BERX_WORLD_CLEAR[2], 1);
          gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
          let calls = 0, tris = 0, lod = 0, frustum = 0, budget = 0, visibleCount = 0;
          for (const [index, eye] of [shift(-1), shift(1)].entries()) {
            gl.viewport(index * half, 0, half, this.height);
            this.drawEye(eye, options, half, this.height, false);
            calls += this.stats.drawCalls;
            tris += this.stats.triangles;
            lod += this.stats.lodReduced;
            frustum += this.stats.inFrustum;
            budget += this.stats.budgetCut;
            visibleCount = this.stats.visible;
          }
          gl.viewport(0, 0, this.width, this.height);
          this.stats = { ...this.stats, visible: visibleCount, inFrustum: frustum, drawCalls: calls, triangles: tris, lodReduced: lod, budgetCut: budget };
          return;
        }
        gl.viewport(0, 0, this.width, this.height);
        this.drawEye(frame, options, this.width, this.height, true);
      }
      drawEye(frame, options, width, height, clear) {
        const gl = this.gl;
        gl.useProgram(this.program);
        const list = berxBuildDrawList(frame, {
          width,
          height,
          maxObjects: options.maxObjects,
          ambientMotion: options.ambientMotion,
          lighting: this.lighting,
          mediaFor: (id) => this.media.get(id),
          affordances: this.affordances
        });
        if (clear) {
          gl.clearColor(list.clearColor[0], list.clearColor[1], list.clearColor[2], 1);
          gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        }
        gl.uniformMatrix4fv(this.P, false, new Float32Array(list.projection));
        gl.uniformMatrix4fv(this.V, false, new Float32Array(list.view));
        this.textures.beginFrame();
        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(this.TEX, 0);
        gl.uniform3f(this.CAM, list.camera.x, list.camera.y, list.camera.z);
        gl.uniform3f(this.AMB, list.ambient[0], list.ambient[1], list.ambient[2]);
        gl.uniform3f(this.KEY_DIR, list.key.direction.x, list.key.direction.y, list.key.direction.z);
        gl.uniform3f(this.KEY_COL, list.key.colour[0], list.key.colour[1], list.key.colour[2]);
        gl.uniform1f(this.KEY_I, list.key.intensity);
        let drawCalls = 0, triangles = 0;
        for (const item of list.items) {
          const mesh = this.getMesh(item.primitive, item.lod);
          gl.bindVertexArray(mesh.vao);
          gl.uniformMatrix4fv(this.M, false, new Float32Array(item.model));
          gl.uniform3f(this.BASE, item.base[0], item.base[1], item.base[2]);
          gl.uniform3f(this.EMIT, item.emissive[0], item.emissive[1], item.emissive[2]);
          gl.uniform1f(this.MET, item.metalness);
          gl.uniform1f(this.ROUGH, item.roughness);
          gl.uniform1f(this.OPAC, item.opacity);
          gl.uniform1f(this.TRANS, item.transmission);
          const near = item.pointLights;
          gl.uniform1i(this.PL_N, near.length);
          if (near.length > 0) {
            const pos = new Float32Array(BERX_MAX_POINT_LIGHTS * 3), col = new Float32Array(BERX_MAX_POINT_LIGHTS * 3), ints = new Float32Array(BERX_MAX_POINT_LIGHTS), ranges = new Float32Array(BERX_MAX_POINT_LIGHTS);
            near.forEach((light, i) => {
              pos[i * 3] = light.position.x;
              pos[i * 3 + 1] = light.position.y;
              pos[i * 3 + 2] = light.position.z;
              col[i * 3] = light.colour[0];
              col[i * 3 + 1] = light.colour[1];
              col[i * 3 + 2] = light.colour[2];
              ints[i] = light.intensity;
              ranges[i] = light.range;
            });
            gl.uniform3fv(this.PL_POS, pos);
            gl.uniform3fv(this.PL_COL, col);
            gl.uniform1fv(this.PL_I, ints);
            gl.uniform1fv(this.PL_R, ranges);
          }
          const loaded = item.media ? this.textures.get(item.media) : void 0;
          if (loaded) {
            gl.bindTexture(gl.TEXTURE_2D, loaded.texture);
            gl.uniform1f(this.HT, 1);
            const face = mesh.halfX / mesh.halfY, fit = loaded.aspectRatio / face;
            gl.uniform4f(this.TS, mesh.halfX, mesh.halfY, fit > 1 ? 1 / fit : 1, fit > 1 ? 1 : fit);
          } else gl.uniform1f(this.HT, 0);
          gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_SHORT, 0);
          drawCalls++;
          triangles += mesh.count / 3;
        }
        gl.bindVertexArray(null);
        gl.bindTexture(gl.TEXTURE_2D, null);
        const labelCalls = this.renderLabels(list);
        this.stats = {
          visible: list.stats.visible,
          inFrustum: list.stats.inFrustum,
          drawCalls: drawCalls + labelCalls,
          triangles,
          lodReduced: list.stats.lodReduced,
          budgetCut: list.stats.budgetCut,
          residentTextures: this.textures.residentCount,
          residentLabels: this.labels.residentCount,
          meshVariants: this.meshes.size
        };
      }
      /**
       * The names, standing where their entities stand.
       *
       * One camera-facing quad each, drawn after the world so the depth
       * buffer already holds everything solid: a label behind a place is
       * hidden by it, exactly as a sign behind a building would be. Depth
       * writes are off so labels never occlude each other into flicker, and
       * they are drawn far-to-near so the ones in front composite over the
       * ones behind.
       *
       * They fade with distance rather than growing to stay readable. A
       * label that keeps its screen size is a HUD; this is a world.
       */
      renderLabels(list) {
        const gl = this.gl;
        const basis = list.basis;
        if (!basis) return 0;
        let calls = 0;
        this.labels.beginFrame();
        gl.useProgram(this.labelProgram);
        gl.bindVertexArray(this.labelQuad.vao);
        gl.depthMask(false);
        gl.disable(gl.CULL_FACE);
        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(this.LT, 0);
        gl.uniformMatrix4fv(this.LP, false, new Float32Array(list.projection));
        gl.uniformMatrix4fv(this.LV, false, new Float32Array(list.view));
        gl.uniform3f(this.LR, basis.right.x, basis.right.y, basis.right.z);
        gl.uniform3f(this.LU, basis.up.x, basis.up.y, basis.up.z);
        for (const placement of list.labels) {
          const entry = this.labels.get(placement.text);
          if (!entry) continue;
          gl.bindTexture(gl.TEXTURE_2D, entry.texture);
          gl.uniform3f(this.LC, placement.position.x, placement.position.y, placement.position.z);
          gl.uniform2f(this.LS, placement.halfHeight * entry.aspect, placement.halfHeight);
          gl.uniform1f(this.LA, placement.alpha);
          gl.drawArrays(gl.TRIANGLES, 0, 6);
          calls++;
        }
        this.slots = list.actionSlots;
        for (const slot of this.slots) {
          const entry = this.labels.get(slot.affordance.label);
          if (!entry) continue;
          gl.bindTexture(gl.TEXTURE_2D, entry.texture);
          gl.uniform3f(this.LC, slot.position.x, slot.position.y, slot.position.z);
          gl.uniform2f(this.LS, slot.halfHeight * entry.aspect, slot.halfHeight);
          gl.uniform1f(this.LA, 1);
          gl.drawArrays(gl.TRIANGLES, 0, 6);
          calls++;
        }
        gl.depthMask(true);
        gl.enable(gl.CULL_FACE);
        gl.bindVertexArray(null);
        gl.bindTexture(gl.TEXTURE_2D, null);
        return calls;
      }
      /** How many label textures are resident. Real, for a host reporting budgets. */
      get residentLabelCount() {
        return this.labels.residentCount;
      }
      /** The actions to offer beside whatever is focused. */
      setAffordances(affordances) {
        this.affordances = affordances;
      }
      /** Where the ring stood in the last drawn frame. */
      get actionSlots() {
        return this.slots;
      }
      /** Relight the world. Lights are state, not constants baked into a shader. */
      setLighting(lighting) {
        this.lighting = lighting;
      }
      get worldLighting() {
        return this.lighting;
      }
      /** What the last frame actually cost. Read it, do not estimate it. */
      get frameStats() {
        return { ...this.stats };
      }
      /**
       * The media an object carries, from the mapping layer.
       *
       * One picture per object: these forms have one face that points at
       * the viewer, and a second image on it would have nowhere to go.
       * Passing no surfaces removes whatever was there — the object returns
       * to its material colour rather than keeping a stale photograph.
       */
      setObjectMedia(objectId, surfaces) {
        const first = surfaces[0]?.uri;
        if (first) this.media.set(objectId, first);
        else this.media.delete(objectId);
      }
      /** Everything the world no longer holds stops being drawn or cached. */
      forgetObjectMedia(objectId) {
        this.media.delete(objectId);
      }
      /** How many textures are resident. Real, for a host that reports budgets. */
      get residentTextureCount() {
        return this.textures.residentCount;
      }
      /** `x`/`y` are in backing-store pixels, the same space the frame was drawn in. */
      pick(frame, x, y) {
        const ray = rayFromNdc(frame.camera, x / this.width * 2 - 1, 1 - y / this.height * 2, this.width / this.height);
        return ray ? pickSpatialObject(ray, frame.world.objects) : void 0;
      }
      /**
       * Deleting the objects is not the same as giving the GPU its memory
       * back: the context itself holds the driver allocation, and a page
       * that mounts and unmounts worlds leaks one per mount without this.
       * WEBGL_lose_context is the only way to ask for it, and it is
       * optional — where the extension is absent the deletes above are all
       * there is, which is honest rather than silent.
       */
      dispose() {
        const gl = this.gl;
        this.releaseMeshes();
        this.textures.dispose();
        this.labels.dispose();
        this.media.clear();
        gl.deleteProgram(this.program);
        gl.getExtension("WEBGL_lose_context")?.loseContext();
      }
      releaseMeshes() {
        const gl = this.gl;
        for (const m of this.meshes.values()) {
          gl.deleteBuffer(m.vbo);
          gl.deleteBuffer(m.ibo);
          gl.deleteVertexArray(m.vao);
        }
        this.meshes.clear();
      }
      /**
       * A lost context invalidates every name this renderer holds. The map
       * is cleared so the next frame rebuilds its meshes instead of binding
       * handles the driver no longer knows; deleting them here would be
       * calling into a dead context.
       */
      handleContextLost() {
        this.meshes.clear();
        this.textures.handleContextLost();
        this.labels.handleContextLost();
      }
    };
  }
});

// packages/spatial-shaders/src/index.ts
var BERX_WORLD_WGSL, BERX_LABEL_WGSL;
var init_src2 = __esm({
  "packages/spatial-shaders/src/index.ts"() {
    "use strict";
    BERX_WORLD_WGSL = "// The BERX forward pass, in WGSL. This file is the only copy of it.\n//\n// Two backends run this exact text: @berx/spatial-web's WebGPU renderer,\n// which imports it through @berx/spatial-shaders, and the native\n// berx-spatial-native crate, which include_str!s it. A shader duplicated\n// per backend is how two renderers quietly stop drawing the same world.\n//\n// The same microfacet BRDF the WebGL2 backend runs: GGX, height-correlated\n// Smith visibility, Schlick Fresnel, metalness splitting the diffuse and\n// specular lobes, one directional key, up to four windowed point lights, and\n// an ambient term that stands in for the bounced room without pretending to\n// be image-based lighting. There is no shadow map and no post chain here,\n// and both backends' reported capabilities say so.\n//\n// One thing differs from the GLSL source, and it is a clip-space convention\n// rather than shading: WGSL depth runs 0..1 where GL runs -1..1, so the host\n// hands this shader a projection already remapped.\n//\n// Media is a planar projection onto the face that points at you, exactly as\n// in the GLSL pass: object-space position and normal give the UVs from the\n// local XY extent, and the texture is applied only where the surface faces\n// +Z, so an avatar on an orb reads as a face rather than as a photograph\n// smeared around a ball. A backend with no image to bind binds a 1x1 texture\n// and leaves the flag at zero; nothing is approximated with a colour.\n\nstruct Globals {\n  proj: mat4x4<f32>,\n  view: mat4x4<f32>,\n  camera: vec4<f32>,\n  ambient: vec4<f32>,\n  key_dir: vec4<f32>,\n  key_col: vec4<f32>,   // rgb, intensity in w\n};\n\nstruct Draw {\n  model: mat4x4<f32>,\n  base: vec4<f32>,              // rgb base colour, w = local half-extent in X\n  emissive: vec4<f32>,          // rgb emission,    w = local half-extent in Y\n  surface: vec4<f32>,           // metalness, roughness, opacity, transmission\n  pl_pos: array<vec4<f32>, 4>,  // xyz position, w range\n  pl_col: array<vec4<f32>, 4>,  // rgb colour, w intensity\n  // x = point light count, yz = UV cover/contain correction, w = has texture\n  counts: vec4<f32>,\n};\n\n@group(0) @binding(0) var<uniform> g: Globals;\n@group(1) @binding(0) var<uniform> d: Draw;\n@group(2) @binding(0) var media_sampler: sampler;\n@group(2) @binding(1) var media_texture: texture_2d<f32>;\n\nstruct VsOut {\n  @builtin(position) clip: vec4<f32>,\n  @location(0) n: vec3<f32>,\n  @location(1) w: vec3<f32>,\n  // object space, so media projects onto the form rather than the screen\n  @location(2) local: vec3<f32>,\n  @location(3) local_n: vec3<f32>,\n};\n\n@vertex\nfn vs(@location(0) p: vec3<f32>, @location(1) n: vec3<f32>) -> VsOut {\n  var o: VsOut;\n  let w = d.model * vec4<f32>(p, 1.0);\n  o.w = w.xyz;\n  o.n = (mat3x3<f32>(d.model[0].xyz, d.model[1].xyz, d.model[2].xyz)) * n;\n  o.local = p;\n  o.local_n = n;\n  o.clip = g.proj * g.view * w;\n  return o;\n}\n\nconst PI: f32 = 3.14159265359;\n\nfn d_ggx(noh: f32, a: f32) -> f32 {\n  let a2 = a * a;\n  let den = noh * noh * (a2 - 1.0) + 1.0;\n  return a2 / max(PI * den * den, 1e-7);\n}\n\nfn v_smith(nov: f32, nol: f32, a: f32) -> f32 {\n  let a2 = a * a;\n  let v = nol * sqrt(nov * nov * (1.0 - a2) + a2);\n  let l = nov * sqrt(nol * nol * (1.0 - a2) + a2);\n  return 0.5 / max(v + l, 1e-7);\n}\n\nfn f_schlick(f0: vec3<f32>, u: f32) -> vec3<f32> {\n  let m = clamp(1.0 - u, 0.0, 1.0);\n  let m2 = m * m;\n  return f0 + (vec3<f32>(1.0) - f0) * (m2 * m2 * m);\n}\n\nfn shade(n: vec3<f32>, v: vec3<f32>, l: vec3<f32>, radiance: vec3<f32>,\n         diffuse_color: vec3<f32>, f0: vec3<f32>, a: f32) -> vec3<f32> {\n  let h = normalize(v + l);\n  let nol = max(dot(n, l), 0.0);\n  if (nol <= 0.0) { return vec3<f32>(0.0); }\n  let nov = max(dot(n, v), 1e-4);\n  let noh = max(dot(n, h), 0.0);\n  let voh = max(dot(v, h), 0.0);\n  let f = f_schlick(f0, voh);\n  let vis = v_smith(nov, nol, a);\n  let dist = d_ggx(noh, a);\n  let spec = f * (dist * vis);\n  // energy that was not reflected is the only energy left to scatter\n  let kd = vec3<f32>(1.0) - f;\n  let diff = kd * diffuse_color / PI;\n  return (diff + spec) * radiance * nol;\n}\n\n@fragment\nfn fs(i: VsOut) -> @location(0) vec4<f32> {\n  // Media is a planar projection onto the face that points at you.\n  //\n  // The sample is taken unconditionally and then selected, rather than\n  // taken inside the test: textureSample needs uniform control flow, and\n  // whether a fragment is on the front face and inside the picture is a\n  // per-fragment fact. A backend with nothing to show binds a 1x1\n  // texture and leaves counts.w at zero, so the sample is discarded.\n  let half_extent = vec2<f32>(max(d.base.w, 1e-4), max(d.emissive.w, 1e-4));\n  let uv = (i.local.xy / half_extent) * 0.5 * d.counts.yz + vec2<f32>(0.5);\n  let sampled = textureSample(media_texture, media_sampler, vec2<f32>(uv.x, 1.0 - uv.y)).rgb;\n  let inside = uv.x >= 0.0 && uv.x <= 1.0 && uv.y >= 0.0 && uv.y <= 1.0;\n  let facing = normalize(i.local_n).z > 0.5;\n  let base = select(d.base.rgb, sampled, d.counts.w > 0.5 && facing && inside);\n  let n = normalize(i.n);\n  let v = normalize(g.camera.xyz - i.w);\n  let a = max(d.surface.y * d.surface.y, 1e-3);\n  // metals have no diffuse term and tint their reflection; dielectrics\n  // reflect 4% white and keep their colour in the diffuse lobe\n  let diffuse_color = base * (1.0 - d.surface.x);\n  let f0 = mix(vec3<f32>(0.04), base, vec3<f32>(d.surface.x));\n\n  var lit = shade(n, v, normalize(g.key_dir.xyz), g.key_col.rgb * g.key_col.w, diffuse_color, f0, a);\n\n  let count = i32(d.counts.x);\n  for (var k: i32 = 0; k < 4; k = k + 1) {\n    if (k >= count) { break; }\n    let lp = d.pl_pos[k];\n    let lc = d.pl_col[k];\n    let delta = lp.xyz - i.w;\n    let dist = length(delta);\n    if (dist > lp.w) { continue; }\n    // inverse-square, windowed so a light ends where its range says\n    let win = clamp(1.0 - pow(dist / lp.w, 4.0), 0.0, 1.0);\n    let atten = win * win / max(dist * dist, 1e-4);\n    lit = lit + shade(n, v, delta / max(dist, 1e-4), lc.rgb * lc.w * atten, diffuse_color, f0, a);\n  }\n\n  let amb = g.ambient.rgb * (diffuse_color + f0 * pow(1.0 - max(dot(n, v), 0.0), 5.0));\n  let colour = lit + amb + d.emissive.rgb;\n  // transmission lets the ground through a glass surface rather than\n  // fading it to nothing\n  let alpha = clamp(d.surface.z * (1.0 - d.surface.w * 0.55), 0.02, 1.0);\n  return vec4<f32>(colour, alpha);\n}\n";
    BERX_LABEL_WGSL = "// Names standing in the world, in WGSL. This file is the only copy of it.\n//\n// Unlit on purpose: a name is not a surface in the room, it is a name, and\n// shading it would make it dimmer the further it turned from the key light \u2014\n// the opposite of what a label is for. It is still real geometry, at a real\n// world position with a real height in metres, and depth-tested, so anything\n// in front of it hides it.\n//\n// The quad turns to face the camera by being built from the camera's own\n// right and up vectors, which the shared core hands over with the label's\n// position. Nothing here decides where a name goes.\n\nstruct LabelGlobals {\n  proj: mat4x4<f32>,\n  view: mat4x4<f32>,\n  right: vec4<f32>,\n  up: vec4<f32>,\n};\n\nstruct Label {\n  // xyz world centre, w unused\n  centre: vec4<f32>,\n  // xy half-extent in metres, z alpha, w unused\n  size: vec4<f32>,\n};\n\n@group(0) @binding(0) var<uniform> g: LabelGlobals;\n@group(1) @binding(0) var<uniform> l: Label;\n@group(2) @binding(0) var glyph_sampler: sampler;\n@group(2) @binding(1) var glyph_texture: texture_2d<f32>;\n\nstruct VsOut {\n  @builtin(position) clip: vec4<f32>,\n  @location(0) uv: vec2<f32>,\n};\n\n@vertex\nfn vs(@builtin(vertex_index) v: u32) -> VsOut {\n  // two triangles, as a quad in the camera's plane\n  var corners = array<vec2<f32>, 6>(\n    vec2<f32>(-1.0, -1.0), vec2<f32>(1.0, -1.0), vec2<f32>(1.0, 1.0),\n    vec2<f32>(-1.0, -1.0), vec2<f32>(1.0, 1.0), vec2<f32>(-1.0, 1.0),\n  );\n  let q = corners[v];\n  var o: VsOut;\n  // the rasterised glyphs run top row first, so V is flipped here rather\n  // than in the upload \u2014 writeTexture has no flip of its own\n  o.uv = vec2<f32>(q.x * 0.5 + 0.5, 0.5 - q.y * 0.5);\n  let w = l.centre.xyz + g.right.xyz * (q.x * l.size.x) + g.up.xyz * (q.y * l.size.y);\n  o.clip = g.proj * g.view * vec4<f32>(w, 1.0);\n  return o;\n}\n\n@fragment\nfn fs(i: VsOut) -> @location(0) vec4<f32> {\n  let t = textureSample(glyph_texture, glyph_sampler, i.uv);\n  let a = t.a * l.size.z;\n  if (a < 0.01) { discard; }\n  return vec4<f32>(t.rgb, a);\n}\n";
  }
});

// packages/spatial-web/src/webgpuMipmaps.ts
function berxMipLevelCount(width, height) {
  return Math.floor(Math.log2(Math.max(1, Math.max(width, height)))) + 1;
}
function berxBuildMipChain(source, width, height) {
  const levels = [{ width, height, data: new Uint8Array(source) }];
  let w = width;
  let h = height;
  let previous = levels[0].data;
  while (w > 1 || h > 1) {
    const nw = Math.max(1, w >> 1);
    const nh = Math.max(1, h >> 1);
    const next = new Uint8Array(nw * nh * 4);
    for (let y = 0; y < nh; y++) {
      for (let x = 0; x < nw; x++) {
        let r = 0, g = 0, b = 0, a = 0, weight = 0;
        for (let dy = 0; dy < 2; dy++) {
          for (let dx = 0; dx < 2; dx++) {
            const sx = Math.min(w - 1, x * 2 + dx);
            const sy = Math.min(h - 1, y * 2 + dy);
            const i = (sy * w + sx) * 4;
            const alpha = previous[i + 3];
            r += previous[i] * alpha;
            g += previous[i + 1] * alpha;
            b += previous[i + 2] * alpha;
            a += alpha;
            weight += alpha;
          }
        }
        const o = (y * nw + x) * 4;
        next[o] = weight > 0 ? Math.round(r / weight) : previous[(Math.min(h - 1, y * 2) * w + Math.min(w - 1, x * 2)) * 4];
        next[o + 1] = weight > 0 ? Math.round(g / weight) : previous[(Math.min(h - 1, y * 2) * w + Math.min(w - 1, x * 2)) * 4 + 1];
        next[o + 2] = weight > 0 ? Math.round(b / weight) : previous[(Math.min(h - 1, y * 2) * w + Math.min(w - 1, x * 2)) * 4 + 2];
        next[o + 3] = Math.round(a / 4);
      }
    }
    levels.push({ width: nw, height: nh, data: next });
    previous = next;
    w = nw;
    h = nh;
  }
  return levels;
}
function berxWriteMipChain(device, texture, levels) {
  levels.forEach((level, mipLevel) => {
    device.queue.writeTexture(
      { texture, mipLevel },
      level.data,
      { bytesPerRow: level.width * 4, rowsPerImage: level.height },
      { width: level.width, height: level.height }
    );
  });
}
var init_webgpuMipmaps = __esm({
  "packages/spatial-web/src/webgpuMipmaps.ts"() {
    "use strict";
  }
});

// packages/spatial-web/src/webgpuMediaTextures.ts
async function decodeToPixels(uri) {
  const image = await new Promise((resolve, reject) => {
    const element = new Image();
    element.crossOrigin = "anonymous";
    element.decoding = "async";
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error(`BERX 5D: media failed to load (${uri})`));
    element.src = uri;
  });
  const width = Math.max(1, image.naturalWidth || image.width);
  const height = Math.max(1, image.naturalHeight || image.height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("BERX 5D: no 2D context to read media pixels through");
  ctx.drawImage(image, 0, 0);
  return { width, height, data: ctx.getImageData(0, 0, width, height).data };
}
var DEFAULT_BUDGET3, BerxWebGPUMediaTextures;
var init_webgpuMediaTextures = __esm({
  "packages/spatial-web/src/webgpuMediaTextures.ts"() {
    "use strict";
    init_webgpuMipmaps();
    DEFAULT_BUDGET3 = 64;
    BerxWebGPUMediaTextures = class {
      constructor(device, options = {}) {
        this.device = device;
        this.loaded = /* @__PURE__ */ new Map();
        this.pending = /* @__PURE__ */ new Set();
        this.failed = /* @__PURE__ */ new Set();
        this.frame = 0;
        this.alive = true;
        this.budget = Math.max(1, options.budget ?? DEFAULT_BUDGET3);
        this.onError = options.onError;
      }
      beginFrame() {
        this.frame++;
      }
      /**
       * The texture for a URI if it is resident, starting a load if it is
       * not. Undefined while loading and forever after a failure — the
       * caller draws the material colour, which is what an object with no
       * picture looks like.
       */
      get(uri) {
        const hit = this.loaded.get(uri);
        if (hit) {
          hit.lastUsedFrame = this.frame;
          return hit;
        }
        if (!this.pending.has(uri) && !this.failed.has(uri)) void this.load(uri);
        return void 0;
      }
      async load(uri) {
        this.pending.add(uri);
        try {
          const pixels = await decodeToPixels(uri);
          if (!this.alive) return;
          const texture = this.device.createTexture({
            size: { width: pixels.width, height: pixels.height },
            format: "rgba8unorm",
            mipLevelCount: berxMipLevelCount(pixels.width, pixels.height),
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
          });
          berxWriteMipChain(this.device, texture, berxBuildMipChain(pixels.data, pixels.width, pixels.height));
          this.loaded.set(uri, {
            texture,
            view: texture.createView(),
            aspectRatio: pixels.width / Math.max(1, pixels.height),
            lastUsedFrame: this.frame
          });
          this.evict();
        } catch (error) {
          this.failed.add(uri);
          this.onError?.(uri, error);
        } finally {
          this.pending.delete(uri);
        }
      }
      /**
       * Least recently drawn go first, down to the budget — and the budget
       * is met, not merely aimed at. With more textures visible at once
       * than the budget allows, the oldest in-use ones go too: that
       * thrashes, which is the honest symptom of a budget set below what
       * the world is showing, and is still preferable to unbounded GPU
       * memory.
       */
      evict() {
        if (this.loaded.size <= this.budget) return;
        const byAge = [...this.loaded.entries()].sort((a, b) => a[1].lastUsedFrame - b[1].lastUsedFrame);
        const drop = (uri, entry) => {
          entry.texture.destroy();
          this.loaded.delete(uri);
        };
        for (const [uri, entry] of byAge) {
          if (this.loaded.size <= this.budget) return;
          if (entry.lastUsedFrame !== this.frame) drop(uri, entry);
        }
        for (const [uri, entry] of byAge) {
          if (this.loaded.size <= this.budget) return;
          if (this.loaded.has(uri)) drop(uri, entry);
        }
      }
      get residentCount() {
        return this.loaded.size;
      }
      dispose() {
        this.alive = false;
        for (const entry of this.loaded.values()) entry.texture.destroy();
        this.loaded.clear();
        this.pending.clear();
        this.failed.clear();
      }
    };
  }
});

// packages/spatial-web/src/webgpuText.ts
var DEFAULT_BUDGET4, DEFAULT_PIXEL_HEIGHT2, BerxWebGPUTextAtlas;
var init_webgpuText = __esm({
  "packages/spatial-web/src/webgpuText.ts"() {
    "use strict";
    init_spatialText();
    init_webgpuMipmaps();
    DEFAULT_BUDGET4 = 96;
    DEFAULT_PIXEL_HEIGHT2 = 64;
    BerxWebGPUTextAtlas = class {
      constructor(device, options = {}) {
        this.device = device;
        this.cache = /* @__PURE__ */ new Map();
        this.frame = 0;
        this.budget = Math.max(1, options.budget ?? DEFAULT_BUDGET4);
        this.pixelHeight = Math.max(16, options.pixelHeight ?? DEFAULT_PIXEL_HEIGHT2);
      }
      beginFrame() {
        this.frame++;
      }
      /**
       * The texture for a label, rasterising it on first use.
       *
       * Synchronous, like the WebGL2 atlas: one line of text on a 2D
       * canvas is a fraction of a millisecond, and a name that appeared a
       * frame late would flicker every time the camera moved.
       */
      get(text) {
        const label = text.trim();
        if (label.length === 0) return void 0;
        const hit = this.cache.get(label);
        if (hit) {
          hit.lastUsedFrame = this.frame;
          return hit;
        }
        const raster = berxRasteriseLabel(label, this.pixelHeight);
        if (!raster) return void 0;
        const context = raster.canvas.getContext("2d", { willReadFrequently: true });
        if (!context) return void 0;
        const { width, height } = raster.canvas;
        const pixels = context.getImageData(0, 0, width, height).data;
        const texture = this.device.createTexture({
          size: { width, height },
          format: "rgba8unorm",
          mipLevelCount: berxMipLevelCount(width, height),
          usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
        });
        berxWriteMipChain(this.device, texture, berxBuildMipChain(pixels, width, height));
        const entry = {
          texture,
          view: texture.createView(),
          aspect: raster.aspect,
          lastUsedFrame: this.frame
        };
        this.cache.set(label, entry);
        this.evict();
        return entry;
      }
      /** Same rule as the media cache: the budget is met, not aimed at. */
      evict() {
        if (this.cache.size <= this.budget) return;
        const byAge = [...this.cache.entries()].sort((a, b) => a[1].lastUsedFrame - b[1].lastUsedFrame);
        for (const [key, entry] of byAge) {
          if (this.cache.size <= this.budget) return;
          if (entry.lastUsedFrame !== this.frame) {
            entry.texture.destroy();
            this.cache.delete(key);
          }
        }
        for (const [key, entry] of byAge) {
          if (this.cache.size <= this.budget) return;
          if (this.cache.has(key)) {
            entry.texture.destroy();
            this.cache.delete(key);
          }
        }
      }
      get residentCount() {
        return this.cache.size;
      }
      dispose() {
        for (const entry of this.cache.values()) entry.texture.destroy();
        this.cache.clear();
      }
    };
  }
});

// packages/spatial-web/src/webgpuRuntime.ts
var webgpuRuntime_exports = {};
__export(webgpuRuntime_exports, {
  BerxWebGPURuntimeRenderer: () => BerxWebGPURuntimeRenderer,
  berxWebGPUCanvasPresentable: () => berxWebGPUCanvasPresentable
});
function meshFor2(primitive, lod) {
  const far = lod === 1;
  switch (primitive) {
    case "orb":
      return createSphere(0.5, far ? 10 : 24, far ? 7 : 16);
    case "ring":
      return createRing(0.62, 0.42, far ? 16 : 48);
    case "frame":
      return createFrame(1, 1, 0.12);
    case "surface":
      return createBox(1, 1, 0.06);
    case "portal":
      return createFrame(1, 1.2, 0.16);
    case "node":
      return createSphere(0.58, far ? 9 : 20, far ? 6 : 12);
    case "stack":
      return createBox(1, 1, 0.32);
    case "message":
      return createBox(1, 0.46, 0.12);
    case "create":
      return createSphere(0.58, far ? 11 : 28, far ? 7 : 18);
    default:
      throw new Error(`BERX 5D WebGPU: unknown primitive '${primitive}'`);
  }
}
function glToWgpuDepth(projection) {
  const m = Float32Array.from(projection);
  for (let c = 0; c < 4; c++) {
    m[c * 4 + 2] = (projection[c * 4 + 2] + projection[c * 4 + 3]) * 0.5;
  }
  return m;
}
async function berxWebGPUCanvasPresentable() {
  const gpu = navigator.gpu;
  if (!gpu) return { ok: false, reason: "navigator.gpu is absent" };
  let device;
  try {
    const adapter = await gpu.requestAdapter({ powerPreference: "high-performance" });
    if (!adapter) return { ok: false, reason: "navigator.gpu granted no adapter" };
    device = await adapter.requestDevice();
    let lostReason;
    void device.lost.then((info) => {
      lostReason = `${info.reason}: ${info.message}`.trim();
    });
    const canvas = document.createElement("canvas");
    canvas.width = 16;
    canvas.height = 16;
    const context = canvas.getContext("webgpu");
    if (!context) return { ok: false, reason: "the canvas granted no webgpu context" };
    context.configure({ device, format: "rgba8unorm", alphaMode: "opaque" });
    for (let frame = 0; frame < 2 && !lostReason; frame++) {
      const encoder = device.createCommandEncoder();
      encoder.beginRenderPass({
        colorAttachments: [{
          view: context.getCurrentTexture().createView(),
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
          loadOp: "clear",
          storeOp: "store"
        }]
      }).end();
      device.queue.submit([encoder.finish()]);
      await new Promise((resolve) => requestAnimationFrame(() => resolve()));
    }
    for (let settle = 0; settle < 4 && !lostReason; settle++) {
      await new Promise((resolve) => requestAnimationFrame(() => resolve()));
    }
    if (lostReason) return { ok: false, reason: `the device was lost on presenting to a canvas (${lostReason})` };
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : String(error) };
  } finally {
    try {
      device?.destroy();
    } catch {
    }
  }
}
var DRAW_STRIDE, GLOBALS_BYTES, LABEL_STRIDE, LABEL_GLOBALS_BYTES, SAMPLE_COUNT, BerxWebGPURuntimeRenderer;
var init_webgpuRuntime = __esm({
  "packages/spatial-web/src/webgpuRuntime.ts"() {
    "use strict";
    init_src();
    init_src2();
    init_primitiveGeometry();
    init_webgpuMediaTextures();
    init_webgpuText();
    DRAW_STRIDE = 256;
    GLOBALS_BYTES = 192;
    LABEL_STRIDE = 256;
    LABEL_GLOBALS_BYTES = 160;
    SAMPLE_COUNT = 4;
    BerxWebGPURuntimeRenderer = class _BerxWebGPURuntimeRenderer {
      constructor(canvas, device, context, format, pipeline, drawLayout, mediaLayout, labelPipeline, labelLayout, options) {
        this.canvas = canvas;
        this.device = device;
        this.context = context;
        this.format = format;
        this.pipeline = pipeline;
        this.drawLayout = drawLayout;
        this.labelPipeline = labelPipeline;
        this.labelLayout = labelLayout;
        this.kind = "webgpu";
        /* what this backend really does, and nothing it does not */
        this.capabilities = {
          perspective: true,
          depthBuffer: true,
          physicallyLitMaterials: true,
          shadows: false,
          postProcessing: false
        };
        /** What this backend has, beyond the renderer interface's own list. */
        this.extendedCapabilities = {
          mediaSurfaces: true,
          /** Built on the CPU, since WebGPU has no generateMipmap of its own. */
          mediaMipmaps: true,
          worldSpaceLabels: true,
          labelMipmaps: true,
          multisample: SAMPLE_COUNT
        };
        this.meshes = /* @__PURE__ */ new Map();
        this.drawCapacity = 0;
        /** objectId -> the one media URI drawn on its face */
        this.media = /* @__PURE__ */ new Map();
        this.mediaBinds = /* @__PURE__ */ new Map();
        this.labelCapacity = 0;
        this.labelBinds = /* @__PURE__ */ new Map();
        /** Every uncaptured device error since this renderer was created. */
        this.errors = [];
        this.affordances = [];
        this.slots = [];
        this.lighting = berxWorldLighting();
        this.lostPromise = new Promise(() => {
        });
        this.width = 1;
        this.height = 1;
        this.stats = {
          visible: 0,
          inFrustum: 0,
          drawCalls: 0,
          triangles: 0,
          lodReduced: 0,
          budgetCut: 0,
          residentTextures: 0,
          residentLabels: 0,
          meshVariants: 0
        };
        this.stereoCarry = { drawCalls: 0, triangles: 0, inFrustum: 0, lodReduced: 0, budgetCut: 0 };
        this.labels = new BerxWebGPUTextAtlas(device, { budget: options.labelBudget });
        this.labelGlobals = device.createBuffer({ size: LABEL_GLOBALS_BYTES, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
        this.labelGlobalsBind = device.createBindGroup({
          layout: labelPipeline.getBindGroupLayout(0),
          entries: [{ binding: 0, resource: { buffer: this.labelGlobals } }]
        });
        this.mediaLayout = mediaLayout;
        this.textures = new BerxWebGPUMediaTextures(device, { budget: options.textureBudget, onError: options.onMediaError });
        this.mediaSampler = device.createSampler({ magFilter: "linear", minFilter: "linear" });
        const blank = device.createTexture({
          size: { width: 1, height: 1 },
          format: "rgba8unorm",
          usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
        });
        device.queue.writeTexture({ texture: blank }, new Uint8Array([255, 255, 255, 255]), { bytesPerRow: 4, rowsPerImage: 1 }, { width: 1, height: 1 });
        this.blankBind = device.createBindGroup({
          layout: mediaLayout,
          entries: [
            { binding: 0, resource: this.mediaSampler },
            { binding: 1, resource: blank.createView() }
          ]
        });
        this.globals = device.createBuffer({ size: GLOBALS_BYTES, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
        this.globalsBind = device.createBindGroup({
          layout: pipeline.getBindGroupLayout(0),
          entries: [{ binding: 0, resource: { buffer: this.globals } }]
        });
        this.resize(canvas.width || 1, canvas.height || 1);
      }
      /**
       * Build the backend, or say honestly that this browser has no
       * WebGPU. Returns undefined rather than throwing, so a host can ask
       * for the better renderer and keep the working one when the answer
       * is no.
       */
      static async create(canvas, options = {}) {
        const gpu = navigator.gpu;
        if (!gpu) return void 0;
        const adapter = await gpu.requestAdapter({ powerPreference: "high-performance" });
        if (!adapter) return void 0;
        const device = await adapter.requestDevice();
        const errors = [];
        device.onuncapturederror = (event) => {
          errors.push(event.error.message);
        };
        const context = canvas.getContext("webgpu");
        if (!context) return void 0;
        const format = "rgba8unorm";
        context.configure({
          device,
          format,
          alphaMode: "opaque",
          usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC
        });
        const module = device.createShaderModule({ code: BERX_WORLD_WGSL });
        const drawLayout = device.createBindGroupLayout({
          entries: [{
            binding: 0,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            buffer: { type: "uniform", hasDynamicOffset: true, minBindingSize: DRAW_STRIDE }
          }]
        });
        const mediaLayout = device.createBindGroupLayout({
          entries: [
            { binding: 0, visibility: GPUShaderStage.FRAGMENT, sampler: { type: "filtering" } },
            { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "float", viewDimension: "2d" } }
          ]
        });
        const globalsLayout = device.createBindGroupLayout({
          entries: [{
            binding: 0,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            buffer: { type: "uniform", minBindingSize: GLOBALS_BYTES }
          }]
        });
        const pipeline = device.createRenderPipeline({
          layout: device.createPipelineLayout({ bindGroupLayouts: [globalsLayout, drawLayout, mediaLayout] }),
          vertex: {
            module,
            entryPoint: "vs",
            buffers: [{
              arrayStride: 24,
              attributes: [
                { shaderLocation: 0, offset: 0, format: "float32x3" },
                { shaderLocation: 1, offset: 12, format: "float32x3" }
              ]
            }]
          },
          fragment: {
            module,
            entryPoint: "fs",
            targets: [{
              format,
              /* the same blend the WebGL2 backend runs */
              blend: {
                color: { srcFactor: "src-alpha", dstFactor: "one-minus-src-alpha", operation: "add" },
                alpha: { srcFactor: "src-alpha", dstFactor: "one-minus-src-alpha", operation: "add" }
              }
            }]
          },
          primitive: { topology: "triangle-list", frontFace: "ccw", cullMode: "back" },
          depthStencil: { format: "depth32float", depthWriteEnabled: true, depthCompare: "less" },
          multisample: { count: SAMPLE_COUNT }
        });
        const labelModule = device.createShaderModule({ code: BERX_LABEL_WGSL });
        const labelGlobalsLayout = device.createBindGroupLayout({
          entries: [{ binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: "uniform", minBindingSize: LABEL_GLOBALS_BYTES } }]
        });
        const labelLayout = device.createBindGroupLayout({
          entries: [{
            binding: 0,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            buffer: { type: "uniform", hasDynamicOffset: true, minBindingSize: LABEL_STRIDE }
          }]
        });
        const labelPipeline = device.createRenderPipeline({
          layout: device.createPipelineLayout({ bindGroupLayouts: [labelGlobalsLayout, labelLayout, mediaLayout] }),
          vertex: { module: labelModule, entryPoint: "vs" },
          fragment: {
            module: labelModule,
            entryPoint: "fs",
            targets: [{
              format,
              blend: {
                color: { srcFactor: "src-alpha", dstFactor: "one-minus-src-alpha", operation: "add" },
                alpha: { srcFactor: "src-alpha", dstFactor: "one-minus-src-alpha", operation: "add" }
              }
            }]
          },
          /* two-sided: a name has no back, and culling one would make it
             vanish when the camera crossed behind its plane */
          primitive: { topology: "triangle-list", cullMode: "none" },
          depthStencil: { format: "depth32float", depthWriteEnabled: false, depthCompare: "less" },
          multisample: { count: SAMPLE_COUNT }
        });
        const renderer = new _BerxWebGPURuntimeRenderer(canvas, device, context, format, pipeline, drawLayout, mediaLayout, labelPipeline, labelLayout, options);
        renderer.errors = errors;
        renderer.adapter = adapter;
        renderer.lostPromise = device.lost.then((info) => {
          const reason = `${info.reason}: ${info.message}`.trim();
          renderer.handleContextLost(reason);
          return reason;
        });
        return renderer;
      }
      get frameStats() {
        return { ...this.stats };
      }
      /** What can be done to the focused entity. State, not a constant. */
      setAffordances(affordances) {
        this.affordances = affordances;
      }
      /** Where the ring stood in the last drawn frame. */
      get actionSlots() {
        return this.slots;
      }
      /** Relight the world. Lights are state, not constants baked into a shader. */
      setLighting(lighting) {
        this.lighting = lighting;
      }
      get worldLighting() {
        return this.lighting;
      }
      get residentTextureCount() {
        return this.textures.residentCount;
      }
      get residentLabelCount() {
        return this.labels.residentCount;
      }
      /** Why the GPU device went away, if it has. Undefined while it is alive. */
      get deviceLost() {
        return this.lost;
      }
      /**
       * Resolves when the device is gone, with the reason.
       *
       * WebGPU has no restore: a lost device stays lost, and continuing
       * means asking for another one. The host watches this and rebuilds,
       * which is possible only because none of the world is in here.
       */
      get whenLost() {
        return this.lostPromise;
      }
      /**
       * What the viewer is pointing at.
       *
       * The same shared-core ray cast the WebGL2 backend uses, against the
       * same world objects: a spatial identity picked here is the same
       * identity picked there. `x`/`y` are in backing-store pixels, the
       * space the frame was drawn in.
       */
      pick(frame, x, y) {
        const ray = rayFromNdc(frame.camera, x / this.width * 2 - 1, 1 - y / this.height * 2, this.width / this.height);
        return ray ? pickSpatialObject(ray, frame.world.objects) : void 0;
      }
      /**
       * A lost WebGPU device invalidates every handle at once.
       *
       * There is no equivalent of WebGL's context-restored event: the
       * device is gone and a new one must be requested, which is the
       * host's decision rather than this object's. All this does is stop
       * the renderer from calling into a dead device and record why.
       */
      handleContextLost(reason = "device lost") {
        this.lost = reason;
        this.meshes.clear();
        this.mediaBinds.clear();
        this.labelBinds.clear();
      }
      resize(width, height) {
        this.width = Math.max(1, Math.floor(width));
        this.height = Math.max(1, Math.floor(height));
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.msaa?.destroy();
        this.depth?.destroy();
        this.offscreen?.destroy();
        this.offscreen = this.device.createTexture({
          size: { width: this.width, height: this.height },
          format: this.format,
          usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC
        });
        this.msaa = this.device.createTexture({
          size: { width: this.width, height: this.height },
          sampleCount: SAMPLE_COUNT,
          format: this.format,
          usage: GPUTextureUsage.RENDER_ATTACHMENT
        });
        this.depth = this.device.createTexture({
          size: { width: this.width, height: this.height },
          sampleCount: SAMPLE_COUNT,
          format: "depth32float",
          usage: GPUTextureUsage.RENDER_ATTACHMENT
        });
      }
      mesh(primitive, lod) {
        const key = `${primitive}:${lod}`;
        let m = this.meshes.get(key);
        if (!m) {
          const source = meshFor2(primitive, lod);
          const vertices = this.device.createBuffer({ size: source.vertices.byteLength, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST });
          this.device.queue.writeBuffer(vertices, 0, source.vertices);
          const indexBytes = Math.ceil(source.indices.byteLength / 4) * 4;
          const indices = this.device.createBuffer({ size: indexBytes, usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST });
          this.device.queue.writeBuffer(indices, 0, source.indices);
          let halfX = 0, halfY = 0;
          for (let i = 0; i < source.vertices.length; i += 6) {
            halfX = Math.max(halfX, Math.abs(source.vertices[i]));
            halfY = Math.max(halfY, Math.abs(source.vertices[i + 1]));
          }
          m = { vertices, indices, count: source.indices.length, halfX: halfX || 0.5, halfY: halfY || 0.5 };
          this.meshes.set(key, m);
        }
        return m;
      }
      render(frame, options = {}) {
        if (this.lost) return;
        const listFor = (eye, width, height) => berxBuildDrawList(eye, {
          width,
          height,
          maxObjects: options.maxObjects,
          ambientMotion: options.ambientMotion,
          lighting: this.lighting,
          mediaFor: (id) => this.media.get(id),
          affordances: this.affordances
        });
        if (options.stereo) {
          const half = Math.max(1, Math.floor(this.width / 2));
          this.draw(
            listFor({ ...frame, camera: berxEyeCamera(frame.camera, options.stereo.ipd, -1) }, half, this.height),
            false,
            { x: 0, width: half },
            { clear: true, keep: true }
          );
          this.draw(
            listFor({ ...frame, camera: berxEyeCamera(frame.camera, options.stereo.ipd, 1) }, half, this.height),
            false,
            { x: half, width: half },
            { clear: false, keep: false }
          );
          return;
        }
        this.draw(listFor(frame, this.width, this.height));
      }
      /**
       * Draw a list the caller already resolved.
       *
       * `offscreen` sends the resolve to a texture that can be read back
       * rather than to the canvas. It is the same pipeline, the same
       * shader and the same draw list; the cross-renderer gate uses it
       * because this driver cannot copy out of a canvas texture.
       */
      draw(list, offscreen = false, viewport, pass_) {
        if (this.lost) return;
        const device = this.device;
        const globals = new Float32Array(GLOBALS_BYTES / 4);
        globals.set(glToWgpuDepth(list.projection), 0);
        globals.set(list.view, 16);
        globals.set([list.camera.x, list.camera.y, list.camera.z, 0], 32);
        globals.set([list.ambient[0], list.ambient[1], list.ambient[2], 0], 36);
        globals.set([list.key.direction.x, list.key.direction.y, list.key.direction.z, 0], 40);
        globals.set([list.key.colour[0], list.key.colour[1], list.key.colour[2], list.key.intensity], 44);
        device.queue.writeBuffer(this.globals, 0, globals);
        const count = Math.max(1, list.items.length);
        if (!this.drawBuffer || this.drawCapacity < count) {
          this.drawBuffer?.destroy();
          this.drawBuffer = device.createBuffer({ size: count * DRAW_STRIDE, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
          this.drawCapacity = count;
          this.drawBind = device.createBindGroup({
            layout: this.drawLayout,
            entries: [{ binding: 0, resource: { buffer: this.drawBuffer, size: DRAW_STRIDE } }]
          });
        }
        this.textures.beginFrame();
        const resolved = list.items.map((item) => {
          const mesh = this.mesh(item.primitive, item.lod);
          const uri = item.media;
          const loaded = uri ? this.textures.get(uri) : void 0;
          return { item, mesh, uri, loaded };
        });
        const draws = new Float32Array(count * (DRAW_STRIDE / 4));
        resolved.forEach(({ item, mesh, loaded }, i) => {
          const o = i * (DRAW_STRIDE / 4);
          draws.set(item.model, o);
          draws.set([item.base[0], item.base[1], item.base[2], mesh.halfX], o + 16);
          draws.set([item.emissive[0], item.emissive[1], item.emissive[2], mesh.halfY], o + 20);
          draws.set([item.metalness, item.roughness, item.opacity, item.transmission], o + 24);
          const near = item.pointLights.slice(0, 4);
          near.forEach((light, k) => {
            draws.set([light.position.x, light.position.y, light.position.z, light.range], o + 28 + k * 4);
            draws.set([light.colour[0], light.colour[1], light.colour[2], light.intensity], o + 44 + k * 4);
          });
          const face = mesh.halfX / mesh.halfY;
          const fit = loaded ? loaded.aspectRatio / face : 1;
          draws.set([
            near.length,
            loaded ? fit > 1 ? 1 / fit : 1 : 1,
            loaded ? fit > 1 ? 1 : fit : 1,
            loaded ? 1 : 0
          ], o + 60);
        });
        device.queue.writeBuffer(this.drawBuffer, 0, draws);
        const encoder = device.createCommandEncoder();
        const pass = encoder.beginRenderPass({
          colorAttachments: [{
            view: this.msaa.createView(),
            resolveTarget: (offscreen ? this.offscreen : this.context.getCurrentTexture()).createView(),
            clearValue: { r: BERX_WORLD_CLEAR[0], g: BERX_WORLD_CLEAR[1], b: BERX_WORLD_CLEAR[2], a: 1 },
            loadOp: pass_?.clear === false ? "load" : "clear",
            storeOp: "store"
          }],
          depthStencilAttachment: {
            view: this.depth.createView(),
            depthClearValue: 1,
            depthLoadOp: pass_?.clear === false ? "load" : "clear",
            depthStoreOp: "store"
          }
        });
        if (viewport) pass.setViewport(viewport.x, 0, viewport.width, this.height, 0, 1);
        pass.setPipeline(this.pipeline);
        pass.setBindGroup(0, this.globalsBind);
        let drawCalls = 0, triangles = 0;
        resolved.forEach(({ mesh, uri, loaded }, i) => {
          pass.setBindGroup(1, this.drawBind, [i * DRAW_STRIDE]);
          pass.setBindGroup(2, loaded && uri ? this.mediaBind(uri, loaded.view) : this.blankBind);
          pass.setVertexBuffer(0, mesh.vertices);
          pass.setIndexBuffer(mesh.indices, "uint16");
          pass.drawIndexed(mesh.count);
          drawCalls++;
          triangles += mesh.count / 3;
        });
        drawCalls += this.drawLabels(pass, list);
        pass.end();
        device.queue.submit([encoder.finish()]);
        this.slots = list.actionSlots;
        const accumulate = pass_?.keep === true;
        this.stats = accumulate ? {
          ...this.stats,
          visible: list.stats.visible,
          inFrustum: list.stats.inFrustum,
          drawCalls,
          triangles,
          lodReduced: list.stats.lodReduced,
          budgetCut: list.stats.budgetCut,
          meshVariants: this.meshes.size
        } : {
          visible: list.stats.visible,
          inFrustum: list.stats.inFrustum,
          drawCalls,
          triangles,
          lodReduced: list.stats.lodReduced,
          budgetCut: list.stats.budgetCut,
          residentTextures: this.textures.residentCount,
          residentLabels: this.labels.residentCount,
          meshVariants: this.meshes.size
        };
        if (!accumulate && pass_?.clear === false) {
          this.stats.drawCalls += this.stereoCarry.drawCalls;
          this.stats.triangles += this.stereoCarry.triangles;
          this.stats.inFrustum += this.stereoCarry.inFrustum;
          this.stats.lodReduced += this.stereoCarry.lodReduced;
          this.stats.budgetCut += this.stereoCarry.budgetCut;
        }
        if (accumulate) {
          this.stereoCarry = {
            drawCalls,
            triangles,
            inFrustum: list.stats.inFrustum,
            lodReduced: list.stats.lodReduced,
            budgetCut: list.stats.budgetCut
          };
        }
      }
      /**
       * The names and the action ring, where the shared core put them.
       *
       * One pass, one pipeline and one buffer, because they are the same
       * kind of thing — a word standing in the world beside the object it
       * belongs to. Names go far to near so the ones in front composite
       * over the ones behind; the ring follows, on top of them. The
       * placement — position, height, fade — is not decided here: it
       * arrives in the draw list, which is what makes this pass comparable
       * to the WebGL2 one.
       *
       * Capacity is settled before anything is recorded. Growing the
       * buffer between two draws in the same pass would destroy the buffer
       * the earlier draws are bound to.
       */
      drawLabels(pass, list) {
        this.labels.beginFrame();
        if (!list.basis) return 0;
        const named = list.labels.map((placement) => ({
          position: placement.position,
          halfHeight: placement.halfHeight,
          alpha: placement.alpha,
          text: placement.text,
          glyphs: this.labels.get(placement.text)
        })).filter((entry) => entry.glyphs !== void 0);
        const ring = list.actionSlots.map((slot) => ({
          position: slot.position,
          halfHeight: slot.halfHeight,
          alpha: 1,
          text: slot.affordance.label,
          glyphs: this.labels.get(slot.affordance.label)
        })).filter((entry) => entry.glyphs !== void 0);
        const quads = [...named, ...ring];
        if (quads.length === 0) return 0;
        const globals = new Float32Array(LABEL_GLOBALS_BYTES / 4);
        globals.set(glToWgpuDepth(list.projection), 0);
        globals.set(list.view, 16);
        globals.set([list.basis.right.x, list.basis.right.y, list.basis.right.z, 0], 32);
        globals.set([list.basis.up.x, list.basis.up.y, list.basis.up.z, 0], 36);
        this.device.queue.writeBuffer(this.labelGlobals, 0, globals);
        this.ensureLabelCapacity(quads.length);
        const data = new Float32Array(quads.length * (LABEL_STRIDE / 4));
        quads.forEach((quad, i) => {
          const o = i * (LABEL_STRIDE / 4);
          data.set([quad.position.x, quad.position.y, quad.position.z, 0], o);
          data.set([quad.halfHeight * quad.glyphs.aspect, quad.halfHeight, quad.alpha, 0], o + 4);
        });
        this.device.queue.writeBuffer(this.labelBuffer, 0, data);
        pass.setPipeline(this.labelPipeline);
        pass.setBindGroup(0, this.labelGlobalsBind);
        quads.forEach((quad, i) => {
          pass.setBindGroup(1, this.labelBind, [i * LABEL_STRIDE]);
          pass.setBindGroup(2, this.glyphBind(quad.text, quad.glyphs.view));
          pass.draw(6);
        });
        return quads.length;
      }
      /**
       * Room for `count` label quads.
       *
       * Sized before the pass records anything, because growing it after a
       * draw is bound to the old buffer would destroy a buffer in use.
       */
      ensureLabelCapacity(count) {
        if (this.labelBuffer && this.labelCapacity >= count) return;
        this.labelBuffer?.destroy();
        this.labelBuffer = this.device.createBuffer({
          size: Math.max(1, count) * LABEL_STRIDE,
          usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        this.labelCapacity = Math.max(1, count);
        this.labelBind = this.device.createBindGroup({
          layout: this.labelLayout,
          entries: [{ binding: 0, resource: { buffer: this.labelBuffer, size: LABEL_STRIDE } }]
        });
      }
      glyphBind(text, view) {
        let bind = this.labelBinds.get(text);
        if (!bind) {
          bind = this.device.createBindGroup({
            layout: this.mediaLayout,
            entries: [{ binding: 0, resource: this.mediaSampler }, { binding: 1, resource: view }]
          });
          this.labelBinds.set(text, bind);
        }
        return bind;
      }
      mediaBind(uri, view) {
        let bind = this.mediaBinds.get(uri);
        if (!bind) {
          bind = this.device.createBindGroup({
            layout: this.mediaLayout,
            entries: [{ binding: 0, resource: this.mediaSampler }, { binding: 1, resource: view }]
          });
          this.mediaBinds.set(uri, bind);
        }
        return bind;
      }
      /**
       * The one media surface an object shows.
       *
       * Only URIs the server actually sent ever reach here; an object with
       * none keeps its material colour, which is what "no picture" looks
       * like rather than a placeholder.
       */
      setObjectMedia(objectId, media) {
        const first = media.find((m) => m.uri)?.uri;
        if (first) this.media.set(objectId, first);
        else this.media.delete(objectId);
      }
      forgetObjectMedia(objectId) {
        this.media.delete(objectId);
      }
      /**
       * The frame that was just drawn, off the GPU.
       *
       * Tightly packed RGBA8, top row first — the same layout the native
       * backend returns, so the two can be compared byte for byte.
       */
      async readback() {
        const texture = this.offscreen;
        const unpadded = this.width * 4;
        const padded = Math.ceil(unpadded / 256) * 256;
        const staging = this.device.createBuffer({
          size: padded * this.height,
          usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
        });
        const encoder = this.device.createCommandEncoder();
        encoder.copyTextureToBuffer(
          { texture },
          { buffer: staging, bytesPerRow: padded, rowsPerImage: this.height },
          { width: this.width, height: this.height }
        );
        this.device.queue.submit([encoder.finish()]);
        await this.device.queue.onSubmittedWorkDone();
        await staging.mapAsync(GPUMapMode.READ);
        const data = new Uint8Array(staging.getMappedRange());
        const out = new Uint8Array(unpadded * this.height);
        for (let row = 0; row < this.height; row++) {
          out.set(data.subarray(row * padded, row * padded + unpadded), row * unpadded);
        }
        staging.unmap();
        staging.destroy();
        return out;
      }
      dispose() {
        if (this.lost) {
          this.meshes.clear();
          this.mediaBinds.clear();
          this.labelBinds.clear();
          return;
        }
        for (const mesh of this.meshes.values()) {
          mesh.vertices.destroy();
          mesh.indices.destroy();
        }
        this.meshes.clear();
        this.mediaBinds.clear();
        this.labelBinds.clear();
        this.labels.dispose();
        this.labelBuffer?.destroy();
        this.labelGlobals.destroy();
        this.textures.dispose();
        this.drawBuffer?.destroy();
        this.globals.destroy();
        this.msaa?.destroy();
        this.depth?.destroy();
        this.offscreen?.destroy();
        this.device.destroy();
      }
    };
  }
});

// packages/core/src/index.ts
var BerxApiError = class extends Error {
  constructor(status, body) {
    super(body.message || body.error);
    this.status = status;
    this.code = body.error;
  }
};

// packages/api/src/client.ts
function appendFilePart(form, field, part, filename) {
  if (typeof Blob !== "undefined" && part instanceof Blob) {
    form.append(field, part, filename);
  } else {
    form.append(field, part);
  }
}
var BerxApiClient = class {
  constructor(baseUrl, storage2) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.storage = storage2;
  }
  /**
   * Public — used both internally by request() and directly by UI
   * code that needs to fetch an authenticated resource RN's own
   * components can request (e.g. <Image source={{uri, headers}}>
   * for a private story's media, which needs the same bearer/
   * fallback headers but isn't going through request() at all).
   */
  async getAuthHeaders() {
    const token = await this.storage.getToken();
    if (!token) return {};
    return { Authorization: `Bearer ${token}`, "X-Api-Token": token };
  }
  async request(path, options = {}) {
    const { method = "GET", body, multipart, auth = true } = options;
    const headers = {};
    let fetchBody;
    if (multipart) {
      const form = new FormData();
      if (multipart.fields) {
        for (const [k, v] of Object.entries(multipart.fields)) {
          form.append(k, v);
        }
      }
      for (const f of multipart.files) {
        appendFilePart(form, f.field, f.part, f.filename);
      }
      fetchBody = form;
    } else if (body) {
      headers["Content-Type"] = "application/x-www-form-urlencoded";
      fetchBody = Object.entries(body).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
    }
    if (auth) {
      const authHeaders = await this.getAuthHeaders();
      Object.assign(headers, authHeaders);
    }
    const res = await fetch(`${this.baseUrl}/api/v1${path}`, {
      method,
      headers,
      body: fetchBody
    });
    const json = await res.json();
    if (!res.ok) {
      throw new BerxApiError(res.status, json);
    }
    return json;
  }
  /**
   * Matches auth.php's real 'register' action field names exactly
   * (username, firstname, lastname, email, password — see
   * components/OssnApi/v1/auth.php). Returns no token — the real API
   * requires email activation before login() will succeed, matching
   * the web signup flow exactly (see that file's own comment).
   */
  async register(fields) {
    return this.request("/auth/register", {
      method: "POST",
      auth: false,
      body: fields
    });
  }
  async login(usernameOrEmail, password2, deviceLabel) {
    const session = await this.request("/auth/login", {
      method: "POST",
      auth: false,
      body: {
        username_or_email: usernameOrEmail,
        password: password2,
        ...deviceLabel ? { device_label: deviceLabel } : {}
      }
    });
    await this.storage.setToken(session.token);
    return session;
  }
  async logout() {
    try {
      await this.request("/auth/logout", { method: "POST" });
    } finally {
      await this.storage.setToken(null);
    }
  }
  async me() {
    return this.request("/me");
  }
  async updateProfile(fields) {
    return this.request("/me", { method: "PATCH", body: fields });
  }
  /**
   * Field name is 'userphoto' to match components/OssnApi/v1/me.php
   * exactly (`$_FILES['userphoto']`) — not a generic 'file' or
   * 'avatar' name, since PHP's $_FILES key comes straight from the
   * multipart field name the client sends.
   */
  async uploadAvatar(part, filename = "avatar.jpg") {
    return this.request("/me/avatar", {
      method: "POST",
      multipart: { files: [{ field: "userphoto", part, filename }] }
    });
  }
  async feed(limit = 20, offset = 0) {
    return this.request(`/feed?limit=${limit}&offset=${offset}`);
  }
  /** visibility defaults to public server-side when omitted — every pre-existing post stays exactly as visible as it always was. */
  async createPost(text, visibility) {
    return this.request("/posts", { method: "POST", body: { text, ...visibility ? { visibility } : {} } });
  }
  async getPost(id) {
    return this.request(`/posts/${id}`);
  }
  async likePost(id) {
    return this.request(`/posts/${id}/like`, { method: "POST" });
  }
  async commentOnPost(id, text) {
    return this.request(`/posts/${id}/comments`, { method: "POST", body: { text } });
  }
  /** Closes a previously disclosed gap — comments were write-only until this session. */
  async postComments(id) {
    return this.request(`/posts/${id}/comments`);
  }
  /** Author or admin only — enforced server-side against the stored comment's own owner_guid. */
  async deletePostComment(postId, commentId) {
    return this.request(`/posts/${postId}/comments/${commentId}/delete`, { method: "POST" });
  }
  // ---------------------------------------------------------------
  // Collections — components/OssnApi/v1/collections.php. New domain
  // this session, backed by real ossn_collections/ossn_collection_items
  // tables. All authorization (owner-only mutation, visibility-gated
  // read) lives server-side in OssnCollections — mirrored here only
  // as types, never re-derived client-side.
  // ---------------------------------------------------------------
  /** Omit userGuid to get the caller's own collections. */
  async collections(userGuid) {
    const qs = userGuid !== void 0 ? `?user=${userGuid}` : "";
    return this.request(`/collections${qs}`);
  }
  async getCollection(id) {
    return this.request(`/collections/${id}`);
  }
  async createCollection(title, description, visibility = "private") {
    return this.request("/collections", {
      method: "POST",
      body: { title, ...description ? { description } : {}, visibility }
    });
  }
  async updateCollection(id, fields) {
    const body = {};
    if (fields.title !== void 0) body.title = fields.title;
    if (fields.description !== void 0) body.description = fields.description;
    if (fields.visibility !== void 0) body.visibility = fields.visibility;
    return this.request(`/collections/${id}`, { method: "PATCH", body });
  }
  async deleteCollection(id) {
    return this.request(`/collections/${id}`, { method: "DELETE" });
  }
  /** itemExists() is re-checked server-side — adding a guid for a deleted place/event/post fails with a real 404, never silently "succeeds". */
  async addCollectionItem(collectionId, itemType, itemGuid) {
    return this.request(`/collections/${collectionId}/items`, {
      method: "POST",
      body: { item_type: itemType, item_guid: String(itemGuid) }
    });
  }
  async removeCollectionItem(collectionId, itemType, itemGuid) {
    return this.request(`/collections/${collectionId}/items/${itemType}/${itemGuid}`, { method: "DELETE" });
  }
  // ---------------------------------------------------------------
  // Circles — components/OssnApi/v1/circles.php. New domain this
  // session, real ossn_circles/ossn_circle_members tables. Strictly
  // owner-only (no public tier, unlike Collections). Membership is
  // constrained to real friends server-side (OssnUser::isFriend()) —
  // this is not a second contact list.
  // ---------------------------------------------------------------
  async circles() {
    return this.request("/circles");
  }
  async getCircle(id) {
    return this.request(`/circles/${id}`);
  }
  async createCircle(name, kind) {
    return this.request("/circles", { method: "POST", body: { name, ...kind ? { kind } : {} } });
  }
  async renameCircle(id, name) {
    return this.request(`/circles/${id}`, { method: "PATCH", body: { name } });
  }
  async deleteCircle(id) {
    return this.request(`/circles/${id}`, { method: "DELETE" });
  }
  /** Rejected server-side with a real 'not_a_friend' error unless the target is a confirmed friend. */
  async addCircleMember(circleId, userGuid) {
    return this.request(`/circles/${circleId}/members/${userGuid}`, { method: "POST" });
  }
  async removeCircleMember(circleId, userGuid) {
    return this.request(`/circles/${circleId}/members/${userGuid}`, { method: "DELETE" });
  }
  // ---------------------------------------------------------------
  // Trips — components/OssnApi/v1/trips.php. New domain this
  // session: real ossn_trips/ossn_trip_stops/ossn_trip_participants
  // tables, built on already-real Places/Events + friends. Owner
  // edits; owner + real participants can view (public trips are
  // viewable by anyone).
  // ---------------------------------------------------------------
  /** Omit userGuid for the caller's own trips (owned + participant-of, deduplicated server-side). */
  async trips(userGuid) {
    const qs = userGuid !== void 0 ? `?user=${userGuid}` : "";
    return this.request(`/trips${qs}`);
  }
  async getTrip(id) {
    return this.request(`/trips/${id}`);
  }
  async createTrip(fields) {
    const body = { title: fields.title };
    if (fields.description) body.description = fields.description;
    if (fields.visibility) body.visibility = fields.visibility;
    if (fields.startDate) body.start_date = String(fields.startDate);
    if (fields.endDate) body.end_date = String(fields.endDate);
    return this.request("/trips", { method: "POST", body });
  }
  async updateTrip(id, fields) {
    const body = {};
    if (fields.title !== void 0) body.title = fields.title;
    if (fields.description !== void 0) body.description = fields.description;
    if (fields.visibility !== void 0) body.visibility = fields.visibility;
    if (fields.startDate !== void 0) body.start_date = fields.startDate === null ? "" : String(fields.startDate);
    if (fields.endDate !== void 0) body.end_date = fields.endDate === null ? "" : String(fields.endDate);
    return this.request(`/trips/${id}`, { method: "PATCH", body });
  }
  async deleteTrip(id) {
    return this.request(`/trips/${id}`, { method: "DELETE" });
  }
  /** itemExists() is re-checked server-side — adding a deleted place/event fails with a real 404. */
  async addTripStop(tripId, itemType, itemGuid, dayNumber = 1, note) {
    return this.request(`/trips/${tripId}/stops`, {
      method: "POST",
      body: { item_type: itemType, item_guid: String(itemGuid), day_number: String(dayNumber), ...note ? { note } : {} }
    });
  }
  async removeTripStop(tripId, stopId) {
    return this.request(`/trips/${tripId}/stops/${stopId}`, { method: "DELETE" });
  }
  /** Rejected server-side with a real 'not_a_friend' error unless the target is a confirmed friend. */
  async addTripParticipant(tripId, userGuid) {
    return this.request(`/trips/${tripId}/participants/${userGuid}`, { method: "POST" });
  }
  async removeTripParticipant(tripId, userGuid) {
    return this.request(`/trips/${tripId}/participants/${userGuid}`, { method: "DELETE" });
  }
  // ---------------------------------------------------------------
  // Experiences — components/OssnApi/v1/experiences.php. New domain
  // this session: real ossn_experiences/ossn_experience_participants
  // tables. Anchored to exactly one real Place or Event; NO ticket/
  // payment lifecycle — that infrastructure doesn't exist and isn't
  // faked. Participants are INVITED real friends who accept/decline
  // themselves, unlike Trips' simpler add/remove model.
  // ---------------------------------------------------------------
  async experiences(userGuid) {
    const qs = userGuid !== void 0 ? `?user=${userGuid}` : "";
    return this.request(`/experiences${qs}`);
  }
  async getExperience(id) {
    return this.request(`/experiences/${id}`);
  }
  /** Exactly one of placeGuid/eventGuid — the server rejects both or neither with a real create_failed error. */
  async createExperience(fields) {
    const body = { title: fields.title, scheduled_start: String(fields.scheduledStart) };
    if (fields.description) body.description = fields.description;
    if (fields.placeGuid) body.place_guid = String(fields.placeGuid);
    if (fields.eventGuid) body.event_guid = String(fields.eventGuid);
    if (fields.scheduledEnd) body.scheduled_end = String(fields.scheduledEnd);
    if (fields.visibility) body.visibility = fields.visibility;
    return this.request("/experiences", { method: "POST", body });
  }
  async updateExperience(id, fields) {
    const body = {};
    if (fields.title !== void 0) body.title = fields.title;
    if (fields.description !== void 0) body.description = fields.description;
    if (fields.scheduledStart !== void 0) body.scheduled_start = String(fields.scheduledStart);
    if (fields.scheduledEnd !== void 0) body.scheduled_end = fields.scheduledEnd === null ? "" : String(fields.scheduledEnd);
    if (fields.visibility !== void 0) body.visibility = fields.visibility;
    return this.request(`/experiences/${id}`, { method: "PATCH", body });
  }
  async deleteExperience(id) {
    return this.request(`/experiences/${id}`, { method: "DELETE" });
  }
  /** Rejected server-side with 'not_a_friend' unless the target is a confirmed friend. */
  async inviteToExperience(id, userGuid) {
    return this.request(`/experiences/${id}/invite/${userGuid}`, { method: "POST" });
  }
  async respondToExperience(id, accept) {
    return this.request(`/experiences/${id}/respond`, { method: "POST", body: { accept: accept ? "1" : "0" } });
  }
  /** Owner removes an invitee, or an invitee removes themselves — enforced server-side. */
  async removeExperienceParticipant(id, userGuid) {
    return this.request(`/experiences/${id}/participants/${userGuid}`, { method: "DELETE" });
  }
  // ---------------------------------------------------------------
  // Creator — components/OssnApi/v1/creator.php. New domain this
  // session: a real profile extension + real view-event log + real
  // content aggregation over already-real posts/albums/events/
  // experiences. No engagement rate, growth trend, or follower
  // projection anywhere — none of those have a real data source.
  // ---------------------------------------------------------------
  async getCreatorProfile(username) {
    return this.request(`/creator/${username}`);
  }
  async getCreatorContent(username) {
    return this.request(`/creator/${username}/content`);
  }
  /** Self-views are never recorded server-side — a creator can't inflate their own count by visiting their own profile. */
  async recordCreatorView(username) {
    return this.request(`/creator/${username}/view`, { method: "POST" });
  }
  async enableCreatorMode(category, bio) {
    return this.request("/creator/enable", { method: "POST", body: { ...category ? { category } : {}, ...bio ? { bio } : {} } });
  }
  async disableCreatorMode() {
    return this.request("/creator/disable", { method: "POST" });
  }
  async updateCreatorProfile(fields) {
    const body = {};
    if (fields.category !== void 0) body.category = fields.category;
    if (fields.bio !== void 0) body.bio = fields.bio;
    return this.request("/creator", { method: "PATCH", body });
  }
  // ---------------------------------------------------------------
  // Media Assets — components/OssnApi/v1/media.php. Generic upload/
  // metadata/attach layer on top of the real OssnFile storage
  // system (never duplicates its resize/MIME/CDN logic). Supports
  // image/video/audio — OssnFile::mimeTypes() already whitelists
  // mp4/mp3 alongside images. duration_seconds is always null for
  // video/audio: no real transcoding/probing pipeline exists in
  // this environment to measure it honestly, so it's never
  // estimated. Read URLs are public-by-guid (same trust model as
  // every other media URL in this codebase — Place/Event covers
  // work the same way); write operations (delete/attach/detach)
  // require a valid bearer token and real ownership.
  // ---------------------------------------------------------------
  async uploadMedia(part, filename) {
    return this.request("/media", { method: "POST", multipart: { files: [{ field: "file", part, filename }] } });
  }
  async getMediaAsset(guid) {
    return this.request(`/media/${guid}`);
  }
  async deleteMediaAsset(guid) {
    return this.request(`/media/${guid}`, { method: "DELETE" });
  }
  /** contextType is caller-defined (e.g. 'post', 'creator') — the server stores it as-is, no whitelist enforced yet since no consuming feature requires one. */
  async attachMedia(guid, contextType, contextGuid) {
    return this.request(`/media/${guid}/attach`, { method: "POST", body: { context_type: contextType, context_guid: String(contextGuid) } });
  }
  async detachMedia(guid) {
    return this.request(`/media/${guid}/detach`, { method: "POST" });
  }
  async mediaByContext(contextType, contextGuid) {
    return this.request(`/media/context/${contextType}/${contextGuid}`);
  }
  // ---------------------------------------------------------------
  // Video — components/OssnApi/v1/videos.php. NOT a new content
  // type: a video is a real post (OssnWall) with a real video-type
  // asset attached via the existing generic Media Foundation. This
  // is a read/listing layer only — creation reuses createPost() +
  // uploadMedia() + attachMedia() directly (see CreateVideoScreen),
  // deletion reuses the real deletePost() below.
  // ---------------------------------------------------------------
  async videoFeed(limit = 20, offset = 0) {
    return this.request(`/videos?limit=${limit}&offset=${offset}`);
  }
  async getVideo(postGuid) {
    return this.request(`/videos/${postGuid}`);
  }
  async userVideos(userGuid) {
    return this.request(`/videos?user=${userGuid}`);
  }
  /** A video IS a post — deleting it deletes the real post (author/admin only, enforced server-side) AND cleans up any attached media (the real underlying file too), never leaving an orphan. Same method covers deleting a track post — a track is architecturally identical, just audio instead of video. */
  async deletePost(postGuid) {
    return this.request(`/posts/${postGuid}`, { method: "DELETE" });
  }
  // ---------------------------------------------------------------
  // Tracks — components/OssnApi/v1/tracks.php. Same architecture as
  // Video: a track is a real post with a real audio-type asset
  // attached via the Media Foundation, not a new content type. No
  // copyrighted-music catalog, no licensing metadata — attachment
  // of a user's own real uploaded audio only, same honest scope
  // Video has for video.
  // ---------------------------------------------------------------
  async trackFeed(limit = 20, offset = 0) {
    return this.request(`/tracks?limit=${limit}&offset=${offset}`);
  }
  async getTrack(postGuid) {
    return this.request(`/tracks/${postGuid}`);
  }
  async userTracks(userGuid) {
    return this.request(`/tracks?user=${userGuid}`);
  }
  // ---------------------------------------------------------------
  // Business — components/OssnApi/v1/business.php. Real place-claim
  // requests (NEVER auto-approved — no real business registry or
  // verification service exists here) and real owner-only review
  // replies. Approval is a real, logged admin action, same manual-
  // review pattern as Admin Unvalidated Users / Community requests.
  // ---------------------------------------------------------------
  async submitPlaceClaim(placeGuid, message) {
    return this.request(`/business/places/${placeGuid}/claim`, { method: "POST", body: message ? { message } : {} });
  }
  async myPlaceClaims() {
    return this.request("/business/claims/mine");
  }
  /** Admin only — enforced server-side regardless of what this client believes about the caller's role. */
  async pendingPlaceClaims() {
    return this.request("/business/claims/pending");
  }
  async approvePlaceClaim(claimId) {
    return this.request(`/business/claims/${claimId}/approve`, { method: "POST" });
  }
  async rejectPlaceClaim(claimId) {
    return this.request(`/business/claims/${claimId}/reject`, { method: "POST" });
  }
  /** Place-owner/admin only — real one-reply-per-review upsert, enforced server-side. */
  async replyToReview(reviewGuid, text) {
    return this.request(`/business/reviews/${reviewGuid}/reply`, { method: "POST", body: { text } });
  }
  async deleteReviewReply(reviewGuid) {
    return this.request(`/business/reviews/${reviewGuid}/reply`, { method: "DELETE" });
  }
  // ---------------------------------------------------------------
  // Business team + subscription — components/OssnApi/v1/business.php.
  // Team is a real access-control list (owner/manager/staff), never a
  // second user-identity system. Subscription is server-authoritative
  // trial timing only — NO payment endpoint exists (no real payment
  // provider is integrated), so there is deliberately no "upgrade"/
  // "pay" method here to call.
  // ---------------------------------------------------------------
  async businessTeam(placeGuid) {
    return this.request(`/business/places/${placeGuid}/team`);
  }
  /** Owner/admin only, enforced server-side — a manager cannot add others even with UI access to this call. */
  async addBusinessTeamMember(placeGuid, userGuid, role) {
    return this.request(`/business/places/${placeGuid}/team`, { method: "POST", body: { user_guid: String(userGuid), role } });
  }
  async removeBusinessTeamMember(placeGuid, userGuid) {
    return this.request(`/business/places/${placeGuid}/team/${userGuid}`, { method: "DELETE" });
  }
  async getBusinessSubscription(placeGuid) {
    return this.request(`/business/places/${placeGuid}/subscription`);
  }
  /** Opens a real, server-timed 7-day trial window — idempotent, never resets an existing trial's clock. */
  async startBusinessTrial(placeGuid) {
    return this.request(`/business/places/${placeGuid}/subscription/start-trial`, { method: "POST" });
  }
  async setBusinessType(placeGuid, businessType) {
    return this.request(`/business/places/${placeGuid}/type`, { method: "POST", body: { business_type: businessType } });
  }
  /** Pure read over existing real posts/photos — components/OssnApi/v1/memories.php. No push notification is sent from this call; no real push infrastructure exists to send one from. */
  async memories() {
    return this.request("/memories");
  }
  async getProfile(username) {
    return this.request(`/profiles/${encodeURIComponent(username)}`);
  }
  async searchUsers(q) {
    return this.request(`/search/users?q=${encodeURIComponent(q)}`);
  }
  async conversations() {
    return this.request("/conversations");
  }
  async conversationWith(otherGuid) {
    return this.request(`/conversations/${otherGuid}`);
  }
  async sendMessage(otherGuid, text) {
    return this.request(`/conversations/${otherGuid}/messages`, { method: "POST", body: { text } });
  }
  async unreadMessageCount() {
    return this.request("/conversations/unread-count");
  }
  /** Marks the OTHER user's messages to me as read — real server call, matching markViewed()'s real semantics. */
  async markConversationRead(otherGuid) {
    return this.request(`/conversations/${otherGuid}/read`, { method: "POST" });
  }
  /** Real ownership check server-side — only a participant in the message can delete it. */
  async deleteMessage(otherGuid, messageId) {
    return this.request(`/conversations/${otherGuid}/messages/${messageId}`, { method: "DELETE" });
  }
  async getTypingStatus(otherGuid) {
    return this.request(`/conversations/${otherGuid}/typing`);
  }
  /** Sets MY OWN typing status toward otherGuid — server never lets this be set on someone else's behalf. */
  async setTypingStatus(otherGuid, typing) {
    return this.request(`/conversations/${otherGuid}/typing`, { method: "POST", body: { typing: typing ? "1" : "0" } });
  }
  async datingDiscover(limit = 20, offset = 0) {
    return this.request(`/dating/discover?limit=${limit}&offset=${offset}`);
  }
  /** Create or update own Match profile — the only dating endpoint callable before a profile exists. */
  async saveDatingProfile(p) {
    const body = { pseudonym: p.pseudonym };
    if (p.age !== void 0) body.age = String(p.age);
    if (p.city !== void 0) body.city = p.city;
    if (p.goal !== void 0) body.goal = p.goal;
    if (p.bio !== void 0) body.bio = p.bio;
    if (p.interests !== void 0) body.interests = p.interests;
    return this.request("/dating/profile", { method: "POST", body });
  }
  /** Own profile — unmasked, since it's the owner viewing their own data. */
  async getOwnDatingProfile() {
    return this.request("/dating/profile");
  }
  async searchDatingProfiles(q, limit = 20, offset = 0) {
    return this.request(`/dating/search?q=${encodeURIComponent(q)}&limit=${limit}&offset=${offset}`);
  }
  /** Server verifies a real mutual match exists before removing either direction. */
  async unmatchDating(userGuid) {
    return this.request("/dating/unmatch", { method: "POST", body: { user: String(userGuid) } });
  }
  async ownDatingPhotos() {
    return this.request("/dating/photos");
  }
  /** Ownership re-checked server-side; the real underlying file is unlinked too, not just the DB row. */
  async deleteOwnDatingPhoto(photoId) {
    return this.request(`/dating/photos/${photoId}`, { method: "DELETE" });
  }
  async datingLike(userGuid) {
    return this.request("/dating/interests", { method: "POST", body: { user: String(userGuid) } });
  }
  async datingPass(userGuid) {
    return this.request("/dating/pass", { method: "POST", body: { user: String(userGuid) } });
  }
  async datingUndo() {
    return this.request("/dating/undo", { method: "POST" });
  }
  async datingMatches() {
    return this.request("/dating/matches");
  }
  /**
   * Matches PATCH /api/v1/dating/location's real accepted fields
   * exactly (dating.php: latitude, longitude, hide_location) — sent
   * as strings since the transport is x-www-form-urlencoded, same as
   * every other write method here.
   */
  async datingUpdateLocation(fields) {
    const body = {};
    if (fields.latitude !== void 0) body.latitude = String(fields.latitude);
    if (fields.longitude !== void 0) body.longitude = String(fields.longitude);
    if (fields.hideLocation !== void 0) body.hide_location = fields.hideLocation ? "1" : "0";
    return this.request("/dating/location", { method: "PATCH", body });
  }
  /** Matches PATCH /api/v1/dating/privacy's real accepted fields exactly. */
  async datingUpdatePrivacy(fields) {
    const body = {};
    if (fields.hideProfile !== void 0) body.hide_profile = fields.hideProfile ? "1" : "0";
    if (fields.hideOnline !== void 0) body.hide_online = fields.hideOnline ? "1" : "0";
    if (fields.hideAge !== void 0) body.hide_age = fields.hideAge ? "1" : "0";
    if (fields.hideCity !== void 0) body.hide_city = fields.hideCity ? "1" : "0";
    if (fields.invisibleMode !== void 0) body.invisible_mode = fields.invisibleMode ? "1" : "0";
    return this.request("/dating/privacy", { method: "PATCH", body });
  }
  async notifications(unreadOnly = false, limit = 20, offset = 1) {
    const q = `?limit=${limit}&offset=${offset}${unreadOnly ? "&unread=1" : ""}`;
    return this.request(`/notifications${q}`);
  }
  async unreadNotificationCount() {
    return this.request("/notifications/unread-count");
  }
  async markNotificationRead(guid) {
    return this.request(`/notifications/${guid}/read`, { method: "POST" });
  }
  async storiesFeed() {
    return this.request("/stories");
  }
  async ownStories() {
    return this.request("/stories/own");
  }
  async createStory(part, caption, filename = "story.jpg", eventGuid) {
    const fields = {};
    if (caption) fields.caption = caption;
    if (eventGuid) fields.event_guid = String(eventGuid);
    return this.request("/stories", {
      method: "POST",
      multipart: { fields: Object.keys(fields).length ? fields : void 0, files: [{ field: "story", part, filename }] }
    });
  }
  async markStoryViewed(id) {
    return this.request(`/stories/${id}/view`, { method: "POST" });
  }
  async deleteStory(id) {
    return this.request(`/stories/${id}/delete`, { method: "POST" });
  }
  /**
   * Returns a fetch-ready URL, not the bytes — media is private and
   * token-gated (see stories.php's /media route), so callers must
   * attach the same Authorization/X-Api-Token headers this client
   * uses internally when actually fetching it (e.g. into an <Image>
   * component via a signed fetch, not a bare <img src>). This method
   * intentionally does NOT fetch the bytes itself — that decision
   * belongs to the UI layer, which knows whether it needs a Blob, a
   * data URI, or a direct authenticated request.
   */
  storyMediaUrl(id) {
    return `${this.baseUrl}/api/v1/stories/${id}/media`;
  }
  async communities(q) {
    return this.request(q ? `/communities?q=${encodeURIComponent(q)}` : "/communities");
  }
  async myCommunities() {
    return this.request("/communities/mine");
  }
  async getCommunity(guid) {
    return this.request(`/communities/${guid}`);
  }
  async createCommunity(name, description, privacy) {
    return this.request("/communities", { method: "POST", body: { name, description, privacy } });
  }
  /** Owner/admin only (enforced server-side against the real group's owner_guid) — updateGroup()'s own scope is title+description only, matching the real web edit action. */
  async updateCommunity(guid, name, description) {
    return this.request(`/communities/${guid}`, { method: "PATCH", body: { name, ...description ? { description } : {} } });
  }
  /** Permanent. Calls the real deleteGroup() the web delete action uses, not the generic object-delete path. */
  async deleteCommunity(guid) {
    return this.request(`/communities/${guid}`, { method: "DELETE" });
  }
  async joinCommunity(guid) {
    return this.request(`/communities/${guid}/join`, { method: "POST" });
  }
  async leaveCommunity(guid) {
    return this.request(`/communities/${guid}/leave`, { method: "POST" });
  }
  async pointsBalance() {
    return this.request("/points");
  }
  /** Real server-side daily check-in — see OssnPoints::recordActivity(). Safe to call once per real app open; the server itself refuses to double-count same-day calls. */
  async streakCheckIn() {
    return this.request("/points/streak/check-in", { method: "POST" });
  }
  /** Real Places (OssnGeo::near) + real Events (via their real linked Place's location) — no fake open-now filter, see nearby.php's own header. */
  async nearbyNow(lat, lng, radiusKm = 5, today = false, openNow = false) {
    return this.request(`/nearby?lat=${lat}&lng=${lng}&radius_km=${radiusKm}&today=${today ? "1" : "0"}&open_now=${openNow ? "1" : "0"}`);
  }
  async placeHours(placeGuid) {
    return this.request(`/business/places/${placeGuid}/hours`);
  }
  /** Owner-only, enforced server-side. Replaces the whole schedule — a schedule is edited as a whole, partial updates would leave stale rows. */
  async savePlaceHours(placeGuid, intervals) {
    return this.request(`/business/places/${placeGuid}/hours`, {
      method: "POST",
      body: { intervals: JSON.stringify(intervals) }
    });
  }
  /** Owner-only, real time-bound (max 24h) announcement. NOT ad inventory — no boost/sponsored tier exists (needs a real payment provider). */
  async createBusinessMoment(placeGuid, text, endsAt) {
    return this.request(`/moments/places/${placeGuid}`, { method: "POST", body: { text, ends_at: String(endsAt) } });
  }
  async deleteBusinessMoment(id) {
    return this.request(`/moments/${id}`, { method: "DELETE" });
  }
  async placeMoments(placeGuid) {
    return this.request(`/moments/places/${placeGuid}`);
  }
  /** 'shown' is recorded automatically server-side inside GET /nearby — this covers the real actions the client itself performs: opened/saved/route. */
  async recordNearbyAction(placeGuid, action) {
    return this.request(`/impressions/places/${placeGuid}/action`, { method: "POST", body: { action } });
  }
  /** Real, currently-active stories for one event — block-filtered server-side via the same real checkStoryAccess() the media route uses. */
  async eventStories(eventGuid) {
    return this.request(`/stories/event/${eventGuid}`);
  }
  /** Pure read aggregation, real counts only — no invented insight text, no fake population comparison. */
  async wrapped(period = "month") {
    return this.request(`/wrapped?period=${period}`);
  }
  async pointsHistory() {
    return this.request("/points/history");
  }
  /**
   * Real, fixed spend options only — 'dating_boost' is the one wired
   * end-to-end server-side right now (see points.php's own
   * $berx_spend_prices). Passing any other reason returns a real
   * 422 from the server, not a client-side fake success.
   */
  async spendPoints(reason, amount) {
    return this.request("/points/spend", { method: "POST", body: { reason, amount: String(amount) } });
  }
  /** Convenience wrapper — spends via dating.php's own /dating/boost action (which itself calls the real points spend + sets boosted_until), not the generic /points/spend endpoint, since boosting needs the extra server-side effect points/spend alone doesn't produce. */
  async boostDatingProfile() {
    return this.request("/dating/boost", { method: "POST" });
  }
  // ---------------------------------------------------------------
  // Dating private photo access — request/respond/revoke/incoming.
  // Every ownership/policy check (mutual-match gating, "not your
  // own photo", "not the actual owner responding") is enforced
  // server-side inside the real OssnDating methods this wraps.
  // ---------------------------------------------------------------
  async requestDatingPhotoAccess(photoId) {
    return this.request("/dating/photo-request", { method: "POST", body: { photo_id: String(photoId) } });
  }
  async respondDatingPhotoAccess(accessId, grant) {
    return this.request("/dating/photo-respond", { method: "POST", body: { access_id: String(accessId), grant: grant ? "1" : "0" } });
  }
  async revokeDatingPhotoAccess(accessId) {
    return this.request("/dating/photo-revoke", { method: "POST", body: { access_id: String(accessId) } });
  }
  async datingPhotoRequests() {
    return this.request("/dating/photo-requests");
  }
  /** Block check is done server-side with real user objects, not session state — see the header comment in api/v1/poke.php for why that distinction matters here specifically. */
  async pokeUser(userGuid) {
    return this.request(`/poke/${userGuid}`, { method: "POST" });
  }
  // ---------------------------------------------------------------
  // Admin — components/OssnApi/v1/admin.php. Admin-only server-side
  // (ossn_isAdminLoggedin()), re-checked there regardless of client
  // state. Search is deliberately NOT exposed here — see the header
  // comment in admin.php for the real SQL-injection reason.
  // ---------------------------------------------------------------
  async unvalidatedUsers() {
    return this.request("/admin/unvalidated");
  }
  async validateUsers(guids) {
    return this.request("/admin/validate", { method: "POST", body: { guids: guids.join(",") } });
  }
  // ---------------------------------------------------------------
  // Group moderators — activates OssnGroup::isModerator(), which has
  // existed in core since the beginning as a documented extension
  // point (never implemented until this pass). Owner/admin only,
  // enforced server-side.
  // ---------------------------------------------------------------
  async communityModerators(guid) {
    return this.request(`/communities/${guid}/moderators`);
  }
  async addCommunityModerator(guid, userGuid) {
    return this.request(`/communities/${guid}/moderators/${userGuid}`, { method: "POST" });
  }
  async removeCommunityModerator(guid, userGuid) {
    return this.request(`/communities/${guid}/moderators/${userGuid}`, { method: "DELETE" });
  }
  // ---------------------------------------------------------------
  // Friends — components/OssnApi/v1/friends.php, wraps the caller's
  // OWN OssnUser::getFriends(). Powers EventInviteScreen's picker.
  // ---------------------------------------------------------------
  async friends() {
    return this.request("/friends");
  }
  async communityMembers(guid) {
    return this.request(`/communities/${guid}/members`);
  }
  // ---------------------------------------------------------------
  // Albums — components/OssnApi/v1/albums.php, wraps OssnAlbums::
  // GetAlbums/GetAlbum/CreateAlbum verbatim (real class, previously
  // zero API coverage despite an audited web UI built earlier).
  // ---------------------------------------------------------------
  async userAlbums(userGuid) {
    return this.request(`/albums?user=${userGuid}`);
  }
  async getAlbum(guid) {
    return this.request(`/albums/${guid}`);
  }
  async createAlbum(title, access = "public") {
    return this.request("/albums", { method: "POST", body: { title, access } });
  }
  /** Real byte-sniffed MIME + getimagesize() validation server-side — see components/OssnApi/v1/albums.php's header comment for the full ownership/session-bridge story. */
  async uploadAlbumPhoto(albumGuid, part, filename = "photo.jpg", access = "public") {
    return this.request(`/albums/${albumGuid}/photos`, {
      method: "POST",
      multipart: { fields: { access }, files: [{ field: "photo", part, filename }] }
    });
  }
  /** Ownership verified server-side against the real file's owner_guid — deleteAlbumPhoto() itself has no built-in check, the endpoint adds it. */
  async deleteAlbumPhoto(albumGuid, photoGuid) {
    return this.request(`/albums/${albumGuid}/photos/${photoGuid}`, { method: "DELETE" });
  }
  // ---------------------------------------------------------------
  // Friends — components/OssnApi/v1/friend.php (send/remove) and
  // friends.php (list, above). OSSN's real model is mutual
  // confirmed friendship (sendRequest()/deleteFriend()) — there is
  // no one-directional "follow" concept anywhere in this backend, so
  // no followFoo/unfollowBar methods exist here; building them would
  // misrepresent the actual relationship model.
  // ---------------------------------------------------------------
  /** Covers BOTH "send a new request" and "confirm the other side's pending request" — sendRequest() itself decides which, matching the real web action's behavior exactly. */
  async addFriend(userGuid) {
    return this.request(`/friend/${userGuid}`, { method: "POST" });
  }
  /** Also cancels a pending (not-yet-mutual) request — deleteFriend() handles both cases, same as the real web action. */
  async removeFriend(userGuid) {
    return this.request(`/friend/${userGuid}`, { method: "DELETE" });
  }
  async isAuthenticated() {
    return await this.storage.getToken() !== null;
  }
  // ---------------------------------------------------------------
  // Places — components/OssnApi/v1/places.php. Every method below
  // maps to exactly one branch in that file; field names copied
  // verbatim from the PHP input() calls, not inferred.
  // ---------------------------------------------------------------
  async places(q, category) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    const qs = params.toString();
    return this.request(`/places${qs ? `?${qs}` : ""}`);
  }
  async placeCategories() {
    return this.request("/places/categories");
  }
  async savedPlaces() {
    return this.request("/places/saved");
  }
  /**
   * lat/lng are REQUIRED — places.php returns 422 without them
   * (deliberately: the server never guesses a location for the
   * caller). radius is in km, defaults to 5 server-side if omitted.
   */
  async nearbyPlaces(lat, lng, radiusKm) {
    const params = new URLSearchParams({ lat: String(lat), lng: String(lng) });
    if (radiusKm !== void 0) params.set("radius", String(radiusKm));
    return this.request(`/places/nearby?${params.toString()}`);
  }
  async getPlace(guid) {
    return this.request(`/places/${guid}`);
  }
  async placeReviews(guid) {
    return this.request(`/places/${guid}/reviews`);
  }
  /**
   * Server-side rules this deliberately does NOT re-check client-side
   * (the request will simply come back as a real 403/409/422, per
   * this file's own "no fake success" rule): a place owner cannot
   * review their own place, and one review per user per place.
   */
  async createPlaceReview(guid, rating, text) {
    return this.request(`/places/${guid}/reviews`, {
      method: "POST",
      body: { rating: String(rating), ...text ? { review: text } : {} }
    });
  }
  // ---------------------------------------------------------------
  // Business — thin extension over existing Places (components/
  // OssnApi/v1/places.php's business/* branches). No new storage;
  // the dashboard reuses data that was already real and queryable.
  // ---------------------------------------------------------------
  async enableBusiness(placeGuid) {
    return this.request(`/places/${placeGuid}/business/enable`, { method: "POST" });
  }
  async disableBusiness(placeGuid) {
    return this.request(`/places/${placeGuid}/business/disable`, { method: "POST" });
  }
  /** Admin-only server-side — a business can never self-verify. */
  async verifyBusiness(placeGuid) {
    return this.request(`/places/${placeGuid}/business/verify`, { method: "POST" });
  }
  async unverifyBusiness(placeGuid) {
    return this.request(`/places/${placeGuid}/business/verify`, { method: "DELETE" });
  }
  async businessDashboard(placeGuid) {
    return this.request(`/places/${placeGuid}/business/dashboard`);
  }
  async savePlace(guid) {
    return this.request(`/places/${guid}/save`, { method: "POST" });
  }
  async unsavePlace(guid) {
    return this.request(`/places/${guid}/unsave`, { method: "POST" });
  }
  async uploadPlaceCover(guid, part, filename = "cover.jpg") {
    return this.request(`/places/${guid}/cover`, {
      method: "POST",
      multipart: { files: [{ field: "cover", part, filename }] }
    });
  }
  async createPlace(fields) {
    const body = { title: fields.title, category: fields.category };
    if (fields.description) body.description = fields.description;
    if (fields.address) body.address = fields.address;
    if (fields.phone) body.phone = fields.phone;
    if (fields.website) body.website = fields.website;
    if (fields.hours) body.hours = fields.hours;
    if (fields.price !== void 0) body.price = String(fields.price);
    if (fields.lat !== void 0) body.lat = String(fields.lat);
    if (fields.lng !== void 0) body.lng = String(fields.lng);
    return this.request("/places", { method: "POST", body });
  }
  /** Only fields actually present in `fields` are sent — a true partial PATCH, matching places.php's own "only touch what arrived" handling. */
  async updatePlace(guid, fields) {
    const body = {};
    for (const [k, v] of Object.entries(fields)) {
      if (v !== void 0) body[k] = String(v);
    }
    return this.request(`/places/${guid}`, { method: "PATCH", body });
  }
  /** Permanent — deletes the place's reviews and geo-index entry server-side too (see places.php's DELETE branch). */
  async deletePlace(guid) {
    return this.request(`/places/${guid}`, { method: "DELETE" });
  }
  // ---------------------------------------------------------------
  // Events — components/OssnApi/v1/events.php
  // ---------------------------------------------------------------
  async events(opts) {
    const params = new URLSearchParams();
    if (opts?.q) params.set("q", opts.q);
    if (opts?.category) params.set("category", opts.category);
    if (opts?.past) params.set("past", "1");
    const qs = params.toString();
    return this.request(`/events${qs ? `?${qs}` : ""}`);
  }
  async eventCategories() {
    return this.request("/events/categories");
  }
  async myGoingEvents() {
    return this.request("/events/going");
  }
  async getEvent(guid) {
    return this.request(`/events/${guid}`);
  }
  async eventAttendees(guid) {
    return this.request(`/events/${guid}/attendees`);
  }
  /**
   * starts/ends accept EITHER a unix timestamp (number) or an
   * ISO/date-parseable string — events.php's create branch tries
   * is_numeric() first, then strtotime(), so either works. Passing a
   * JS Date, convert with `.getTime() / 1000` first.
   */
  async createEvent(fields) {
    const body = {
      title: fields.title,
      category: fields.category,
      starts: String(fields.starts)
    };
    if (fields.ends !== void 0) body.ends = String(fields.ends);
    if (fields.description) body.description = fields.description;
    if (fields.location) body.location = fields.location;
    if (fields.placeGuid !== void 0) body.place_guid = String(fields.placeGuid);
    if (fields.capacity !== void 0) body.capacity = String(fields.capacity);
    return this.request("/events", { method: "POST", body });
  }
  async updateEvent(guid, fields) {
    const body = {};
    if (fields.title !== void 0) body.title = fields.title;
    if (fields.description !== void 0) body.description = fields.description;
    if (fields.category !== void 0) body.category = fields.category;
    if (fields.starts !== void 0) body.starts = String(fields.starts);
    if (fields.ends !== void 0) body.ends = String(fields.ends);
    if (fields.capacity !== void 0) body.capacity = String(fields.capacity);
    if (fields.location !== void 0) body.location = fields.location;
    if (fields.placeGuid !== void 0) body.place_guid = String(fields.placeGuid);
    return this.request(`/events/${guid}`, { method: "PATCH", body });
  }
  async deleteEvent(guid) {
    return this.request(`/events/${guid}`, { method: "DELETE" });
  }
  /**
   * Capacity is re-counted server-side immediately before insert
   * (OssnEvents::rsvp()) — a replayed tap or two near-simultaneous
   * requests cannot oversell an event. On error, `error` is a real
   * BerxRsvpErrorCode the UI can branch on without string-matching
   * `message`.
   */
  async rsvpEvent(guid) {
    return this.request(`/events/${guid}/rsvp`, { method: "POST" });
  }
  async cancelRsvp(guid) {
    return this.request(`/events/${guid}/rsvp/cancel`, { method: "POST" });
  }
  /** userGuid must be a real friend of the caller — inviteFriend() re-checks this server-side regardless of what the UI already knows. */
  async inviteToEvent(guid, userGuid) {
    return this.request(`/events/${guid}/invite`, { method: "POST", body: { user: String(userGuid) } });
  }
  async uploadEventCover(guid, part, filename = "cover.jpg") {
    return this.request(`/events/${guid}/cover`, {
      method: "POST",
      multipart: { files: [{ field: "cover", part, filename }] }
    });
  }
  // ---------------------------------------------------------------
  // Comments on Places/Events — components/OssnApi/v1/comments.php.
  // Deliberately separate from commentOnPost() above, which hits a
  // different endpoint (/posts/{id}/comments) with a different
  // backing model — these two were never the same feature.
  // ---------------------------------------------------------------
  async objectComments(type, id) {
    return this.request(`/comments?type=${type}&id=${id}`);
  }
  async createObjectComment(type, id, text) {
    return this.request("/comments", { method: "POST", body: { type, id: String(id), comment: text } });
  }
  /** Author or admin only — enforced inside comments.php against the stored comment's own owner_guid, not against anything this call sends. */
  async deleteObjectComment(commentId) {
    return this.request(`/comments/${commentId}/delete`, { method: "POST" });
  }
  // ---------------------------------------------------------------
  // Devices & Sessions — components/OssnApi/v1/me.php. Backed by the
  // SAME ossn_api_tokens rows the web "Devices & Sessions" settings
  // tab reads — signing out a device here signs it out there too.
  // ---------------------------------------------------------------
  async sessions() {
    return this.request("/me/sessions");
  }
  /** Ownership is enforced server-side (id AND the caller's own guid, both in the WHERE) — a foreign session id simply matches zero rows. */
  async revokeSession(id) {
    return this.request(`/me/sessions/${id}/revoke`, { method: "POST" });
  }
  /**
   * PERMANENT. Requires the account's current password — verified
   * server-side via the same authenticate() check login() uses, not
   * merely "is a token present". Revokes the calling token itself on
   * success, so this client is immediately logged out.
   */
  async deleteAccount(password2) {
    const result = await this.request("/me/delete", { method: "POST", body: { password: password2 } });
    await this.storage.setToken(null);
    return result;
  }
  // ---------------------------------------------------------------
  // Community join requests — components/OssnApi/v1/communities.php.
  // Owner/admin only; enforced server-side against the real group
  // owner_guid, not against anything these calls send.
  // ---------------------------------------------------------------
  async communityRequests(guid) {
    return this.request(`/communities/${guid}/requests`);
  }
  async approveCommunityRequest(guid, userGuid) {
    return this.request(`/communities/${guid}/requests/${userGuid}/approve`, { method: "POST" });
  }
  async declineCommunityRequest(guid, userGuid) {
    return this.request(`/communities/${guid}/requests/${userGuid}/decline`, { method: "POST" });
  }
  // ---------------------------------------------------------------
  // Notifications — bulk actions added to notifications.php
  // alongside the existing single-item read/list methods above.
  // ---------------------------------------------------------------
  async markAllNotificationsRead() {
    return this.request("/notifications/read-all", { method: "POST" });
  }
  /** Ownership enforced server-side: guid AND the caller's own owner_guid together in the delete query, so a foreign guid matches zero rows. */
  async deleteNotification(guid) {
    return this.request(`/notifications/${guid}`, { method: "DELETE" });
  }
  async deleteAllNotifications() {
    return this.request("/notifications", { method: "DELETE" });
  }
  // ---------------------------------------------------------------
  // Message search — components/OssnApi/v1/messagesearch.php, a
  // thin wrapper around ossn_messagesearch_query() (also used by the
  // real web /messages-search page — one query, two surfaces).
  // ---------------------------------------------------------------
  async searchMessages(q) {
    return this.request(`/messagesearch?q=${encodeURIComponent(q)}`);
  }
  // ---------------------------------------------------------------
  // Block — components/OssnApi/v1/block.php. `from` is always the
  // caller's own token identity, never sent explicitly.
  // ---------------------------------------------------------------
  async blockedUsers() {
    return this.request("/block");
  }
  async blockUser(userGuid) {
    return this.request(`/block/${userGuid}`, { method: "POST" });
  }
  async unblockUser(userGuid) {
    return this.request(`/block/${userGuid}`, { method: "DELETE" });
  }
  // ---------------------------------------------------------------
  // Report — components/OssnApi/v1/report.php. targetType/reason are
  // validated server-side against OssnReport::VALID_TARGET_TYPES /
  // VALID_REASONS — the TS unions here exist for editor completion,
  // the server whitelist is still the actual authority.
  // ---------------------------------------------------------------
  async submitReport(targetType, targetGuid, reason, note) {
    return this.request("/report", {
      method: "POST",
      body: { target_type: targetType, target_guid: String(targetGuid), reason, ...note ? { note } : {} }
    });
  }
  /** Admin only — enforced server-side regardless of what this client believes. */
  async reportQueue() {
    return this.request("/report/queue");
  }
  async resolveReport(reportId, status) {
    return this.request(`/report/${reportId}/resolve`, { method: "POST", body: { status } });
  }
  /**
   * Real moderation action — deletes the reported content itself and
   * marks the report reviewed. Returns 501 server-side for target
   * types with no real removal mechanism ('user', 'dating_profile'),
   * rather than pretending the action succeeded.
   */
  async deleteReportedContent(reportId) {
    return this.request(`/report/${reportId}/action`, { method: "POST", body: { action: "delete_content" } });
  }
  // ---------------------------------------------------------------
  // Search — Places/Events/Communities scopes added to the existing
  // user search (components/OssnApi/v1/search.php). Note: these
  // results are intentionally lighter than the full Places/Events
  // list endpoints (guid/title/category/cover/rating only) — the
  // dispatcher loads exactly one v1 file per request, so search.php
  // cannot reuse places.php's/events.php's full JSON builder
  // functions. For a full place/event record after finding it here,
  // follow up with getPlace()/getEvent().
  // ---------------------------------------------------------------
  async searchPlaces(q) {
    return this.request(`/search/places?q=${encodeURIComponent(q)}`);
  }
  async searchEvents(q) {
    return this.request(`/search/events?q=${encodeURIComponent(q)}`);
  }
  async searchCommunities(q) {
    return this.request(`/search/communities?q=${encodeURIComponent(q)}`);
  }
};

// packages/scenes/src/spatialMapping.ts
init_src();
function berxSpatialId(kind, guid) {
  return `${kind}:${guid}`;
}
var MATERIAL_NAME = {
  person: "pearl",
  moment: "dark-glass",
  place: "graphite",
  event: "soft-gold",
  experience: "champagne",
  community: "ceramic",
  business: "metal",
  collection: "fabric",
  message: "dark-glass",
  create: "energy"
};
function materialStateFor(kind) {
  const name = MATERIAL_NAME[kind];
  const physical = berxWorldMaterial(name);
  return {
    material: name,
    /* emission is the material's, scaled by real energy at draw time */
    emissive: physical.emission[0] + physical.emission[1] + physical.emission[2] > 0 ? 1 : 0,
    roughness: physical.roughness,
    metalness: physical.metalness,
    opacity: physical.opacity,
    transmission: physical.transmission
  };
}
var DEFAULT_DEPTH = 3;
function baseObject(kind, guid, label, sourceId, energy, placement, time) {
  const now = Date.now();
  return {
    id: berxSpatialId(kind, guid),
    kind,
    label,
    sourceId,
    ...time ? { time } : {},
    transform: {
      position: placement.position ? { ...placement.position } : { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      /* the form's own proportions, so a place is portal-shaped and a
         message is message-shaped without every caller knowing that */
      scale: geometryScale(geometryForEntity(kind))
    },
    material: materialStateFor(kind),
    visible: placement.visible ?? true,
    interactive: placement.interactive ?? true,
    focusable: placement.focusable ?? true,
    energy: clamp01(energy),
    depth: placement.depth ?? DEFAULT_DEPTH,
    createdAt: now,
    updatedAt: now
  };
}
var clamp01 = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
function surfaceFor(object, uri, fit = "cover") {
  if (!uri) return [];
  return [createMediaSurface(object, { mediaId: `${object.id}:media`, uri, aspectRatio: 1, fit, opacity: 1 })];
}
var ownedBy = (objectId, ownerGuid) => ({
  id: `${objectId}->${berxSpatialId("person", ownerGuid)}:created-by`,
  from: objectId,
  to: berxSpatialId("person", ownerGuid),
  type: "created-by",
  /**
   * Weaker than any structural relation, deliberately. Who made a
   * place matters less to where that place stands than what happens
   * at it — so an event settles beside its venue, and the venue
   * settles near whoever made it.
   */
  strength: 0.55
});
function mapUserToSpatial(user, placement = {}) {
  const object = baseObject("person", user.guid, user.fullname || user.username, String(user.guid), 0, placement);
  return { object, media: surfaceFor(object, user.icon_url), relations: [] };
}
function mapFriendToSpatial(friend, placement = {}) {
  const object = baseObject("person", friend.guid, friend.fullname || friend.username, String(friend.guid), 0, placement);
  return { object, media: surfaceFor(object, friend.icon), relations: [] };
}
function mapFeedItemToSpatial(item, placement = {}) {
  const label = item.text.trim().slice(0, 80) || "\u041C\u043E\u043C\u0435\u043D\u0442";
  const object = baseObject("moment", item.guid, label, String(item.guid), 0, placement, { at: item.time_created });
  const relations = item.owner_username ? [{
    id: `${object.id}->${berxSpatialId("person", item.owner_guid)}`,
    from: object.id,
    to: berxSpatialId("person", item.owner_guid),
    type: "created-by",
    strength: 1
  }] : [];
  return { object, media: [], relations };
}
function mapPlaceToSpatial(place, placement = {}) {
  const object = baseObject("place", place.guid, place.title, String(place.guid), 0, placement);
  if (place.is_business) object.kind = "business";
  return { object, media: surfaceFor(object, place.cover_url), relations: [ownedBy(object.id, place.owner_guid)] };
}
function mapNearbyPlaceToSpatial(place, now, placement = {}) {
  const live = place.moments.filter((m) => m.ends_at * 1e3 > now).length;
  const object = baseObject("place", place.guid, place.title, String(place.guid), live === 0 ? 0 : Math.min(1, 0.4 + live * 0.2), placement);
  return { object, media: surfaceFor(object, place.cover_url), relations: [] };
}
function mapEventToSpatial(event, placement = {}) {
  const energy = event.has_ended ? 0 : event.is_going ? 0.7 : 0.35;
  const object = baseObject("event", event.guid, event.title, String(event.guid), energy, placement, {
    at: event.starts,
    startsAt: event.starts,
    /* `ends` is nullable, and open-ended is not the same as instant */
    ...event.ends !== null ? { endsAt: event.ends } : {}
  });
  const relations = event.place ? [ownedBy(object.id, event.owner_guid), {
    id: `${object.id}->${berxSpatialId("place", event.place.guid)}`,
    from: object.id,
    to: berxSpatialId("place", event.place.guid),
    type: "located-at",
    strength: 1
  }] : [ownedBy(object.id, event.owner_guid)];
  return { object, media: surfaceFor(object, event.cover_url), relations };
}
function mapNearbyEventToSpatial(event, placement = {}) {
  const object = baseObject("event", event.guid, event.title, String(event.guid), 0.35, placement, { at: event.starts, startsAt: event.starts });
  return {
    object,
    media: [],
    relations: [{
      id: `${object.id}->${berxSpatialId("place", event.place_guid)}`,
      from: object.id,
      to: berxSpatialId("place", event.place_guid),
      type: "located-at",
      strength: 1
    }]
  };
}
function mapExperienceToSpatial(experience, placement = {}) {
  const energy = experience.my_status === "accepted" ? 0.6 : 0.25;
  const object = baseObject("experience", experience.id, experience.title, String(experience.id), energy, placement, {
    at: experience.scheduled_start,
    startsAt: experience.scheduled_start,
    ...experience.scheduled_end !== null ? { endsAt: experience.scheduled_end } : {}
  });
  const anchor = experience.anchor;
  const relations = anchor ? [ownedBy(object.id, experience.owner_guid), {
    id: `${object.id}->${berxSpatialId(anchor.type, anchor.guid)}`,
    from: object.id,
    to: berxSpatialId(anchor.type, anchor.guid),
    type: "located-at",
    strength: 1
  }] : [ownedBy(object.id, experience.owner_guid)];
  return { object, media: [], relations };
}
function mapCommunityToSpatial(community, placement = {}) {
  const object = baseObject("community", community.guid, community.name, String(community.guid), 0, placement);
  return { object, media: [], relations: [ownedBy(object.id, community.owner_guid)] };
}
function mapCollectionToSpatial(collection, placement = {}) {
  const object = baseObject("collection", collection.id, collection.title, String(collection.id), 0, placement);
  return { object, media: [], relations: [ownedBy(object.id, collection.owner_guid)] };
}
function mapMessageToSpatial(message, placement = {}) {
  const label = message.text.trim().slice(0, 60) || "\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435";
  const object = baseObject("message", `m${message.id}`, label, String(message.id), 0, placement, { at: message.time });
  return {
    object,
    media: [],
    relations: [{
      id: `${object.id}->${berxSpatialId("person", message.from_guid)}`,
      from: object.id,
      to: berxSpatialId("person", message.from_guid),
      type: "created-by",
      strength: 1
    }]
  };
}
function mapConversationToSpatial(conversation, placement = {}) {
  const label = conversation.with_username ?? conversation.last_message.trim().slice(0, 60);
  const object = baseObject("message", conversation.with_guid, label || "\u0414\u0438\u0430\u043B\u043E\u0433", String(conversation.with_guid), 0, placement, { at: conversation.time });
  return {
    object,
    media: [],
    relations: [{
      id: `${object.id}->${berxSpatialId("person", conversation.with_guid)}`,
      from: object.id,
      to: berxSpatialId("person", conversation.with_guid),
      type: "messages",
      strength: 1
    }]
  };
}

// packages/scenes/src/worldLoader.ts
var toEntry = (mapping) => ({
  object: mapping.object,
  relations: mapping.relations,
  media: mapping.media
});
var relation = (from, to, type, strength) => ({
  id: `${from}->${to}:${type}`,
  from,
  to,
  type,
  strength
});
async function loadBerxWorld(api2, options = {}) {
  const entries = [];
  const failures = [];
  let viewerId;
  const attempt = async (source, run, use) => {
    try {
      use(await run());
    } catch (error) {
      failures.push({ source, message: error instanceof Error ? error.message : String(error) });
    }
  };
  await Promise.all([
    attempt("me", () => api2.me(), (me) => {
      const mapped = mapUserToSpatial(me);
      viewerId = mapped.object.id;
      entries.push(toEntry(mapped));
    }),
    attempt("feed", () => api2.feed(options.feedLimit ?? 24), (response) => {
      for (const item of response.items) entries.push(toEntry(mapFeedItemToSpatial(item)));
    }),
    attempt("friends", () => api2.friends(), (response) => {
      for (const friend of response.friends) entries.push(toEntry(mapFriendToSpatial(friend)));
    }),
    attempt("conversations", () => api2.conversations(), (response) => {
      for (const conversation of response.conversations) entries.push(toEntry(mapConversationToSpatial(conversation)));
    }),
    attempt("places", () => api2.places(), (response) => {
      for (const place of response.places) entries.push(toEntry(mapPlaceToSpatial(place)));
    }),
    attempt("events", () => api2.events(), (response) => {
      for (const event of response.events) entries.push(toEntry(mapEventToSpatial(event)));
    }),
    attempt("experiences", () => api2.experiences(), (response) => {
      for (const experience of response.experiences) entries.push(toEntry(mapExperienceToSpatial(experience)));
    }),
    attempt("communities", () => api2.communities(), (response) => {
      for (const community of response.communities) entries.push(toEntry(mapCommunityToSpatial(community)));
    }),
    attempt("collections", () => api2.collections(), (response) => {
      for (const collection of response.collections) entries.push(toEntry(mapCollectionToSpatial(collection)));
    }),
    /* NOW only where real coordinates were given. There is no
       location provider in this repository, so a caller that has no
       position simply has no NOW rather than a fabricated one. */
    options.near ? attempt("nearbyNow", () => api2.nearbyNow(options.near.lat, options.near.lng, options.near.radiusKm ?? 5), (now) => {
      const at = Date.now();
      for (const place of now.places) entries.push(toEntry(mapNearbyPlaceToSpatial(place, at)));
      for (const event of now.events) entries.push(toEntry(mapNearbyEventToSpatial(event)));
    }) : Promise.resolve()
  ]);
  if (viewerId) {
    for (const entry of entries) {
      if (entry.object.id === viewerId) continue;
      if (entry.object.kind === "person") {
        entry.relations = [...entry.relations ?? [], relation(viewerId, entry.object.id, "related", 0.85)];
      } else if (entry.object.kind === "message") {
        entry.relations = [...entry.relations ?? [], relation(viewerId, entry.object.id, "messages", 0.95)];
      }
    }
  }
  return { entries, viewerId, failures };
}
async function loadBerxConversation(api2, otherGuid, viewerId) {
  const entries = [];
  const failures = [];
  try {
    const { messages } = await api2.conversationWith(otherGuid);
    const otherId = berxSpatialId("person", otherGuid);
    for (const message of messages) {
      const mapped = mapMessageToSpatial(message);
      entries.push({
        object: mapped.object,
        relations: [
          ...mapped.relations,
          {
            id: `${mapped.object.id}->${otherId}:messages`,
            from: mapped.object.id,
            to: otherId,
            type: "messages",
            strength: 0.8
          }
        ],
        media: []
      });
    }
  } catch (error) {
    failures.push({ source: "conversationWith", message: error instanceof Error ? error.message : String(error) });
  }
  return { entries, viewerId, failures };
}

// packages/spatial-web/src/appShell.ts
init_src();

// packages/spatial-web/src/runtimeHost5d.ts
init_src();
init_threeRuntime();

// packages/spatial-web/src/runtimeQuality.ts
function resolveSpatialQuality(input) {
  const pixels = Math.max(1, input.width * input.height);
  const load = input.visibleObjectCount * Math.max(1, input.devicePixelRatio) / Math.sqrt(pixels / 1e6);
  if (input.reducedMotion) return { quality: "conservative", pixelRatio: Math.min(1.5, input.devicePixelRatio), maxObjects: 40, ambientMotion: false };
  if (load < 55 && input.devicePixelRatio <= 2.5) return { quality: "cinematic", pixelRatio: Math.min(2.25, input.devicePixelRatio), maxObjects: 120, ambientMotion: true };
  if (load < 110) return { quality: "high", pixelRatio: Math.min(2, input.devicePixelRatio), maxObjects: 100, ambientMotion: true };
  if (load < 180) return { quality: "balanced", pixelRatio: Math.min(1.75, input.devicePixelRatio), maxObjects: 80, ambientMotion: true };
  return { quality: "conservative", pixelRatio: Math.min(1.5, input.devicePixelRatio), maxObjects: 60, ambientMotion: false };
}

// packages/spatial-web/src/runtimeHost5d.ts
var prefersReducedMotion = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
var KIND_NAME = {
  person: "\u0447\u0435\u043B\u043E\u0432\u0435\u043A",
  moment: "\u043C\u043E\u043C\u0435\u043D\u0442",
  place: "\u043C\u0435\u0441\u0442\u043E",
  event: "\u0441\u043E\u0431\u044B\u0442\u0438\u0435",
  experience: "\u0432\u043F\u0435\u0447\u0430\u0442\u043B\u0435\u043D\u0438\u0435",
  community: "\u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u043E",
  business: "\u0431\u0438\u0437\u043D\u0435\u0441",
  collection: "\u043F\u043E\u0434\u0431\u043E\u0440\u043A\u0430",
  message: "\u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435",
  create: "\u0441\u043E\u0437\u0434\u0430\u0442\u044C"
};
var nameOf = (o) => o.label ?? KIND_NAME[o.kind];
function createBerx5DWebHost(options = {}) {
  const canvas = options.canvas ?? document.createElement("canvas");
  const owned = !options.canvas;
  if (owned) document.body.appendChild(canvas);
  canvas.style.display = "block";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.touchAction = "none";
  canvas.style.background = "#07080A";
  canvas.removeAttribute("aria-hidden");
  canvas.tabIndex = 0;
  canvas.setAttribute("role", "application");
  canvas.setAttribute("aria-label", options.ariaLabel ?? "\u041F\u0440\u043E\u0441\u0442\u0440\u0430\u043D\u0441\u0442\u0432\u043E BERX. \u0421\u0442\u0440\u0435\u043B\u043A\u0438 \u2014 \u043A \u0441\u043E\u0441\u0435\u0434\u043D\u0435\u043C\u0443 \u043E\u0431\u044A\u0435\u043A\u0442\u0443, Enter \u2014 \u043F\u0435\u0440\u0435\u043C\u0435\u0441\u0442\u0438\u0442\u044C\u0441\u044F \u043A \u043D\u0435\u043C\u0443, Escape \u2014 \u043D\u0430\u0437\u0430\u0434, L \u2014 \u043A \u0442\u043E\u043C\u0443, \u0447\u0442\u043E \u043F\u0440\u043E\u0438\u0441\u0445\u043E\u0434\u0438\u0442 \u0441\u0435\u0439\u0447\u0430\u0441, \u0437\u0430\u043F\u044F\u0442\u0430\u044F \u0438 \u0442\u043E\u0447\u043A\u0430 \u2014 \u043D\u0430\u0437\u0430\u0434 \u0438 \u0432\u043F\u0435\u0440\u0451\u0434 \u0432\u043E \u0432\u0440\u0435\u043C\u0435\u043D\u0438.");
  const live = document.createElement("div");
  live.setAttribute("aria-live", "polite");
  live.setAttribute("aria-atomic", "true");
  live.style.cssText = "position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0";
  (canvas.parentElement ?? document.body).appendChild(live);
  const announce = (text) => {
    live.textContent = text;
  };
  const motionQuery = typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : void 0;
  let reducedMotion = options.reducedMotion ?? prefersReducedMotion();
  const world = options.world;
  const runtime = world?.runtime ?? new Berx5DRuntime({ reducedMotion, deviceMotionEnabled: options.deviceMotion !== false });
  world?.setAccessibility({ reducedMotion });
  let renderer = options.renderer ?? new BerxThreeRuntimeRenderer(canvas, { textureBudget: options.textureBudget, onMediaError: options.onMediaError });
  const mediaByObject = /* @__PURE__ */ new Map();
  const pixelRatioCap = Math.max(1, options.pixelRatioCap ?? 2);
  let quality = { quality: "balanced", pixelRatio: 1, maxObjects: 80, ambientMotion: true };
  let raf = 0;
  let last = performance.now();
  let running = false;
  let contextAlive = true;
  let dragging = false;
  let lastX = 0, lastY = 0, downX = 0, downY = 0;
  let pinchDistance;
  let cssWidth = 1, cssHeight = 1;
  let lastAnnouncedId;
  const frameTimes = [];
  let lastFrameMs = 0;
  const visibleObjects = () => (world ? world.latestFrame : runtime.latestFrame).world.objects.filter((o) => o.visible);
  const applySize = () => {
    const nativeDpr = (typeof window !== "undefined" ? window.devicePixelRatio : 1) || 1;
    const baseDpr = Math.min(nativeDpr, pixelRatioCap);
    quality = resolveSpatialQuality({
      devicePixelRatio: baseDpr,
      width: Math.max(1, cssWidth),
      height: Math.max(1, cssHeight),
      reducedMotion,
      visibleObjectCount: visibleObjects().length
    });
    const dpr = Math.min(baseDpr, quality.pixelRatio);
    const width = Math.max(1, Math.round(cssWidth * dpr));
    const height = Math.max(1, Math.round(cssHeight * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      renderer.resize(width, height);
    }
  };
  let lastVisibleCount = -1;
  const syncQualityToLoad = () => {
    const count = visibleObjects().length;
    if (count === lastVisibleCount) return;
    lastVisibleCount = count;
    applySize();
  };
  const announceFocus = () => {
    const object = runtime.world.getActiveObject();
    if (object?.id === lastAnnouncedId) return;
    lastAnnouncedId = object?.id;
    options.onFocusChange?.(object);
    if (object) announce(`${nameOf(object)} \u0432 \u0444\u043E\u043A\u0443\u0441\u0435`);
  };
  const frame = (now) => {
    if (!running) return;
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1e3));
    lastFrameMs = now - last;
    last = now;
    frameTimes.push(lastFrameMs);
    if (frameTimes.length > 120) frameTimes.shift();
    if (contextAlive) {
      syncQualityToLoad();
      if (world) renderer.setAffordances(world.affordances());
      renderer.render(world ? world.frame(dt) : runtime.frame(dt), { maxObjects: quality.maxObjects, ambientMotion: quality.ambientMotion });
    } else {
      if (world) world.frame(dt);
      else runtime.frame(dt);
    }
    raf = requestAnimationFrame(frame);
  };
  const onPointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    dragging = true;
    lastX = downX = e.clientX;
    lastY = downY = e.clientY;
    canvas.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    runtime.input({ panX: -dx * 0.018, panY: dy * 0.018, depthDelta: 0, pinch: 0 });
  };
  const onPointerUp = (e) => {
    if (!dragging) return;
    dragging = false;
    canvas.releasePointerCapture?.(e.pointerId);
    if (Math.hypot(e.clientX - downX, e.clientY - downY) > 8) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = canvas.width / Math.max(1, rect.width);
    const x = (e.clientX - rect.left) * dpr;
    const y = (e.clientY - rect.top) * dpr;
    const frameState = world ? world.latestFrame : runtime.latestFrame;
    const ray = rayFromNdc(frameState.camera, x / canvas.width * 2 - 1, 1 - y / canvas.height * 2, canvas.width / canvas.height);
    const slot = ray && world ? pickActionSlot(renderer.actionSlots, frameState.camera, ray.direction, canvas.width / canvas.height) : void 0;
    if (slot && world) {
      announce(`${slot.affordance.label}\u2026`);
      void world.act(slot.affordance.id).then((done) => {
        announce(done ? `${slot.affordance.label}: \u0433\u043E\u0442\u043E\u0432\u043E` : `${slot.affordance.label}: \u043D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C`);
      }).catch((error) => {
        announce(error instanceof Error ? error.message : `${slot.affordance.label}: \u043D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C`);
      });
      return;
    }
    const hit = renderer.pick(frameState, x, y);
    if (hit && runtime.focus(hit.objectId)) announceFocus();
  };
  const onWheel = (e) => {
    e.preventDefault();
    runtime.input({ panX: 0, panY: 0, depthDelta: e.deltaY * 3e-3, pinch: 0 });
  };
  const onTouchStart = (e) => {
    if (e.touches.length === 2) pinchDistance = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
  };
  const onTouchMove = (e) => {
    if (e.touches.length !== 2 || pinchDistance === void 0) return;
    const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    runtime.input({ panX: 0, panY: 0, depthDelta: 0, pinch: (d - pinchDistance) * 0.03 });
    pinchDistance = d;
  };
  const onTouchEnd = () => {
    pinchDistance = void 0;
  };
  const onDeviceMotion = (e) => {
    if (reducedMotion) return;
    runtime.input({ panX: 0, panY: 0, depthDelta: 0, pinch: 0, motion: { pitch: (e.beta ?? 0) / 45, roll: (e.gamma ?? 0) / 45, yaw: (e.alpha ?? 0) / 180, intensity: 0.65 } });
  };
  const step = (dx, dy) => {
    const frameState = world ? world.latestFrame : runtime.latestFrame;
    const objects = frameState.world.objects.filter((o) => o.visible && o.focusable);
    if (objects.length === 0) return false;
    const current = runtime.world.getActiveObject();
    if (!current) return runtime.focus(objects[0].id);
    const basis = cameraBasis(frameState.camera);
    if (!basis) return false;
    const { right, up } = basis;
    let best;
    let bestScore = Infinity;
    for (const o of objects) {
      if (o.id === current.id) continue;
      const d = { x: o.transform.position.x - current.transform.position.x, y: o.transform.position.y - current.transform.position.y, z: o.transform.position.z - current.transform.position.z };
      const sx = d.x * right.x + d.y * right.y + d.z * right.z;
      const sy = d.x * up.x + d.y * up.y + d.z * up.z;
      const along = sx * dx + sy * dy;
      if (along <= 1e-3) continue;
      const off = Math.abs(sx * dy - sy * dx);
      const score = off * 2 + along;
      if (score < bestScore) {
        bestScore = score;
        best = o;
      }
    }
    if (!best) return false;
    return runtime.focus(best.id);
  };
  const onKeyDown = (e) => {
    let handled = true;
    switch (e.key) {
      case "ArrowRight":
        handled = step(1, 0);
        break;
      case "ArrowLeft":
        handled = step(-1, 0);
        break;
      case "ArrowUp":
        handled = step(0, 1);
        break;
      case "ArrowDown":
        handled = step(0, -1);
        break;
      case "Enter":
      case " ": {
        const object = runtime.world.getActiveObject();
        if (object) {
          if (world) world.travelTo(object.id);
          else runtime.enterWorld({ id: `${object.kind}:${object.id}`, focusObjectId: object.id, enteredAt: Date.now() });
          announce(`${nameOf(object)} \u2014 \u043A\u0430\u043C\u0435\u0440\u0430 \u043F\u0435\u0440\u0435\u043C\u0435\u0449\u0430\u0435\u0442\u0441\u044F`);
        } else handled = false;
        break;
      }
      case "Escape":
      case "Backspace":
        handled = world ? world.back() : runtime.back();
        if (handled) announce("\u041D\u0430\u0437\u0430\u0434");
        break;
      /* what is happening, from anywhere in the world */
      case "l":
      case "\u0434":
        if (world) {
          const wentLive = world.travelToLive();
          announce(wentLive ? "\u0421\u0435\u0439\u0447\u0430\u0441" : "\u0421\u0435\u0439\u0447\u0430\u0441 \u043D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u043F\u0440\u043E\u0438\u0441\u0445\u043E\u0434\u0438\u0442");
        } else handled = false;
        break;
      /* time is a direction you can move in, on the same keyboard */
      case ",":
      case "<":
        if (world) world.scrubTime(-86400);
        else handled = false;
        if (handled) announce("\u041D\u0430\u0437\u0430\u0434 \u0432\u043E \u0432\u0440\u0435\u043C\u0435\u043D\u0438 \u043D\u0430 \u0434\u0435\u043D\u044C");
        break;
      case ".":
      case ">":
        if (world) world.scrubTime(86400);
        else handled = false;
        if (handled) announce("\u0412\u043F\u0435\u0440\u0451\u0434 \u0432\u043E \u0432\u0440\u0435\u043C\u0435\u043D\u0438 \u043D\u0430 \u0434\u0435\u043D\u044C");
        break;
      default:
        handled = false;
    }
    if (handled) {
      e.preventDefault();
      announceFocus();
    }
  };
  const onContextLost = (e) => {
    e.preventDefault();
    contextAlive = false;
    renderer.handleContextLost();
    options.onContextChange?.("lost");
    announce("\u0413\u0440\u0430\u0444\u0438\u043A\u0430 \u043F\u0440\u0435\u0440\u0432\u0430\u043B\u0430\u0441\u044C. BERX \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442 \u0441\u0446\u0435\u043D\u0443.");
  };
  const onDeviceLost = async (reason) => {
    contextAlive = false;
    renderer.handleContextLost(reason);
    options.onContextChange?.("lost");
    announce("\u0413\u0440\u0430\u0444\u0438\u043A\u0430 \u043F\u0440\u0435\u0440\u0432\u0430\u043B\u0430\u0441\u044C. BERX \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442 \u0441\u0446\u0435\u043D\u0443.");
    if (!options.rendererFactory) return;
    try {
      const next = await options.rendererFactory();
      renderer.dispose();
      renderer = next;
      applySize();
      for (const [objectId, surfaces] of mediaByObject) renderer.setObjectMedia(objectId, surfaces);
      if (world) renderer.setAffordances(world.affordances());
      contextAlive = true;
      watchForDeviceLoss();
      options.onContextChange?.("restored");
      announce("\u0421\u0446\u0435\u043D\u0430 \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u0430.");
    } catch (error) {
      options.onMediaError?.("gpu:device", error);
    }
  };
  const watchForDeviceLoss = () => {
    const lost = renderer.whenLost;
    if (!lost) return;
    const mine = renderer;
    void lost.then((reason) => {
      if (renderer === mine) void onDeviceLost(reason);
    });
  };
  const onContextRestored = () => {
    contextAlive = true;
    applySize();
    options.onContextChange?.("restored");
    announce("\u0421\u0446\u0435\u043D\u0430 \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u0430.");
  };
  const onMotionPreferenceChange = (e) => {
    if (options.reducedMotion !== void 0) return;
    reducedMotion = e.matches;
    runtime.setAccessibility({ reducedMotion });
    world?.setAccessibility({ reducedMotion });
    applySize();
  };
  const observer = typeof ResizeObserver === "function" ? new ResizeObserver((entries) => {
    const box = entries[0]?.contentRect;
    if (!box) return;
    if (box.width === cssWidth && box.height === cssHeight) return;
    cssWidth = box.width;
    cssHeight = box.height;
    applySize();
  }) : void 0;
  const onWindowResize = () => {
    const rect = canvas.getBoundingClientRect();
    cssWidth = rect.width;
    cssHeight = rect.height;
    applySize();
  };
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  canvas.addEventListener("wheel", onWheel, { passive: false });
  canvas.addEventListener("touchstart", onTouchStart, { passive: true });
  canvas.addEventListener("touchmove", onTouchMove, { passive: true });
  canvas.addEventListener("touchend", onTouchEnd, { passive: true });
  canvas.addEventListener("keydown", onKeyDown);
  watchForDeviceLoss();
  canvas.addEventListener("webglcontextlost", onContextLost);
  canvas.addEventListener("webglcontextrestored", onContextRestored);
  if (observer) observer.observe(canvas);
  else window.addEventListener("resize", onWindowResize);
  motionQuery?.addEventListener?.("change", onMotionPreferenceChange);
  const wantsDeviceMotion = options.deviceMotion !== false && typeof window !== "undefined" && "DeviceOrientationEvent" in window;
  if (wantsDeviceMotion) window.addEventListener("deviceorientation", onDeviceMotion);
  onWindowResize();
  return {
    canvas,
    runtime,
    renderer,
    get quality() {
      return quality;
    },
    get contextAlive() {
      return contextAlive;
    },
    get performance() {
      const sorted = [...frameTimes].sort((a, b) => a - b);
      const stats = renderer.frameStats;
      return {
        frameMs: lastFrameMs,
        p95Ms: sorted.length > 0 ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))] : 0,
        visible: stats.visible,
        inFrustum: stats.inFrustum,
        drawCalls: stats.drawCalls,
        triangles: stats.triangles,
        lodReduced: stats.lodReduced,
        budgetCut: stats.budgetCut,
        residentTextures: stats.residentTextures,
        residentLabels: stats.residentLabels,
        quality: quality.quality
      };
    },
    world,
    ingest: (entries) => {
      if (!world) throw new Error("BERX 5D: this host has no world to ingest into");
      world.ingest(entries);
      for (const entry of entries) {
        mediaByObject.set(entry.object.id, entry.media ?? []);
        renderer.setObjectMedia(entry.object.id, entry.media ?? []);
      }
    },
    addObject: (object, media) => {
      runtime.registerObject(object);
      mediaByObject.set(object.id, media ?? []);
      renderer.setObjectMedia(object.id, media ?? []);
    },
    removeObject: (id) => {
      runtime.removeObject(id);
      mediaByObject.delete(id);
      renderer.forgetObjectMedia(id);
    },
    focus: (id) => {
      const ok = world ? world.focus(id) : runtime.focus(id);
      if (ok) announceFocus();
      return ok;
    },
    enterWorld: (id, sourceRoute, destination) => runtime.enterWorld({ id, sourceRoute, enteredAt: Date.now() }, destination),
    back: () => {
      const ok = world ? world.back() : runtime.back();
      if (ok) announceFocus();
      return ok;
    },
    start: () => {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    },
    stop: () => {
      running = false;
      cancelAnimationFrame(raf);
    },
    destroy: () => {
      running = false;
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
      canvas.removeEventListener("keydown", onKeyDown);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
      observer?.disconnect();
      if (!observer) window.removeEventListener("resize", onWindowResize);
      motionQuery?.removeEventListener?.("change", onMotionPreferenceChange);
      if (wantsDeviceMotion) window.removeEventListener("deviceorientation", onDeviceMotion);
      renderer.dispose();
      live.remove();
      if (owned) canvas.remove();
    }
  };
}

// packages/spatial-web/src/webRenderer.ts
async function createBerxWebRenderer(canvas, options = {}) {
  const prefer = options.prefer ?? "auto";
  if (prefer !== "webgl2") {
    const { BerxWebGPURuntimeRenderer: BerxWebGPURuntimeRenderer2, berxWebGPUCanvasPresentable: berxWebGPUCanvasPresentable2 } = await Promise.resolve().then(() => (init_webgpuRuntime(), webgpuRuntime_exports));
    const presentable = await berxWebGPUCanvasPresentable2();
    if (presentable.ok) {
      const webgpu = await BerxWebGPURuntimeRenderer2.create(canvas, options);
      if (webgpu) return webgpu;
    }
    if (prefer === "webgpu") {
      throw new Error(`BERX 5D: WebGPU was asked for and cannot draw here \u2014 ${presentable.reason ?? "this browser granted no device"}`);
    }
  }
  const { BerxThreeRuntimeRenderer: BerxThreeRuntimeRenderer2 } = await Promise.resolve().then(() => (init_threeRuntime(), threeRuntime_exports));
  return new BerxThreeRuntimeRenderer2(canvas, options);
}

// packages/spatial-web/src/appShell.ts
function describe(world) {
  const frame = world.latestFrame;
  const position = world.worldPosition;
  const byKind = /* @__PURE__ */ new Map();
  for (const object of frame.world.objects) byKind.set(object.kind, (byKind.get(object.kind) ?? 0) + 1);
  const inventory = [...byKind.entries()].sort((a, b) => b[1] - a[1]).map(([kind, n]) => `${kind}: ${n}`).join(", ");
  const focused = frame.world.activeObjectId ? frame.world.objects.find((o) => o.id === frame.world.activeObjectId) : void 0;
  const when = new Date(position.cursor.at * 1e3).toISOString().slice(0, 16).replace("T", " ");
  return [
    `\u041C\u0438\u0440 BERX: ${frame.world.objects.length} \u043E\u0431\u044A\u0435\u043A\u0442\u043E\u0432 (${inventory}).`,
    `\u041E\u0431\u043B\u0430\u0441\u0442\u044C: ${position.region}. \u0412\u0440\u0435\u043C\u044F: ${when}.`,
    focused ? `\u0412 \u0444\u043E\u043A\u0443\u0441\u0435: ${focused.label ?? focused.kind}.` : "\u041D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u0432 \u0444\u043E\u043A\u0443\u0441\u0435."
  ].join(" ");
}
async function startBerxApp(options) {
  const mount = options.mount ?? document.body;
  mount.style.margin = "0";
  mount.style.background = "#07080A";
  const notice = document.createElement("p");
  notice.setAttribute("role", "status");
  notice.setAttribute("aria-live", "polite");
  notice.style.cssText = "position:fixed;inset:auto 0 24px;margin:0;text-align:center;color:#A7ADB4;font:14px/1.5 system-ui,sans-serif";
  notice.textContent = "BERX \u0441\u043E\u0431\u0438\u0440\u0430\u0435\u0442 \u043C\u0438\u0440";
  mount.appendChild(notice);
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:fixed;inset:0;width:100%;height:100%;display:block";
  mount.appendChild(canvas);
  const world = new Berx5DWorldApp({
    reducedMotion: options.reducedMotion,
    cursor: berxTemporalCursor(),
    onAction: options.act,
    actionLabels: options.actionLabels,
    onPositionChange: (position) => {
      outline.textContent = describe(world);
      options.onPositionChange?.(position);
      options.remember?.(world.persist());
      void enterRegion(position);
    }
  });
  const outline = document.createElement("div");
  outline.setAttribute("role", "status");
  outline.setAttribute("aria-live", "polite");
  outline.style.cssText = "position:absolute;width:1px;height:1px;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap";
  mount.appendChild(outline);
  const buildRenderer = () => createBerxWebRenderer(canvas, {
    textureBudget: options.textureBudget,
    prefer: options.renderer ?? "auto"
  });
  const renderer = await buildRenderer();
  const host = createBerx5DWebHost({
    canvas,
    world,
    renderer,
    /* a lost GPU device costs pixels and nothing else: the world, the
       camera, the time cursor and the focus are in @berx/spatial, so
       a new backend picks up exactly where the old one stopped */
    rendererFactory: buildRenderer,
    reducedMotion: options.reducedMotion,
    textureBudget: options.textureBudget
  });
  const failures = [];
  const loadedRegions = /* @__PURE__ */ new Set();
  const enterRegion = async (position) => {
    if (!options.loadRegion) return;
    const key = `${position.region}:${position.focusId ?? ""}`;
    if (loadedRegions.has(key)) return;
    loadedRegions.add(key);
    const focused = position.focusId ? world.runtime.world.getObject(position.focusId) : void 0;
    const more = await options.loadRegion(position, focused).catch((error) => {
      failures.push({ source: `region:${key}`, message: error instanceof Error ? error.message : String(error) });
      return void 0;
    });
    if (!more) return;
    failures.push(...more.failures);
    if (more.entries.length > 0) {
      host.ingest(more.entries);
      outline.textContent = describe(world);
    }
  };
  const pull = async () => {
    const loaded = await options.load();
    failures.length = 0;
    failures.push(...loaded.failures);
    if (loaded.viewerId) world.setViewer(loaded.viewerId);
    host.ingest(loaded.entries);
    outline.textContent = describe(world);
    if (loaded.entries.length === 0) {
      notice.textContent = loaded.failures.length > 0 ? `BERX \u043D\u0435 \u0441\u043C\u043E\u0433 \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C: ${loaded.failures.map((f) => f.source).join(", ")}` : "\u0412 \u043C\u0438\u0440\u0435 \u043F\u043E\u043A\u0430 \u043F\u0443\u0441\u0442\u043E";
      notice.hidden = false;
    } else {
      notice.hidden = true;
    }
  };
  let composer;
  const compose = () => {
    if (composer || !options.publish) return;
    const form = document.createElement("form");
    composer = form;
    form.style.cssText = "position:fixed;left:50%;bottom:32px;transform:translateX(-50%);display:flex;gap:8px;width:min(560px,calc(100% - 48px))";
    const field = document.createElement("input");
    field.setAttribute("aria-label", "\u0427\u0442\u043E \u043F\u0440\u043E\u0438\u0441\u0445\u043E\u0434\u0438\u0442");
    field.placeholder = "\u0427\u0442\u043E \u043F\u0440\u043E\u0438\u0441\u0445\u043E\u0434\u0438\u0442";
    field.style.cssText = "flex:1;min-height:44px;padding:0 16px;border-radius:999px;border:1px solid #1C2228;background:#0D1014;color:#F2F0EB;font:inherit";
    const send = document.createElement("button");
    send.type = "submit";
    send.textContent = "\u041E\u043F\u0443\u0431\u043B\u0438\u043A\u043E\u0432\u0430\u0442\u044C";
    send.style.cssText = "min-height:44px;padding:0 18px;border-radius:999px;border:1px solid #1C2228;background:#15191E;color:#4FD6E8;font:inherit;cursor:pointer";
    const problem = document.createElement("p");
    problem.setAttribute("role", "alert");
    problem.style.cssText = "position:absolute;bottom:52px;left:0;margin:0;color:#FF5C72;font:14px/1.4 system-ui,sans-serif";
    form.append(field, send, problem);
    mount.appendChild(form);
    field.focus();
    const close = () => {
      form.remove();
      composer = void 0;
      canvas.focus();
    };
    field.addEventListener("keydown", (event) => {
      if (event.key === "Escape") close();
    });
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const text = field.value.trim();
      if (text.length === 0 || send.disabled) return;
      send.disabled = true;
      problem.textContent = "";
      try {
        const created = await options.publish(text);
        host.ingest([created]);
        outline.textContent = describe(world);
        close();
        world.travelTo(created.object.id);
      } catch (error) {
        problem.textContent = error instanceof Error ? error.message : "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u043F\u0443\u0431\u043B\u0438\u043A\u043E\u0432\u0430\u0442\u044C";
        send.disabled = false;
      }
    });
  };
  const onCompose = (event) => {
    if (event.key !== "n" && event.key !== "\u0442") return;
    if (composer) return;
    event.preventDefault();
    compose();
  };
  canvas.addEventListener("keydown", onCompose);
  await pull();
  const remembered = options.restore?.();
  if (remembered) {
    world.restore(remembered);
    outline.textContent = describe(world);
  }
  host.start();
  globalThis.__berxWorld = world;
  globalThis.__berxHost = host;
  return {
    host,
    world,
    failures,
    refresh: pull,
    compose,
    destroy: () => {
      canvas.removeEventListener("keydown", onCompose);
      composer?.remove();
      delete globalThis.__berxWorld;
      delete globalThis.__berxHost;
      host.destroy();
      notice.remove();
      outline.remove();
      canvas.remove();
    }
  };
}

// scripts/app-shell.entry.ts
var storage = {
  async getToken() {
    try {
      return localStorage.getItem("berx.token");
    } catch {
      return null;
    }
  },
  async setToken(token) {
    try {
      if (token === null) localStorage.removeItem("berx.token");
      else localStorage.setItem("berx.token", token);
    } catch {
    }
  }
};
var apiHost = document.documentElement.dataset.berxHost || location.origin;
var api = new BerxApiClient(apiHost, storage);
var gate = document.getElementById("berx-entry");
var gateError = document.getElementById("berx-entry-error");
var identifier = document.getElementById("berx-identifier");
var password = document.getElementById("berx-password");
var submit = document.getElementById("berx-enter");
async function enterWorld() {
  gate?.remove();
  await startBerxApp({
    load: () => loadBerxWorld(api, { feedLimit: 30 }),
    /**
     * Arriving at a conversation reads it.
     *
     * The first load brings the conversations a person has, not every
     * message in all of them — that would be reading the whole
     * account to show one world. Travelling into one is what fetches
     * its messages, and they land in the same world: the person you
     * are talking to is the entity that was already there.
     */
    loadRegion: async (position, focused) => {
      if (position.region !== "conversation" || focused?.kind !== "message") return void 0;
      const guid = Number(focused.sourceId);
      if (!Number.isFinite(guid) || focused.id.startsWith("message:m")) return void 0;
      return loadBerxConversation(api, guid);
    },
    /**
     * Publishing creates a real post and reads it back.
     *
     * `createPost` answers with a guid and nothing else, so the entity
     * that enters the world is built from what the server then
     * returns for that guid — not from the text that was typed, which
     * would be showing someone their own draft and calling it
     * published.
     */
    publish: async (text) => {
      const { guid } = await api.createPost(text);
      const post = await api.getPost(guid);
      const mapped = mapFeedItemToSpatial({
        guid: post.guid,
        text: post.text,
        owner_guid: post.owner_guid,
        owner_username: post.owner_username,
        time_created: post.time_created
      });
      return { object: mapped.object, relations: mapped.relations, media: mapped.media };
    },
    /**
     * Where this person was standing, kept for this browser only.
     *
     * The world's entities are never stored: they come from the
     * server every time, and a feed restored from disk would be a
     * world made of yesterday. What is kept is the place — camera
     * pose, region, focus, time, and the way back.
     */
    restore: () => {
      try {
        const raw = localStorage.getItem("berx.place");
        return raw ? JSON.parse(raw) : void 0;
      } catch {
        return void 0;
      }
    },
    remember: (state) => {
      try {
        localStorage.setItem("berx.place", JSON.stringify(state));
      } catch {
      }
    },
    /**
     * Actions, carried out on the server and read back.
     *
     * Only the ones BERX actually has an endpoint for. An affordance
     * with nothing behind it is a control that does nothing, so
     * anything not listed here throws rather than quietly succeeding
     * — and the world is updated from what the server returns, never
     * from what was asked for.
     */
    act: async (action, object) => {
      const guid = Number(object.sourceId);
      if (!Number.isFinite(guid)) throw new Error("BERX: \u044D\u0442\u043E\u0442 \u043E\u0431\u044A\u0435\u043A\u0442 \u043D\u0435 \u0441 \u0441\u0435\u0440\u0432\u0435\u0440\u0430");
      switch (action) {
        case "like": {
          await api.likePost(guid);
          const post = await api.getPost(guid);
          const mapped = mapFeedItemToSpatial({
            guid: post.guid,
            text: post.text,
            owner_guid: post.owner_guid,
            owner_username: post.owner_username,
            time_created: post.time_created
          });
          return { object: mapped.object, relations: mapped.relations, media: mapped.media };
        }
        case "attend": {
          await api.rsvpEvent(guid);
          const events = await api.events();
          const found = events.events.find((e) => e.guid === guid);
          if (!found) return void 0;
          const mapped = mapEventToSpatial(found);
          return { object: mapped.object, relations: mapped.relations, media: mapped.media };
        }
        case "save": {
          await api.savePlace(guid);
          const places = await api.places();
          const found = places.places.find((p) => p.guid === guid);
          if (!found) return void 0;
          const mapped = mapPlaceToSpatial(found);
          return { object: mapped.object, relations: mapped.relations, media: mapped.media };
        }
        case "join":
          await api.joinCommunity(guid);
          return void 0;
        default:
          throw new Error(`BERX: \xAB${action}\xBB \u043F\u043E\u043A\u0430 \u043D\u0435\u0442 \u043D\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0435`);
      }
    },
    actionLabels: {
      open: "\u041E\u0442\u043A\u0440\u044B\u0442\u044C",
      like: "\u041D\u0440\u0430\u0432\u0438\u0442\u0441\u044F",
      attend: "\u041F\u043E\u0439\u0434\u0443",
      save: "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C",
      join: "\u0412\u0441\u0442\u0443\u043F\u0438\u0442\u044C",
      share: "\u041F\u043E\u0434\u0435\u043B\u0438\u0442\u044C\u0441\u044F",
      message: "\u041D\u0430\u043F\u0438\u0441\u0430\u0442\u044C",
      follow: "\u041F\u043E\u0434\u043F\u0438\u0441\u0430\u0442\u044C\u0441\u044F",
      comment: "\u041A\u043E\u043C\u043C\u0435\u043D\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C",
      directions: "\u041C\u0430\u0440\u0448\u0440\u0443\u0442",
      reserve: "\u0417\u0430\u0431\u0440\u043E\u043D\u0438\u0440\u043E\u0432\u0430\u0442\u044C",
      reply: "\u041E\u0442\u0432\u0435\u0442\u0438\u0442\u044C",
      react: "\u0420\u0435\u0430\u043A\u0446\u0438\u044F"
    },
    textureBudget: 96
  });
}
async function boot() {
  const token = await storage.getToken();
  if (token) {
    await enterWorld();
    return;
  }
  if (!gate || !identifier || !password || !submit) return;
  gate.hidden = false;
  gate.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (submit.disabled) return;
    submit.disabled = true;
    if (gateError) gateError.textContent = "";
    try {
      const session = await api.login(identifier.value.trim(), password.value);
      await storage.setToken(session.token);
      await enterWorld();
    } catch (error) {
      if (gateError) gateError.textContent = error instanceof Error ? error.message : "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0432\u043E\u0439\u0442\u0438";
      submit.disabled = false;
    }
  });
}
void boot();
