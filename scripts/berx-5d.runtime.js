/* BERX MAX 5D runtime — GENERATED. Do not edit by hand. */

// packages/spatial/src/tokens.ts
var BERX_DEPTH_KEYS = ["D0", "D1", "D2", "D3", "D4", "D5"];
var BERX_DEPTH_ROLE = {
  D0: "substrate",
  D1: "environment",
  D2: "structure",
  D3: "content",
  D4: "controls",
  D5: "focus"
};
var BERX_DEPTH_TOKENS = {
  D0: { z: 0, parallax: 0 },
  D1: { z: 1, parallax: 0.15 },
  D2: { z: 2, parallax: 0.2 },
  D3: { z: 3, parallax: 0.35 },
  D4: { z: 4, parallax: 0.65 },
  D5: { z: 5, parallax: 1 }
};
var BERX_V9_COLOR = {
  bg: "#07080A",
  surface: "#101216",
  textPrimary: "#F5F8FA",
  textSecondary: "#A7B0B7",
  textMuted: "#6F7A82",
  accent: "#4FD6E8",
  accentSoft: "rgba(79,214,232,.14)",
  glass04: "rgba(255,255,255,.04)",
  glass06: "rgba(255,255,255,.06)",
  glass10: "rgba(255,255,255,.10)",
  danger: "#FF5C72",
  success: "#54E39A",
  warning: "#FFC857"
};
var BERX_V9_BLUR = { sm: 8, md: 16, lg: 28, xl: 40 };
var BERX_MAX_TILT_DEG = 2.5;
var BERX_V9_PERFORMANCE = {
  targetFps: 60,
  interactiveBudgetMs: 16.7,
  blurMaxLayersMobile: 3,
  simultaneous3DObjectsMobile: 80,
  videoAutoplayConcurrentMobile: 1
};
var BERX_MATERIALS = {
  ClearGlass: { transmission: 0.72, roughness: 0.18, specular: 0.7, ior: 1.2, emissive: 0 },
  DeepGlass: { transmission: 0.32, roughness: 0.24, specular: 0.55, ior: 1.18, emissive: 0 },
  FrostGlass: { transmission: 0.58, roughness: 0.42, specular: 0.42, ior: 1.18, emissive: 0 },
  Crystal: { transmission: 0.82, roughness: 0.1, specular: 0.9, ior: 1.35, emissive: 0.02 },
  DarkMetal: { transmission: 0, roughness: 0.28, specular: 0.82, ior: 1, emissive: 0 },
  Carbon: { transmission: 0, roughness: 0.62, specular: 0.25, ior: 1, emissive: 0 },
  LiquidGlass: { transmission: 0.76, roughness: 0.12, specular: 0.88, ior: 1.25, emissive: 0.04 },
  MediaSurface: { transmission: 0, roughness: 0.45, specular: 0.18, ior: 1, emissive: 0 },
  NeonEnergy: { transmission: 0.05, roughness: 0.1, specular: 0.9, ior: 1, emissive: 0.45 },
  SoftLight: { transmission: 0, roughness: 0.7, specular: 0.1, ior: 1, emissive: 0.1 }
};
var BERX_ENVIRONMENT_LIGHT = { ambient: 0.18, directional: 0.62, accent: 0.2 };
var BERX_LIGHT_RECIPES = {
  hero: { key: 0.55, rim: 0.25, ambient: 0.2 },
  card: { key: 0.35, rim: 0.12, ambient: 0.53 },
  active: { key: 0.42, rim: 0.38, ambient: 0.2 },
  modal: { key: 0.28, rim: 0.16, ambient: 0.56 }
};
var BERX_COLOR_WORLDS = {
  Turquoise: { accent: "#4FD6E8", energy: "cool", mood: "future / clarity" },
  Midnight: { accent: "#8BA8FF", energy: "deep", mood: "night / calm" },
  Crimson: { accent: "#FF5C72", energy: "warm", mood: "intense / expressive" },
  Orchid: { accent: "#B38CFF", energy: "creative", mood: "art / culture" },
  WineAsh: { accent: "#A56F83", energy: "muted", mood: "luxury / intimate" },
  Obsidian: { accent: "#C6D0D8", energy: "neutral", mood: "minimal / elite" }
};
var BERX_DEFAULT_COLOR_WORLD = "Turquoise";
var BERX_MOTION_PRESETS = {
  appear: {
    durationMs: 360,
    easing: "cubic-bezier(.22,1,.36,1)",
    bezier: [0.22, 1, 0.36, 1],
    from: { opacity: 0, translateY: 12, scale: 0.985 },
    to: { opacity: 1, translateY: 0, scale: 1 }
  },
  spatialEnter: {
    durationMs: 650,
    easing: "cubic-bezier(.16,1,.3,1)",
    bezier: [0.16, 1, 0.3, 1],
    from: { opacity: 0, translateZ: -24, scale: 0.96 },
    to: { opacity: 1, translateZ: 0, scale: 1 }
  },
  focus: {
    durationMs: 220,
    easing: "cubic-bezier(.2,.8,.2,1)",
    bezier: [0.2, 0.8, 0.2, 1],
    from: { scale: 1 },
    to: { scale: 1.025 }
  },
  exit: {
    durationMs: 220,
    easing: "ease-out",
    bezier: [0, 0, 0.58, 1],
    to: { opacity: 0, scale: 0.985 }
  },
  ambient: {
    durationMs: 4e3,
    easing: "ease-in-out",
    bezier: [0.42, 0, 0.58, 1],
    loop: true,
    delta: { translateY: 3 }
  },
  /** The reduced-motion substitute. Semantics kept, spatial travel dropped. */
  crossFade: {
    durationMs: 220,
    easing: "ease-out",
    bezier: [0, 0, 0.58, 1],
    from: { opacity: 0 },
    to: { opacity: 1 }
  }
};
var BERX_REDUCED_MOTION_RULES = {
  replaceParallaxWith: "crossFade",
  replaceTiltWith: "none",
  maxDurationMs: 220
};

