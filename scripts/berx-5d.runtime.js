/* BERX 5D ULTIMATE v9 — web spatial runtime.
 * GENERATED from client/packages/spatial{,-web}/src by
 * client/scripts/build-spatial-web.mjs. Do not edit by hand.
 * Regenerate: cd client && node scripts/build-spatial-web.mjs
 */

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
    effectiveColor
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
    "--berx-focus-scale": String(scene.motion.focus.to?.scale ?? 1),
    "--berx-ambient-ms": `${scene.motion.ambient.durationMs}ms`
  };
  const d2 = scene.layers.D2;
  props["--berx-room"] = [
    `linear-gradient(160deg, ${d2.lighting.key.stops[0].color} 0%, ${d2.lighting.key.stops[1].color} 34%, transparent 100%)`,
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
      maxPools: berxAtmospherePoolBudget(scene.budget.tier)
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
  };
  build();
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
  const onResize = () => build();
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
    refresh: build,
    measuredFps: () => fps,
    adapted: () => blurDisabled || tierOverride !== void 0,
    destroy: () => {
      if (frame) cancelAnimationFrame(frame);
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
export {
  BERX_DEPTH_KEYS,
  BERX_MAX_TILT_DEG,
  atmosphereBackground,
  atmosphereCustomProperties,
  berxLayerContent,
  createBerxCard,
  createBerxControl,
  createBerxEnergy,
  createBerxLayer,
  createBerxSceneRoot,
  detectPlatform,
  mountBerxScene,
  readDeviceSignals,
  resolveScene,
  runBerxSharedElement,
  sceneCustomProperties,
  supportsBackdropBlur
};