// packages/spatial/src/color.ts
var HEX3 = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i;
var HEX6 = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;
var RGB_FN = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]*)\s*)?\)$/i;
function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}
function round(value, decimals = 3) {
  const f = Math.pow(10, decimals);
  return Math.round(value * f) / f;
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
function rgba(color, alpha) {
  const c = parseColor(color);
  const a = round(clamp(alpha, 0, 1));
  if (!c) return `rgba(255,255,255,${a})`;
  return `rgba(${Math.round(c.r)},${Math.round(c.g)},${Math.round(c.b)},${a})`;
}
function toCss(c) {
  return c.a >= 1 ? `rgb(${Math.round(c.r)},${Math.round(c.g)},${Math.round(c.b)})` : `rgba(${Math.round(c.r)},${Math.round(c.g)},${Math.round(c.b)},${round(c.a)})`;
}
function composite(top, bottom) {
  const a = top.a + bottom.a * (1 - top.a);
  if (a === 0) return { r: 0, g: 0, b: 0, a: 0 };
  return {
    r: (top.r * top.a + bottom.r * bottom.a * (1 - top.a)) / a,
    g: (top.g * top.a + bottom.g * bottom.a * (1 - top.a)) / a,
    b: (top.b * top.a + bottom.b * bottom.a * (1 - top.a)) / a,
    a
  };
}
function mix(a, b, t) {
  const ca = parseColor(a);
  const cb = parseColor(b);
  if (!ca || !cb) return a;
  const k = clamp(t, 0, 1);
  return toCss({
    r: ca.r + (cb.r - ca.r) * k,
    g: ca.g + (cb.g - ca.g) * k,
    b: ca.b + (cb.b - ca.b) * k,
    a: ca.a + (cb.a - ca.a) * k
  });
}
function channelLuminance(v) {
  const s = v / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}
function relativeLuminance(color) {
  const c = parseColor(color);
  if (!c) return 0;
  return 0.2126 * channelLuminance(c.r) + 0.7152 * channelLuminance(c.g) + 0.0722 * channelLuminance(c.b);
}
function contrastRatio(foreground, background) {
  const l1 = relativeLuminance(foreground);
  const l2 = relativeLuminance(background);
  const light = Math.max(l1, l2);
  const dark = Math.min(l1, l2);
  return round((light + 0.05) / (dark + 0.05), 2);
}
function flatten(over, ground) {
  const top = parseColor(over);
  const bottom = parseColor(ground);
  if (!top || !bottom) return ground;
  return toCss(composite(top, { ...bottom, a: 1 }));
}

// packages/spatial/src/atmosphere.ts
var BERX_FAMILY_ATMOSPHERE = {
  AUTH: "cinematic",
  HOME: "social",
  EXPLORE: "geographic",
  NOW: "geographic",
  PROFILE: "identity",
  SOCIAL: "social",
  MESSAGES: "conversational",
  PLACES: "location",
  EVENTS: "temporal",
  EXPERIENCE: "journey",
  COMMUNITY: "community",
  CREATOR: "immersive",
  BUSINESS: "location"
};
function berxAtmosphereForFamily(family) {
  return BERX_FAMILY_ATMOSPHERE[family];
}
function berxAtmospherePoolBudget(tier) {
  return tier === "high" ? 3 : tier === "medium" ? 2 : 1;
}
function berxTimeOfDay(date = /* @__PURE__ */ new Date()) {
  const h = date.getHours();
  if (h >= 5 && h < 8) return "dawn";
  if (h >= 8 && h < 17) return "day";
  if (h >= 17 && h < 21) return "dusk";
  return "night";
}
var TIME_LIGHT = {
  dawn: { warmth: 0.5, lift: 0.1, tint: "#FFC857" },
  day: { warmth: 0.2, lift: 0.14, tint: "#A7B0B7" },
  dusk: { warmth: 0.75, lift: 0.09, tint: "#FF5C72" },
  night: { warmth: 0, lift: 0.05, tint: "#8BA8FF" }
};
function pool(x, y, radius, color, depth = 1) {
  return { x: round(x, 3), y: round(y, 3), radius: round(radius, 3), color, depth: round(depth, 2) };
}
var KIND_LIGHT = {
  /* a window, high and to the left; interiors are lamplit */
  location: { angleDeg: 158, warmth: 0.45, contrast: 1.1 },
  /* one key light on one face, slightly warm, close and low-contrast */
  identity: { angleDeg: 196, warmth: 0.3, contrast: 0.85 },
  /* along the corridor, not down it, and cool */
  conversational: { angleDeg: 118, warmth: -0.2, contrast: 0.8 },
  /* the media is the light; the room only frames it */
  immersive: { angleDeg: 180, warmth: 0, contrast: 1.25 },
  /* wide, cold, high sun over a lot of ground */
  geographic: { angleDeg: 172, warmth: -0.55, contrast: 1.3 },
  /* dusk: the light is behind and to the right, and it is warm */
  temporal: { angleDeg: 208, warmth: 0.6, contrast: 1.2 },
  /* a hall with light from both sides */
  community: { angleDeg: 135, warmth: 0.15, contrast: 0.95 },
  /* distance: low sun, long throw, cold at the far end */
  journey: { angleDeg: 165, warmth: -0.35, contrast: 1.35 },
  /* a display case: raking light across the object */
  premium: { angleDeg: 142, warmth: 0.25, contrast: 1.15 },
  /* a steep entrance light from behind the viewer */
  cinematic: { angleDeg: 214, warmth: -0.1, contrast: 1.4 },
  /* even, social, slightly warm — a room with people in it */
  social: { angleDeg: 186, warmth: 0.2, contrast: 0.9 }
};
var COLD_LIGHT = "#8FB6FF";
var WARM_LIGHT = "#FFB27A";
function applyKindLight(sky, kind) {
  const signature = KIND_LIGHT[kind];
  const strength = kindTintStrength(kind);
  const tint = kindTint(kind);
  return {
    angleDeg: signature.angleDeg,
    stops: sky.stops.map((stop, index) => {
      const lit = index === 0;
      const parsed = parseColor(stop.color);
      const alpha = parsed ? parsed.a : 1;
      const scaled = clamp(alpha * (lit ? signature.contrast * 1.25 : 1 + (signature.contrast - 1) * 0.5), 0, 0.86);
      const color = lit && strength > 0 ? mix(stop.color, tint, strength) : stop.color;
      return { color: rgba(color, round(scaled, 4)), position: stop.position };
    })
  };
}
function lStar(color) {
  const y = relativeLuminance(color);
  return y > 216 / 24389 ? 116 * Math.cbrt(y) - 16 : y * (24389 / 27);
}
function capSkyToContent(sky, background, contentColor) {
  const ceiling = lStar(contentColor) - 1.5;
  const first = sky.stops[0];
  const parsed = parseColor(first.color);
  if (!parsed) return sky;
  if (lStar(flatten(first.color, background)) <= ceiling) return sky;
  let low = 0;
  let high = parsed.a;
  for (let i = 0; i < 14; i += 1) {
    const mid = (low + high) / 2;
    const composited = lStar(flatten(rgba(first.color, mid), background));
    if (composited > ceiling) high = mid;
    else low = mid;
  }
  return {
    angleDeg: sky.angleDeg,
    stops: sky.stops.map((stop, index) => index === 0 ? { color: rgba(stop.color, round(low, 4)), position: stop.position } : stop)
  };
}
function kindTint(kind) {
  return KIND_LIGHT[kind].warmth >= 0 ? WARM_LIGHT : COLD_LIGHT;
}
function kindTintStrength(kind) {
  return round(Math.min(0.55, Math.abs(KIND_LIGHT[kind].warmth) * 0.62), 4);
}
function resolveAtmosphere(input) {
  const accent = input.accent;
  const bg = input.background || BERX_V9_COLOR.bg;
  const intensity = clamp(input.intensity ?? 0.72, 0.2, 1);
  const flat = input.blurred === false;
  const gain = flat ? 1.45 : 1;
  const reduced = input.reducedMotion === true;
  const parallaxOk = input.allowParallax !== false && !reduced;
  const time = input.timeOfDay ?? berxTimeOfDay();
  const t = TIME_LIGHT[time];
  const a = (base) => round(clamp(base * intensity * gain * 1.35, 0, 0.75), 4);
  const skyTop = mix(bg, BERX_V9_COLOR.surface, 0.85);
  let sky;
  let pools;
  let ground = null;
  let vignette;
  let mediaRole;
  let mediaOpacity;
  let mediaScrim;
  let baseScrim;
  let parallaxScale;
  let drift;
  let description;
  switch (input.kind) {
    /**
     * Identity — Profile, Dating, Creator.
     * One person, one key light. The pool sits high and centred
     * where a face is, falls off fast, and the room behind is
     * close: identity scenes are intimate, not architectural.
     */
    case "identity":
      sky = {
        angleDeg: 180,
        stops: [
          { color: rgba(mix(skyTop, accent, 0.18), a(0.3)), position: 0 },
          { color: rgba(bg, a(0.12)), position: 0.55 },
          { color: rgba("#000000", a(0.34)), position: 1 }
        ]
      };
      pools = [
        pool(0.5, 0.22, 0.72, rgba(accent, a(0.2)), 0.8),
        pool(0.16, 0.08, 0.42, rgba(BERX_V9_COLOR.textPrimary, a(0.06)), 0.5)
      ];
      vignette = round(0.42 * gain, 3);
      mediaRole = "primary";
      mediaOpacity = round(0.55 * intensity + 0.1, 3);
      mediaScrim = 0.72;
      baseScrim = 0;
      parallaxScale = 0.8;
      drift = 3;
      description = "identity \u2014 a single key light on the person, close walls";
      break;
    /**
     * Location — Places, Business.
     * A room with a floor. The horizon is what makes a place a
     * place: the ground plane recedes, the far wall hazes, and
     * the cover photograph sits in that space rather than behind
     * a pane of glass.
     */
    case "location":
      sky = {
        angleDeg: 172,
        stops: [
          { color: rgba(mix(skyTop, t.tint, 0.22 * t.warmth + 0.08), a(0.32)), position: 0 },
          { color: rgba(mix(bg, accent, 0.1), a(0.14)), position: 0.5 },
          { color: rgba("#000000", a(0.3)), position: 1 }
        ]
      };
      pools = [
        pool(0.24, 0.18, 0.66, rgba(mix(accent, t.tint, t.warmth * 0.5), a(0.18)), 0.6),
        pool(0.86, 0.42, 0.5, rgba(BERX_V9_COLOR.textPrimary, a(0.05)), 0.9)
      ];
      ground = { horizon: 0.62, color: rgba(mix(bg, "#000000", 0.4), a(0.5)), haze: flat ? 0.3 : 0.55, edge: a(0.16) };
      vignette = round(0.36 * gain, 3);
      mediaRole = "primary";
      mediaOpacity = round(0.62 * intensity + 0.12, 3);
      mediaScrim = 0.66;
      baseScrim = 0;
      parallaxScale = 1;
      drift = 4;
      description = "location \u2014 ground plane, horizon haze, light from the entrance side";
      break;
    /**
     * Temporal — Events, Memories, Wrapped.
     * The sky is the clock. Dawn/day/dusk/night are read from
     * the device, so an evening event is lit like an evening.
     * A high horizon keeps the sky dominant: time is the
     * subject.
     */
    case "temporal":
      sky = {
        angleDeg: 178,
        stops: [
          { color: rgba(mix(mix(skyTop, t.tint, 0.34), accent, 0.16), a(0.16 + t.lift * 1.6)), position: 0 },
          { color: rgba(mix(bg, t.tint, 0.12), a(0.16)), position: 0.42 },
          { color: rgba("#000000", a(0.36)), position: 1 }
        ]
      };
      pools = [
        pool(0.72, 0.14, 0.8, rgba(t.tint, a(0.16 + t.warmth * 0.1)), 0.45),
        pool(0.2, 0.3, 0.46, rgba(accent, a(0.13)), 0.75)
      ];
      ground = { horizon: 0.78, color: rgba(mix(bg, "#000000", 0.55), a(0.44)), haze: 0.7, edge: a(0.12) };
      vignette = round(0.34 * gain, 3);
      mediaRole = "primary";
      mediaOpacity = round(0.6 * intensity + 0.1, 3);
      mediaScrim = 0.68;
      baseScrim = 0;
      parallaxScale = 0.9;
      drift = 5;
      description = `temporal \u2014 sky lit for ${time}, high horizon, time is the subject`;
      break;
    /**
     * Conversational — Messages.
     * No photograph. A conversation's environment is attention:
     * a narrow corridor of light down the middle of the thread,
     * darker at both edges, so the bubbles sit in a lit column.
     * Media here would compete with the thing being read.
     */
    case "conversational":
      sky = {
        angleDeg: 180,
        stops: [
          { color: rgba(mix(bg, accent, 0.08), a(0.18)), position: 0 },
          { color: rgba(mix(skyTop, accent, 0.12), a(0.22)), position: 0.4 },
          { color: rgba("#000000", a(0.28)), position: 1 }
        ]
      };
      pools = [
        pool(0.5, 0.46, 0.55, rgba(accent, a(0.15)), 0.35),
        pool(0.5, 0.02, 0.34, rgba(BERX_V9_COLOR.textPrimary, a(0.05)), 0.2)
      ];
      vignette = round(0.5 * gain, 3);
      mediaRole = "none";
      mediaOpacity = 0;
      mediaScrim = 0;
      baseScrim = 0;
      parallaxScale = 0.45;
      drift = 2;
      description = "conversational \u2014 a lit corridor down the thread, edges held back";
      break;
    /**
     * Immersive — Stories, video, the story viewer, creator work.
     * The media *is* the room. The lit sky recedes almost to
     * nothing, the vignette does the framing, and the scrim is
     * the minimum that keeps overlay text legible.
     */
    case "immersive":
      sky = {
        angleDeg: 180,
        stops: [
          { color: rgba("#000000", a(0.3)), position: 0 },
          { color: rgba(mix(bg, accent, 0.06), a(0.08)), position: 0.5 },
          { color: rgba("#000000", a(0.44)), position: 1 }
        ]
      };
      pools = [pool(0.5, 0.5, 0.95, rgba(accent, a(0.1)), 0.25)];
      vignette = round(0.58 * gain, 3);
      mediaRole = "primary";
      mediaOpacity = round(0.82 * intensity + 0.16, 3);
      mediaScrim = 0.4;
      baseScrim = 0;
      parallaxScale = 0.3;
      drift = 2;
      description = "immersive \u2014 the media is the room; framing by vignette, not by chrome";
      break;
    /**
     * Geographic — Explore, Nearby, NOW.
     * A living field: a wide low horizon, two pools at different
     * apparent distances so the ground moves at a different rate
     * from the sky, and the time of day colouring the whole
     * thing. This is the one that must feel *outdoors*.
     */
    case "geographic":
      sky = {
        angleDeg: 175,
        stops: [
          { color: rgba(mix(mix(skyTop, t.tint, 0.28), accent, 0.2), a(0.2 + t.lift)), position: 0 },
          { color: rgba(mix(bg, accent, 0.12), a(0.15)), position: 0.46 },
          { color: rgba("#000000", a(0.3)), position: 1 }
        ]
      };
      pools = [
        pool(0.14, 0.24, 0.6, rgba(accent, a(0.17)), 0.5),
        pool(0.82, 0.18, 0.54, rgba(t.tint, a(0.12 + t.warmth * 0.06)), 0.35),
        pool(0.6, 0.76, 0.7, rgba(mix(accent, bg, 0.5), a(0.12)), 1)
      ];
      ground = { horizon: 0.5, color: rgba(mix(bg, "#000000", 0.35), a(0.42)), haze: 0.75, edge: a(0.14) };
      vignette = round(0.3 * gain, 3);
      mediaRole = "supporting";
      mediaOpacity = round(0.48 * intensity + 0.08, 3);
      mediaScrim = 0.62;
      baseScrim = 0;
      parallaxScale = 1;
      drift = 6;
      description = `geographic \u2014 open field lit for ${time}, ground and sky at different distances`;
      break;
    /**
     * Community — Communities, Circles, Connections.
     * Several pools of comparable weight, overlapping. A
     * community is not one person and not one place; the light
     * has more than one source and they meet in the middle.
     */
    case "community":
      sky = {
        angleDeg: 180,
        stops: [
          { color: rgba(mix(skyTop, accent, 0.16), a(0.24)), position: 0 },
          { color: rgba(bg, a(0.12)), position: 0.5 },
          { color: rgba("#000000", a(0.3)), position: 1 }
        ]
      };
      pools = [
        pool(0.26, 0.2, 0.5, rgba(accent, a(0.15)), 0.65),
        pool(0.74, 0.3, 0.5, rgba(mix(accent, BERX_V9_COLOR.textPrimary, 0.35), a(0.12)), 0.8),
        pool(0.5, 0.62, 0.56, rgba(accent, a(0.1)), 1)
      ];
      vignette = round(0.38 * gain, 3);
      mediaRole = "supporting";
      mediaOpacity = round(0.5 * intensity + 0.1, 3);
      mediaScrim = 0.68;
      baseScrim = 0;
      parallaxScale = 0.85;
      drift = 4;
      description = "community \u2014 several light sources of equal weight, meeting";
      break;
    /**
     * Journey — Trips, Experiences.
     * Perspective is the point. A low vanishing pool, a hard-ish
     * horizon and the strongest parallax in the system: the
     * scene should read as somewhere you are going.
     */
    case "journey":
      sky = {
        angleDeg: 176,
        stops: [
          { color: rgba(mix(mix(skyTop, t.tint, 0.2), accent, 0.14), a(0.26)), position: 0 },
          { color: rgba(mix(bg, accent, 0.08), a(0.12)), position: 0.52 },
          { color: rgba("#000000", a(0.34)), position: 1 }
        ]
      };
      pools = [
        pool(0.5, 0.54, 0.34, rgba(mix(accent, t.tint, t.warmth * 0.4), a(0.22)), 0.3),
        pool(0.5, 0.95, 0.8, rgba(bg, a(0.3)), 1)
      ];
      ground = { horizon: 0.54, color: rgba(mix(bg, "#000000", 0.45), a(0.46)), haze: 0.4, edge: a(0.2) };
      vignette = round(0.4 * gain, 3);
      mediaRole = "primary";
      mediaOpacity = round(0.58 * intensity + 0.1, 3);
      mediaScrim = 0.66;
      baseScrim = 0;
      parallaxScale = 1;
      drift = 5;
      description = "journey \u2014 vanishing point on the horizon, strongest parallax in the system";
      break;
    /**
     * Premium — Wallet, Points, Rewards, Tickets.
     * A dark object under a specular sweep. No horizon, no
     * outdoors: this is a lit display case. The sweep is a
     * narrow, high-specular band rather than a soft pool, which
     * is what makes metal read as metal.
     */
    case "premium":
      sky = {
        angleDeg: 150,
        stops: [
          { color: rgba(mix(bg, BERX_V9_COLOR.textPrimary, 0.1), a(0.22)), position: 0 },
          { color: rgba(mix(accent, BERX_V9_COLOR.textPrimary, 0.4), a(0.16)), position: 0.34 },
          { color: rgba(bg, a(0.1)), position: 0.62 },
          { color: rgba("#000000", a(0.4)), position: 1 }
        ]
      };
      pools = [
        pool(0.82, 0.1, 0.44, rgba(BERX_V9_COLOR.textPrimary, a(0.09)), 0.4),
        pool(0.3, 0.7, 0.5, rgba(accent, a(0.12)), 0.9)
      ];
      vignette = round(0.48 * gain, 3);
      mediaRole = "none";
      mediaOpacity = 0;
      mediaScrim = 0;
      baseScrim = 0;
      parallaxScale = 0.6;
      drift = 3;
      description = "premium \u2014 specular sweep across a dark object in a lit case";
      break;
    /**
     * Cinematic — Auth, Onboarding, Welcome.
     * First entry into BERX. Deep vertical falloff, a single
     * distant key, the widest vignette in the system. Nothing
     * competes with the first thing the person is asked to do.
     */
    case "cinematic":
      sky = {
        angleDeg: 180,
        stops: [
          { color: rgba(mix(bg, accent, 0.2), a(0.34)), position: 0 },
          { color: rgba(mix(bg, accent, 0.06), a(0.14)), position: 0.38 },
          { color: rgba("#000000", a(0.42)), position: 1 }
        ]
      };
      pools = [
        pool(0.5, 0.12, 0.9, rgba(accent, a(0.22)), 0.3),
        pool(0.5, 0.88, 0.6, rgba(mix(accent, bg, 0.6), a(0.14)), 0.7)
      ];
      vignette = round(0.54 * gain, 3);
      mediaRole = "none";
      mediaOpacity = 0;
      mediaScrim = 0;
      baseScrim = 0;
      parallaxScale = 0.5;
      drift = 4;
      description = "cinematic \u2014 one distant key, deep falloff, nothing competing with the ask";
      break;
    /**
     * Social — Home, Feed, Search, Settings and everything whose
     * subject is a list of other things. A calm, evenly lit room
     * with a soft ceiling: it must recede, because the content
     * on it is heterogeneous and carries its own media.
     */
    case "social":
    default:
      sky = {
        angleDeg: 180,
        stops: [
          { color: rgba(mix(skyTop, accent, 0.12), a(0.22)), position: 0 },
          { color: rgba(bg, a(0.1)), position: 0.52 },
          { color: rgba("#000000", a(0.26)), position: 1 }
        ]
      };
      pools = [
        pool(0.2, 0.12, 0.62, rgba(accent, a(0.13)), 0.55),
        pool(0.88, 0.68, 0.56, rgba(mix(accent, BERX_V9_COLOR.textPrimary, 0.3), a(0.08)), 0.9)
      ];
      vignette = round(0.32 * gain, 3);
      mediaRole = "supporting";
      mediaOpacity = round(0.46 * intensity + 0.08, 3);
      mediaScrim = 0.66;
      baseScrim = 0;
      parallaxScale = 0.75;
      drift = 3;
      description = "social \u2014 an evenly lit room that recedes behind heterogeneous content";
      break;
  }
  if (input.bounded) {
    ground = null;
    vignette = round(vignette * 0.8, 3);
  }
  sky = applyKindLight(sky, input.kind);
  if (input.contentColor) sky = capSkyToContent(sky, bg, input.contentColor);
  const lampTint = kindTint(input.kind);
  const lampStrength = kindTintStrength(input.kind) * 0.42;
  if (lampStrength > 0) {
    pools = pools.map((p) => ({ ...p, color: mix(p.color, lampTint, lampStrength) }));
  }
  const poolBudget = Math.max(1, input.maxPools ?? pools.length);
  if (pools.length > poolBudget) {
    pools = [...pools].sort((p1, p2) => alphaOf(p2.color) - alphaOf(p1.color)).slice(0, poolBudget).sort((p1, p2) => p1.depth - p2.depth);
  }
  if (input.hasMedia && mediaRole !== "none") {
    pools = pools.map((p) => ({ ...p, color: fade(p.color, 0.7) }));
    vignette = round(clamp(vignette * 1.1, 0, 0.7), 3);
  }
  return {
    kind: input.kind,
    sky,
    pools,
    ground,
    vignette: round(clamp(vignette, 0, 0.7), 3),
    mediaRole,
    mediaOpacity: input.hasMedia ? round(clamp(mediaOpacity, 0, 1), 3) : 0,
    mediaScrim: input.hasMedia ? mediaScrim : 0,
    baseScrim,
    parallaxScale: parallaxOk ? parallaxScale : 0,
    driftPx: reduced ? 0 : drift,
    description,
    compensatedForFlatness: flat
  };
}
function fade(color, factor) {
  const m = /^rgba\(([^,]+),([^,]+),([^,]+),([^)]+)\)$/.exec(color.replace(/\s/g, ""));
  if (!m) return color;
  return `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${round(clamp(Number(m[4]) * factor, 0, 1), 4)})`;
}
function alphaOf(color) {
  const m = /rgba\([^,]+,[^,]+,[^,]+,([^)]+)\)/.exec(color.replace(/\s/g, ""));
  return m ? Number(m[1]) : 1;
}
function berxIlluminationAt(atmosphere, x, y) {
  const px = clamp(x, 0, 1);
  const py = clamp(y, 0, 1);
  let light = 0;
  for (const p of atmosphere.pools) {
    const dx = px - p.x;
    const dy = py - p.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const reach = Math.max(1e-3, p.radius);
    if (distance >= reach) continue;
    const t = 1 - distance / reach;
    light += t * t * clamp(p.depth, 0.2, 1);
  }
  const cx = px - 0.5;
  const cy = py - 0.5;
  const fromCentre = Math.min(1, Math.sqrt(cx * cx + cy * cy) / 0.7071);
  const walls = atmosphere.vignette * fromCentre * fromCentre;
  const bounce = atmosphere.ground && py > atmosphere.ground.horizon ? 0.12 * (1 - atmosphere.ground.haze) : 0;
  return round(clamp(0.5 + light * 0.55 - walls * 0.4 + bounce, 0.15, 1), 4);
}
function berxRoomColorAt(atmosphere, background, x, y) {
  const px = clamp(x, 0, 1);
  const py = clamp(y, 0, 1);
  let color = background;
  const rad = atmosphere.sky.angleDeg * Math.PI / 180;
  const axis = clamp(0.5 + (px - 0.5) * Math.sin(rad) - (py - 0.5) * Math.cos(rad), 0, 1);
  const stops = atmosphere.sky.stops;
  for (let i = 0; i < stops.length - 1; i += 1) {
    const from = stops[i];
    const to = stops[i + 1];
    if (axis > to.position && i < stops.length - 2) continue;
    const span = Math.max(1e-4, to.position - from.position);
    const t = clamp((axis - from.position) / span, 0, 1);
    color = flatten(mixTranslucent(from.color, to.color, t), color);
    break;
  }
  for (const p of atmosphere.pools) {
    const dx = px - p.x;
    const dy = py - p.y;
    const reach = Math.max(1e-3, p.radius);
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance >= reach) continue;
    const t = 1 - distance / reach;
    color = flatten(scaleAlpha(p.color, t * t * clamp(p.depth, 0.2, 1)), color);
  }
  if (atmosphere.ground && py > atmosphere.ground.horizon) {
    const depth = clamp((py - atmosphere.ground.horizon) / Math.max(1e-4, 1 - atmosphere.ground.horizon), 0, 1);
    color = flatten(scaleAlpha(atmosphere.ground.color, depth * (1 - atmosphere.ground.haze * 0.5)), color);
  }
  const cx = px - 0.5;
  const cy = py - 0.5;
  const fromCentre = Math.min(1, Math.sqrt(cx * cx + cy * cy) / 0.7071);
  const wall = atmosphere.vignette * fromCentre * fromCentre;
  if (wall > 1e-3) color = flatten(rgba("#000000", round(clamp(wall, 0, 0.9), 4)), color);
  return color;
}
function mixTranslucent(from, to, t) {
  const a = parseColor(from);
  const b = parseColor(to);
  if (!a || !b) return from;
  return rgba(mix(from, to, t), round(a.a + (b.a - a.a) * t, 4));
}
function scaleAlpha(color, factor) {
  const parsed = parseColor(color);
  if (!parsed) return color;
  return rgba(color, round(clamp(parsed.a * factor, 0, 1), 4));
}

// packages/spatial/src/materials.ts
var BERX_MIN_TEXT_CONTRAST = 4.5;
function fillAlpha(m) {
  if (m.transmission <= 0) return 1;
  return round(clamp(0.03 + (1 - m.transmission) * 0.16, 0.03, 0.34));
}
function blurRadius(m) {
  if (m.transmission <= 0.02) return 0;
  const scaled = BERX_V9_BLUR.sm + m.roughness * (BERX_V9_BLUR.xl - BERX_V9_BLUR.sm) * 1.15;
  return Math.round(clamp(scaled, BERX_V9_BLUR.sm, BERX_V9_BLUR.xl));
}
function borderAlpha(m) {
  return round(clamp(0.05 + m.specular * 0.11, 0.05, 0.18));
}
function edgeAlpha(m) {
  return round(clamp(0.06 + m.specular * 0.18, 0.06, 0.26));
}
function rim(m) {
  const delta = m.ior - 1;
  if (delta <= 1e-3) return { width: 0, alpha: 0 };
  return {
    width: round(clamp(delta * 4, 0.5, 1.6), 2),
    alpha: round(clamp(delta * 0.7 + m.specular * 0.08, 0.06, 0.3))
  };
}
function resolveMaterial(input) {
  const spec = BERX_MATERIALS[input.material];
  const accent = input.accent ?? BERX_V9_COLOR.accent;
  const ground = input.ground ?? BERX_V9_COLOR.bg;
  const blurAvailable = input.blurBudgetAvailable !== false && !input.forceOpaque;
  const blurPx = blurAvailable ? blurRadius(spec) : 0;
  const wantsOpaque = input.forceOpaque === true || spec.transmission <= 0 || blurPx === 0 && spec.transmission > 0;
  const lift = clamp(input.elevation ?? 0.6, 0, 1);
  const elevationTint = 0.028 + lift * 0.128;
  const materialShift = 0.94 + Math.min(fillAlpha(spec), 0.34) / 0.34 * 0.12;
  const tint = round(clamp(elevationTint * materialShift, 0.015, 0.44), 4);
  const translucentFill = rgba(BERX_V9_COLOR.textPrimary, tint);
  const opaqueFill = flatten(translucentFill, ground);
  const backgroundColor = wantsOpaque ? opaqueFill : translucentFill;
  const effectiveColor = wantsOpaque ? opaqueFill : flatten(translucentFill, ground);
  const r = rim(spec);
  return {
    material: input.material,
    backgroundColor,
    blurPx: wantsOpaque ? 0 : blurPx,
    borderColor: rgba(BERX_V9_COLOR.textPrimary, borderAlpha(spec)),
    borderWidth: 1,
    edgeHighlightColor: rgba(BERX_V9_COLOR.textPrimary, edgeAlpha(spec)),
    rimWidth: r.width,
    rimColor: rgba(accent, r.alpha),
    glowColor: spec.emissive > 0 ? rgba(accent, round(clamp(spec.emissive * 0.8, 0, 0.42))) : "transparent",
    glowRadius: spec.emissive > 0 ? Math.round(clamp(spec.emissive * 64, 0, 42)) : 0,
    opaqueFallback: wantsOpaque,
    textContrast: contrastRatio(BERX_V9_COLOR.textPrimary, effectiveColor),
    effectiveColor,
    translucentColor: translucentFill
  };
}
function ensureReadableSurface(input) {
  const surface = resolveMaterial(input);
  if (surface.textContrast >= BERX_MIN_TEXT_CONTRAST) return surface;
  return resolveMaterial({ ...input, forceOpaque: true });
}

// packages/spatial/src/lighting.ts
function depthShadow(depthZ, keyIntensity) {
  const z = clamp(depthZ, 0, 5);
  return {
    color: rgba("#000000", round(clamp(0.14 + z * 0.07 * (0.6 + keyIntensity * 0.8), 0, 0.62))),
    radius: Math.round(6 + z * 11),
    offsetY: Math.round(2 + z * 4),
    elevation: Math.round(z * 3)
  };
}
function resolveLighting(input) {
  const recipe = BERX_LIGHT_RECIPES[input.recipe];
  const accent = input.accent ?? BERX_V9_COLOR.accent;
  const intensity = clamp(input.intensity ?? 1, 0, 1);
  const key = recipe.key * intensity * BERX_ENVIRONMENT_LIGHT.directional;
  const rim2 = recipe.rim * intensity;
  const ambient = recipe.ambient * BERX_ENVIRONMENT_LIGHT.ambient;
  return {
    recipe: input.recipe,
    key: {
      /**
       * 165° rather than a flat 180° so the key reads as a light
       * arriving from upper-left, consistent across every scene —
       * a scene whose lights disagree stops looking like a space.
       */
      angleDeg: 165,
      stops: [
        { color: rgba(BERX_V9_COLOR.textPrimary, round(clamp(key * 0.16, 0, 0.14))), position: 0 },
        { color: rgba(BERX_V9_COLOR.textPrimary, round(clamp(key * 0.05, 0, 0.05))), position: 0.55 },
        { color: "rgba(255,255,255,0)", position: 1 }
      ]
    },
    rimColor: rgba(BERX_V9_COLOR.textPrimary, round(clamp(0.05 + rim2 * 0.32, 0.05, 0.34))),
    rimWidth: rim2 > 0.3 ? 1.5 : 1,
    ambientColor: rgba(BERX_V9_COLOR.surface, round(clamp(ambient, 0, 0.14))),
    shadow: depthShadow(input.depthZ, recipe.key),
    accentGlow: rgba(accent, round(clamp(BERX_ENVIRONMENT_LIGHT.accent * intensity * rim2 * 1.6, 0, 0.24)))
  };
}
function depthLightIntensity(depth) {
  switch (depth) {
    case "D0":
      return 0.25;
    case "D1":
      return 0.4;
    case "D2":
      return 0.75;
    case "D3":
      return 1;
    case "D4":
      return 1;
    case "D5":
      return 1;
  }
}

// packages/spatial/src/camera.ts
function depthUnitPx(perspectivePx, fovDeg) {
  const halfAngle = clamp(fovDeg, 10, 120) / 2 * (Math.PI / 180);
  const spread = Math.tan(halfAngle);
  return round(clamp(perspectivePx * 0.04 / (0.5 + Math.max(spread, 0.09)), 6, 72), 2);
}
function resolveCamera(input) {
  const { contract } = input;
  const perspectiveEnabled = input.allow3D !== false;
  const reduced = input.reducedMotion === true;
  return {
    perspectivePx: contract.perspectivePx,
    fovDeg: contract.fovDeg,
    /**
     * Origin is viewport-centre horizontally (scene graph schema)
     * but slightly above centre vertically: content sits in the
     * upper two thirds on a phone, and a centred origin would tilt
     * the hero away from the reader.
     */
    originX: round(input.viewportWidth / 2, 1),
    originY: round(input.viewportHeight * 0.42, 1),
    depthUnitPx: perspectiveEnabled ? depthUnitPx(contract.perspectivePx, contract.fovDeg) : 0,
    maxTiltDeg: reduced || !perspectiveEnabled ? 0 : round(clamp(Math.abs(contract.tiltDeg) || BERX_MAX_TILT_DEG, 0, BERX_MAX_TILT_DEG), 2),
    perspectiveEnabled
  };
}
function perspectiveScale(translateZ, perspectivePx) {
  if (perspectivePx <= 0) return 1;
  const denominator = perspectivePx - translateZ;
  if (denominator <= 1) return 1;
  return round(clamp(perspectivePx / denominator, 0.5, 1.6), 4);
}
function tiltFromPointer(offsetX, offsetY, camera) {
  if (camera.maxTiltDeg === 0) return { rotateXDeg: 0, rotateYDeg: 0 };
  return {
    rotateXDeg: round(clamp(-offsetY, -1, 1) * camera.maxTiltDeg, 3),
    rotateYDeg: round(clamp(offsetX, -1, 1) * camera.maxTiltDeg, 3)
  };
}

// packages/spatial/src/motion.ts
function stripSpatial(preset) {
  const strip = (t) => {
    if (!t) return t;
    const { translateZ: _dropped, ...rest } = t;
    return rest;
  };
  return { ...preset, from: strip(preset.from), to: strip(preset.to), delta: strip(preset.delta) };
}
function resolveMotion(input) {
  const requested = input.preset;
  const preset = BERX_MOTION_PRESETS[requested];
  if (input.reducedMotion) {
    if (requested === "ambient") {
      return {
        ...BERX_MOTION_PRESETS.crossFade,
        durationMs: 0,
        name: "crossFade",
        substitutedFor: "ambient",
        adapted: true,
        reason: "reduced motion: ambient loops removed entirely"
      };
    }
    if (requested === "crossFade") {
      return { ...preset, name: requested, adapted: false };
    }
    return {
      ...BERX_MOTION_PRESETS.crossFade,
      durationMs: Math.min(preset.durationMs, BERX_REDUCED_MOTION_RULES.maxDurationMs),
      name: BERX_REDUCED_MOTION_RULES.replaceParallaxWith,
      substitutedFor: requested,
      adapted: true,
      reason: "reduced motion: spatial travel replaced by cross-fade"
    };
  }
  if (requested === "ambient" && input.budget?.allowAmbientMotion === false) {
    return {
      ...BERX_MOTION_PRESETS.ambient,
      durationMs: 0,
      loop: false,
      delta: void 0,
      name: "ambient",
      adapted: true,
      reason: "performance budget: ambient loop suspended"
    };
  }
  if (input.budget?.allow3D === false) {
    return {
      ...stripSpatial(preset),
      name: requested,
      adapted: true,
      reason: "performance budget: z travel flattened to opacity/scale"
    };
  }
  return { ...preset, name: requested, adapted: false };
}
function planSharedElementFlip(from, to, reducedMotion) {
  const spatial = BERX_MOTION_PRESETS.spatialEnter;
  const fade2 = BERX_MOTION_PRESETS.crossFade;
  if (reducedMotion) {
    return {
      translateX: 0,
      translateY: 0,
      scaleX: 1,
      scaleY: 1,
      durationMs: Math.min(fade2.durationMs, BERX_REDUCED_MOTION_RULES.maxDurationMs),
      easing: fade2.easing,
      bezier: fade2.bezier,
      travels: false
    };
  }
  const scaleX = to.width > 0 ? round(from.width / to.width, 4) : 1;
  const scaleY = to.height > 0 ? round(from.height / to.height, 4) : 1;
  return {
    /* centre-to-centre, so the transform is independent of transform-origin */
    translateX: round(from.x + from.width / 2 - (to.x + to.width / 2), 2),
    translateY: round(from.y + from.height / 2 - (to.y + to.height / 2), 2),
    scaleX,
    scaleY,
    durationMs: spatial.durationMs,
    easing: spatial.easing,
    bezier: spatial.bezier,
    travels: true
  };
}
function parallaxOffset(scrollY, parallaxFactor, enabled, maxOffsetPx = 120) {
  if (!enabled || parallaxFactor === 0) return 0;
  const offset = scrollY * (1 - clamp(parallaxFactor, 0, 1)) * -0.35;
  return round(clamp(offset, -maxOffsetPx, maxOffsetPx), 2);
}

// packages/spatial/src/performance.ts
var WATCH_BUDGET = {
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
var ARVR_BUDGET = {
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
function resolvePerformanceTier(signals) {
  if (signals.platform === "watch") return { tier: "low", reason: "watch platform: depth is simulated, never composited" };
  if (signals.platform === "arvr") {
    return { tier: "medium", reason: "headset: real volumetric depth, but two eyes at 72Hz+" };
  }
  if (signals.measuredFps !== void 0 && signals.measuredFps > 0) {
    if (signals.measuredFps < 45) return { tier: "low", reason: `measured ${Math.round(signals.measuredFps)}fps below 45` };
    if (signals.measuredFps < 55) return { tier: "medium", reason: `measured ${Math.round(signals.measuredFps)}fps below 55` };
  }
  if (signals.saveData) return { tier: "low", reason: "Save-Data requested by the user agent" };
  const mem = signals.deviceMemoryGb;
  const cores = signals.logicalCores;
  const dpr = signals.pixelRatio ?? 1;
  if (mem !== void 0 && mem <= 2) return { tier: "low", reason: `deviceMemory ${mem}GB` };
  if (cores !== void 0 && cores <= 2) return { tier: "low", reason: `${cores} logical cores` };
  if (mem !== void 0 && mem <= 4 && dpr >= 3) return { tier: "medium", reason: `deviceMemory ${mem}GB at ${dpr}x` };
  if (mem !== void 0 && mem <= 4) return { tier: "medium", reason: `deviceMemory ${mem}GB` };
  if (cores !== void 0 && cores <= 4) return { tier: "medium", reason: `${cores} logical cores` };
  if (signals.platform === "desktop" || signals.platform === "tablet") {
    return { tier: "high", reason: `${signals.platform} with no low-capability signal` };
  }
  if (mem === void 0 && cores === void 0) {
    return { tier: "medium", reason: "no capability signals exposed; conservative default" };
  }
  return { tier: "high", reason: "capability signals above every low/medium threshold" };
}
function resolvePerformanceBudget(signals) {
  if (signals.platform === "watch") {
    return { ...WATCH_BUDGET, reason: "watch platform: depth is simulated, never composited" };
  }
  if (signals.platform === "arvr") {
    return { ...ARVR_BUDGET, reason: "headset: depth kept in full, screen-space effects dropped for the frame budget" };
  }
  const { tier, reason } = resolvePerformanceTier(signals);
  const reduced = signals.prefersReducedMotion === true;
  const desktopClass = signals.platform === "desktop" || signals.platform === "tablet";
  const base = tier === "low" ? {
    tier,
    targetFps: BERX_V9_PERFORMANCE.targetFps,
    frameBudgetMs: BERX_V9_PERFORMANCE.interactiveBudgetMs,
    maxBlurLayers: 0,
    allow3D: false,
    allowAmbientMotion: false,
    allowParallax: false,
    maxConcurrentVideo: 0,
    max3DObjects: 0,
    listWindowSize: 10,
    lazyMedia: true
  } : tier === "medium" ? {
    tier,
    targetFps: BERX_V9_PERFORMANCE.targetFps,
    frameBudgetMs: BERX_V9_PERFORMANCE.interactiveBudgetMs,
    maxBlurLayers: 2,
    allow3D: true,
    allowAmbientMotion: true,
    allowParallax: true,
    maxConcurrentVideo: BERX_V9_PERFORMANCE.videoAutoplayConcurrentMobile,
    max3DObjects: BERX_V9_PERFORMANCE.simultaneous3DObjectsMobile,
    listWindowSize: 14,
    lazyMedia: true
  } : {
    tier,
    targetFps: BERX_V9_PERFORMANCE.targetFps,
    frameBudgetMs: BERX_V9_PERFORMANCE.interactiveBudgetMs,
    /**
     * Three, on every platform. An earlier draft gave
     * desktop four on the assumption that a bigger
     * machine could afford it; the browser probe
     * measured the fourth blurred layer pushing p95
     * frame time from 33ms to 50ms during a real
     * scroll, with no visible gain. The archive only
     * ever specified three, and the measurement agrees
     * with the archive.
     */
    maxBlurLayers: BERX_V9_PERFORMANCE.blurMaxLayersMobile,
    allow3D: true,
    allowAmbientMotion: true,
    allowParallax: true,
    maxConcurrentVideo: desktopClass ? 2 : BERX_V9_PERFORMANCE.videoAutoplayConcurrentMobile,
    max3DObjects: desktopClass ? 240 : BERX_V9_PERFORMANCE.simultaneous3DObjectsMobile,
    listWindowSize: 21,
    lazyMedia: true
  };
  if (signals.supportsBackdropBlur === false) base.maxBlurLayers = 0;
  if (reduced) {
    base.allowAmbientMotion = false;
    base.allowParallax = false;
  }
  return { ...base, reason: reduced ? `${reason}; reduced motion active` : reason };
}
function allocateBlurLayers(depths, budget) {
  const priority = ["D5", "D4", "D2", "D3", "D1", "D0"];
  const allowed = { D0: false, D1: false, D2: false, D3: false, D4: false, D5: false };
  let remaining = clamp(budget.maxBlurLayers, 0, 6);
  for (const depth of priority) {
    if (remaining <= 0) break;
    if (!depths.includes(depth)) continue;
    allowed[depth] = true;
    remaining -= 1;
  }
  return allowed;
}

// packages/spatial/src/focus.ts
var RECESSION_AT_FULL = {
  D0: 0.66,
  D1: 0.71,
  D2: 0.8,
  D3: 0.88,
  D4: 0.95,
  D5: 1
};
var CLEAR_MIN = 0.08;
var CLEAR_MAX = 0.56;
function resolveFocus(input) {
  const intensity = clamp(input.intensity ?? 1, 0, 1);
  if (intensity < 0.02) return null;
  const vw = Math.max(1, input.viewportWidth);
  const vh = Math.max(1, input.viewportHeight);
  const cx = clamp((input.rect.x + input.rect.width / 2) / vw, 0, 1);
  const cy = clamp((input.rect.y + input.rect.height / 2) / vh, 0, 1);
  const radiusX = round(clamp(Math.max(cx, 1 - cx) * 1.42, 0.2, 2), 4);
  const radiusY = round(clamp(Math.max(cy, 1 - cy) * 1.42, 0.2, 2), 4);
  const marginedX = input.rect.width / 2 / vw * 1.18;
  const marginedY = input.rect.height / 2 / vh * 1.18;
  const clearOffset = round(
    clamp(Math.max(marginedX / radiusX, marginedY / radiusY), CLEAR_MIN, CLEAR_MAX),
    4
  );
  const tier = input.tier ?? "high";
  const flatGain = input.blurred === false ? 1.22 : 1;
  const surroundAlpha = round(clamp(0.46 * intensity * flatGain, 0, 0.72), 4);
  const surroundColor = input.background;
  const knee = clamp(clearOffset + (1 - clearOffset) * 0.42, clearOffset + 0.02, 0.98);
  const stops = tier === "low" ? [
    { offset: 0, alpha: 0 },
    { offset: clearOffset, alpha: 0 },
    { offset: 1, alpha: surroundAlpha }
  ] : [
    { offset: 0, alpha: 0 },
    { offset: clearOffset, alpha: 0 },
    { offset: round(knee, 4), alpha: round(surroundAlpha * 0.52, 4) },
    { offset: 1, alpha: surroundAlpha }
  ];
  const plane = input.plane ?? "D5";
  const planeZ = BERX_DEPTH_TOKENS[plane].z;
  const recession = {};
  for (const depth of BERX_DEPTH_KEYS) {
    if (BERX_DEPTH_TOKENS[depth].z >= planeZ) {
      recession[depth] = 1;
      continue;
    }
    const full = RECESSION_AT_FULL[depth];
    recession[depth] = round(1 - (1 - full) * intensity, 4);
  }
  const haloRadiusPx = Math.round(
    clamp(Math.max(input.rect.width, input.rect.height) * 0.34, 12, 96)
  );
  return {
    centerX: round(cx, 4),
    centerY: round(cy, 4),
    radiusX,
    radiusY,
    clearOffset,
    stops,
    plane,
    surroundAlpha,
    surroundColor,
    recession,
    emissionGain: round(1 + 0.62 * intensity, 4),
    haloRadiusPx,
    description: `focus clearing at ${Math.round(cx * 100)}%/${Math.round(cy * 100)}%, surround falls to ${Math.round(surroundAlpha * 100)}%`
  };
}

// packages/spatial/src/scene.ts
function materialForDepth(depth, sceneMaterial) {
  switch (depth) {
    case "D0":
      return "Carbon";
    case "D1":
      return "SoftLight";
    case "D2":
      return sceneMaterial;
    case "D3":
      return sceneMaterial === "DarkMetal" || sceneMaterial === "Carbon" ? sceneMaterial : "ClearGlass";
    case "D4":
      return "LiquidGlass";
    case "D5":
      return "NeonEnergy";
  }
}
function resolveScene(contract, env) {
  const budget = resolvePerformanceBudget(env.device);
  const reducedMotion = env.device.prefersReducedMotion === true;
  const colorWorld = env.colorWorld ?? contract.scene.colorWorld ?? BERX_DEFAULT_COLOR_WORLD;
  const accent = BERX_COLOR_WORLDS[colorWorld].accent;
  const adaptations = [];
  const camera = resolveCamera({
    contract: contract.scene.camera,
    viewportWidth: env.viewportWidth,
    viewportHeight: env.viewportHeight,
    reducedMotion,
    allow3D: budget.allow3D
  });
  if (!camera.perspectiveEnabled) adaptations.push(`3D flattened (${budget.reason})`);
  if (camera.maxTiltDeg === 0 && budget.allow3D) adaptations.push("tilt disabled (reduced motion)");
  const order = contract.scene.layerOrder.length ? contract.scene.layerOrder : [...BERX_DEPTH_KEYS];
  const blurAllowed = allocateBlurLayers(order, budget);
  if (budget.maxBlurLayers < order.length) {
    adaptations.push(`blur budget ${budget.maxBlurLayers}/${order.length} layers (${budget.tier} tier)`);
  }
  const contentDepth = contract.scene.depthProfile.content;
  const layers = {};
  for (const depth of BERX_DEPTH_KEYS) {
    const token = BERX_DEPTH_TOKENS[depth];
    const material = materialForDepth(depth, contract.scene.material);
    const surface = ensureReadableSurface({
      material,
      accent,
      ground: BERX_V9_COLOR.bg,
      blurBudgetAvailable: blurAllowed[depth],
      forceOpaque: env.highContrast === true,
      elevation: token.z / 5
    });
    if (surface.opaqueFallback && blurAllowed[depth] && env.highContrast !== true && material !== "Carbon" && material !== "SoftLight" && material !== "MediaSurface") {
      adaptations.push(`${depth} fell back to opaque for contrast (${surface.textContrast}:1)`);
    }
    layers[depth] = {
      depth,
      role: BERX_DEPTH_ROLE[depth],
      z: token.z,
      zIndex: token.z,
      /**
       * The content plane is the reference, not the substrate.
       * z is measured from it, so D3 renders at exactly 1:1 —
       * body text is never projected smaller or resampled — the
       * environment falls away behind it, and controls and focus
       * sit slightly in front where a control must be. Anchoring
       * on D5 instead (the earlier arrangement) shrank the whole
       * reading plane by 14% and pushed controls under their
       * minimum touch target; the browser probe measured a 38px
       * button against a 44px minimum, which is what surfaced it.
       */
      translateZ: round((token.z - BERX_DEPTH_TOKENS[contentDepth].z) * camera.depthUnitPx, 2),
      parallaxFactor: budget.allowParallax ? token.parallax : 0,
      blurred: blurAllowed[depth] && !surface.opaqueFallback,
      surface,
      lighting: resolveLighting({
        recipe: contract.scene.lightRecipe,
        depthZ: token.z,
        accent,
        intensity: depthLightIntensity(depth)
      }),
      contentOpacity: depth === "D0" ? 1 : depth === "D1" ? 0.72 : 1
    };
  }
  const motionBudget = { allowAmbientMotion: budget.allowAmbientMotion, allow3D: budget.allow3D };
  const motion = {
    enter: resolveMotion({ preset: contract.motion.enter, reducedMotion, budget: motionBudget }),
    exit: resolveMotion({ preset: contract.motion.exit, reducedMotion, budget: motionBudget }),
    focus: resolveMotion({ preset: contract.motion.focus, reducedMotion, budget: motionBudget }),
    ambient: resolveMotion({ preset: contract.motion.ambient, reducedMotion, budget: motionBudget })
  };
  for (const m of Object.values(motion)) {
    if (m.adapted && m.reason) adaptations.push(m.reason);
  }
  return {
    screenId: contract.screenId,
    title: contract.title,
    family: contract.family,
    route: contract.route,
    mood: contract.experience.mood,
    colorWorld,
    accent,
    background: BERX_V9_COLOR.bg,
    camera,
    layers,
    layerOrder: order,
    focalDepth: contract.scene.depthProfile.content,
    budget,
    motion,
    reducedMotion,
    adaptations: [...new Set(adaptations)]
  };
}

// packages/spatial/src/temporal.ts
var BERX_DEFAULT_HORIZON_SECONDS = 3 * 3600;
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
var DAY = 86400;
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

// packages/spatial/src/relational.ts
function berxStableAngle(id) {
  let hash = 2166136261;
  for (let i = 0; i < id.length; i++) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash / 4294967296 * Math.PI * 2;
}
var RELATION_RADIUS = {
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
var UNRELATED_RING = 9.5;
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
  for (const relation of relations) {
    add(relation.from, relation.to, relation.type, relation.strength);
    add(relation.to, relation.from, relation.type, relation.strength);
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
  for (const relation of relations) {
    if (relation.from === id || relation.to === id) total += Math.max(0, relation.strength);
  }
  return total === 0 ? 0 : 1 - 1 / (1 + total);
}

// packages/spatial/src/worldLighting.ts
var rgb = (hex) => {
  const c = parseColor(hex);
  if (!c) throw new Error(`BERX 5D lighting: ${hex} is not a colour`);
  return [c.r / 255, c.g / 255, c.b / 255];
};
var BERX_MAX_POINT_LIGHTS = 4;
var normalise = (v) => {
  const l = Math.hypot(v.x, v.y, v.z) || 1;
  return { x: v.x / l, y: v.y / l, z: v.z / l };
};
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

// packages/spatial/src/worldMaterials.ts
var rgb2 = (hex) => {
  const c = parseColor(hex);
  if (!c) throw new Error(`BERX 5D material: ${hex} is not a colour`);
  return [c.r / 255, c.g / 255, c.b / 255];
};
var NONE = [0, 0, 0];
var BERX_WORLD_MATERIALS = {
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
function berxWorldMaterial(name) {
  return BERX_WORLD_MATERIALS[name] ?? BERX_WORLD_MATERIALS.ceramic;
}

// packages/spatial/src/spatialAudio.ts
function berxAudioAttenuation(source, listener, at) {
  const d = Math.hypot(at.x - listener.x, at.y - listener.y, at.z - listener.z);
  if (d >= source.maxDistance) return 0;
  if (d <= source.refDistance) return source.gain;
  const inverse = source.refDistance / d;
  const window2 = 1 - (d - source.refDistance) / (source.maxDistance - source.refDistance);
  return source.gain * inverse * window2;
}

// packages/spatial/src/spatialCamera.ts
var clamp2 = (v, min, max) => Math.max(min, Math.min(max, v));
var lerp = (a, b, t) => a + (b - a) * t;
var copy = (v) => ({ x: v.x, y: v.y, z: v.z });
var smoothstep = (t) => t * t * (3 - 2 * t);
var BerxSpatialCamera = class {
  constructor(initial, limits) {
    this.velocity = { x: 0, y: 0, z: 0 };
    this.state = { position: copy(initial?.position ?? { x: 0, y: 0, z: 8 }), target: copy(initial?.target ?? { x: 0, y: 0, z: 0 }), rotation: { ...initial?.rotation ?? { x: 0, y: 0, z: 0 } }, fov: initial?.fov ?? 42, near: initial?.near ?? 0.1, far: initial?.far ?? 200 };
    this.baseTarget = copy(this.state.target);
    this.limits = { maxTiltDeg: limits?.maxTiltDeg ?? 2.5, maxDepth: limits?.maxDepth ?? 30, minFov: limits?.minFov ?? 28, maxFov: limits?.maxFov ?? 58 };
  }
  getState() {
    return { position: copy(this.state.position), target: copy(this.state.target), rotation: { ...this.state.rotation }, fov: this.state.fov, near: this.state.near, far: this.state.far };
  }
  setState(next) {
    this.state = { position: copy(next.position), target: copy(next.target), rotation: { ...next.rotation }, fov: clamp2(next.fov, this.limits.minFov, this.limits.maxFov), near: next.near, far: next.far };
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
  poseForObject(position, scale = { x: 1, y: 1, z: 1 }, distance) {
    const radius = Math.max(scale.x, scale.y, scale.z, 0.5), d = distance ?? Math.max(2.4, radius * 3.2);
    return { position: { x: position.x, y: position.y, z: position.z + d }, target: copy(position) };
  }
  moveToPose(pose, durationSeconds = 0.65) {
    return new BerxCameraTransition(this.getState(), pose, durationSeconds);
  }
  moveTo(target, durationSeconds = 0.65) {
    return this.moveToPose(this.poseForObject(target), durationSeconds);
  }
};
var BerxCameraTransition = class {
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

// packages/spatial/src/world.ts
var copyVec3 = (v) => ({ ...v });
var copyEuler = (v) => ({ ...v });
var BerxSpatialWorld = class {
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
    for (const [relationId, relation] of this.relations) {
      if (relation.from === id || relation.to === id) this.relations.delete(relationId);
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
  addRelation(relation) {
    if (!this.objects.has(relation.from) || !this.objects.has(relation.to)) return;
    this.relations.set(relation.id, { ...relation });
  }
  relatedTo(id) {
    const ids = /* @__PURE__ */ new Set();
    for (const relation of this.relations.values()) {
      if (relation.from === id) ids.add(relation.to);
      if (relation.to === id) ids.add(relation.from);
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
      relations: [...this.relations.values()].map((relation) => ({ ...relation })),
      activeObjectId: this.activeObjectId,
      worldTime: this.worldTime
    };
  }
  restore(snapshot) {
    this.objects.clear();
    this.relations.clear();
    for (const object of snapshot.objects) this.upsertObject(object);
    for (const relation of snapshot.relations) this.addRelation(relation);
    this.activeObjectId = snapshot.activeObjectId;
    this.worldTime = snapshot.worldTime;
  }
};

// packages/spatial/src/runtime5d.ts
var cloneCamera = (c) => ({ position: { ...c.position }, target: { ...c.target }, rotation: { ...c.rotation }, fov: c.fov, near: c.near, far: c.far });
var cloneWorld = (w) => ({ ...w, camera: cloneCamera(w.camera) });
var Berx5DRuntime = class {
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

// packages/spatial/src/spatialAffordances.ts
var primaryByKind = {
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
function affordancesForObject(object, labels = {}) {
  const actions = primaryByKind[object.kind] ?? ["open"];
  return { objectId: object.id, affordances: actions.map((action, index) => ({ id: `${object.id}:${action}`, objectId: object.id, action, state: object.interactive ? "available" : "disabled", label: labels[action] ?? action, accessibilityLabel: labels[action] ?? action, priority: index, serverRequired: action !== "open" && action !== "focus" })) };
}

// packages/spatial/src/worldApp.ts
var BERX_PERSISTENCE_VERSION = 1;
var Berx5DWorldApp = class {
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
      for (const relation of entry.relations ?? []) this.relations.set(relation.id, relation);
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
    for (const [id, relation] of this.relations) {
      if (relation.from === objectId || relation.to === objectId) this.relations.delete(id);
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
      for (const relation of usable) this.runtime.world.addRelation(relation);
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
    const cursor = this.position.cursor;
    return {
      ...base,
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

// packages/spatial/src/spatialInteraction.ts
var dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
var sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
var len = (v) => Math.hypot(v.x, v.y, v.z);
var norm = (v) => {
  const l = len(v) || 1;
  return { x: v.x / l, y: v.y / l, z: v.z / l };
};
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
var cross = (a, b) => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });
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

// packages/spatial/src/actionRing.ts
var RING_GAP = 0.55;
var SLOT_HEIGHT = 0.26;
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

// packages/spatial/src/geometry.ts
var specs = {
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
function geometryForEntity(kind) {
  return { ...specs[kind] };
}

// packages/spatial/src/spatialPresentation.ts
var shaderRgb = (hex) => {
  const c = parseColor(hex);
  if (!c) throw new Error(`BERX 5D DNA: ${hex} is not a colour`);
  return [c.r / 255, c.g / 255, c.b / 255];
};
var BERX_5D_DNA = {
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
var materials = {
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

// packages/spatial-web/src/index.ts
function detectPlatform(width) {
  const ua = typeof navigator === "undefined" ? "" : navigator.userAgent;
  if (/iPad|Android(?!.*Mobile)|Tablet/i.test(ua)) return "tablet";
  if (/iPhone|iPod/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return width >= 1280 ? "desktop" : "web";
}
function supportsBackdropBlur() {
  if (typeof CSS === "undefined" || typeof CSS.supports !== "function") return false;
  return CSS.supports("backdrop-filter", "blur(4px)") || CSS.supports("-webkit-backdrop-filter", "blur(4px)");
}
function readDeviceSignals(overrides) {
  const width = typeof window === "undefined" ? 1280 : window.innerWidth;
  const nav = typeof navigator === "undefined" ? void 0 : navigator;
  const reduced = typeof window !== "undefined" && typeof window.matchMedia === "function" ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false;
  return {
    platform: detectPlatform(width),
    deviceMemoryGb: nav?.deviceMemory,
    logicalCores: nav?.hardwareConcurrency,
    pixelRatio: typeof window === "undefined" ? 1 : window.devicePixelRatio,
    supportsBackdropBlur: supportsBackdropBlur(),
    prefersReducedMotion: reduced,
    saveData: nav?.connection?.saveData === true,
    ...overrides
  };
}
function runBerxSharedElement(from, to, options = {}) {
  const reducedMotion = options.reducedMotion ?? (typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches);
  const a = from.getBoundingClientRect();
  const b = to.getBoundingClientRect();
  const flip = planSharedElementFlip(
    { x: a.left, y: a.top, width: a.width, height: a.height },
    { x: b.left, y: b.top, width: b.width, height: b.height },
    reducedMotion
  );
  const measurable = b.width > 0 && b.height > 0;
  const travels = flip.travels && measurable;
  const keyframes = travels ? [
    {
      transform: `translate(${flip.translateX}px, ${flip.translateY}px) scale(${flip.scaleX}, ${flip.scaleY})`,
      opacity: 0.72
    },
    { transform: "translate(0px, 0px) scale(1, 1)", opacity: 1 }
  ] : [{ opacity: 0 }, { opacity: 1 }];
  const animation = to.animate(keyframes, {
    duration: flip.durationMs,
    easing: flip.easing,
    fill: "both"
  });
  to.dataset.berxSharedElement = travels ? "travelling" : "fading";
  const finished = animation.finished.then(() => void 0).catch(() => void 0).finally(() => {
    animation.cancel();
    delete to.dataset.berxSharedElement;
  });
  return { finished, travelled: travels };
}
function atmosphereBackground(atmosphere, viewportWidth, viewportHeight, mediaUrl) {
  const major = Math.max(viewportWidth, viewportHeight);
  const layers = [];
  if (atmosphere.vignette > 0) {
    layers.push(
      `radial-gradient(ellipse 150% 150% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,${atmosphere.vignette}) 100%)`
    );
  }
  for (const pool2 of atmosphere.pools) {
    const r = Math.round(pool2.radius * major);
    layers.push(
      `radial-gradient(circle ${r}px at ${pool2.x * 100}% ${pool2.y * 100}%, ${pool2.color} 0%, ${transparentize(pool2.color, 0.45)} 45%, ${transparentize(pool2.color, 0)} 100%)`
    );
  }
  if (mediaUrl && atmosphere.mediaRole !== "none") {
    if (atmosphere.mediaScrim > 0) {
      layers.push(`linear-gradient(rgba(0,0,0,${atmosphere.mediaScrim}), rgba(0,0,0,${atmosphere.mediaScrim}))`);
    }
    layers.push(`image-set(url("${encodeURI(mediaUrl)}") 1x)`);
  }
  if (atmosphere.ground) {
    const h = atmosphere.ground.horizon * 100;
    layers.push(
      `linear-gradient(to bottom, rgba(0,0,0,0) ${h}%, ${transparentize(atmosphere.ground.color, 1 - atmosphere.ground.haze)} ${h}%, ${atmosphere.ground.color} 100%)`
    );
    layers.push(
      `linear-gradient(to bottom, rgba(0,0,0,0) calc(${h}% - 1px), rgba(255,255,255,${atmosphere.ground.edge}) calc(${h}% - 1px), rgba(255,255,255,${atmosphere.ground.edge}) ${h}%, rgba(0,0,0,0) ${h}%)`
    );
  }
  const sky = atmosphere.sky.stops.map((stop) => `${stop.color} ${Math.round(stop.position * 100)}%`).join(", ");
  layers.push(`linear-gradient(${atmosphere.sky.angleDeg}deg, ${sky})`);
  return layers.join(", ");
}
function transparentize(color, factor) {
  const m = /^rgba\(([^,]+),([^,]+),([^,]+),([^)]+)\)$/.exec(color.replace(/\s/g, ""));
  if (!m) return color;
  return `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${(Number(m[4]) * factor).toFixed(4)})`;
}
function atmosphereCustomProperties(atmosphere, viewportWidth, viewportHeight, mediaUrl) {
  return {
    "--berx-d1-atmosphere": atmosphereBackground(atmosphere, viewportWidth, viewportHeight, mediaUrl),
    "--berx-d1-atmosphere-size": mediaUrl && atmosphere.mediaRole !== "none" ? "cover" : "auto",
    "--berx-d1-media-opacity": String(atmosphere.mediaOpacity || 1),
    "--berx-d1-vignette": String(atmosphere.vignette)
  };
}
function focusBackground(field) {
  const stops = field.stops.map((stop) => `${rgbaOf(field.surroundColor, stop.alpha)} ${round2(stop.offset * 100)}%`).join(", ");
  return `radial-gradient(ellipse ${round2(field.radiusX * 100)}% ${round2(field.radiusY * 100)}% at ${round2(field.centerX * 100)}% ${round2(field.centerY * 100)}%, ${stops})`;
}
function round2(value) {
  return Math.round(value * 100) / 100;
}
function rgbaOf(color, alpha) {
  const hex = /^#([0-9a-f]{6})$/i.exec(color.trim());
  if (hex) {
    const n = parseInt(hex[1], 16);
    return `rgba(${n >> 16 & 255}, ${n >> 8 & 255}, ${n & 255}, ${alpha})`;
  }
  const rgb3 = /^rgba?\(([^,]+),([^,]+),([^,)]+)(?:,([^)]+))?\)$/.exec(color.replace(/\s/g, ""));
  if (rgb3) return `rgba(${rgb3[1]}, ${rgb3[2]}, ${rgb3[3]}, ${alpha})`;
  throw new Error(`BERX: focus surround colour "${color}" is not a colour this runtime can fade.`);
}
function focusCustomProperties(field) {
  if (!field) {
    return {
      "--berx-focus-field": "none",
      "--berx-focus-emission": "1",
      "--berx-focus-alpha": "0"
    };
  }
  return {
    "--berx-focus-field": focusBackground(field),
    "--berx-focus-emission": String(field.emissionGain),
    "--berx-focus-alpha": String(field.surroundAlpha)
  };
}
function sceneCustomProperties(scene) {
  const controlScale = perspectiveScale(scene.layers.D4.translateZ, scene.camera.perspectivePx);
  const OFF_AXIS_WORST_CASE = 0.94;
  const touchMin = Math.ceil(44 / (controlScale * OFF_AXIS_WORST_CASE));
  const props = {
    "--berx-touch-min": `${touchMin}px`,
    "--berx-bg": scene.background,
    "--berx-accent": scene.accent,
    "--berx-perspective": `${scene.camera.perspectivePx}px`,
    "--berx-perspective-origin": `${scene.camera.originX}px ${scene.camera.originY}px`,
    "--berx-tilt-max": `${scene.camera.maxTiltDeg}deg`,
    "--berx-enter-ms": `${scene.motion.enter.durationMs}ms`,
    "--berx-enter-ease": scene.motion.enter.easing,
    "--berx-exit-ms": `${scene.motion.exit.durationMs}ms`,
    "--berx-focus-ms": `${scene.motion.focus.durationMs}ms`,
    "--berx-focus-ease": scene.motion.focus.easing,
    "--berx-focus-scale": String(scene.motion.focus.to?.scale ?? 1),
    "--berx-ambient-ms": `${scene.motion.ambient.durationMs}ms`
  };
  const d2 = scene.layers.D2;
  props["--berx-card-fall"] = [
    "to bottom",
    `${rgbaOf(scene.background, 0)} 0%`,
    `${rgbaOf(scene.background, 0.18)} 38%`,
    `${rgbaOf(scene.background, 0.72)} 62%`,
    `${rgbaOf(scene.background, 0.94)} 82%`,
    `${rgbaOf(scene.background, 0.99)} 100%`
  ].join(", ");
  props["--berx-room"] = [
    `linear-gradient(160deg, ${d2.lighting.key.stops[0].color} 0%, ${d2.lighting.key.stops[1].color} 34%, transparent 100%)`,
    `linear-gradient(to right, ${transparentize(d2.surface.edgeHighlightColor, 0.5)} 0%, transparent 14%)`,
    `linear-gradient(to left, ${transparentize(d2.surface.backgroundColor, 0.9)} 0%, transparent 14%)`,
    `linear-gradient(to bottom, transparent 68%, ${d2.surface.backgroundColor} 100%)`
  ].join(", ");
  for (const depth of BERX_DEPTH_KEYS) {
    const layer = scene.layers[depth];
    const k = depth.toLowerCase();
    props[`--berx-${k}-z`] = String(layer.zIndex);
    props[`--berx-${k}-translate-z`] = `${layer.translateZ}px`;
    props[`--berx-${k}-bg`] = layer.surface.backgroundColor;
    props[`--berx-${k}-blur`] = layer.blurred && layer.surface.blurPx > 0 ? `blur(${layer.surface.blurPx}px)` : "none";
    props[`--berx-${k}-border`] = layer.surface.borderColor;
    props[`--berx-${k}-edge`] = layer.surface.edgeHighlightColor;
    props[`--berx-${k}-rim`] = layer.surface.rimColor;
    props[`--berx-${k}-rim-width`] = `${layer.surface.rimWidth}px`;
    props[`--berx-${k}-glow`] = layer.surface.glowColor;
    props[`--berx-${k}-glow-radius`] = `${layer.surface.glowRadius}px`;
    props[`--berx-${k}-shadow`] = `0 ${layer.lighting.shadow.offsetY}px ${layer.lighting.shadow.radius}px ${layer.lighting.shadow.color}`;
    props[`--berx-${k}-key-0`] = layer.lighting.key.stops[0].color;
    props[`--berx-${k}-key-1`] = layer.lighting.key.stops[1].color;
    props[`--berx-${k}-key-angle`] = `${layer.lighting.key.angleDeg}deg`;
    props[`--berx-${k}-ambient`] = layer.lighting.ambientColor;
    props[`--berx-${k}-light-rim`] = layer.lighting.rimColor;
    props[`--berx-${k}-opacity`] = String(layer.contentOpacity);
  }
  return props;
}
function applyProps(el, props) {
  for (const [name, value] of Object.entries(props)) el.style.setProperty(name, value);
}
var SAMPLE_FRAMES = 24;
var SLOW_FRAME_MS = 20;
var MAX_DROPPED_RATIO = 0.15;
function mountBerxScene(root, contract, options = {}) {
  let fps = null;
  let tierOverride;
  let blurDisabled = false;
  let scene;
  let atmosphere;
  let frame = 0;
  let focusTarget = null;
  let focusIntensity;
  let focusField = null;
  let clearingEl = null;
  const scrollTarget = options.scrollTarget ?? window;
  const build = () => {
    const device = readDeviceSignals({
      ...options.device,
      measuredFps: tierOverride,
      ...blurDisabled ? { supportsBackdropBlur: false } : null
    });
    scene = resolveScene(contract, {
      device,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      colorWorld: options.colorWorld,
      highContrast: options.highContrast
    });
    applyProps(root, sceneCustomProperties(scene));
    atmosphere = resolveAtmosphere({
      kind: options.atmosphereKind ?? berxAtmosphereForFamily(scene.family),
      /* a room inside a card has no horizon to show */
      bounded: root.getBoundingClientRect().height > 0 && root.getBoundingClientRect().height < window.innerHeight * 0.85,
      accent: scene.accent,
      background: scene.background,
      hasMedia: options.atmosphereMediaUrl !== void 0,
      intensity: scene.layers.D1.contentOpacity,
      reducedMotion: scene.reducedMotion,
      allowParallax: scene.budget.allowParallax,
      blurred: scene.layers.D1.blurred,
      maxPools: berxAtmospherePoolBudget(scene.budget.tier),
      /* the room may not out-shine the objects standing in it */
      contentColor: scene.layers.D3.surface.effectiveColor
    });
    const box = root.getBoundingClientRect();
    const bounded = box.height > 0 && box.height < window.innerHeight * 0.85;
    const envWidth = Math.max(1, Math.round(bounded ? box.width : window.innerWidth));
    const envHeight = Math.max(1, Math.round(bounded ? box.height : window.innerHeight));
    applyProps(root, atmosphereCustomProperties(atmosphere, envWidth, envHeight, options.atmosphereMediaUrl));
    root.dataset.berxBounded = String(bounded);
    root.dataset.berxAtmosphere = atmosphere.kind;
    root.dataset.berxAtmosphereDepth = String(
      atmosphere.sky.stops.length + atmosphere.pools.length + (atmosphere.ground ? 2 : 0)
    );
    root.dataset.berxScene = scene.screenId;
    root.dataset.berxFamily = scene.family;
    root.dataset.berxTier = scene.budget.tier;
    root.dataset.berxReducedMotion = String(scene.reducedMotion);
    root.dataset.berxParallax = String(scene.budget.allowParallax);
    root.dataset.berxBlurLayers = String(
      BERX_DEPTH_KEYS.filter((d) => scene.layers[d].blurred).length
    );
    root.dataset.berx3d = String(scene.camera.perspectiveEnabled);
    root.dataset.berxAdaptation = blurDisabled ? tierOverride === void 0 ? "blur-dropped" : "tier-dropped" : "none";
    if (focusTarget) applyFocus();
  };
  const applyFocus = () => {
    focusField = null;
    if (focusTarget && root.contains(focusTarget)) {
      const target = focusTarget.getBoundingClientRect();
      const box = root.getBoundingClientRect();
      const holder = focusTarget.closest("[data-berx-depth]");
      const holderDepth = holder?.dataset.berxDepth;
      focusField = resolveFocus({
        /* the object's box in the scene's own coordinates */
        rect: {
          x: target.left - box.left,
          y: target.top - box.top,
          width: target.width,
          height: target.height
        },
        viewportWidth: Math.max(1, box.width),
        viewportHeight: Math.max(1, box.height),
        background: scene.background,
        intensity: focusIntensity,
        plane: holderDepth && holderDepth in scene.layers ? holderDepth : void 0,
        tier: scene.budget.tier,
        blurred: scene.layers.D5.blurred
      });
    }
    applyProps(root, focusCustomProperties(focusField));
    root.dataset.berxFocused = String(focusField !== null);
    for (const el of Array.from(root.querySelectorAll("[data-berx-depth]"))) {
      const depth = el.dataset.berxDepth;
      if (!depth || !(depth in scene.layers)) continue;
      el.style.setProperty("--berx-focus-recession", String(focusField ? focusField.recession[depth] : 1));
    }
    if (!focusField) {
      clearingEl?.remove();
      clearingEl = null;
      return;
    }
    if (!clearingEl) {
      clearingEl = document.createElement("div");
      clearingEl.className = "berx-focus-clearing";
      clearingEl.setAttribute("aria-hidden", "true");
      root.appendChild(clearingEl);
    }
    if (clearingEl.parentElement !== root || root.lastElementChild !== clearingEl) {
      root.appendChild(clearingEl);
    }
  };
  const lightSurfaces = () => {
    const box = root.getBoundingClientRect();
    const w = Math.max(1, box.width);
    const h = Math.max(1, box.height);
    for (const el of Array.from(root.querySelectorAll(".berx-surface"))) {
      const depth = el.dataset.berxDepth;
      if (depth === "D0" || depth === "D1") continue;
      const r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) continue;
      const nx = (r.left + r.width / 2 - box.left) / w;
      const ny = (r.top + r.height / 2 - box.top) / h;
      const lit = berxIlluminationAt(atmosphere, nx, ny);
      el.style.setProperty("--berx-surface-light", String(Math.round((0.45 + lit) * 100) / 100));
      if (!depth || !(depth in scene.layers)) continue;
      const layer = scene.layers[depth];
      if (!layer.surface.opaqueFallback) continue;
      const behind = berxRoomColorAt(atmosphere, scene.background, nx, ny);
      el.style.setProperty("--berx-surface-bg", flatten(layer.surface.translucentColor, behind));
    }
  };
  build();
  lightSurfaces();
  const layerEls = () => Array.from(root.querySelectorAll("[data-berx-depth]"));
  let pendingScroll = null;
  const applyParallax = (now) => {
    frame = 0;
    recordFrame(now);
    if (pendingScroll === null) return;
    const y = pendingScroll;
    pendingScroll = null;
    for (const el of layerEls()) {
      const depth = el.dataset.berxDepth;
      if (!depth || !(depth in scene.layers)) continue;
      const layer = scene.layers[depth];
      const offset = parallaxOffset(y, layer.parallaxFactor, scene.budget.allowParallax);
      const anchored = depth === "D1" ? y + offset : offset;
      el.style.setProperty("--berx-parallax-y", `${anchored}px`);
    }
  };
  const onScroll = () => {
    if (!scene.budget.allowParallax) return;
    pendingScroll = scrollTarget === window ? window.scrollY : scrollTarget.scrollTop;
    if (frame === 0) frame = requestAnimationFrame(applyParallax);
  };
  const onPointerMove = (e) => {
    if (scene.camera.maxTiltDeg === 0) return;
    const w = window.innerWidth || 1;
    const h = window.innerHeight || 1;
    const { rotateXDeg, rotateYDeg } = tiltFromPointer(e.clientX / w * 2 - 1, e.clientY / h * 2 - 1, scene.camera);
    root.style.setProperty("--berx-tilt-x", `${rotateXDeg}deg`);
    root.style.setProperty("--berx-tilt-y", `${rotateYDeg}deg`);
  };
  let sampleTimes = [];
  let lastFrameAt = 0;
  const recordFrame = (now) => {
    if (!options.sampleFrames && options.sampleFrames !== void 0) return;
    if (lastFrameAt !== 0) sampleTimes.push(now - lastFrameAt);
    lastFrameAt = now;
    if (sampleTimes.length < SAMPLE_FRAMES) return;
    const sorted = [...sampleTimes].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const droppedRatio = sorted.filter((t) => t > SLOW_FRAME_MS).length / sorted.length;
    fps = median > 0 ? 1e3 / median : null;
    sampleTimes = [];
    const holding = median <= SLOW_FRAME_MS && droppedRatio <= MAX_DROPPED_RATIO;
    if (holding || fps === null) return;
    if (!blurDisabled) {
      blurDisabled = true;
      build();
      return;
    }
    if (tierOverride === void 0) {
      tierOverride = fps;
      build();
    }
  };
  const onResize = () => {
    build();
    lightSurfaces();
  };
  const motionQuery = typeof window.matchMedia === "function" ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  const onMotionChange = () => build();
  if (options.interactive !== false) scrollTarget.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });
  if (options.interactive !== false) window.addEventListener("pointermove", onPointerMove, { passive: true });
  motionQuery?.addEventListener?.("change", onMotionChange);
  return {
    get scene() {
      return scene;
    },
    get atmosphere() {
      return atmosphere;
    },
    refresh: () => {
      build();
      lightSurfaces();
    },
    /** Re-measures every surface against the room. Call after the
     *  page adds or moves content. */
    relight: lightSurfaces,
    setFocus: (target, intensity) => {
      focusTarget = target;
      focusIntensity = intensity;
      applyFocus();
      return focusField;
    },
    focusField: () => focusField,
    measuredFps: () => fps,
    adapted: () => blurDisabled || tierOverride !== void 0,
    destroy: () => {
      if (frame) cancelAnimationFrame(frame);
      clearingEl?.remove();
      clearingEl = null;
      scrollTarget.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      motionQuery?.removeEventListener?.("change", onMotionChange);
    }
  };
}
function createBerxLayer(depth, options = {}) {
  const layer = document.createElement("div");
  layer.className = ["berx-layer", options.className].filter(Boolean).join(" ");
  layer.dataset.berxDepth = depth;
  const decorative = options.decorative ?? (depth === "D0" || depth === "D1");
  if (decorative) {
    layer.setAttribute("aria-hidden", "true");
    layer.style.pointerEvents = "none";
  }
  if (options.surface === false) return layer;
  const surface = document.createElement("div");
  surface.className = "berx-surface";
  surface.dataset.berxDepth = depth;
  layer.appendChild(surface);
  return layer;
}
function berxLayerContent(layer) {
  return layer.querySelector(".berx-surface") ?? layer;
}
function createBerxCard(options = {}) {
  const depth = options.depth ?? "D3";
  const interactive = typeof options.onPress === "function";
  const el = document.createElement(interactive ? "button" : "div");
  el.className = ["berx-surface", interactive ? "berx-focusable" : "", options.className].filter(Boolean).join(" ");
  if (interactive) {
    el.style.color = "inherit";
    el.style.font = "inherit";
    el.style.textAlign = "inherit";
  }
  el.dataset.berxDepth = depth;
  if (interactive) {
    el.type = "button";
    if (options.accessibleName) el.setAttribute("aria-label", options.accessibleName);
    el.addEventListener("click", () => options.onPress?.());
  }
  if (options.mediaUrl) {
    el.classList.add("berx-card-media");
    const stage = document.createElement("div");
    stage.className = "berx-card-stage";
    const img = document.createElement("img");
    img.src = options.mediaUrl;
    img.decoding = "async";
    img.loading = "lazy";
    if (options.mediaAlt) img.alt = options.mediaAlt;
    else {
      img.alt = "";
      img.setAttribute("aria-hidden", "true");
    }
    stage.appendChild(img);
    const fall = document.createElement("div");
    fall.className = "berx-card-fall";
    fall.setAttribute("aria-hidden", "true");
    stage.appendChild(fall);
    el.appendChild(stage);
  }
  return el;
}
function createBerxControl(label, onPress) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "berx-focusable berx-control";
  button.textContent = label;
  button.addEventListener("click", onPress);
  return button;
}
function createBerxEnergy(sizePx = 64) {
  const el = document.createElement("div");
  el.className = "berx-energy";
  el.setAttribute("aria-hidden", "true");
  el.style.width = `${sizePx}px`;
  el.style.height = `${sizePx}px`;
  return el;
}
function createBerxSceneRoot(root) {
  root.className = "berx-scene";
  root.innerHTML = "";
  const layers = {};
  for (const depth of BERX_DEPTH_KEYS) {
    const layer = createBerxLayer(depth, { surface: depth !== "D3" });
    layers[depth] = layer;
    root.appendChild(layer);
  }
  return layers;
}

// packages/spatial-web/src/primitiveGeometry.ts
var push = (a, x, y, z, nx, ny, nz) => {
  a.push(x, y, z, nx, ny, nz);
};
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

// packages/spatial-web/src/mediaTextures.ts
var DEFAULT_BUDGET = 64;
var BerxMediaTextureCache = class {
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

// packages/spatial-web/src/spatialText.ts
var DEFAULT_BUDGET2 = 96;
var DEFAULT_PIXEL_HEIGHT = 64;
var INK = "#F2F0EB";
var BerxSpatialTextAtlas = class {
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
    const raster = rasterise(label, this.pixelHeight);
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
function rasterise(text, pixelHeight) {
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

// packages/spatial-web/src/threeRuntime.ts
var V = `#version 300 es
precision highp float;layout(location=0)in vec3 p;layout(location=1)in vec3 n;uniform mat4 P,V,M;out vec3 N,W,L,LN;void main(){vec4 w=M*vec4(p,1.);W=w.xyz;N=mat3(M)*n;L=p;LN=n;gl_Position=P*V*w;}`;
var F = `#version 300 es
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
var TV = `#version 300 es
precision highp float;layout(location=0)in vec2 q;uniform mat4 P,V;uniform vec3 C,R,U;uniform vec2 S;out vec2 T;void main(){T=q*.5+.5;vec3 w=C+R*(q.x*S.x)+U*(q.y*S.y);gl_Position=P*V*vec4(w,1.);}`;
var TF = `#version 300 es
precision highp float;in vec2 T;uniform sampler2D TEX;uniform float A;out vec4 C;void main(){vec4 t=texture(TEX,T);C=vec4(t.rgb,t.a*A);if(C.a<.01)discard;}`;
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
function perspective(f, a, n, z) {
  const q = 1 / Math.tan(f * Math.PI / 360), nf = 1 / (n - z), m = new Float32Array(16);
  m[0] = q / a;
  m[5] = q;
  m[10] = (z + n) * nf;
  m[11] = -1;
  m[14] = 2 * z * n * nf;
  return m;
}
function cross2(a, b) {
  return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x };
}
function norm2(v) {
  const l = Math.hypot(v.x, v.y, v.z) || 1;
  return { x: v.x / l, y: v.y / l, z: v.z / l };
}
function sub2(a, b) {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}
function lookAt(p, t) {
  const z = norm2(sub2(p, t));
  let up = { x: 0, y: 1, z: 0 };
  if (Math.abs(z.y) > 0.98) up = { x: 1, y: 0, z: 0 };
  const x = norm2(cross2(up, z)), y = cross2(z, x), m = new Float32Array(16);
  m[0] = x.x;
  m[1] = y.x;
  m[2] = z.x;
  m[4] = x.y;
  m[5] = y.y;
  m[6] = z.y;
  m[8] = x.z;
  m[9] = y.z;
  m[10] = z.z;
  m[12] = -x.x * p.x - x.y * p.y - x.z * p.z;
  m[13] = -y.x * p.x - y.y * p.y - y.z * p.z;
  m[14] = -z.x * p.x - z.y * p.y - z.z * p.z;
  m[15] = 1;
  return m;
}
function model(p, s, r) {
  const cx = Math.cos(r.x), sx = Math.sin(r.x), cy = Math.cos(r.y), sy = Math.sin(r.y), cz = Math.cos(r.z), sz = Math.sin(r.z), m = new Float32Array(16);
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
}
function frustumPlanes(vp) {
  const p = new Float32Array(24);
  const m = (r, c) => vp[c * 4 + r];
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
function sphereVisible(planes, x, y, z, r) {
  for (let i = 0; i < 6; i++) {
    if (planes[i * 4] * x + planes[i * 4 + 1] * y + planes[i * 4 + 2] * z + planes[i * 4 + 3] < -r) return false;
  }
  return true;
}
function multiply(a, b) {
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
    let v = 0;
    for (let k = 0; k < 4; k++) v += a[k * 4 + r] * b[c * 4 + k];
    o[c * 4 + r] = v;
  }
  return o;
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
var LOD_DISTANCE = 18;
var LABEL_FADE_START = 14;
var LABEL_FADE_END = 26;
var BerxThreeRuntimeRenderer = class {
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
    this.labelHeight = 0.34;
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
      gl.clearColor(0.027, 0.031, 0.039, 1);
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
    const gl = this.gl, c = frame.camera, max = Math.max(1, Math.floor(options.maxObjects ?? frame.world.objects.length));
    gl.useProgram(this.program);
    if (clear) {
      gl.clearColor(0.027, 0.031, 0.039, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }
    const proj = perspective(c.fov, width / height, c.near, c.far), view = lookAt(c.position, c.target);
    gl.uniformMatrix4fv(this.P, false, proj);
    gl.uniformMatrix4fv(this.V, false, view);
    const planes = frustumPlanes(multiply(proj, view));
    const all = frame.world.objects.filter((o) => o.visible);
    const focused = frame.world.activeObjectId;
    const radiusOf = (o) => Math.max(o.transform.scale.x, o.transform.scale.y, o.transform.scale.z) * 0.75;
    const visible = all.filter((o) => sphereVisible(planes, o.transform.position.x, o.transform.position.y, o.transform.position.z, radiusOf(o)));
    const eye = c.position, distance = (o) => Math.hypot(o.transform.position.x - eye.x, o.transform.position.y - eye.y, o.transform.position.z - eye.z);
    const opaque = visible.filter((o) => o.material.opacity >= 1).sort((a, b) => {
      if (a.id === focused) return -1;
      if (b.id === focused) return 1;
      return distance(a) - distance(b);
    });
    const blended = visible.filter((o) => o.material.opacity < 1).sort((a, b) => distance(b) - distance(a));
    const ordered = [...opaque, ...blended];
    const drawn = ordered.slice(0, max);
    let drawCalls = 0, triangles = 0, lodReduced = 0;
    this.textures.beginFrame();
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(this.TEX, 0);
    const lighting = this.lighting;
    const energyLights = [];
    for (const o of visible) {
      const light = berxEnergyLight(o.transform.position, o.energy);
      if (light) energyLights.push(light);
    }
    const litWorld = { ...lighting, points: [...lighting.points, ...energyLights] };
    gl.uniform3f(this.CAM, c.position.x, c.position.y, c.position.z);
    gl.uniform3f(this.AMB, lighting.ambient[0] * lighting.ambientIntensity, lighting.ambient[1] * lighting.ambientIntensity, lighting.ambient[2] * lighting.ambientIntensity);
    gl.uniform3f(this.KEY_DIR, lighting.key.direction.x, lighting.key.direction.y, lighting.key.direction.z);
    gl.uniform3f(this.KEY_COL, ...lighting.key.colour);
    gl.uniform1f(this.KEY_I, lighting.key.intensity * (options.ambientMotion === false ? 0.85 : 1));
    for (const o of drawn) {
      const spec = geometryForEntity(o.kind), presentation = presentationForKind(o.kind, o), material = berxWorldMaterial(o.material.material);
      const far = Math.hypot(o.transform.position.x - c.position.x, o.transform.position.y - c.position.y, o.transform.position.z - c.position.z) > LOD_DISTANCE;
      if (far) lodReduced++;
      const mesh = this.getMesh(spec.kind, far ? 1 : 0);
      gl.bindVertexArray(mesh.vao);
      gl.uniformMatrix4fv(this.M, false, model(o.transform.position, o.transform.scale, o.transform.rotation));
      gl.uniform3f(this.BASE, ...presentation.base);
      gl.uniform3f(this.EMIT, presentation.emissive[0] + material.emission[0] * o.energy, presentation.emissive[1] + material.emission[1] * o.energy, presentation.emissive[2] + material.emission[2] * o.energy);
      gl.uniform1f(this.MET, o.material.metalness);
      gl.uniform1f(this.ROUGH, o.material.roughness);
      gl.uniform1f(this.OPAC, o.material.opacity);
      gl.uniform1f(this.TRANS, o.material.transmission);
      const near = berxResolvePointLights(litWorld, o.transform.position);
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
      const uri = this.media.get(o.id), loaded = uri ? this.textures.get(uri) : void 0;
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
    const labelCalls = this.renderLabels(frame, drawn, width, height);
    this.stats = {
      visible: all.length,
      inFrustum: visible.length,
      drawCalls: drawCalls + labelCalls,
      triangles,
      lodReduced,
      budgetCut: Math.max(0, visible.length - drawn.length),
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
  renderLabels(frame, objects, width, height) {
    const gl = this.gl, c = frame.camera;
    const basis = cameraBasis(c);
    if (!basis) return 0;
    let calls = 0;
    this.labels.beginFrame();
    gl.useProgram(this.labelProgram);
    gl.bindVertexArray(this.labelQuad.vao);
    gl.depthMask(false);
    gl.disable(gl.CULL_FACE);
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(this.LT, 0);
    gl.uniformMatrix4fv(this.LP, false, perspective(c.fov, width / height, c.near, c.far));
    gl.uniformMatrix4fv(this.LV, false, lookAt(c.position, c.target));
    gl.uniform3f(this.LR, basis.right.x, basis.right.y, basis.right.z);
    gl.uniform3f(this.LU, basis.up.x, basis.up.y, basis.up.z);
    const eye = c.position;
    const withLabels = objects.filter((o) => o.label && o.label.trim().length > 0);
    const distance = (o) => Math.hypot(o.transform.position.x - eye.x, o.transform.position.y - eye.y, o.transform.position.z - eye.z);
    for (const o of withLabels.slice().sort((a, b) => distance(b) - distance(a))) {
      const d = distance(o);
      if (d > LABEL_FADE_END) continue;
      const entry = this.labels.get(o.label);
      if (!entry) continue;
      const alpha = d <= LABEL_FADE_START ? 1 : 1 - (d - LABEL_FADE_START) / (LABEL_FADE_END - LABEL_FADE_START);
      const halfHeight = this.labelHeight * 0.5;
      const above = o.transform.scale.y * 0.5 + halfHeight * 1.6;
      gl.bindTexture(gl.TEXTURE_2D, entry.texture);
      gl.uniform3f(
        this.LC,
        o.transform.position.x + basis.up.x * above,
        o.transform.position.y + basis.up.y * above,
        o.transform.position.z + basis.up.z * above
      );
      gl.uniform2f(this.LS, halfHeight * entry.aspect, halfHeight);
      gl.uniform1f(this.LA, alpha * o.material.opacity);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      calls++;
    }
    const focusedObject = frame.world.objects.find((o) => o.id === frame.world.activeObjectId);
    this.slots = berxActionRing(focusedObject, c, this.affordances);
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

// packages/spatial-web/src/runtimeQuality.ts
var BERX_SPATIAL_QUALITY_ORDER = ["cinematic", "high", "balanced", "conservative"];
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
  const renderer = new BerxThreeRuntimeRenderer(canvas, { textureBudget: options.textureBudget, onMediaError: options.onMediaError });
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
      for (const entry of entries) renderer.setObjectMedia(entry.object.id, entry.media ?? []);
    },
    addObject: (object, media) => {
      runtime.registerObject(object);
      renderer.setObjectMedia(object.id, media ?? []);
    },
    removeObject: (id) => {
      runtime.removeObject(id);
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

// packages/spatial-web/src/spatialAudioWeb.ts
var BerxWebSpatialAudio = class {
  /**
   * Any real audio context. An `OfflineAudioContext` is one — it is
   * how the verification renders sound deterministically — and it has
   * no `resume` or `close`, which is why both are guarded rather than
   * assumed.
   */
  constructor(context) {
    this.spatial = true;
    this.playing = /* @__PURE__ */ new Map();
    this.buffers = /* @__PURE__ */ new Map();
    this.listener = {
      position: { x: 0, y: 0, z: 0 },
      forward: { x: 0, y: 0, z: -1 },
      up: { x: 0, y: 1, z: 0 }
    };
    this.context = context ?? new AudioContext();
  }
  /** Running only after a gesture. Reported, never assumed. */
  get running() {
    return this.context.state === "running";
  }
  /** Call from a real user gesture. Browsers require one; this is honest about it. */
  async resume() {
    const context = this.context;
    if (context.state !== "running" && typeof context.resume === "function") await context.resume();
  }
  setListener(listener) {
    this.listener = listener;
    const l = this.context.listener;
    if (l.positionX) {
      l.positionX.value = listener.position.x;
      l.positionY.value = listener.position.y;
      l.positionZ.value = listener.position.z;
      l.forwardX.value = listener.forward.x;
      l.forwardY.value = listener.forward.y;
      l.forwardZ.value = listener.forward.z;
      l.upX.value = listener.up.x;
      l.upY.value = listener.up.y;
      l.upZ.value = listener.up.z;
    } else {
      l.setPosition(listener.position.x, listener.position.y, listener.position.z);
      l.setOrientation(
        listener.forward.x,
        listener.forward.y,
        listener.forward.z,
        listener.up.x,
        listener.up.y,
        listener.up.z
      );
    }
  }
  async buffer(uri) {
    const cached = this.buffers.get(uri);
    if (cached) return cached;
    const response = await fetch(uri, { mode: "cors" });
    if (!response.ok) throw new Error(`BERX 5D audio: ${uri} answered ${response.status}`);
    const decoded = await this.context.decodeAudioData(await response.arrayBuffer());
    this.buffers.set(uri, decoded);
    return decoded;
  }
  async play(spec, at) {
    this.stop(spec.id);
    const buffer = await this.buffer(spec.uri);
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.loop = spec.loop;
    const panner = this.context.createPanner();
    panner.panningModel = "HRTF";
    panner.distanceModel = "inverse";
    panner.refDistance = spec.refDistance;
    panner.maxDistance = spec.maxDistance;
    panner.rolloffFactor = 1;
    if (spec.orientation) {
      panner.coneInnerAngle = spec.coneInnerAngle ?? 60;
      panner.coneOuterAngle = spec.coneOuterAngle ?? 180;
      panner.coneOuterGain = 0.2;
    }
    setPannerPosition(panner, at, spec.orientation);
    const gain = this.context.createGain();
    gain.gain.value = berxAudioAttenuation(spec, this.listener.position, at) > 0 ? spec.gain : 0;
    source.connect(panner).connect(gain).connect(this.context.destination);
    source.start();
    source.onended = () => this.stop(spec.id);
    this.playing.set(spec.id, { source, panner, gain, spec });
  }
  move(sourceId, to) {
    const entry = this.playing.get(sourceId);
    if (!entry) return;
    setPannerPosition(entry.panner, to, entry.spec.orientation);
    entry.gain.gain.value = berxAudioAttenuation(entry.spec, this.listener.position, to) > 0 ? entry.spec.gain : 0;
  }
  stop(sourceId) {
    const entry = this.playing.get(sourceId);
    if (!entry) return;
    this.playing.delete(sourceId);
    try {
      entry.source.onended = null;
      entry.source.stop();
    } catch {
    }
    entry.source.disconnect();
    entry.panner.disconnect();
    entry.gain.disconnect();
  }
  stopAll() {
    for (const id of [...this.playing.keys()]) this.stop(id);
  }
  dispose() {
    this.stopAll();
    this.buffers.clear();
    const context = this.context;
    if (typeof context.close === "function") void context.close();
  }
};
function setPannerPosition(panner, at, orientation) {
  if (panner.positionX) {
    panner.positionX.value = at.x;
    panner.positionY.value = at.y;
    panner.positionZ.value = at.z;
    if (orientation) {
      panner.orientationX.value = orientation.x;
      panner.orientationY.value = orientation.y;
      panner.orientationZ.value = orientation.z;
    }
  } else {
    panner.setPosition(at.x, at.y, at.z);
    if (orientation) {
      panner.setOrientation(orientation.x, orientation.y, orientation.z);
    }
  }
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
  const host = createBerx5DWebHost({
    canvas,
    world,
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
export {
  BERX_DEPTH_KEYS,
  BERX_MAX_TILT_DEG,
  BERX_SPATIAL_QUALITY_ORDER,
  BerxMediaTextureCache,
  BerxSpatialTextAtlas,
  BerxThreeRuntimeRenderer,
  BerxWebSpatialAudio,
  atmosphereBackground,
  atmosphereCustomProperties,
  berxLayerContent,
  createBerx5DWebHost,
  createBerxCard,
  createBerxControl,
  createBerxEnergy,
  createBerxLayer,
  createBerxSceneRoot,
  createBox,
  createFrame,
  createRing,
  createSphere,
  detectPlatform,
  focusBackground,
  focusCustomProperties,
  mountBerxScene,
  readDeviceSignals,
  resolveScene,
  resolveSpatialQuality,
  runBerxSharedElement,
  sceneCustomProperties,
  startBerxApp,
  supportsBackdropBlur
};
