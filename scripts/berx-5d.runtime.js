/* BERX MAX 5D runtime — GENERATED. Do not edit by hand. */
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
var BERX_DEPTH_KEYS, BERX_DEPTH_ROLE, BERX_DEPTH_TOKENS, BERX_V9_COLOR, BERX_V9_BLUR, BERX_MAX_TILT_DEG, BERX_V9_PERFORMANCE, BERX_MATERIALS, BERX_ENVIRONMENT_LIGHT, BERX_LIGHT_RECIPES, BERX_COLOR_WORLDS, BERX_DEFAULT_COLOR_WORLD, BERX_MOTION_PRESETS, BERX_REDUCED_MOTION_RULES;
var init_tokens = __esm({
  "packages/spatial/src/tokens.ts"() {
    "use strict";
    BERX_DEPTH_KEYS = ["D0", "D1", "D2", "D3", "D4", "D5"];
    BERX_DEPTH_ROLE = {
      D0: "substrate",
      D1: "environment",
      D2: "structure",
      D3: "content",
      D4: "controls",
      D5: "focus"
    };
    BERX_DEPTH_TOKENS = {
      D0: { z: 0, parallax: 0 },
      D1: { z: 1, parallax: 0.15 },
      D2: { z: 2, parallax: 0.2 },
      D3: { z: 3, parallax: 0.35 },
      D4: { z: 4, parallax: 0.65 },
      D5: { z: 5, parallax: 1 }
    };
    BERX_V9_COLOR = {
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
    BERX_V9_BLUR = { sm: 8, md: 16, lg: 28, xl: 40 };
    BERX_MAX_TILT_DEG = 2.5;
    BERX_V9_PERFORMANCE = {
      targetFps: 60,
      interactiveBudgetMs: 16.7,
      blurMaxLayersMobile: 3,
      simultaneous3DObjectsMobile: 80,
      videoAutoplayConcurrentMobile: 1
    };
    BERX_MATERIALS = {
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
    BERX_ENVIRONMENT_LIGHT = { ambient: 0.18, directional: 0.62, accent: 0.2 };
    BERX_LIGHT_RECIPES = {
      hero: { key: 0.55, rim: 0.25, ambient: 0.2 },
      card: { key: 0.35, rim: 0.12, ambient: 0.53 },
      active: { key: 0.42, rim: 0.38, ambient: 0.2 },
      modal: { key: 0.28, rim: 0.16, ambient: 0.56 }
    };
    BERX_COLOR_WORLDS = {
      Turquoise: { accent: "#4FD6E8", energy: "cool", mood: "future / clarity" },
      Midnight: { accent: "#8BA8FF", energy: "deep", mood: "night / calm" },
      Crimson: { accent: "#FF5C72", energy: "warm", mood: "intense / expressive" },
      Orchid: { accent: "#B38CFF", energy: "creative", mood: "art / culture" },
      WineAsh: { accent: "#A56F83", energy: "muted", mood: "luxury / intimate" },
      Obsidian: { accent: "#C6D0D8", energy: "neutral", mood: "minimal / elite" }
    };
    BERX_DEFAULT_COLOR_WORLD = "Turquoise";
    BERX_MOTION_PRESETS = {
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
    BERX_REDUCED_MOTION_RULES = {
      replaceParallaxWith: "crossFade",
      replaceTiltWith: "none",
      maxDurationMs: 220
    };
  }
});

// packages/spatial/src/color.ts
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
function pool(x, y, radius, color, depth = 1) {
  return { x: round(x, 3), y: round(y, 3), radius: round(radius, 3), color, depth: round(depth, 2) };
}
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
    const distance3 = Math.sqrt(dx * dx + dy * dy);
    const reach = Math.max(1e-3, p.radius);
    if (distance3 >= reach) continue;
    const t = 1 - distance3 / reach;
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
    const distance3 = Math.sqrt(dx * dx + dy * dy);
    if (distance3 >= reach) continue;
    const t = 1 - distance3 / reach;
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
var BERX_FAMILY_ATMOSPHERE, TIME_LIGHT, KIND_LIGHT, COLD_LIGHT, WARM_LIGHT;
var init_atmosphere = __esm({
  "packages/spatial/src/atmosphere.ts"() {
    "use strict";
    init_color();
    init_tokens();
    BERX_FAMILY_ATMOSPHERE = {
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
    TIME_LIGHT = {
      dawn: { warmth: 0.5, lift: 0.1, tint: "#FFC857" },
      day: { warmth: 0.2, lift: 0.14, tint: "#A7B0B7" },
      dusk: { warmth: 0.75, lift: 0.09, tint: "#FF5C72" },
      night: { warmth: 0, lift: 0.05, tint: "#8BA8FF" }
    };
    KIND_LIGHT = {
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
    COLD_LIGHT = "#8FB6FF";
    WARM_LIGHT = "#FFB27A";
  }
});

// packages/spatial/src/materials.ts
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
var BERX_MIN_TEXT_CONTRAST;
var init_materials = __esm({
  "packages/spatial/src/materials.ts"() {
    "use strict";
    init_tokens();
    init_color();
    BERX_MIN_TEXT_CONTRAST = 4.5;
  }
});

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
var init_lighting = __esm({
  "packages/spatial/src/lighting.ts"() {
    "use strict";
    init_tokens();
    init_color();
  }
});

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
var init_camera = __esm({
  "packages/spatial/src/camera.ts"() {
    "use strict";
    init_tokens();
    init_color();
  }
});

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
var init_motion = __esm({
  "packages/spatial/src/motion.ts"() {
    "use strict";
    init_tokens();
    init_color();
  }
});

// packages/spatial/src/performance.ts
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
var WATCH_BUDGET, ARVR_BUDGET;
var init_performance = __esm({
  "packages/spatial/src/performance.ts"() {
    "use strict";
    init_tokens();
    init_color();
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
var RECESSION_AT_FULL, CLEAR_MIN, CLEAR_MAX;
var init_focus = __esm({
  "packages/spatial/src/focus.ts"() {
    "use strict";
    init_color();
    init_tokens();
    RECESSION_AT_FULL = {
      D0: 0.66,
      D1: 0.71,
      D2: 0.8,
      D3: 0.88,
      D4: 0.95,
      D5: 1
    };
    CLEAR_MIN = 0.08;
    CLEAR_MAX = 0.56;
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
var init_scene = __esm({
  "packages/spatial/src/scene.ts"() {
    "use strict";
    init_tokens();
    init_materials();
    init_lighting();
    init_camera();
    init_motion();
    init_performance();
    init_color();
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

// packages/spatial/src/composition.ts
function berxCompositionFor(region) {
  return BY_REGION[region] ?? "relational";
}
function berxComposeLayout(composition, objects, relations, options = {}) {
  if (composition === "relational" || objects.length === 0) {
    return berxRelationalLayout(objects, relations, { rootId: options.rootId });
  }
  const radius = options.radius ?? RADIUS[composition];
  const rise = options.rise ?? 1.15;
  const root = options.rootId ? objects.find((o) => o.id === options.rootId) : void 0;
  const others = objects.filter((o) => o.id !== root?.id);
  const positions = /* @__PURE__ */ new Map();
  if (root) positions.set(root.id, { x: 0, y: 0, z: 0 });
  switch (composition) {
    case "ring": {
      const ordered = [...others].sort((a, b) => a.id.localeCompare(b.id));
      ordered.forEach((object, i) => {
        const angle = i / Math.max(1, ordered.length) * Math.PI * 2;
        positions.set(object.id, {
          x: Math.cos(angle) * radius,
          /* a slight lift so the ring is a ring and not a floor */
          y: Math.sin(angle * 2) * rise * 0.25,
          z: Math.sin(angle) * radius
        });
      });
      break;
    }
    case "orbits": {
      const ranked = [...others].sort((a, b) => {
        const wa = berxRelationalWeight(a.id, relations);
        const wb = berxRelationalWeight(b.id, relations);
        if (wa !== wb) return wb - wa;
        return a.id.localeCompare(b.id);
      });
      const rings = 3;
      const perRing = Math.max(1, Math.ceil(ranked.length / rings));
      ranked.forEach((object, i) => {
        const ring = Math.min(rings - 1, Math.floor(i / perRing));
        const withinRing = i % perRing;
        const inThisRing = Math.min(perRing, ranked.length - ring * perRing);
        const angle = withinRing / Math.max(1, inThisRing) * Math.PI * 2 + berxStableAngle(`ring:${ring}`);
        const r = radius * (1 + ring * 0.75);
        positions.set(object.id, {
          x: Math.cos(angle) * r,
          /* rings sit at different heights, so a ring behind is
             visible over a ring in front rather than hidden by it */
          y: (ring - 1) * rise * 0.6,
          z: Math.sin(angle) * r
        });
      });
      break;
    }
    case "thread": {
      const ends = [...others].sort((a, b) => berxRelationalWeight(b.id, relations) - berxRelationalWeight(a.id, relations) || a.id.localeCompare(b.id)).slice(0, 2);
      const when = (o) => o.time?.at ?? o.time?.startsAt ?? Number.POSITIVE_INFINITY;
      const between = others.filter((o) => !ends.some((e) => e.id === o.id)).sort((a, b) => when(a) - when(b) || a.id.localeCompare(b.id));
      ends.forEach((object, i) => {
        positions.set(object.id, { x: i === 0 ? -radius : radius, y: 0, z: 0 });
      });
      between.forEach((object, i) => {
        const t = (i + 1) / (between.length + 1);
        positions.set(object.id, {
          x: -radius + t * radius * 2,
          /* alternating sides of the line, so a thread reads as an
             exchange rather than as a queue */
          y: (i % 2 === 0 ? 1 : -1) * rise * 0.45,
          z: (i % 2 === 0 ? 1 : -1) * radius * 0.22
        });
      });
      break;
    }
    case "stage": {
      const ordered = [...others].sort((a, b) => {
        const wa = berxRelationalWeight(a.id, relations);
        const wb = berxRelationalWeight(b.id, relations);
        if (wa !== wb) return wb - wa;
        return a.id.localeCompare(b.id);
      });
      ordered.forEach((object, i) => {
        const side = i === 0 ? 0 : (i % 2 === 0 ? 1 : -1) * Math.ceil(i / 2) * radius * 0.38;
        positions.set(object.id, {
          x: side,
          y: i === 0 ? 0 : -rise * 0.2 * Math.ceil(i / 2),
          z: -i * radius * 0.85
        });
      });
      break;
    }
  }
  if (positions.size < objects.length) {
    const fallback = berxRelationalLayout(objects, relations, { rootId: options.rootId });
    for (const object of objects) {
      if (!positions.has(object.id)) {
        const at = fallback.get(object.id);
        if (at) positions.set(object.id, at);
      }
    }
  }
  return positions;
}
var RADIUS, BY_REGION;
var init_composition = __esm({
  "packages/spatial/src/composition.ts"() {
    "use strict";
    init_relational();
    RADIUS = Object.freeze({
      relational: 0,
      /* an arm's reach plus a step: close enough to be a choice, far
         enough that four of them do not touch */
      ring: 4.2,
      orbits: 3.4,
      thread: 5.5,
      stage: 3
    });
    BY_REGION = Object.freeze({
      world: "relational",
      now: "orbits",
      discover: "relational",
      person: "orbits",
      place: "stage",
      event: "orbits",
      experience: "stage",
      community: "relational",
      collection: "stage",
      conversation: "thread",
      create: "ring",
      signals: "orbits",
      self: "orbits"
    });
  }
});

// packages/spatial/src/voice/BerxVoiceAssistant.ts
function berxVoiceProsody(emotion) {
  return PROSODY[emotion];
}
var BERX_VOICE_RATE, BERX_VOICE_PITCH, BERX_VOICE_PAUSE_AFTER_QUESTION, PROSODY, ANSWER_TO_TONE;
var init_BerxVoiceAssistant = __esm({
  "packages/spatial/src/voice/BerxVoiceAssistant.ts"() {
    "use strict";
    BERX_VOICE_RATE = 0.9;
    BERX_VOICE_PITCH = 1.1;
    BERX_VOICE_PAUSE_AFTER_QUESTION = 3e3;
    PROSODY = Object.freeze({
      calm: { rate: BERX_VOICE_RATE, pitch: BERX_VOICE_PITCH, pauseMs: 900 },
      tender: { rate: BERX_VOICE_RATE - 0.08, pitch: BERX_VOICE_PITCH - 0.06, pauseMs: 1600 },
      warm: { rate: BERX_VOICE_RATE + 0.05, pitch: BERX_VOICE_PITCH + 0.05, pauseMs: 1100 },
      /* the pause is the line: this is the one that waits */
      holding: { rate: BERX_VOICE_RATE - 0.12, pitch: BERX_VOICE_PITCH - 0.04, pauseMs: BERX_VOICE_PAUSE_AFTER_QUESTION },
      certain: { rate: BERX_VOICE_RATE, pitch: BERX_VOICE_PITCH - 0.02, pauseMs: 1200 }
    });
    ANSWER_TO_TONE = Object.freeze({
      trembling: "tender",
      uncertain: "holding",
      confident: "warm",
      plain: "calm"
    });
  }
});

// packages/spatial/src/voice/berxPhrases.ts
function berxVoiceNameHeard(name, intent) {
  const clean = name.trim();
  return Object.freeze([
    { text: `${clean}. \u041A\u0440\u0430\u0441\u0438\u0432\u043E\u0435 \u0438\u043C\u044F.`, emotion: "warm" },
    { text: `${clean}. \u0422\u044B \u0438\u0449\u0435\u0448\u044C ${INTENT_WORD[intent]}.`, emotion: "calm" },
    { text: `${clean}. \u0418 \u0442\u044B \u043D\u0435 \u0431\u043E\u0438\u0448\u044C\u0441\u044F.`, emotion: "certain" }
  ]);
}
function berxVoiceWelcome(name) {
  return { text: `\u0414\u043E\u0431\u0440\u043E \u043F\u043E\u0436\u0430\u043B\u043E\u0432\u0430\u0442\u044C \u0434\u043E\u043C\u043E\u0439, ${name.trim()}.`, emotion: "certain" };
}
var BERX_INTENT_OBJECT, BERX_VOICE_WAKING, BERX_VOICE_IDENTITY, BERX_VOICE_OFFER, BERX_VOICE_CHOSEN, BERX_VOICE_NAME_ASK, INTENT_WORD, BERX_VOICE_NOT_HEARD, BERX_VOICE_SILENT_PATH, BERX_VOICE_ALL_LINES;
var init_berxPhrases = __esm({
  "packages/spatial/src/voice/berxPhrases.ts"() {
    "use strict";
    BERX_INTENT_OBJECT = Object.freeze({
      love: "create:intent-love",
      friendship: "create:intent-friendship",
      creation: "create:intent-creation",
      search: "create:intent-search"
    });
    BERX_VOICE_WAKING = Object.freeze([
      { text: "\u0422\u044B \u0441\u043B\u044B\u0448\u0438\u0448\u044C \u043C\u0435\u043D\u044F?", emotion: "holding" },
      { text: "\u042F \u0441\u043B\u044B\u0448\u0443 \u0442\u0435\u0431\u044F.", emotion: "tender" },
      { text: "\u0422\u044B \u0437\u0434\u0435\u0441\u044C \u043D\u0435 \u0441\u043B\u0443\u0447\u0430\u0439\u043D\u043E.", emotion: "holding" }
    ]);
    BERX_VOICE_IDENTITY = Object.freeze([
      { text: "\u0420\u0430\u0441\u0441\u043A\u0430\u0436\u0438 \u043C\u043D\u0435\u2026 \u043A\u0442\u043E \u0442\u044B \u043D\u0430 \u0441\u0430\u043C\u043E\u043C \u0434\u0435\u043B\u0435.", emotion: "holding" },
      { text: "\u041D\u0435 \u0442\u043E, \u0447\u0442\u043E \u0442\u044B \u0433\u043E\u0432\u043E\u0440\u0438\u0448\u044C \u0434\u0440\u0443\u0433\u0438\u043C. \u0410 \u0442\u043E, \u0447\u0442\u043E \u0437\u043D\u0430\u0435\u0448\u044C \u0442\u043E\u043B\u044C\u043A\u043E \u0442\u044B.", emotion: "tender" }
    ]);
    BERX_VOICE_OFFER = Object.freeze([
      { text: "\u0417\u0434\u0435\u0441\u044C \u0447\u0435\u0442\u044B\u0440\u0435 \u0441\u0442\u043E\u0440\u043E\u043D\u044B. \u041F\u043E\u0434\u043E\u0439\u0434\u0438 \u043A \u0442\u043E\u0439, \u0447\u0442\u043E \u0431\u043B\u0438\u0436\u0435.", emotion: "calm" }
    ]);
    BERX_VOICE_CHOSEN = Object.freeze({
      love: {
        text: "\u041B\u044E\u0431\u043E\u0432\u044C\u2026 \u0422\u044B \u0433\u043E\u0432\u043E\u0440\u0438\u0448\u044C \u044D\u0442\u043E \u0442\u0430\u043A, \u0431\u0443\u0434\u0442\u043E \u0431\u043E\u0438\u0448\u044C\u0441\u044F. \u0417\u0434\u0435\u0441\u044C \u0431\u043E\u044F\u0442\u044C\u0441\u044F \u043D\u0435 \u043D\u0443\u0436\u043D\u043E.",
        emotion: "tender",
        about: BERX_INTENT_OBJECT.love
      },
      friendship: {
        text: "\u0414\u0440\u0443\u0436\u0431\u0430\u2026 \u042D\u0442\u043E \u0442\u0438\u0445\u0430\u044F \u0441\u0438\u043B\u0430. \u041D\u0435 \u0433\u0440\u043E\u043C\u043A\u0430\u044F. \u041D\u043E \u043D\u0430\u0441\u0442\u043E\u044F\u0449\u0430\u044F.",
        emotion: "warm",
        about: BERX_INTENT_OBJECT.friendship
      },
      creation: {
        text: "\u0422\u0432\u043E\u0440\u0447\u0435\u0441\u0442\u0432\u043E\u2026 \u0422\u044B \u0431\u0443\u0434\u0435\u0448\u044C \u0441\u043E\u0437\u0434\u0430\u0432\u0430\u0442\u044C \u043C\u0438\u0440\u044B. \u042F \u044D\u0442\u043E \u0447\u0443\u0432\u0441\u0442\u0432\u0443\u044E.",
        emotion: "warm",
        about: BERX_INTENT_OBJECT.creation
      },
      search: {
        text: "\u041F\u043E\u0438\u0441\u043A\u2026 \u0417\u043D\u0430\u0447\u0438\u0442, \u0442\u044B \u0435\u0449\u0451 \u043D\u0435 \u0437\u043D\u0430\u0435\u0448\u044C. \u042D\u0442\u043E \u0447\u0435\u0441\u0442\u043D\u0435\u0435 \u0432\u0441\u0435\u0433\u043E \u043E\u0441\u0442\u0430\u043B\u044C\u043D\u043E\u0433\u043E.",
        emotion: "tender",
        about: BERX_INTENT_OBJECT.search
      }
    });
    BERX_VOICE_NAME_ASK = Object.freeze({
      text: "\u041A\u0430\u043A \u0442\u0435\u0431\u044F \u0437\u043E\u0432\u0443\u0442?",
      emotion: "holding"
    });
    INTENT_WORD = Object.freeze({
      love: "\u043B\u044E\u0431\u043E\u0432\u044C",
      friendship: "\u0434\u0440\u0443\u0436\u0431\u0443",
      creation: "\u0442\u0432\u043E\u0440\u0447\u0435\u0441\u0442\u0432\u043E",
      search: "\u043E\u0442\u0432\u0435\u0442"
    });
    BERX_VOICE_NOT_HEARD = Object.freeze([
      { text: "\u042F \u0442\u0435\u0431\u044F \u043D\u0435 \u0441\u043B\u044B\u0448\u0443. \u041D\u0438\u0447\u0435\u0433\u043E \u0441\u0442\u0440\u0430\u0448\u043D\u043E\u0433\u043E.", emotion: "tender" },
      { text: "\u041C\u043E\u0436\u0435\u0448\u044C \u043F\u0440\u043E\u0441\u0442\u043E \u0432\u044B\u0431\u0440\u0430\u0442\u044C \u2014 \u0440\u0443\u043A\u043E\u0439. \u042F \u043D\u0438\u043A\u0443\u0434\u0430 \u043D\u0435 \u0434\u0435\u043D\u0443\u0441\u044C.", emotion: "calm" }
    ]);
    BERX_VOICE_SILENT_PATH = Object.freeze([
      { text: "\u0417\u0434\u0435\u0441\u044C \u043C\u043E\u0436\u043D\u043E \u0438 \u043C\u043E\u043B\u0447\u0430.", emotion: "calm" },
      { text: "\u041F\u043E\u0434\u043E\u0439\u0434\u0438 \u043A \u0442\u043E\u0439 \u0441\u0442\u043E\u0440\u043E\u043D\u0435, \u0447\u0442\u043E \u0431\u043B\u0438\u0436\u0435.", emotion: "calm" }
    ]);
    BERX_VOICE_ALL_LINES = Object.freeze([
      ...BERX_VOICE_WAKING,
      ...BERX_VOICE_IDENTITY,
      ...BERX_VOICE_OFFER,
      ...Object.values(BERX_VOICE_CHOSEN),
      BERX_VOICE_NAME_ASK,
      ...berxVoiceNameHeard("\u0418\u043C\u044F", "love"),
      berxVoiceWelcome("\u0418\u043C\u044F"),
      ...BERX_VOICE_NOT_HEARD,
      ...BERX_VOICE_SILENT_PATH
    ]);
  }
});

// packages/spatial/src/voice/berxVoiceWorld.ts
var init_berxVoiceWorld = __esm({
  "packages/spatial/src/voice/berxVoiceWorld.ts"() {
    "use strict";
  }
});

// packages/spatial/src/voice/berxRegistrationVoice.ts
var INTENT_WORDS;
var init_berxRegistrationVoice = __esm({
  "packages/spatial/src/voice/berxRegistrationVoice.ts"() {
    "use strict";
    INTENT_WORDS = Object.freeze({
      love: ["\u043B\u044E\u0431\u043E\u0432", "\u043B\u044E\u0431\u0438\u0442\u044C", "\u043E\u0442\u043D\u043E\u0448\u0435\u043D\u0438"],
      friendship: ["\u0434\u0440\u0443\u0436", "\u0434\u0440\u0443\u0437", "\u0434\u0440\u0443\u0433"],
      creation: ["\u0442\u0432\u043E\u0440\u0447", "\u0441\u043E\u0437\u0434\u0430\u0432", "\u0442\u0432\u043E\u0440\u0438\u0442", "\u0438\u0441\u043A\u0443\u0441\u0441\u0442\u0432"],
      search: ["\u043F\u043E\u0438\u0441\u043A", "\u0438\u0449\u0443", "\u0438\u0441\u043A\u0430\u0442\u044C", "\u043D\u0435 \u0437\u043D\u0430\u044E"]
    });
  }
});

// packages/spatial/src/lighting/berxExposure.ts
function berxShoulderInverse(appearance) {
  const y = Math.min(1 - 1e-6, Math.max(0, appearance));
  const qa = ACES_A - y * ACES_C;
  const qb = ACES_B - y * ACES_D;
  const qc = -y * ACES_E;
  const disc = qb * qb - 4 * qa * qc;
  if (disc <= 0 || qa === 0) return y;
  return Math.max(0, (-qb + Math.sqrt(disc)) / (2 * qa));
}
function berxRadianceFor(appearance) {
  return berxShoulderInverse(appearance) / BERX_EXPOSURE;
}
var BERX_SCENE_TRANSPORT, BERX_EXPOSURE, ACES_A, ACES_B, ACES_C, ACES_D, ACES_E, BERX_VISIBLE_STEP;
var init_berxExposure = __esm({
  "packages/spatial/src/lighting/berxExposure.ts"() {
    "use strict";
    BERX_SCENE_TRANSPORT = 0.339;
    BERX_EXPOSURE = 1 / BERX_SCENE_TRANSPORT;
    ACES_A = 2.51;
    ACES_B = 0.03;
    ACES_C = 2.43;
    ACES_D = 0.59;
    ACES_E = 0.14;
    BERX_VISIBLE_STEP = 2 / 255;
  }
});

// packages/spatial/src/lighting/berxEnvironment.ts
function berxEnvironment(sunDirection) {
  const appearance = (hex) => {
    const c = rgb(hex);
    return [berxRadianceFor(c[0]), berxRadianceFor(c[1]), berxRadianceFor(c[2])];
  };
  return {
    zenith: appearance("#15191E"),
    horizon: appearance("#07080A"),
    ground: appearance("#0D1014"),
    sun: appearance("#4FD6E8"),
    /* The sun is the only part of the room brighter than the room. It
       is deliberately modest: a glow that out-runs the key light stops
       reading as a reflection of it and starts reading as a second
       light nobody placed. */
    sunIntensity: 0.55,
    /* ~18° of visible lobe. Tight enough to be a sun rather than a
       tinted sky, wide enough that a rough surface still finds it. */
    sunSharpness: 32,
    /* A floor returns a little of what falls on it. This is the number
       that keeps a downward face dim but not black. */
    bounce: 0.35,
    intensity: 1,
    sunDirection
  };
}
function berxEnvironmentUniform(env) {
  return [
    env.zenith[0],
    env.zenith[1],
    env.zenith[2],
    env.sunIntensity,
    env.horizon[0],
    env.horizon[1],
    env.horizon[2],
    env.sunSharpness,
    env.ground[0] * env.bounce,
    env.ground[1] * env.bounce,
    env.ground[2] * env.bounce,
    env.intensity,
    env.sunDirection.x,
    env.sunDirection.y,
    env.sunDirection.z,
    0,
    env.sun[0],
    env.sun[1],
    env.sun[2],
    0
  ];
}
var rgb;
var init_berxEnvironment = __esm({
  "packages/spatial/src/lighting/berxEnvironment.ts"() {
    "use strict";
    init_color();
    init_berxExposure();
    rgb = (hex) => {
      const c = parseColor(hex);
      if (!c) throw new Error(`BERX 5D environment: ${hex} is not a colour`);
      return [c.r / 255, c.g / 255, c.b / 255];
    };
  }
});

// packages/spatial/src/worldLighting.ts
function berxWorldLighting() {
  const keyDirection = normalise({ x: 0.45, y: 0.72, z: 0.9 });
  return {
    /* #15191E: the room, bounced */
    ambient: rgb2("#15191E"),
    ambientIntensity: 1.35,
    key: {
      direction: keyDirection,
      /* #F2F0EB: daylight-neutral pearl, not white */
      colour: rgb2("#F2F0EB"),
      intensity: 1
    },
    environment: berxEnvironment(keyDirection),
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
    colour: rgb2("#4FD6E8"),
    intensity: e * 1.6,
    range: 4 + e * 6
  };
}
var rgb2, BERX_MAX_POINT_LIGHTS, normalise;
var init_worldLighting = __esm({
  "packages/spatial/src/worldLighting.ts"() {
    "use strict";
    init_color();
    init_berxEnvironment();
    rgb2 = (hex) => {
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

// packages/spatial/src/lighting/berxSSAO.ts
function berxSSAOParams() {
  return { radius: 0.65, bias: 0.025, strength: 0.75, power: 1.6 };
}
function berxSSAOKernel(samples = BERX_SSAO_SAMPLES) {
  const GOLDEN = Math.PI * (3 - Math.sqrt(5));
  const out = [];
  for (let i = 0; i < BERX_SSAO_SAMPLES; i++) {
    const z = 1 - (i + 0.5) / BERX_SSAO_SAMPLES;
    const r = Math.sqrt(Math.max(0, 1 - z * z));
    const theta = GOLDEN * i;
    const t = (i + 1) / BERX_SSAO_SAMPLES;
    const scale = 0.1 + 0.9 * t * t;
    out.push({ x: Math.cos(theta) * r * scale, y: Math.sin(theta) * r * scale, z: z * scale });
  }
  if (samples >= out.length) return out;
  const stride = out.length / samples;
  const cheap = [];
  for (let i = 0; i < samples; i++) cheap.push(out[Math.floor(i * stride)]);
  return cheap;
}
function berxSSAOUniform(params = berxSSAOParams(), samples = BERX_SSAO_SAMPLES) {
  const out = [];
  const kernel = berxSSAOKernel(samples);
  for (const s of kernel) out.push(s.x, s.y, s.z, 0);
  for (let i = kernel.length; i < BERX_SSAO_SAMPLES; i++) out.push(0, 0, 0, 0);
  out.push(params.radius, params.bias, params.strength, params.power);
  return out;
}
var BERX_SSAO_SAMPLES, BERX_SSAO_FLOATS;
var init_berxSSAO = __esm({
  "packages/spatial/src/lighting/berxSSAO.ts"() {
    "use strict";
    BERX_SSAO_SAMPLES = 16;
    BERX_SSAO_FLOATS = (BERX_SSAO_SAMPLES + 1) * 4;
  }
});

// packages/spatial/src/lighting/berxVolumetric.ts
function berxVolumetricParams() {
  return {
    density: 0.035,
    phaseG: 0.45,
    maxDistance: 28,
    intensity: 0.85
  };
}
function berxVolumetricUniform(params = berxVolumetricParams()) {
  return [params.density, params.phaseG, params.maxDistance, params.intensity];
}
var BERX_VOLUMETRIC_STEPS;
var init_berxVolumetric = __esm({
  "packages/spatial/src/lighting/berxVolumetric.ts"() {
    "use strict";
    BERX_VOLUMETRIC_STEPS = 32;
  }
});

// packages/spatial/src/lighting/berxParticles.ts
function berxParticleSpec(kind) {
  return SPECS[kind];
}
function berxParticleUniform(kind, origin = { x: 0, y: 0, z: 0 }, count = SPECS[kind].count) {
  const s = SPECS[kind];
  return [
    s.colour[0],
    s.colour[1],
    s.colour[2],
    s.alpha,
    s.extent,
    s.speed,
    s.size,
    s.period,
    Math.max(1, Math.round(count)),
    BERX_PARTICLE_KINDS.indexOf(kind),
    0,
    0,
    origin.x,
    origin.y,
    origin.z,
    0
  ];
}
function berxParticleOrigin(kind, camera, forward, live) {
  if (kind === "energy") return live;
  const lead = SPECS[kind].extent * BERX_PARTICLE_LEAD;
  return {
    x: camera.x + forward.x * lead,
    y: camera.y + forward.y * lead,
    z: camera.z + forward.z * lead
  };
}
var BERX_PARTICLE_KINDS, BERX_ENERGY, SPECS, BERX_PARTICLE_LEAD;
var init_berxParticles = __esm({
  "packages/spatial/src/lighting/berxParticles.ts"() {
    "use strict";
    BERX_PARTICLE_KINDS = ["dust", "energy", "stars"];
    BERX_ENERGY = [79 / 255, 214 / 255, 232 / 255];
    SPECS = Object.freeze({
      dust: {
        count: 512,
        extent: 24,
        speed: 0.08,
        size: 0.035,
        /* #A7ADB4 — the palette's mist, not white: white motes read as
           dirt on the lens rather than as air in the room */
        colour: [167 / 255, 173 / 255, 180 / 255],
        alpha: 0.22,
        period: 26,
        meaning: "motes in the room \u2014 what makes a lit volume read as air"
      },
      energy: {
        count: 128,
        extent: 3.2,
        speed: 0.55,
        size: 0.05,
        colour: BERX_ENERGY,
        alpha: 0.5,
        period: 4.5,
        meaning: "BERX Energy rising off something live, and nothing else"
      },
      stars: {
        count: 256,
        extent: 90,
        /* fixed in the world: a star that drifts is not far away */
        speed: 0,
        size: 0.05,
        /* #F2F0EB — pearl, the palette's own light */
        colour: [242 / 255, 240 / 255, 235 / 255],
        alpha: 0.3,
        period: 60,
        meaning: "the far field \u2014 the world continues past what is drawn"
      }
    });
    BERX_PARTICLE_LEAD = 0.35;
  }
});

// packages/spatial/src/lighting/berxRenderQuality.ts
function berxRenderQuality(tier) {
  return { ...QUALITIES[tier], reason: REASONS[tier] };
}
function berxSSAOKernelFor(quality) {
  return berxSSAOKernel(quality.ssaoSamples);
}
function berxParticleCountFor(kind, quality) {
  return Math.max(1, Math.round(berxParticleSpec(kind).count * quality.particleScale));
}
function berxResolveRenderTier(signals) {
  if (signals.saveData) {
    return { tier: "low", reason: "the device asked for less data and less work; that request is honoured" };
  }
  if (signals.platform === "arvr") {
    return { tier: "medium", reason: "two eyes at 72Hz or more: half the frame budget of anything else, whatever the GPU" };
  }
  if (signals.platform === "watch") {
    return { tier: "low", reason: "a watch draws the world at all, which is already the ambitious choice" };
  }
  if (typeof signals.measuredFps === "number") {
    if (signals.measuredFps < 24) return { tier: "low", reason: `measured ${Math.round(signals.measuredFps)}fps \u2014 the machine is already behind` };
    if (signals.measuredFps < 50) return { tier: "medium", reason: `measured ${Math.round(signals.measuredFps)}fps \u2014 room for the picture, not for all of it` };
    if (signals.platform === "desktop" && (signals.logicalCores ?? 0) >= 8) {
      return { tier: "ultra", reason: `measured ${Math.round(signals.measuredFps)}fps on ${signals.logicalCores} cores` };
    }
    return { tier: "high", reason: `measured ${Math.round(signals.measuredFps)}fps` };
  }
  const memory = signals.deviceMemoryGb ?? 0;
  const cores = signals.logicalCores ?? 0;
  const dense = (signals.pixelRatio ?? 1) >= 3;
  if (signals.platform === "desktop" && memory >= 16 && cores >= 8) {
    return { tier: "ultra", reason: `desktop, ${memory}GB and ${cores} cores` };
  }
  if (memory >= 8 && cores >= 8 && !dense) return { tier: "high", reason: `${memory}GB and ${cores} cores` };
  if (memory > 0 && memory <= 2) return { tier: "low", reason: `${memory}GB of memory` };
  if (cores > 0 && cores <= 4) return { tier: "low", reason: `${cores} logical cores` };
  if (memory >= 6 && cores >= 6) return { tier: "medium", reason: `${memory}GB and ${cores} cores${dense ? " at 3x or denser" : ""}` };
  return { tier: "medium", reason: "the device said little about itself, and medium is the tier that cannot embarrass it" };
}
var QUALITIES, REASONS;
var init_berxRenderQuality = __esm({
  "packages/spatial/src/lighting/berxRenderQuality.ts"() {
    "use strict";
    init_berxSSAO();
    init_berxVolumetric();
    init_berxParticles();
    QUALITIES = Object.freeze({
      ultra: {
        tier: "ultra",
        volumetricSteps: 48,
        volumetricScale: 1,
        ssaoSamples: BERX_SSAO_SAMPLES,
        shadowMapSize: 2048,
        particleScale: 1,
        maxObjects: 160
      },
      high: {
        tier: "high",
        volumetricSteps: BERX_VOLUMETRIC_STEPS,
        volumetricScale: 1,
        ssaoSamples: BERX_SSAO_SAMPLES,
        shadowMapSize: 2048,
        particleScale: 1,
        maxObjects: 120
      },
      medium: {
        tier: "medium",
        volumetricSteps: 20,
        volumetricScale: 2,
        ssaoSamples: 8,
        shadowMapSize: 1024,
        particleScale: 0.55,
        maxObjects: 80
      },
      low: {
        tier: "low",
        volumetricSteps: 12,
        volumetricScale: 2,
        ssaoSamples: 8,
        shadowMapSize: 512,
        particleScale: 0.3,
        maxObjects: 48
      }
    });
    REASONS = Object.freeze({
      ultra: "a machine with headroom: the march at full resolution and 48 steps, and every mote the fields describe",
      high: "the reference picture \u2014 full-resolution march, 32 steps, a 2048 shadow map",
      medium: "a half-resolution march at 20 steps, which is a sixth of the cost and the same shaft",
      low: "a half-resolution march at 12 steps and a 512 map: every pass still runs, none of them at full price"
    });
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
function berxInvertMat4(m) {
  const a00 = m[0], a01 = m[1], a02 = m[2], a03 = m[3];
  const a10 = m[4], a11 = m[5], a12 = m[6], a13 = m[7];
  const a20 = m[8], a21 = m[9], a22 = m[10], a23 = m[11];
  const a30 = m[12], a31 = m[13], a32 = m[14], a33 = m[15];
  const b00 = a00 * a11 - a01 * a10;
  const b01 = a00 * a12 - a02 * a10;
  const b02 = a00 * a13 - a03 * a10;
  const b03 = a01 * a12 - a02 * a11;
  const b04 = a01 * a13 - a03 * a11;
  const b05 = a02 * a13 - a03 * a12;
  const b06 = a20 * a31 - a21 * a30;
  const b07 = a20 * a32 - a22 * a30;
  const b08 = a20 * a33 - a23 * a30;
  const b09 = a21 * a32 - a22 * a31;
  const b10 = a21 * a33 - a23 * a31;
  const b11 = a22 * a33 - a23 * a32;
  const det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
  const out = new Float32Array(16);
  if (!det) {
    out[0] = 1;
    out[5] = 1;
    out[10] = 1;
    out[15] = 1;
    return out;
  }
  const d = 1 / det;
  out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * d;
  out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * d;
  out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * d;
  out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * d;
  out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * d;
  out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * d;
  out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * d;
  out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * d;
  out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * d;
  out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * d;
  out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * d;
  out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * d;
  out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * d;
  out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * d;
  out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * d;
  out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * d;
  return out;
}
var init_frustum = __esm({
  "packages/spatial/src/frustum.ts"() {
    "use strict";
  }
});

// packages/spatial/src/berxFraming.ts
function berxBoundingRadius(o) {
  return Math.max(o.transform.scale.x, o.transform.scale.y, o.transform.scale.z) * 0.75;
}
function berxFraming(frame, width, height, grid = 96) {
  const c = frame.camera;
  const projection = berxPerspective(c.fov, Math.max(1e-6, width / height), c.near, c.far);
  const view = berxLookAt(c.position, c.target);
  const viewProjection = berxMultiplyMat4(projection, view);
  const cells = new Uint8Array(grid * grid);
  let onScreen = 0, whole = 0, sumX = 0, sumY = 0, weight = 0;
  let minX = 1, minY = 1, maxX = 0, maxY = 0;
  for (const o of frame.world.objects) {
    if (!o.visible) continue;
    const p = project(viewProjection, o.transform.position);
    if (p.w <= 1e-6) continue;
    const ndcX = p.x / p.w, ndcY = p.y / p.w;
    const r = berxBoundingRadius(o);
    const radiusY = r * projection[5] / p.w;
    const radiusX = r * projection[0] / p.w;
    if (radiusX <= 0 || radiusY <= 0) continue;
    const fx = ndcX * 0.5 + 0.5, fy = 0.5 - ndcY * 0.5;
    const rx = radiusX * 0.5, ry = radiusY * 0.5;
    let touched = false;
    const x0 = Math.max(0, Math.floor((fx - rx) * grid));
    const x1 = Math.min(grid - 1, Math.ceil((fx + rx) * grid));
    const y0 = Math.max(0, Math.floor((fy - ry) * grid));
    const y1 = Math.min(grid - 1, Math.ceil((fy + ry) * grid));
    for (let gy = y0; gy <= y1; gy++) {
      for (let gx = x0; gx <= x1; gx++) {
        const cx = (gx + 0.5) / grid, cy = (gy + 0.5) / grid;
        const dx = (cx - fx) / rx, dy = (cy - fy) / ry;
        if (dx * dx + dy * dy <= 1) {
          cells[gy * grid + gx] = 1;
          touched = true;
        }
      }
    }
    if (!touched) continue;
    onScreen++;
    if (fx - rx >= 0 && fx + rx <= 1 && fy - ry >= 0 && fy + ry <= 1) whole++;
    const w = rx * ry;
    sumX += fx * w;
    sumY += fy * w;
    weight += w;
    minX = Math.min(minX, fx - rx);
    maxX = Math.max(maxX, fx + rx);
    minY = Math.min(minY, fy - ry);
    maxY = Math.max(maxY, fy + ry);
  }
  let covered = 0;
  for (let i = 0; i < cells.length; i++) covered += cells[i];
  const centreX = weight > 0 ? sumX / weight : 0.5;
  const centreY = weight > 0 ? sumY / weight : 0.5;
  const offCentre = weight > 0 ? Math.min(1, Math.hypot(centreX - 0.5, centreY - 0.5) * 2) : 0;
  return {
    covered: covered / cells.length,
    onScreen,
    whole,
    offCentre,
    bounds: onScreen > 0 ? { minX, minY, maxX, maxY } : void 0
  };
}
function berxFrameTheWorld(frame, width, height, target = (BERX_FRAMING_MIN + BERX_FRAMING_MAX) / 2) {
  const visible = frame.world.objects.filter((o) => o.visible);
  const camera = frame.camera;
  if (visible.length === 0) {
    return { position: camera.position, target: camera.target, framing: berxFraming(frame, width, height) };
  }
  let cx = 0, cy = 0, cz = 0;
  for (const o of visible) {
    cx += o.transform.position.x;
    cy += o.transform.position.y;
    cz += o.transform.position.z;
  }
  const centre = { x: cx / visible.length, y: cy / visible.length, z: cz / visible.length };
  let dx = camera.position.x - centre.x;
  let dy = camera.position.y - centre.y;
  let dz = camera.position.z - centre.z;
  const len2 = Math.hypot(dx, dy, dz) || 1;
  if (len2 <= 1e-6) {
    dx = 0;
    dy = 0;
    dz = 1;
  }
  dx /= len2;
  dy /= len2;
  dz /= len2;
  let reach = 0;
  for (const o of visible) {
    reach = Math.max(reach, Math.hypot(
      o.transform.position.x - centre.x,
      o.transform.position.y - centre.y,
      o.transform.position.z - centre.z
    ) + berxBoundingRadius(o));
  }
  const at = (distance3) => {
    const position = {
      x: centre.x + dx * distance3,
      y: centre.y + dy * distance3,
      z: centre.z + dz * distance3
    };
    return {
      position,
      framing: berxFraming({ ...frame, camera: { ...camera, position, target: centre } }, width, height)
    };
  };
  const wanted = visible.length;
  const fits = (f) => f.whole >= wanted;
  let near = Math.max(camera.near * 2, reach * 0.05);
  let far = Math.max(near * 2, reach * 12 + 1);
  let best = at(far);
  if (!fits(best.framing)) return { position: best.position, target: centre, framing: best.framing };
  for (let i = 0; i < 24; i++) {
    const mid = (near + far) / 2;
    const probe = at(mid);
    if (fits(probe.framing)) {
      best = probe;
      far = mid;
    } else {
      near = mid;
    }
  }
  if (best.framing.covered > target) {
    let lo = far, hi = Math.max(far * 2, reach * 12 + 1);
    for (let i = 0; i < 16; i++) {
      const mid = (lo + hi) / 2;
      const probe = at(mid);
      if (probe.framing.covered > target) lo = mid;
      else {
        best = probe;
        hi = mid;
      }
    }
  }
  return { position: best.position, target: centre, framing: best.framing };
}
var BERX_FRAMING_MIN, BERX_FRAMING_MAX, project;
var init_berxFraming = __esm({
  "packages/spatial/src/berxFraming.ts"() {
    "use strict";
    init_frustum();
    BERX_FRAMING_MIN = 0.4;
    BERX_FRAMING_MAX = 0.6;
    project = (m, p) => {
      const x = m[0] * p.x + m[4] * p.y + m[8] * p.z + m[12];
      const y = m[1] * p.x + m[5] * p.y + m[9] * p.z + m[13];
      const w = m[3] * p.x + m[7] * p.y + m[11] * p.z + m[15];
      return { x, y, w };
    };
  }
});

// packages/spatial/src/renderPipeline.ts
var BERX_PIPELINE;
var init_renderPipeline = __esm({
  "packages/spatial/src/renderPipeline.ts"() {
    "use strict";
    BERX_PIPELINE = Object.freeze([
      {
        id: "composition",
        kind: "upstream",
        needs: [],
        produces: ["draw-list"],
        why: "the arrangement of the world is a function from entities and relations to coordinates, so it happens in the core and arrives as a draw list \u2014 a composition implemented as a pass would be a composition only the GPU knew about"
      },
      {
        id: "shadows",
        kind: "pass",
        needs: ["draw-list"],
        produces: ["shadow-map"],
        optional: "shadows: false, or a world with nothing to cast",
        why: "depth from the light's own camera, first, because both the surfaces and the air ask it the same question and neither can ask before it exists"
      },
      {
        id: "gbuffer",
        kind: "pass",
        needs: ["draw-list"],
        produces: ["view-normals", "view-depth"],
        optional: "only when NEITHER occlusion nor the march is wanted",
        why: "view-space normal and linear view depth for the two passes that need to know where the surfaces are. It has two consumers and gating it on one of them was a real bug: WebGPU tied it to occlusion, so asking for air without occlusion drew no air"
      },
      {
        id: "ssao",
        kind: "pass",
        needs: ["view-normals", "view-depth"],
        produces: ["ao-map"],
        optional: "ssao: false",
        why: "how much of the room each point can see, computed from the G-buffer and read by the world pass \u2014 which is why it has to be before it"
      },
      {
        id: "volumetric",
        kind: "pass",
        needs: ["shadow-map", "view-depth"],
        produces: ["in-scatter"],
        optional: "volumetric: false, or a world with no shadow camera",
        why: "the march needs the shadow map to know which air is lit and the G-buffer to know where each ray stops. It runs before the world pass because the composite that adds it runs INSIDE that pass and cannot sample a target the pass is writing"
      },
      {
        id: "ibl",
        kind: "term",
        needs: ["ao-map"],
        produces: ["ambient"],
        why: "the room is an analytic function of direction \u2014 berxEnvironment \u2014 so it is four lines in the world shader rather than a pass. A cubemap would be a pass; this is why there is not one"
      },
      {
        id: "world",
        kind: "pass",
        needs: ["draw-list", "shadow-map", "ao-map", "ambient"],
        produces: ["frame"],
        why: "the surfaces, lit: the BRDF, the key light through the shadow map, the environment, and the occlusion scaling the ambient term"
      },
      {
        id: "labels",
        kind: "pass",
        needs: ["frame"],
        produces: ["frame"],
        why: "names stand in the world beside their objects, so they are drawn into the same pass with the depth buffer already holding everything solid"
      },
      {
        id: "particles",
        kind: "pass",
        needs: ["frame"],
        produces: ["frame"],
        optional: "particles: false, or a world with no viewer basis",
        why: "after the world, so the depth buffer already holds everything a mote could be behind"
      },
      {
        id: "composite",
        kind: "pass",
        needs: ["in-scatter", "frame"],
        produces: ["frame"],
        optional: "follows volumetric exactly",
        why: "the air goes on last and additively: light in the air ADDS to what is behind it, and a pass that blended over the world would darken something, which scattering never does"
      },
      {
        id: "post",
        kind: "pass",
        needs: ["frame"],
        produces: ["exposed-frame"],
        why: "exposure and the shoulder, the only stage that writes to the screen. It is LAST because in-scatter is light: tone-mapping the surfaces and then adding the air would put unmapped values on top of mapped ones. Everything before it draws into a linear half-float frame, so values above 1.0 reach the curve and the shoulder has something to roll off \u2014 an 8-bit working target clamps them first and a highlight and a much brighter highlight arrive identical. There is still no bloom and no grade; this is exposure alone"
      }
    ]);
  }
});

// packages/spatial/src/stability.ts
function berxStableLod(distance3, threshold, previous) {
  if (previous === void 0) return distance3 > threshold ? 1 : 0;
  if (previous === 1) return distance3 > threshold - BERX_LOD_HYSTERESIS ? 1 : 0;
  return distance3 > threshold + BERX_LOD_HYSTERESIS ? 1 : 0;
}
function berxBudgetDistance(distance3, wasDrawn) {
  return wasDrawn ? distance3 - BERX_BUDGET_HYSTERESIS : distance3;
}
function berxRememberFrame(items) {
  const lod = {};
  for (const i of items) lod[i.id] = i.lod;
  return { lod, drawn: items.map((i) => i.id) };
}
var BERX_LOD_HYSTERESIS, BERX_BUDGET_HYSTERESIS, BERX_NO_MEMORY;
var init_stability = __esm({
  "packages/spatial/src/stability.ts"() {
    "use strict";
    BERX_LOD_HYSTERESIS = 2;
    BERX_BUDGET_HYSTERESIS = 1.5;
    BERX_NO_MEMORY = Object.freeze({ lod: {}, drawn: [] });
  }
});

// packages/spatial/src/voice/berxWorldState.ts
function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}
function berxSituation(input) {
  const visible = input.objects.filter((o) => o.visible).map((o) => ({
    id: o.id,
    kind: o.kind,
    label: o.label,
    energy: o.energy,
    distanceM: distance(input.eye, o.transform.position)
  })).sort((a, b) => a.distanceM - b.distanceM);
  const fresh = input.location && input.nowMs - input.location.atMs <= 10 * 6e4 ? input.location : void 0;
  return {
    nowMs: input.nowMs,
    cursor: { ...input.cursor },
    location: fresh,
    region: input.region,
    focusId: input.focusId,
    visible,
    conversationId: input.conversationId,
    viewerId: input.viewerId,
    recent: (input.recent ?? []).slice(-BERX_RECENT_ACTIONS),
    allowed: input.allowed ?? BERX_NO_PERMISSIONS
  };
}
function berxHere(state) {
  if (!state.focusId) return void 0;
  return state.visible.find((v) => v.id === state.focusId);
}
function berxNth(state, n) {
  if (!Number.isInteger(n) || n < 1) return void 0;
  return state.visible[n - 1];
}
var BERX_RECENT_ACTIONS, BERX_NO_PERMISSIONS;
var init_berxWorldState = __esm({
  "packages/spatial/src/voice/berxWorldState.ts"() {
    "use strict";
    BERX_RECENT_ACTIONS = 12;
    BERX_NO_PERMISSIONS = Object.freeze({
      microphone: false,
      location: false,
      notifications: false,
      presence: false
    });
  }
});

// packages/spatial/src/voice/berxSpatialMemory.ts
function berxShow(memory, entities) {
  const turn = memory.turn + 1;
  return {
    ...memory,
    turn,
    shown: entities.map((e) => ({ id: e.id, label: e.label, turn })),
    /* A dismissal was about the last set. Carrying it into a new one
       would mean a place refused for tonight is refused forever, which
       is a memory nobody asked for. */
    dismissed: [],
    selected: void 0
  };
}
function berxDismiss(memory, id) {
  if (!memory.shown.some((s) => s.id === id)) return memory;
  return {
    ...memory,
    shown: memory.shown.filter((s) => s.id !== id),
    dismissed: [...memory.dismissed, id],
    selected: memory.selected === id ? void 0 : memory.selected
  };
}
function berxSelect(memory, id) {
  if (!memory.shown.some((s) => s.id === id)) return memory;
  return { ...memory, selected: id };
}
function berxAsked(memory, text) {
  return { ...memory, asked: [...memory.asked, text].slice(-BERX_ASKED_KEPT) };
}
function berxRequested(memory, kind) {
  if (kind === "refine" || kind === "unknown" || kind === "dismiss" || kind === "open" || kind === "back") {
    return memory;
  }
  return { ...memory, requested: kind };
}
function berxNthShown(memory, n) {
  if (!Number.isInteger(n) || n < 1) return void 0;
  return memory.shown[n - 1];
}
var BERX_EMPTY_MEMORY, BERX_ASKED_KEPT;
var init_berxSpatialMemory = __esm({
  "packages/spatial/src/voice/berxSpatialMemory.ts"() {
    "use strict";
    BERX_EMPTY_MEMORY = Object.freeze({
      shown: [],
      dismissed: [],
      asked: [],
      turn: 0
    });
    BERX_ASKED_KEPT = 6;
  }
});

// packages/spatial/src/voice/berxUtterance.ts
function berxUtteranceFeatures(utterance) {
  const text = utterance.trim().toLowerCase();
  const matched = [];
  const take = (kind, hit) => {
    if (hit === void 0) return void 0;
    matched.push(`${kind}:${hit}`);
    return kind;
  };
  let act;
  const identify = stem(text, ACT.identify);
  if (identify) act = take("identify", identify);
  else {
    for (const kind of ["remove", "back", "refine", "go", "show", "find"]) {
      const hit = kind === "back" || kind === "go" ? word(text, ACT[kind]) : stem(text, ACT[kind]);
      if (hit) {
        act = take(kind, hit);
        break;
      }
    }
  }
  let subject;
  for (const kind of ["events", "places", "content", "people"]) {
    const hit = stem(text, SUBJECT[kind]);
    if (hit) {
      subject = take(kind, hit);
      break;
    }
  }
  let time;
  for (const kind of ["now", "tonight", "tomorrow", "past", "today"]) {
    const hit = word(text, TIME[kind]) ?? TIME[kind].find((w) => w.endsWith(" ") && text.includes(w));
    if (hit) {
      time = take(kind, hit);
      break;
    }
  }
  const pointingWord = word(text, POINTING);
  if (pointingWord) matched.push(`pointing:${pointingWord}`);
  const restlessWord = stem(text, RESTLESS);
  if (restlessWord) matched.push(`restless:${restlessWord}`);
  const openWord = stem(text, OPEN_NOW);
  if (openWord) matched.push(`open-now:${openWord}`);
  return {
    subject,
    time,
    act,
    pointing: pointingWord !== void 0,
    restless: restlessWord !== void 0,
    openNow: openWord !== void 0,
    matched
  };
}
function berxFeatureConfidence(f) {
  const signals = [f.subject, f.time, f.act].filter(Boolean).length + (f.pointing ? 1 : 0) + (f.restless ? 1 : 0);
  if (signals === 0) return 0;
  if (signals === 1) return 0.5;
  if (signals === 2) return 0.75;
  return 0.9;
}
function berxUtteranceAlternatives(f) {
  const readings = [];
  if (f.subject === "places") readings.push({ kind: "find-places", from: "subject" });
  if (f.subject === "events") readings.push({ kind: "find-events", from: "subject" });
  if (f.subject === "people") readings.push({ kind: "find-people", from: "subject" });
  if (f.subject === "content") readings.push({ kind: "discover", from: "subject" });
  if (f.time === "today" || f.time === "tonight" || f.time === "tomorrow") {
    readings.push({ kind: "find-events", from: "time" });
  }
  if (f.time === "now") readings.push({ kind: "now-nearby", from: "time" });
  if (f.restless) readings.push({ kind: "discover", from: "mood" });
  const seen = /* @__PURE__ */ new Set();
  return readings.filter((r) => seen.has(r.kind) ? false : (seen.add(r.kind), true));
}
var SUBJECT, TIME, ACT, POINTING, RESTLESS, OPEN_NOW, stem, word;
var init_berxUtterance = __esm({
  "packages/spatial/src/voice/berxUtterance.ts"() {
    "use strict";
    SUBJECT = Object.freeze({
      people: [
        "\u043B\u044E\u0434",
        "\u0447\u0435\u043B\u043E\u0432\u0435\u043A",
        "\u043F\u043E\u0437\u043D\u0430\u043A\u043E\u043C",
        "\u0434\u0440\u0443\u0437",
        "\u043F\u043E\u0434\u0440\u0443\u0433",
        "\u0437\u043D\u0430\u043A\u043E\u043C",
        "\u043F\u043E\u0431\u043E\u043B\u0442\u0430",
        "\u043F\u043E\u043E\u0431\u0449\u0430",
        /* Russian pronouns decline in ways no stem covers: кто, кого,
           кому, кем, ком. Listed rather than stemmed, because "к" is not
           a stem and "ко" appears in half the language. */
        "\u043A\u0442\u043E",
        "\u043A\u043E\u0433\u043E",
        "\u043A\u043E\u043C\u0443",
        "\u043A\u0435\u043C",
        "\u043E \u043A\u043E\u043C",
        "people",
        "someone",
        "who",
        "meet",
        "talk to"
      ],
      places: [
        "\u043C\u0435\u0441\u0442",
        "\u0437\u0430\u0432\u0435\u0434\u0435\u043D\u0438",
        "\u0440\u0435\u0441\u0442\u043E\u0440\u0430\u043D",
        "\u0431\u0430\u0440",
        "\u043A\u0430\u0444\u0435",
        "\u043A\u043E\u0444\u0435\u0439\u043D",
        "\u043F\u043E\u0435\u0441\u0442\u044C",
        "\u043F\u043E\u0443\u0436\u0438\u043D\u0430",
        "\u0432\u044B\u043F\u0438\u0442\u044C",
        "\u043F\u0435\u0440\u0435\u043A\u0443\u0441",
        "\u0443\u0436\u0438\u043D",
        "\u043E\u0431\u0435\u0434",
        "\u0437\u0430\u0432\u0442\u0440\u0430\u043A",
        "place",
        "restaurant",
        "bar",
        "cafe",
        "eat",
        "dinner",
        "lunch",
        "coffee"
      ],
      events: [
        "\u0441\u043E\u0431\u044B\u0442\u0438",
        "\u043C\u0435\u0440\u043E\u043F\u0440\u0438\u044F\u0442\u0438",
        "\u043A\u043E\u043D\u0446\u0435\u0440\u0442",
        "\u0432\u044B\u0441\u0442\u0430\u0432\u043A",
        "\u0432\u0435\u0447\u0435\u0440\u0438\u043D\u043A",
        "\u043B\u0435\u043A\u0446\u0438",
        "\u0441\u043F\u0435\u043A\u0442\u0430\u043A\u043B",
        "\u043D\u0430\u0447\u0438\u043D\u0430",
        "\u0438\u0434\u0443\u0442",
        "\u0438\u0434\u0442\u0438",
        "\u0430\u0444\u0438\u0448",
        /* NOT "происходит": "что происходит рядом" is the live question,
           which nearby answers, and listing it here made the very word
           that chose that reading count as a competing one. */
        "event",
        "concert",
        "gig",
        "show",
        "party",
        "happening"
      ],
      content: ["\u043F\u043E\u0441\u0442", "\u0437\u0430\u043F\u0438\u0441", "\u0444\u043E\u0442\u043E", "\u043C\u043E\u043C\u0435\u043D\u0442", "\u043B\u0435\u043D\u0442", "post", "photo", "feed"]
    });
    TIME = Object.freeze({
      now: ["\u0441\u0435\u0439\u0447\u0430\u0441", "\u043F\u0440\u044F\u043C\u043E \u0441\u0435\u0439\u0447\u0430\u0441", "\u0432 \u0434\u0430\u043D\u043D\u044B\u0439 \u043C\u043E\u043C\u0435\u043D\u0442", "now", "right now"],
      today: ["\u0441\u0435\u0433\u043E\u0434\u043D\u044F", "today"],
      tonight: ["\u0432\u0435\u0447\u0435\u0440", "\u0432\u0435\u0447\u0435\u0440\u043E\u043C", "\u0432\u0435\u0447\u0435\u0440\u0430\u043C", "\u043D\u043E\u0447\u044C\u044E", "tonight", "this evening"],
      tomorrow: ["\u0437\u0430\u0432\u0442\u0440\u0430", "\u043D\u0430 \u0432\u044B\u0445\u043E\u0434\u043D\u044B\u0445", "tomorrow", "this weekend"],
      past: ["\u0432\u0447\u0435\u0440\u0430", "\u043D\u0430 \u043F\u0440\u043E\u0448\u043B\u043E\u0439", "\u0440\u0430\u043D\u044C\u0448\u0435", "yesterday", "last "]
    });
    ACT = Object.freeze({
      show: ["\u043F\u043E\u043A\u0430\u0436\u0438", "\u043F\u043E\u043A\u0430\u0437\u0430\u0442\u044C", "\u0447\u0442\u043E \u0442\u0443\u0442", "\u0447\u0442\u043E \u0437\u0434\u0435\u0441\u044C", "\u0447\u0442\u043E \u0432\u043E\u043A\u0440\u0443\u0433", "\u0447\u0442\u043E \u0440\u044F\u0434\u043E\u043C", "show", "what is"],
      find: ["\u043D\u0430\u0439\u0434\u0438", "\u043D\u0430\u0439\u0442\u0438", "\u0438\u0449\u0438", "\u043F\u043E\u0438\u0449\u0438", "\u043A\u0443\u0434\u0430", "\u0433\u0434\u0435", "find", "look for", "where"],
      go: ["\u043E\u0442\u043A\u0440\u043E\u0439", "\u0437\u0430\u0439\u0434\u0438", "\u043F\u0435\u0440\u0435\u0439\u0434\u0438", "\u0432\u0435\u0434\u0438", "\u043F\u043E\u0439\u0434\u0451\u043C", "open", "go", "take me"],
      remove: ["\u0443\u0431\u0435\u0440\u0438", "\u0443\u0431\u0440\u0430\u0442\u044C", "\u0441\u043A\u0440\u043E\u0439", "\u0441\u043F\u0440\u044F\u0447\u044C", "\u043D\u0435 \u0445\u043E\u0447\u0443", "remove", "hide"],
      back: ["\u043D\u0430\u0437\u0430\u0434", "\u043E\u0431\u0440\u0430\u0442\u043D\u043E", "\u0432\u0435\u0440\u043D\u0438", "back"],
      identify: ["\u0447\u0442\u043E \u044D\u0442\u043E", "\u043A\u0442\u043E \u044D\u0442\u043E", "\u0447\u0442\u043E \u0437\u0430", "\u043A\u0442\u043E \u0442\u0430\u043A\u043E\u0439", "\u0440\u0430\u0441\u0441\u043A\u0430\u0436\u0438 \u043F\u0440\u043E", "what is this", "who is this"],
      refine: ["\u043D\u0435 \u0442\u0430\u043A", "\u0441\u043B\u0438\u0448\u043A\u043E\u043C", "\u0434\u0440\u0443\u0433\u043E\u0435", "\u0434\u0440\u0443\u0433\u0438\u0435", "\u0435\u0449\u0451 \u0432\u0430\u0440\u0438\u0430\u043D\u0442", "something else", "too "]
    });
    POINTING = [
      "\u044D\u0442\u043E",
      "\u044D\u0442\u043E\u0442",
      "\u044D\u0442\u0430",
      "\u044D\u0442\u0438",
      "\u0442\u043E\u0442",
      "\u0442\u0430",
      "\u0442\u0435",
      "\u0437\u0434\u0435\u0441\u044C",
      "\u0442\u0443\u0442",
      "\u0442\u0430\u043C",
      "\u0442\u0443\u0434\u0430",
      "\u0441\u044E\u0434\u0430",
      "this",
      "that",
      "these",
      "here",
      "there"
    ];
    RESTLESS = [
      "\u0441\u043A\u0443\u0447\u043D\u043E",
      "\u043D\u0435\u0447\u0435\u0433\u043E \u0434\u0435\u043B\u0430\u0442\u044C",
      "\u0445\u043E\u0447\u0443 \u043A\u0443\u0434\u0430-\u043D\u0438\u0431\u0443\u0434\u044C",
      "\u0445\u043E\u0447\u0443 \u0432\u044B\u0431\u0440\u0430\u0442\u044C\u0441\u044F",
      "\u0447\u0435\u043C \u0437\u0430\u043D\u044F\u0442\u044C\u0441\u044F",
      "bored",
      "nothing to do"
    ];
    OPEN_NOW = ["\u043E\u0442\u043A\u0440\u044B\u0442", "\u0440\u0430\u0431\u043E\u0442\u0430", "\u0433\u0434\u0435 \u0436\u0438\u0437\u043D\u044C", "\u0433\u0434\u0435 \u043B\u044E\u0434\u0438", "\u043E\u0436\u0438\u0432\u043B", "open now", "lively"];
    stem = (text, list) => list.find((w) => text.includes(w));
    word = (text, list) => {
      const padded = ` ${text.replace(/[.,!?;:]/g, " ")} `;
      return list.find((w) => padded.includes(` ${w} `));
    };
  }
});

// packages/spatial/src/voice/berxIntent.ts
function berxReadIntent(utterance, state, memory) {
  const text = utterance.trim().toLowerCase();
  if (text === "") return UNKNOWN;
  const matched = [];
  const needs = [];
  let objectId;
  let referenced = false;
  const ordinalWord = Object.keys(ORDINALS).find((w) => text.includes(w));
  if (ordinalWord) {
    referenced = true;
    matched.push(ordinalWord);
    const nth = berxNthShown(memory, ORDINALS[ordinalWord]) ?? berxNth(state, ORDINALS[ordinalWord]);
    objectId = nth?.id;
  }
  const hereWord = !objectId ? hasWord(text, HERE_WORDS) : void 0;
  if (hereWord) {
    referenced = true;
    matched.push(hereWord);
    objectId = berxHere(state)?.id;
  }
  const thereWord = !objectId ? hasWord(text, THERE_WORDS) : void 0;
  if (thereWord) {
    referenced = true;
    matched.push(thereWord);
    objectId = memory.selected ?? state.focusId;
  }
  if (referenced && !objectId) needs.push("referent");
  const openNowWord = has(text, OPEN_NOW_WORDS);
  if (openNowWord) matched.push(openNowWord);
  const decide = (kind, word2, confidence) => {
    matched.push(word2);
    if (kind === "now-nearby" || kind === "find-places" && Boolean(openNowWord)) {
      if (!state.allowed.location) needs.push("permission");
      else if (!state.location) needs.push("location");
    }
    const askable = kind === "find-places" || kind === "find-events" || kind === "find-people" || kind === "discover" || kind === "now-nearby";
    const also = askable ? berxUtteranceAlternatives(berxUtteranceFeatures(text)).filter((r) => r.from === "time" && r.kind !== kind).map((r) => r.kind) : [];
    return {
      kind,
      objectId,
      query: kind === "find-places" || kind === "find-events" || kind === "find-people" ? text : void 0,
      openNow: Boolean(openNowWord) || void 0,
      needs,
      confidence,
      matched,
      ...also.length > 0 ? { alternatives: also } : {}
    };
  };
  const dismiss = has(text, DISMISS_WORDS);
  if (dismiss) return decide("dismiss", dismiss, objectId ? 0.9 : 0.5);
  const back = has(text, BACK_WORDS);
  if (back) return decide("back", back, 0.85);
  const open = has(text, OPEN_WORDS);
  if (open) return decide("open", open, objectId ? 0.9 : 0.5);
  const now = has(text, NOW_WORDS);
  if (now) return decide("now-nearby", now, 0.9);
  const pointingFeatures = berxUtteranceFeatures(text);
  if (referenced && objectId && text.split(/\s+/).length <= 4 && !(pointingFeatures.subject !== void 0 && pointingFeatures.act !== "identify")) {
    return { kind: "open", objectId, needs, confidence: 0.7, matched };
  }
  const restless = has(text, RESTLESS_WORDS);
  if (restless) {
    const restlessWhen = berxUtteranceFeatures(text).time;
    if (restlessWhen === "today" || restlessWhen === "tonight" || restlessWhen === "tomorrow") {
      return decide("find-events", `${restless}+${restlessWhen}`, 0.75);
    }
    return decide("discover", restless, 0.6);
  }
  const refine = has(text, REFINE_WORDS);
  if (refine && (memory.shown.length > 0 || memory.requested !== void 0)) {
    const read = decide("refine", refine, 0.75);
    return memory.requested ? { ...read, refining: memory.requested } : read;
  }
  const place = has(text, PLACE_WORDS);
  if (place) return decide("find-places", place, 0.85);
  const event = has(text, EVENT_WORDS);
  if (event) return decide("find-events", event, 0.85);
  const people = has(text, PEOPLE_WORDS);
  if (people) return decide("find-people", people, 0.8);
  const discover = has(text, DISCOVER_WORDS);
  if (discover) {
    const timed = berxUtteranceFeatures(text).time;
    if (timed === "today" || timed === "tonight" || timed === "tomorrow") {
      return decide("find-events", `${discover}+${timed}`, 0.8);
    }
    return decide("discover", discover, 0.6);
  }
  const f = berxUtteranceFeatures(text);
  const fromFeatures = berxIntentFromFeatures(f, objectId !== void 0);
  if (fromFeatures) {
    const read = decide(fromFeatures, f.matched.join(" "), berxFeatureConfidence(f));
    const also = berxUtteranceAlternatives(f).map((r) => r.kind).filter((k) => k !== read.kind);
    return also.length > 0 ? { ...read, alternatives: also } : read;
  }
  if (needs.length > 0 || matched.length > 0) {
    return { kind: "unknown", objectId, needs, confidence: 0, matched };
  }
  return UNKNOWN;
}
function berxIntentFromFeatures(f, hasReferent) {
  if (f.act === "identify") return hasReferent || f.pointing ? "open" : void 0;
  if (f.act === "remove") return "dismiss";
  if (f.act === "back") return "back";
  if (f.act === "refine") return "refine";
  if (f.act === "go" && (hasReferent || f.pointing)) return "open";
  if (f.subject === "people") return "find-people";
  if (f.subject === "places") return "find-places";
  if (f.subject === "events") return "find-events";
  if (f.subject === "content") return "discover";
  if (f.time === "tonight" || f.time === "today" || f.time === "tomorrow") return "find-events";
  if (f.time === "now") return "now-nearby";
  if (f.restless) return "discover";
  if (f.act === "show" || f.act === "find") return "discover";
  return void 0;
}
var UNKNOWN, NOW_WORDS, RESTLESS_WORDS, PLACE_WORDS, EVENT_WORDS, PEOPLE_WORDS, DISCOVER_WORDS, OPEN_WORDS, DISMISS_WORDS, REFINE_WORDS, BACK_WORDS, OPEN_NOW_WORDS, HERE_WORDS, THERE_WORDS, ORDINALS, has, hasWord, BERX_VOICE_CAPABILITY;
var init_berxIntent = __esm({
  "packages/spatial/src/voice/berxIntent.ts"() {
    "use strict";
    init_berxUtterance();
    init_berxWorldState();
    init_berxSpatialMemory();
    UNKNOWN = Object.freeze({ kind: "unknown", needs: [], confidence: 0, matched: [] });
    NOW_WORDS = [
      "\u0447\u0442\u043E \u043F\u0440\u043E\u0438\u0441\u0445\u043E\u0434\u0438\u0442",
      "\u0447\u0442\u043E \u0441\u0435\u0439\u0447\u0430\u0441",
      "\u0447\u0442\u043E \u0440\u044F\u0434\u043E\u043C",
      "\u0447\u0442\u043E \u0432\u043E\u043A\u0440\u0443\u0433",
      "\u043A\u0442\u043E \u0440\u044F\u0434\u043E\u043C",
      "\u0447\u0442\u043E \u0442\u0443\u0442 \u043F\u0440\u043E\u0438\u0441\u0445\u043E\u0434\u0438\u0442",
      "\u0447\u0442\u043E \u0437\u0434\u0435\u0441\u044C \u043F\u0440\u043E\u0438\u0441\u0445\u043E\u0434\u0438\u0442",
      "what's happening",
      "what is happening",
      "around me",
      "near me",
      "right now"
    ];
    RESTLESS_WORDS = [
      "\u0441\u043A\u0443\u0447\u043D\u043E",
      "\u043C\u043D\u0435 \u0441\u043A\u0443\u0447\u043D\u043E",
      "\u043D\u0435\u0447\u0435\u0433\u043E \u0434\u0435\u043B\u0430\u0442\u044C",
      "\u0445\u043E\u0447\u0443 \u043A\u0443\u0434\u0430-\u043D\u0438\u0431\u0443\u0434\u044C",
      "\u0445\u043E\u0447\u0443 \u0432\u044B\u0431\u0440\u0430\u0442\u044C\u0441\u044F",
      "\u043A\u0443\u0434\u0430 \u0431\u044B \u0441\u0445\u043E\u0434\u0438\u0442\u044C",
      "\u043A\u0443\u0434\u0430 \u043F\u043E\u0439\u0442\u0438",
      "\u0447\u0435\u043C \u0437\u0430\u043D\u044F\u0442\u044C\u0441\u044F",
      "bored",
      "nothing to do",
      "somewhere to go"
    ];
    PLACE_WORDS = ["\u043C\u0435\u0441\u0442", "\u043C\u0435\u0441\u0442\u043E", "\u0437\u0430\u0432\u0435\u0434\u0435\u043D\u0438", "\u0440\u0435\u0441\u0442\u043E\u0440\u0430\u043D", "\u0431\u0430\u0440", "\u043A\u0430\u0444\u0435", "\u043F\u043E\u0443\u0436\u0438\u043D\u0430\u0442\u044C", "\u043F\u043E\u0435\u0441\u0442\u044C", "\u0432\u044B\u043F\u0438\u0442\u044C", "place", "restaurant", "bar", "cafe", "eat", "dinner"];
    EVENT_WORDS = ["\u0441\u043E\u0431\u044B\u0442\u0438", "\u043C\u0435\u0440\u043E\u043F\u0440\u0438\u044F\u0442\u0438", "\u043A\u043E\u043D\u0446\u0435\u0440\u0442", "\u0432\u044B\u0441\u0442\u0430\u0432\u043A", "\u0447\u0442\u043E \u043D\u0430\u0447\u0438\u043D\u0430\u0435\u0442\u0441\u044F", "event", "concert", "gig"];
    PEOPLE_WORDS = ["\u043B\u044E\u0434", "\u043F\u043E\u0437\u043D\u0430\u043A\u043E\u043C\u0438\u0442", "\u043A\u0442\u043E-\u043D\u0438\u0431\u0443\u0434\u044C", "\u043A\u043E\u0433\u043E-\u043D\u0438\u0431\u0443\u0434\u044C", "people", "meet someone"];
    DISCOVER_WORDS = ["\u043D\u0435\u043E\u0436\u0438\u0434\u0430\u043D\u043D", "\u0438\u043D\u0442\u0435\u0440\u0435\u0441\u043D", "\u0443\u0434\u0438\u0432\u0438", "\u0447\u0442\u043E-\u043D\u0438\u0431\u0443\u0434\u044C", "surprise", "something interesting", "anything"];
    OPEN_WORDS = ["\u043E\u0442\u043A\u0440\u043E\u0439", "\u043F\u043E\u043A\u0430\u0436\u0438 \u044D\u0442\u043E", "\u0437\u0430\u0439\u0434\u0438", "\u043F\u0435\u0440\u0435\u0439\u0434\u0438", "open", "go there", "take me"];
    DISMISS_WORDS = ["\u0443\u0431\u0435\u0440\u0438", "\u043D\u0435 \u044D\u0442\u043E", "\u043D\u0435 \u0445\u043E\u0447\u0443 \u044D\u0442\u043E", "\u0441\u043A\u0440\u043E\u0439", "remove", "hide", "not this"];
    REFINE_WORDS = ["\u043D\u0435\u0442,", "\u043D\u0435 \u0442\u0430\u043A", "\u0441\u043B\u0438\u0448\u043A\u043E\u043C", "\u0434\u0440\u0443\u0433\u043E\u0435", "\u0447\u0442\u043E-\u043D\u0438\u0431\u0443\u0434\u044C \u0435\u0449\u0451", "\u0435\u0449\u0451 \u0432\u0430\u0440\u0438\u0430\u043D\u0442", "no,", "too ", "something else"];
    BACK_WORDS = ["\u043D\u0430\u0437\u0430\u0434", "\u043E\u0431\u0440\u0430\u0442\u043D\u043E", "\u0432\u0435\u0440\u043D\u0438", "back", "go back"];
    OPEN_NOW_WORDS = ["\u043E\u0442\u043A\u0440\u044B\u0442", "\u0441\u0435\u0439\u0447\u0430\u0441 \u0440\u0430\u0431\u043E\u0442\u0430", "\u0433\u0434\u0435 \u0436\u0438\u0437\u043D\u044C", "\u0433\u0434\u0435 \u043B\u044E\u0434\u0438", "open now", "still open", "lively"];
    HERE_WORDS = ["\u0437\u0434\u0435\u0441\u044C", "\u0442\u0443\u0442", "\u044D\u0442\u043E", "\u044D\u0442\u043E\u0442", "\u044D\u0442\u0430", "\u0441\u044E\u0434\u0430", "here", "this one", "this place"];
    THERE_WORDS = ["\u0442\u0443\u0434\u0430", "\u0442\u0430\u043C", "there"];
    ORDINALS = {
      "\u043F\u0435\u0440\u0432\u044B\u0439": 1,
      "\u043F\u0435\u0440\u0432\u043E\u0435": 1,
      "\u043F\u0435\u0440\u0432\u0430\u044F": 1,
      "first": 1,
      "\u0432\u0442\u043E\u0440\u043E\u0439": 2,
      "\u0432\u0442\u043E\u0440\u043E\u0435": 2,
      "\u0432\u0442\u043E\u0440\u0430\u044F": 2,
      "second": 2,
      "\u0442\u0440\u0435\u0442\u0438\u0439": 3,
      "\u0442\u0440\u0435\u0442\u044C\u0435": 3,
      "\u0442\u0440\u0435\u0442\u044C\u044F": 3,
      "third": 3,
      "\u0447\u0435\u0442\u0432\u0451\u0440\u0442\u044B\u0439": 4,
      "\u0447\u0435\u0442\u0432\u0435\u0440\u0442\u044B\u0439": 4,
      "fourth": 4,
      "\u043F\u044F\u0442\u044B\u0439": 5,
      "fifth": 5
    };
    has = (text, words) => words.find((w) => text.includes(w));
    hasWord = (text, words) => {
      const padded = ` ${text.replace(/[.,!?;:]/g, " ")} `;
      return words.find((w) => padded.includes(` ${w} `));
    };
    BERX_VOICE_CAPABILITY = Object.freeze({
      "now-nearby": "nearbyNow",
      "find-places": "nearbyPlaces",
      "find-events": "events",
      "find-people": "searchUsers",
      discover: "feed"
    });
  }
});

// packages/spatial/src/voice/berxActionGraph.ts
function berxPlan(intent, state) {
  const blocked = [];
  if (intent.kind === "unknown") blocked.push("nothing was understood");
  for (const need of intent.needs) {
    if (need === "referent") blocked.push("that referred to something not in view");
    if (need === "location") blocked.push("where you are is not known yet");
    if (need === "permission") blocked.push("location has not been allowed");
  }
  const capability = BERX_VOICE_CAPABILITY[intent.kind];
  const steps = [];
  switch (intent.kind) {
    case "now-nearby":
      steps.push({
        id: "nearby",
        effect: "read",
        capability,
        says: "\u0421\u043C\u043E\u0442\u0440\u044E, \u0447\u0442\u043E \u0440\u044F\u0434\u043E\u043C."
      });
      steps.push({ id: "compose", effect: "move", says: "\u041F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u044E." });
      break;
    case "find-places":
    case "find-events":
    case "find-people":
    case "discover":
      steps.push({ id: "search", effect: "read", capability, says: "\u0421\u0435\u0439\u0447\u0430\u0441 \u043F\u043E\u0441\u043C\u043E\u0442\u0440\u044E." });
      steps.push({ id: "compose", effect: "move", says: "\u0412\u043E\u0442 \u0447\u0442\u043E \u043D\u0430\u0448\u0451\u043B." });
      break;
    case "open":
      steps.push({ id: "travel", effect: "move", says: "\u0418\u0434\u0443 \u0442\u0443\u0434\u0430." });
      break;
    case "dismiss":
      steps.push({ id: "dismiss", effect: "move", says: "\u0423\u0431\u0440\u0430\u043B." });
      break;
    case "refine": {
      const original = intent.refining ?? "discover";
      const capability2 = BERX_VOICE_CAPABILITY[original] ?? BERX_VOICE_CAPABILITY.discover;
      steps.push({ id: "search", effect: "read", capability: capability2, says: "\u041F\u043E\u043F\u0440\u043E\u0431\u0443\u044E \u0438\u043D\u0430\u0447\u0435." });
      steps.push({ id: "compose", effect: "move", says: "\u0412\u043E\u0442 \u0434\u0440\u0443\u0433\u043E\u0435." });
      break;
    }
    case "back":
      steps.push({ id: "back", effect: "move", says: "\u0412\u043E\u0437\u0432\u0440\u0430\u0449\u0430\u044E." });
      break;
    default:
      break;
  }
  if (steps.some((s) => s.effect === "write" || s.effect === "sensitive") && !state.viewerId) {
    blocked.push("nobody is signed in");
  }
  return { intent, steps, blocked };
}
function berxOutcome(results) {
  const stoppedAt = results.find((r) => r.state !== "done");
  return {
    ok: results.length > 0 && stoppedAt === void 0,
    stoppedAt,
    results,
    awaiting: results.some((r) => r.state === "awaiting-confirmation")
  };
}
function berxChangesTheWorld(kind) {
  return kind === "now-nearby" || kind === "find-places" || kind === "find-events" || kind === "find-people" || kind === "discover" || kind === "refine";
}
var init_berxActionGraph = __esm({
  "packages/spatial/src/voice/berxActionGraph.ts"() {
    "use strict";
    init_berxIntent();
  }
});

// packages/spatial/src/voice/berxSay.ts
function berxAcknowledge(plan) {
  if (plan.blocked.length > 0) {
    return { text: `${plan.blocked[0][0].toUpperCase()}${plan.blocked[0].slice(1)}.`, because: "the plan cannot run and the person needs to know which part" };
  }
  const first = plan.steps[0];
  if (!first) return SILENT("there is nothing to do");
  if (first.effect === "move") return SILENT("the world is about to move, which the person can see");
  return { text: first.says, because: "work is starting that takes long enough to be worth covering" };
}
function berxReport(intent, outcome, found) {
  if (outcome.awaiting) {
    return { text: "\u041D\u0443\u0436\u043D\u043E \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u044C.", because: "a person must agree some way other than out loud" };
  }
  if (!outcome.ok) {
    const stopped = outcome.stoppedAt;
    const why = stopped?.reason ? ` ${stopped.reason}` : "";
    return { text: `\u041D\u0435 \u043F\u043E\u043B\u0443\u0447\u0438\u043B\u043E\u0441\u044C.${why}`, because: "a step did not finish, and saying otherwise would be a lie the person would catch" };
  }
  if (!berxChangesTheWorld(intent.kind)) {
    return SILENT("the camera moved and the person watched it happen");
  }
  if (found === 0) {
    return { text: "\u041D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u043D\u0430\u0448\u0451\u043B. \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0435\u043C \u0438\u043D\u0430\u0447\u0435?", because: "an empty result is a real answer and inventing one would be worse than silence" };
  }
  if (found === 1) {
    return { text: "\u041E\u0434\u043D\u043E \u043C\u0435\u0441\u0442\u043E.", because: "the count is the one thing not visible at a glance" };
  }
  return { text: `${found}. \u0412\u043E\u0442 \u0447\u0442\u043E \u043F\u0440\u043E\u0438\u0441\u0445\u043E\u0434\u0438\u0442.`, because: "the count, and then the world speaks for itself" };
}
function berxAskWhich(count) {
  if (count === 0) return { text: "\u041D\u0435 \u0432\u0438\u0436\u0443, \u043E \u0447\u0451\u043C \u0440\u0435\u0447\u044C.", because: "nothing is in view to refer to" };
  return { text: "\u041A\u0430\u043A\u043E\u0435 \u0438\u043C\u0435\u043D\u043D\u043E?", because: "the reference is real but ambiguous, and asking costs one exchange where guessing costs trust" };
}
function berxAskBetween(readings) {
  const named = readings.map((r) => CHOICE[r.kind]).filter(Boolean);
  if (named.length < 2) return void 0;
  return {
    text: `${named[0][0].toUpperCase()}${named[0].slice(1)} \u0438\u043B\u0438 ${named[1]}?`,
    because: "the sentence fits both readings, and asking costs one exchange where guessing wrong costs trust in every answer after it"
  };
}
var SILENT, CHOICE;
var init_berxSay = __esm({
  "packages/spatial/src/voice/berxSay.ts"() {
    "use strict";
    init_berxActionGraph();
    SILENT = (because) => ({ text: "", because });
    CHOICE = Object.freeze({
      "now-nearby": "\u0447\u0442\u043E \u0440\u044F\u0434\u043E\u043C",
      "find-places": "\u043C\u0435\u0441\u0442\u0430",
      "find-events": "\u0441\u043E\u0431\u044B\u0442\u0438\u044F",
      "find-people": "\u043B\u044E\u0434\u0438",
      discover: "\u0447\u0442\u043E-\u043D\u0438\u0431\u0443\u0434\u044C \u0438\u043D\u0442\u0435\u0440\u0435\u0441\u043D\u043E\u0435"
    });
  }
});

// packages/spatial/src/voice/berxBirth.ts
var BERX_BIRTH_PLAN;
var init_berxBirth = __esm({
  "packages/spatial/src/voice/berxBirth.ts"() {
    "use strict";
    BERX_BIRTH_PLAN = Object.freeze([
      { stage: "arrival", needsSession: false, says: "" },
      { stage: "presence", needsSession: false, says: "\u0421\u043B\u044B\u0448\u0443 \u0442\u0435\u0431\u044F." },
      { stage: "name", needsSession: false, says: "\u041A\u0430\u043A \u0442\u0435\u0431\u044F \u0437\u043E\u0432\u0443\u0442?" },
      {
        stage: "interests",
        needsSession: false,
        says: "\u0427\u0442\u043E \u0442\u0435\u0431\u0435 \u0438\u043D\u0442\u0435\u0440\u0435\u0441\u043D\u043E?",
        /* Collected because it shapes what the world shows on arrival, and
           held in memory for that. NOT written anywhere: there is no
           general interests endpoint, and the dating profile's interests
           string belongs to a dating profile this person did not ask
           for. */
        blocked: "no general interests endpoint on this backend; the dating profile's field belongs to a profile this person did not ask for"
      },
      { stage: "identity", needsSession: false, says: "\u041D\u0443\u0436\u0435\u043D \u0430\u0434\u0440\u0435\u0441 \u0438 \u043F\u0430\u0440\u043E\u043B\u044C." },
      { stage: "confirm", needsSession: false, says: "\u0421\u043E\u0437\u0434\u0430\u044E?" },
      { stage: "birth", capability: "register", needsSession: false, says: "\u0413\u043E\u0442\u043E\u0432\u043E." },
      { stage: "portrait", capability: "uploadAvatar", needsSession: true, says: "\u0425\u043E\u0447\u0435\u0448\u044C \u043B\u0438\u0446\u043E?" },
      { stage: "profile", capability: "updateProfile", needsSession: true, says: "" }
    ]);
  }
});

// packages/spatial/src/core/berxCore.ts
function berxCoreStiffness(from, to) {
  return TRANSITION_STIFFNESS[`${from}>${to}`] ?? DEFAULT_STIFFNESS;
}
function follow(current, target, stiffness, dt) {
  const a = 1 - Math.exp(-stiffness * Math.max(0, dt));
  return current + (target - current) * a;
}
function berxCoreAt(state = "idle") {
  return {
    state,
    previous: state,
    field: { ...BERX_CORE_REST, offset: { ...BERX_CORE_REST.offset } },
    unresolved: state === "error"
  };
}
function berxCoreStep(motion, dt) {
  const target = TARGETS[motion.state];
  const k = berxCoreStiffness(motion.previous, motion.state);
  const f = motion.field;
  return {
    ...motion,
    field: {
      energy: follow(f.energy, target.energy, k, dt),
      coherence: follow(f.coherence, target.coherence, k, dt),
      reach: follow(f.reach, target.reach, k, dt),
      luminance: follow(f.luminance, target.luminance, k, dt),
      grain: follow(f.grain, target.grain, k, dt),
      haze: follow(f.haze, target.haze, k, dt),
      deform: follow(f.deform, target.deform, k, dt),
      offset: {
        x: follow(f.offset.x, target.offset.x, k, dt),
        y: follow(f.offset.y, target.offset.y, k, dt),
        z: follow(f.offset.z, target.offset.z, k, dt)
      }
    }
  };
}
function berxCoreEnter(motion, state) {
  if (state === motion.state) return motion;
  return {
    state,
    previous: motion.state,
    field: motion.field,
    unresolved: state === "error" ? true : RESOLVES.includes(state) ? false : motion.unresolved
  };
}
var BERX_CORE_REST, TARGETS, DEFAULT_STIFFNESS, TRANSITION_STIFFNESS, RESOLVES;
var init_berxCore = __esm({
  "packages/spatial/src/core/berxCore.ts"() {
    "use strict";
    BERX_CORE_REST = Object.freeze({
      energy: 0.06,
      coherence: 0.55,
      reach: 0.6,
      luminance: 0.12,
      grain: 0.1,
      haze: 0.2,
      deform: 0.02,
      offset: Object.freeze({ x: 0, y: 0.2, z: -1.4 })
    });
    TARGETS = Object.freeze({
      idle: BERX_CORE_REST,
      /* Reaching out. Barely brighter, noticeably wider — being noticed is
         a change in attention, not in volume. */
      aware: { energy: 0.16, coherence: 0.62, reach: 1.3, luminance: 0.2, grain: 0.16, haze: 0.26, deform: 0.05, offset: { x: 0, y: 0.22, z: -1.3 } },
      /* Held together and close. The most coherent the field ever is:
         listening is the one state that is entirely about one thing. */
      listening: { energy: 0.34, coherence: 0.93, reach: 1, luminance: 0.3, grain: 0.2, haze: 0.3, deform: 0.08, offset: { x: 0, y: 0.2, z: -1.15 } },
      /* Sound becoming structure: energy rises while reach collapses
         inward. Not a spinner — a signal being folded into something
         smaller and denser than it arrived as. */
      understanding: { energy: 0.52, coherence: 0.86, reach: 0.7, luminance: 0.36, grain: 0.3, haze: 0.34, deform: 0.12, offset: { x: 0, y: 0.2, z: -1.2 } },
      /* The space searches, not the Core. Coherence drops hard and reach
         goes further than anywhere else: the field is in several places
         because it is looking in several places. */
      searching: { energy: 0.68, coherence: 0.34, reach: 3.4, luminance: 0.42, grain: 0.52, haze: 0.5, deform: 0.16, offset: { x: 0, y: 0.3, z: -2.1 } },
      /* Answers arriving and organising: reach stays wide while coherence
         climbs back through it. The world composing itself. */
      discovering: { energy: 0.78, coherence: 0.66, reach: 2.8, luminance: 0.54, grain: 0.6, haze: 0.44, deform: 0.13, offset: { x: 0, y: 0.28, z: -1.9 } },
      /* Committed and waiting on a server. Bright, tight, and NOT yet
         resolved — this is the state that must not look like success,
         because the server has not answered. */
      acting: { energy: 0.86, coherence: 0.9, reach: 1.4, luminance: 0.6, grain: 0.42, haze: 0.36, deform: 0.1, offset: { x: 0, y: 0.24, z: -1.35 } },
      /* Speaking: energy in the field, coherence high, and the only state
         whose deformation is driven from outside — see berxCoreSpeak. */
      speaking: { energy: 0.6, coherence: 0.88, reach: 1.2, luminance: 0.46, grain: 0.28, haze: 0.32, deform: 0.14, offset: { x: 0, y: 0.2, z: -1.2 } },
      /* RESOLUTION, not celebration. Coherence at its highest, energy
         FALLING, reach settling wide and calm: the tension goes out of the
         space and what was found stays in it. No flash, because a flash is
         an event and this is the end of one. */
      success: { energy: 0.3, coherence: 0.97, reach: 1.8, luminance: 0.34, grain: 0.22, haze: 0.24, deform: 0.03, offset: { x: 0, y: 0.22, z: -1.5 } },
      /* Presence kept. Energy stays UP — something is still happening —
         while coherence falls and deformation peaks: a plan came apart, and
         the field shows that rather than turning red. Nothing here is a
         colour change. */
      error: { energy: 0.5, coherence: 0.22, reach: 1.6, luminance: 0.28, grain: 0.3, haze: 0.42, deform: 0.34, offset: { x: 0, y: 0.18, z: -1.45 } },
      /* Gathering. Coherence climbs first and hardest; brightness comes
         back last. Looking for another way rather than starting again. */
      recovering: { energy: 0.44, coherence: 0.72, reach: 1.5, luminance: 0.3, grain: 0.26, haze: 0.34, deform: 0.1, offset: { x: 0, y: 0.2, z: -1.35 } }
    });
    DEFAULT_STIFFNESS = 4.2;
    TRANSITION_STIFFNESS = Object.freeze({
      /* Instant attention. Being noticed cannot lag, or it reads as the
         system catching up rather than as it having been there. */
      "idle>aware": 9,
      "aware>listening": 8,
      /* The one deliberate hesitation in the whole machine, and it is
         honest: understanding takes a moment, and pretending it does not
         would be the fake-instant that makes people distrust the result. */
      "listening>understanding": 3,
      "understanding>searching": 6.5,
      /* Answers arrive at the speed the network gives them; the field
         should not race ahead of them. */
      "searching>discovering": 3.6,
      "discovering>acting": 7,
      "acting>success": 2.6,
      /* Resolution is slow on purpose. A fast success is a notification. */
      "speaking>success": 2.4,
      /* Failure is NOT abrupt. A sharp drop would read as a crash; this is
         a plan coming apart, which takes a moment to become apparent. */
      "acting>error": 2.2,
      "searching>error": 2.2,
      /* And recovery is slower still — the deliberate, unhurried gathering
         that says the system is looking for another way rather than
         flailing. */
      "error>recovering": 1.8,
      "recovering>searching": 5,
      "recovering>listening": 5
    });
    RESOLVES = ["success", "discovering"];
  }
});

// packages/spatial/src/core/berxCoreWorld.ts
function berxCoreCause(current, cause, unresolved = false) {
  const recovering = current === "error" || current === "recovering" || unresolved;
  switch (cause.kind) {
    case "presence":
      if (!cause.near) return "idle";
      return recovering ? "recovering" : "aware";
    case "voice":
      return cause.speaking ? "listening" : recovering ? "recovering" : "aware";
    case "utterance":
      if (cause.intent.kind === "unknown") {
        return "recovering";
      }
      return "understanding";
    case "plan": {
      if (cause.plan.blocked.length > 0) return "recovering";
      const writes = cause.plan.steps.some((s) => s.effect === "write" || s.effect === "sensitive");
      return writes ? "acting" : "searching";
    }
    case "results":
      return cause.found > 0 ? "discovering" : "success";
    case "outcome":
      if (cause.outcome.awaiting) return "acting";
      return cause.outcome.ok ? "success" : "error";
    case "speech":
      return cause.speaking ? "speaking" : recovering ? "recovering" : "aware";
    case "arrived":
      return "success";
    default:
      return current;
  }
}
var init_berxCoreWorld = __esm({
  "packages/spatial/src/core/berxCoreWorld.ts"() {
    "use strict";
  }
});

// packages/spatial/src/core/berxTouch.ts
var init_berxTouch = __esm({
  "packages/spatial/src/core/berxTouch.ts"() {
    "use strict";
  }
});

// packages/spatial/src/berxLivingWorld.ts
function berxLivingWorld() {
  return { core: berxCoreAt("idle"), memory: BERX_EMPTY_MEMORY };
}
async function berxSpeakToWorld(state, utterance, situation, bridge, onIntent, onCore) {
  let memory = berxAsked(state.memory, utterance);
  const intent = berxReadIntent(utterance, situation, memory);
  memory = berxRequested(memory, intent.kind);
  onIntent?.(intent);
  let core = state.core;
  const move = (cause) => {
    core = berxCoreEnter(core, berxCoreCause(core.state, cause, core.unresolved));
    onCore?.(cause);
  };
  move({ kind: "utterance", intent });
  const ask = intent.alternatives && intent.alternatives.length > 0 ? berxAskBetween([{ kind: intent.kind }, ...intent.alternatives.map((kind) => ({ kind }))]) : void 0;
  if (ask) {
    return {
      intent,
      plan: berxPlan(intent, situation),
      outcome: berxOutcome([]),
      change: "none",
      shown: memory.shown,
      say: ask,
      core,
      memory
    };
  }
  const plan = berxPlan(intent, situation);
  move({ kind: "plan", plan });
  if (plan.blocked.length > 0 || plan.steps.length === 0) {
    const say = intent.needs.includes("referent") ? berxAskWhich(situation.visible.length) : berxAcknowledge(plan);
    return {
      intent,
      plan,
      outcome: berxOutcome([]),
      change: "none",
      shown: memory.shown,
      say,
      core,
      memory
    };
  }
  if (intent.kind === "open" && intent.objectId) {
    const moved = bridge.travel?.(intent.objectId) ?? false;
    const results = [{
      step: plan.steps[0],
      state: moved ? "done" : "failed",
      reason: moved ? void 0 : "\u044D\u0442\u043E\u0433\u043E \u043D\u0435\u0442 \u0432 \u043C\u0438\u0440\u0435"
    }];
    const outcome2 = berxOutcome(results);
    if (moved) memory = berxSelect(memory, intent.objectId);
    move(moved ? { kind: "arrived", region: situation.region } : { kind: "outcome", outcome: outcome2 });
    return {
      intent,
      plan,
      outcome: outcome2,
      change: moved ? "travelled" : "none",
      shown: memory.shown,
      /* Silent on success: the camera is visibly moving, and saying
         "иду туда" over it is narration. */
      say: berxReport(intent, outcome2, memory.shown.length),
      core,
      memory
    };
  }
  if (intent.kind === "dismiss" && intent.objectId) {
    const before = memory.shown.length;
    memory = berxDismiss(memory, intent.objectId);
    const removed = memory.shown.length < before;
    const outcome2 = berxOutcome([{ step: plan.steps[0], state: removed ? "done" : "failed", reason: removed ? void 0 : "\u044D\u0442\u043E\u0433\u043E \u043D\u0435\u0442 \u0432 \u043D\u0430\u0431\u043E\u0440\u0435" }]);
    move({ kind: "outcome", outcome: outcome2 });
    return {
      intent,
      plan,
      outcome: outcome2,
      change: removed ? "removed" : "none",
      shown: memory.shown,
      say: berxReport(intent, outcome2, memory.shown.length),
      core,
      memory
    };
  }
  if (intent.kind === "back") {
    const went = bridge.back?.() ?? false;
    const outcome2 = berxOutcome([{ step: plan.steps[0], state: went ? "done" : "failed", reason: went ? void 0 : "\u043D\u0435\u043A\u0443\u0434\u0430 \u0432\u043E\u0437\u0432\u0440\u0430\u0449\u0430\u0442\u044C\u0441\u044F" }]);
    move({ kind: "outcome", outcome: outcome2 });
    return {
      intent,
      plan,
      outcome: outcome2,
      change: went ? "returned" : "none",
      shown: memory.shown,
      say: berxReport(intent, outcome2, memory.shown.length),
      core,
      memory
    };
  }
  const ran = await bridge.execute(plan, situation);
  const outcome = berxOutcome(ran.results);
  const entities = outcome.ok ? ran.entities ?? [] : [];
  if (outcome.ok) memory = berxShow(memory, entities);
  move(outcome.ok ? { kind: "results", found: entities.length } : { kind: "outcome", outcome });
  return {
    intent,
    plan,
    outcome,
    change: outcome.ok && entities.length > 0 ? "composed" : "none",
    shown: memory.shown,
    say: berxReport(intent, outcome, entities.length),
    core,
    memory
  };
}
var init_berxLivingWorld = __esm({
  "packages/spatial/src/berxLivingWorld.ts"() {
    "use strict";
    init_berxIntent();
    init_berxActionGraph();
    init_berxSay();
    init_berxSpatialMemory();
    init_berxCore();
    init_berxCoreWorld();
  }
});

// packages/spatial/src/platform/berxReach.ts
var BERX_NO_INSETS, BERX_WITHOUT_VOICE;
var init_berxReach = __esm({
  "packages/spatial/src/platform/berxReach.ts"() {
    "use strict";
    BERX_NO_INSETS = Object.freeze({ top: 0, right: 0, bottom: 0, left: 0 });
    BERX_WITHOUT_VOICE = Object.freeze({
      "now-nearby": "the NOW region, which is a place in the world and reachable by travelling to it",
      "find-places": "the place region, entered the same way",
      "find-events": "the event region",
      "find-people": "the person region",
      discover: "the discover region",
      open: "press the entity \u2014 the same gesture, at the same thing",
      dismiss: "draw it away, or press its dismiss affordance in the action ring",
      refine: "the affordances on what is already shown; refining is choosing again",
      back: "the back gesture, which every platform already has",
      unknown: "nothing to reach: no intent was formed, so there is nothing a hand would do instead"
    });
  }
});

// packages/spatial/src/worldMaterials.ts
function berxWorldMaterial(name) {
  return BERX_WORLD_MATERIALS[name] ?? BERX_WORLD_MATERIALS.ceramic;
}
var rgb3, NONE, BERX_WORLD_MATERIALS;
var init_worldMaterials = __esm({
  "packages/spatial/src/worldMaterials.ts"() {
    "use strict";
    init_color();
    rgb3 = (hex) => {
      const c = parseColor(hex);
      if (!c) throw new Error(`BERX 5D material: ${hex} is not a colour`);
      return [c.r / 255, c.g / 255, c.b / 255];
    };
    NONE = [0, 0, 0];
    BERX_WORLD_MATERIALS = {
      /* the ground itself: near-black, smooth, and it holds a reflection */
      obsidian: { baseColor: rgb3("#07080A"), metalness: 0.08, roughness: 0.18, emission: NONE, opacity: 1, transmission: 0, ior: 1.5 },
      graphite: { baseColor: rgb3("#15191E"), metalness: 0.12, roughness: 0.52, emission: NONE, opacity: 1, transmission: 0, ior: 1.5 },
      /* people: bright, faintly waxy, not a mirror and not chalk */
      pearl: { baseColor: rgb3("#F2F0EB"), metalness: 0.04, roughness: 0.34, emission: NONE, opacity: 1, transmission: 0, ior: 1.5 },
      champagne: { baseColor: rgb3("#C9B58A"), metalness: 0.25, roughness: 0.3, emission: NONE, opacity: 1, transmission: 0, ior: 1.5 },
      /* a real metal: its own tint, no diffuse term */
      "soft-gold": { baseColor: rgb3("#C9B58A"), metalness: 0.92, roughness: 0.28, emission: NONE, opacity: 1, transmission: 0, ior: 1.5 },
      "dark-glass": { baseColor: rgb3("#0D1014"), metalness: 0, roughness: 0.08, emission: NONE, opacity: 0.68, transmission: 0.55, ior: 1.5 },
      ceramic: { baseColor: rgb3("#A7ADB4"), metalness: 0, roughness: 0.42, emission: NONE, opacity: 1, transmission: 0, ior: 1.45 },
      metal: { baseColor: rgb3("#6F767E"), metalness: 0.96, roughness: 0.24, emission: NONE, opacity: 1, transmission: 0, ior: 1.5 },
      /* cloth scatters: rough, dielectric, no visible highlight */
      fabric: { baseColor: rgb3("#1C2228"), metalness: 0, roughness: 0.88, emission: NONE, opacity: 1, transmission: 0, ior: 1.45 },
      /* a photograph is its own colour; the surface under it must not tint it */
      media: { baseColor: rgb3("#F2F0EB"), metalness: 0, roughness: 0.62, emission: NONE, opacity: 1, transmission: 0, ior: 1.5 },
      /* the only material that emits at rest, and only where energy puts it */
      energy: { baseColor: rgb3("#1C2228"), metalness: 0.1, roughness: 0.3, emission: rgb3("#4FD6E8"), opacity: 1, transmission: 0, ior: 1.5 }
    };
  }
});

// packages/spatial/src/spatialAudio.ts
function berxAudioAttenuation(source, listener, at) {
  const d = Math.hypot(at.x - listener.x, at.y - listener.y, at.z - listener.z);
  if (d >= source.maxDistance) return 0;
  if (d <= source.refDistance) return source.gain;
  const inverse = source.refDistance / d;
  const window2 = 1 - (d - source.refDistance) / (source.maxDistance - source.refDistance);
  return source.gain * inverse * window2;
}
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

// packages/spatial/src/transitions.ts
function berxTransitionSpec(kind) {
  return SPECS2[kind];
}
function berxTransitionForTravel(reason) {
  return REASONS2[reason];
}
function berxTransitionModulation(kind, progress) {
  if (!kind) return none;
  return SPECS2[kind].modulate(clamp01(progress));
}
function berxTransitionArcOffset(kind, easedProgress) {
  if (!kind) return 0;
  return SPECS2[kind].arcMetres * hill(easedProgress);
}
var clamp01, hill, smooth, none, SPECS2, REASONS2, BERX_FAR_TRAVEL_METRES;
var init_transitions = __esm({
  "packages/spatial/src/transitions.ts"() {
    "use strict";
    clamp01 = (t) => t < 0 ? 0 : t > 1 ? 1 : t;
    hill = (t) => {
      const c = clamp01(t);
      return 4 * c * (1 - c);
    };
    smooth = (t) => {
      const c = clamp01(t);
      return c * c * (3 - 2 * c);
    };
    none = { opacity: 1, emissive: 0, scale: 1, fov: 1 };
    SPECS2 = Object.freeze({
      /**
       * Distance collapsing. The field of view opens hard while the
       * camera accelerates, which is a real dolly-zoom: the world at the
       * edges rushes past and the thing ahead stays put.
       */
      wormhole: {
        kind: "wormhole",
        durationSeconds: 1.5,
        arcMetres: 0,
        meaning: "distance collapses \u2014 for travel that crosses the world",
        ease: (t) => 1 - Math.pow(1 - clamp01(t), 4),
        modulate: (t) => ({ opacity: 1, emissive: 0.18 * hill(t), scale: 1, fov: 1 + 0.55 * hill(t) })
      },
      /**
       * The world thins out and comes back. Nothing moves that would not
       * have moved anyway — the only change is that surfaces stop hiding
       * each other for a moment, which reads as passing through.
       */
      dissolve: {
        kind: "dissolve",
        durationSeconds: 1,
        arcMetres: 0,
        meaning: "the world thins and reforms \u2014 for arriving somewhere unrelated",
        ease: smooth,
        modulate: (t) => ({ opacity: 1 - 0.72 * hill(t), emissive: 0, scale: 1, fov: 1 })
      },
      /**
       * The path bends over the top. A fold is the only kind that leaves
       * the straight line by a large amount, so it is the one you can
       * recognise from the camera path alone.
       */
      fold: {
        kind: "fold",
        durationSeconds: 1.2,
        arcMetres: 3.4,
        meaning: "space folds over \u2014 for moving between two things side by side",
        ease: smooth,
        modulate: (t) => ({ opacity: 1 - 0.2 * hill(t), emissive: 0, scale: 1, fov: 1 - 0.12 * hill(t) })
      },
      /** Fast and hard. The shortest of the moving kinds. */
      warp: {
        kind: "warp",
        durationSeconds: 0.8,
        arcMetres: 0.6,
        meaning: "a hard jump \u2014 for a deliberate, known destination",
        ease: (t) => {
          const c = clamp01(t);
          return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
        },
        modulate: (t) => ({ opacity: 1, emissive: 0.1 * hill(t), scale: 1 + 0.08 * hill(t), fov: 1 + 0.3 * hill(t) })
      },
      /**
       * Not a move: a cut, with a flash that decays after it.
       *
       * The camera is already there at 5% of a very short duration. The
       * flash is what makes it legible as a jump rather than as a
       * dropped frame — a cut with no acknowledgement is indistinguishable
       * from a bug.
       */
      teleport: {
        /* The one kind that is NOT the identity at t=0: the flash is the
           cut itself, and a cut acknowledged one frame late reads as a
           glitch. Every kind is the identity at t=1, including this one. */
        kind: "teleport",
        durationSeconds: 0.28,
        arcMetres: 0,
        meaning: "a cut, acknowledged \u2014 for returning somewhere already known",
        ease: (t) => clamp01(t) < 0.05 ? 0 : 1,
        modulate: (t) => ({ opacity: 1, emissive: 0.5 * Math.pow(1 - clamp01(t), 2), scale: 1, fov: 1 })
      },
      /**
       * The slowest. Pacing is most of it — but not all of it, and the
       * distinction matters: an effect whose only difference is duration
       * looks identical in any single frame, which means it is a name
       * rather than a thing. So flow also breathes the field of view
       * open by a few degrees and lets it settle, which is what an
       * unhurried move through time looks like from inside it. Small on
       * purpose: this is the one that must never announce itself.
       */
      flow: {
        kind: "flow",
        durationSeconds: 2,
        arcMetres: 1.2,
        meaning: "unhurried travel \u2014 for moving through time, not space",
        ease: (t) => {
          const c = clamp01(t);
          return c < 0.5 ? 2 * c * c : 1 - Math.pow(-2 * c + 2, 2) / 2;
        },
        modulate: (t) => ({ opacity: 1, emissive: 0, scale: 1, fov: 1 + 0.07 * hill(t) })
      },
      /** Light first, movement second — for arriving at something alive. */
      bloom: {
        kind: "bloom",
        durationSeconds: 0.9,
        arcMetres: 0.4,
        meaning: "light swells \u2014 for arriving at something happening now",
        ease: smooth,
        modulate: (t) => ({ opacity: 1, emissive: 0.42 * hill(t), scale: 1 + 0.06 * hill(t), fov: 1 })
      },
      /** Everything draws in toward the destination, then releases. */
      collapse: {
        kind: "collapse",
        durationSeconds: 0.7,
        arcMetres: 0,
        meaning: "the world draws in \u2014 for going back, or closing something",
        ease: (t) => clamp01(t) * clamp01(t),
        modulate: (t) => ({ opacity: 1, emissive: 0, scale: 1 - 0.22 * hill(t), fov: 1 - 0.18 * hill(t) })
      }
    });
    REASONS2 = Object.freeze({
      /* the ordinary case: somewhere else in the world you can see */
      travel: "warp",
      /* far enough that the world between is worth showing collapsing */
      "travel-far": "wormhole",
      back: "collapse",
      /* focusing is not travelling; it is the gentlest thing there is */
      focus: "flow",
      /* something is happening NOW — the one place light leads */
      live: "bloom",
      /* moving along T rather than through XYZ */
      time: "flow",
      /* a different kind of place entirely */
      region: "dissolve",
      /* somewhere already known: no ceremony, just an acknowledged cut */
      return: "teleport"
    });
    BERX_FAR_TRAVEL_METRES = 14;
  }
});

// packages/spatial/src/spatialCamera.ts
var clamp2, lerp, copy, smoothstep, BerxSpatialCamera, BerxCameraTransition;
var init_spatialCamera = __esm({
  "packages/spatial/src/spatialCamera.ts"() {
    "use strict";
    init_transitions();
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
      /**
        * Where to stand to see a thing.
        *
        * `framingRadius` is anything that belongs to the object but is not
        * part of it — the ring of actions, which stands outside its edge. It
        * used to be ignored, so focusing a person put the camera close
        * enough to crop half the ring off the bottom of the screen.
        */
      poseForObject(position, scale = { x: 1, y: 1, z: 1 }, distance3, framingRadius = 0) {
        const radius = Math.max(scale.x, scale.y, scale.z, framingRadius, 0.5), d = distance3 ?? Math.max(2.4, radius * 3.2);
        return { position: { x: position.x, y: position.y, z: position.z + d }, target: copy(position) };
      }
      moveToPose(pose, durationSeconds = 0.65, kind) {
        return new BerxCameraTransition(this.getState(), pose, durationSeconds, kind);
      }
      moveTo(target, durationSeconds = 0.65) {
        return this.moveToPose(this.poseForObject(target), durationSeconds);
      }
    };
    BerxCameraTransition = class {
      constructor(start, destination, duration, kind) {
        this.start = start;
        this.destination = destination;
        this.elapsed = 0;
        this.duration = Math.max(1e-3, duration);
        this.spec = kind ? berxTransitionSpec(kind) : void 0;
      }
      /** The eased progress this frame — what the arc and the modulation read. */
      get progress() {
        return Math.min(1, this.elapsed / this.duration);
      }
      step(deltaSeconds) {
        this.elapsed = Math.min(this.duration, this.elapsed + Math.max(0, deltaSeconds));
        const raw = this.elapsed / this.duration;
        const t = this.spec ? this.spec.ease(raw) : smoothstep(raw);
        const lift = this.spec ? berxTransitionArcOffset(this.spec.kind, raw) : 0;
        return { position: { x: lerp(this.start.position.x, this.destination.position.x, t), y: lerp(this.start.position.y, this.destination.position.y, t) + lift, z: lerp(this.start.position.z, this.destination.position.z, t) }, target: { x: lerp(this.start.target.x, this.destination.target.x, t), y: lerp(this.start.target.y, this.destination.target.y, t), z: lerp(this.start.target.z, this.destination.target.z, t) }, rotation: { x: lerp(this.start.rotation.x, 0, t), y: lerp(this.start.rotation.y, 0, t), z: lerp(this.start.rotation.z, 0, t) }, fov: this.start.fov, near: this.start.near, far: this.start.far };
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
  }
});

// packages/spatial/src/runtime5d.ts
var cloneCamera, cloneWorld, Berx5DRuntime;
var init_runtime5d = __esm({
  "packages/spatial/src/runtime5d.ts"() {
    "use strict";
    init_spatialCamera();
    init_world();
    init_transitions();
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
      /**
       * How long a transition takes. Its KIND decides — pacing is half of
       * what makes eight effects distinguishable — except under reduced
       * motion, where everything is effectively instant, which is what
       * reduced motion means.
       */
      durationFor(kind) {
        if (this.reducedMotion) return 0.01;
        return kind ? berxTransitionSpec(kind).durationSeconds : this.transitionDuration;
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
      /**
       * Look at something.
       *
       * `framingRadius` is how far anything that belongs to the object but
       * stands outside it reaches — the ring of actions. The world
       * application knows what a thing affords and passes it; a bare
       * runtime has no affordances and passes nothing.
       */
      focus(objectId, framingRadius = 0, kind) {
        const object = this.world.getObject(objectId);
        if (!object) return false;
        this.world.setActiveObject(objectId);
        this.currentWorld.focusObjectId = objectId;
        const pose = this.camera.poseForObject(object.transform.position, object.transform.scale, void 0, framingRadius);
        this.beginCameraTransition(pose, this.durationFor(kind), this.currentWorld, this.reducedMotion ? void 0 : kind);
        return true;
      }
      /**
       * Move the camera to an explicit pose, through the one transition.
       *
       * `focus` and `enterWorld` both derive their pose from an OBJECT;
       * framing derives it from the whole world, so it needs a way in that
       * takes a pose directly. It goes through beginCameraTransition like
       * everything else — a second way of moving the camera would be a
       * second camera, and the whole point of this class is that there is
       * one.
       */
      moveCamera(position, target, kind) {
        this.beginCameraTransition({ position, target }, this.durationFor(kind), this.currentWorld, this.reducedMotion ? void 0 : kind);
      }
      beginCameraTransition(pose, duration, toWorld = this.currentWorld, kind) {
        const fromCamera = this.camera.getState();
        this.cameraTransition = this.camera.moveToPose(pose, duration, kind);
        this.transition = { fromWorld: cloneWorld(this.currentWorld), toWorld: cloneWorld(toWorld), fromCamera, destination: { ...pose.position }, progress: 0, duration: Math.max(1e-3, duration), kind };
      }
      enterWorld(world, destination, kind) {
        const previous = cloneWorld({ ...this.currentWorld, camera: this.camera.getState() });
        this.history.push(previous);
        this.currentWorld = { ...world, enteredAt: Date.now(), camera: this.camera.getState() };
        const object = destination ? void 0 : this.world.getActiveObject();
        const focus = destination ?? object?.transform.position ?? { x: 0, y: 0, z: 0 };
        const pose = object ? this.camera.poseForObject(object.transform.position, object.transform.scale) : this.camera.poseForObject(focus);
        this.beginCameraTransition(pose, this.durationFor(kind), this.currentWorld, this.reducedMotion ? void 0 : kind);
      }
      back(kind) {
        const previous = this.history.pop();
        if (!previous) return false;
        const from = cloneWorld({ ...this.currentWorld, camera: this.camera.getState() });
        this.currentWorld = cloneWorld(previous);
        this.world.setActiveObject(previous.focusObjectId);
        const pose = { position: cloneCamera(previous.camera).position, target: cloneCamera(previous.camera).target };
        const duration = this.durationFor(kind);
        const effect = this.reducedMotion ? void 0 : kind;
        this.cameraTransition = this.camera.moveToPose(pose, duration, effect);
        this.transition = { fromWorld: from, toWorld: cloneWorld(previous), fromCamera: this.camera.getState(), destination: { ...pose.position }, progress: 0, duration: Math.max(1e-3, duration), kind: effect };
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
  return objects.filter((o) => o.visible && o.id !== options.exclude && distance2(at, o.transform.position) <= radius).sort((a, b) => distance2(at, a.transform.position) - distance2(at, b.transform.position));
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
    radius = Math.max(radius, distance2(centre, o.transform.position) + interactionRadius(o));
  }
  return { min, max, centre, radius };
}
function berxClampToWorld(position, bounds, margin = 12) {
  const limit = bounds.radius + margin;
  const d = distance2(position, bounds.centre);
  if (d <= limit || d === 0) return position;
  const scale = limit / d;
  return {
    x: bounds.centre.x + (position.x - bounds.centre.x) * scale,
    y: bounds.centre.y + (position.y - bounds.centre.y) * scale,
    z: bounds.centre.z + (position.z - bounds.centre.z) * scale
  };
}
var distance2;
var init_proximity = __esm({
  "packages/spatial/src/proximity.ts"() {
    "use strict";
    init_spatialInteraction();
    distance2 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
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

// packages/spatial/src/actionRing.ts
function berxActionRingRadius(object, affordances) {
  if (!object || affordances.length === 0) return 0;
  const longest = affordances.reduce((n, a) => Math.max(n, a.label.trim().length), 1);
  const needed = longest * SLOT_HEIGHT * WIDTH_PER_CHARACTER;
  return Math.max(
    Math.max(object.transform.scale.x, object.transform.scale.y) * 0.5 + RING_GAP,
    needed * affordances.length / (Math.PI * 1.35)
  );
}
function berxActionRing(object, camera, affordances) {
  if (!object || affordances.length === 0) return [];
  const basis = cameraBasis(camera);
  if (!basis) return [];
  const drop = object.transform.scale.y * 0.5 + SLOT_HEIGHT * 1.4;
  const longest = affordances.reduce((n, a) => Math.max(n, a.label.trim().length), 1);
  const needed = longest * SLOT_HEIGHT * WIDTH_PER_CHARACTER;
  const radius = berxActionRingRadius(object, affordances);
  const perSlot = Math.min(0.9, needed / Math.max(radius * 1.35, 1e-3));
  const spread = Math.min(Math.PI * 0.9, perSlot * Math.max(1, affordances.length - 1));
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
var RING_GAP, SLOT_HEIGHT, WIDTH_PER_CHARACTER;
var init_actionRing = __esm({
  "packages/spatial/src/actionRing.ts"() {
    "use strict";
    init_spatialInteraction();
    RING_GAP = 0.55;
    SLOT_HEIGHT = 0.26;
    WIDTH_PER_CHARACTER = 0.58;
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
var BERX_WORLD_MARGIN, BERX_PERSISTENCE_VERSION, Berx5DWorldApp;
var init_worldApp = __esm({
  "packages/spatial/src/worldApp.ts"() {
    "use strict";
    init_runtime5d();
    init_temporal();
    init_relational();
    init_composition();
    init_berxFraming();
    init_proximity();
    init_spatialAffordances();
    init_transitions();
    init_actionRing();
    init_xrPose();
    BERX_WORLD_MARGIN = 12;
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
        const composition = berxCompositionFor(this.position.region);
        this.layout = berxComposeLayout(composition, snapshot.objects, usable, { rootId: this.viewerId });
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
      /**
       * Frame what is in the world, so a composed set is a composition.
       *
       * BERX's camera stood 8 metres back from the origin no matter what
       * was in front of it, which is not a camera choosing a shot — it is
       * a fixed vantage that frames whatever happens to be at the origin
       * and lets the rest fall where it falls. Measured on a real world
       * composed from a real search: 6.5% of a desktop frame, with two of
       * five entities off it entirely.
       *
       * The pose comes from berxFrameTheWorld, which fits the whole world
       * — everything WHOLLY inside the frame, not merely overlapping it —
       * and it arrives through the same camera transition every travel
       * uses, because a second way of moving the camera is a second
       * camera. Returns false when there is nothing to frame.
       *
       * It is called, never automatic: a camera that re-framed itself
       * while someone was moving through the world would be taking the
       * world away from them.
       */
      frameWorld(width, height) {
        const frame = this.latestFrame;
        if (frame.world.objects.filter((o) => o.visible).length === 0) return false;
        const fitted = berxFrameTheWorld(frame, width, height);
        this.runtime.moveCamera(fitted.position, fitted.target, berxTransitionForTravel("travel"));
        return true;
      }
      /** How the world is framed right now, for a caller that wants to check. */
      framing(width, height) {
        return berxFraming(this.latestFrame, width, height);
      }
      travelTo(objectId, region) {
        const object = this.runtime.world.getObject(objectId);
        if (!object) return false;
        const target = region ?? regionForKind(object.kind);
        const from = this.runtime.camera.getState().position;
        const to = object.transform.position;
        const metres = Math.hypot(to.x - from.x, to.y - from.y, to.z - from.z);
        const visited = this.history.some((at) => at.focusId === objectId);
        const reason = visited ? "return" : target !== this.position.region ? "region" : metres > BERX_FAR_TRAVEL_METRES ? "travel-far" : "travel";
        const kind = berxTransitionForTravel(reason);
        this.history.push(this.worldPosition);
        this.runtime.enterWorld({ id: `${target}:${objectId}`, focusObjectId: objectId, enteredAt: Date.now() }, object.transform.position, kind);
        this.runtime.focus(objectId, berxActionRingRadius(object, this.affordancesFor(object)), kind);
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
        this.runtime.enterWorld({ id: region, enteredAt: Date.now() }, void 0, berxTransitionForTravel("region"));
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
        if (!this.runtime.back(berxTransitionForTravel("back"))) return false;
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
        const object = this.runtime.world.getObject(objectId);
        const ok = this.runtime.focus(objectId, berxActionRingRadius(object, this.affordancesFor(object)), berxTransitionForTravel("focus"));
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
        return this.affordancesFor(object);
      }
      /** What an entity affords, whether or not it is the focused one. */
      affordancesFor(object) {
        if (!object) return [];
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
      /**
       * Where the world ends.
       *
       * Real state, not a debug hook: a host that wants to tell someone
       * they are at the edge — or a gate that wants to check the edge is
       * still there — needs the same numbers `frame()` clamps against,
       * rather than a second copy of the arithmetic that could drift from
       * it.
       */
      get worldEdge() {
        const bounds = berxWorldBounds(this.runtime.latestFrame.world.objects);
        return { centre: { ...bounds.centre }, radius: bounds.radius, limit: bounds.radius + BERX_WORLD_MARGIN };
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
        this.lastDistanceFromWorld = void 0;
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
        const centre = bounds.centre;
        const dx = base.camera.position.x - centre.x;
        const dy = base.camera.position.y - centre.y;
        const dz = base.camera.position.z - centre.z;
        const distanceFromWorld = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const movedOutwards = this.lastDistanceFromWorld !== void 0 && distanceFromWorld > this.lastDistanceFromWorld + 1e-6;
        if (bounds.radius > 0 && !this.runtime.travelling && movedOutwards) {
          const clamped = berxClampToWorld(base.camera.position, bounds, BERX_WORLD_MARGIN);
          if (clamped !== base.camera.position) {
            this.runtime.camera.setState({ ...base.camera, position: clamped });
          }
        }
        {
          const p = this.runtime.camera.getState().position;
          this.lastDistanceFromWorld = Math.hypot(p.x - centre.x, p.y - centre.y, p.z - centre.z);
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
      person: { base: BERX_5D_DNA.pearl, glow: BERX_5D_DNA.energy, amount: 0.45 },
      /* a moment is live only while it is live */
      moment: { base: BERX_5D_DNA.mist, glow: BERX_5D_DNA.energy, amount: 0.55 },
      /* architecture, lit rather than lighting — until something is
         happening inside it, which is what NOW is */
      place: { base: BERX_5D_DNA.steel, glow: BERX_5D_DNA.energy, amount: 0.5 },
      /* gold is what an event is made of; cyan is what it gives off while
         it is actually running */
      event: { base: BERX_5D_DNA.gold, glow: BERX_5D_DNA.energy, amount: 0.7 },
      experience: { base: BERX_5D_DNA.gold, glow: BERX_5D_DNA.energy, amount: 0.5 },
      community: { base: BERX_5D_DNA.mist, glow: BERX_5D_DNA.energy, amount: 0.4 },
      business: { base: BERX_5D_DNA.steel, glow: BERX_5D_DNA.energy, amount: 0.4 },
      collection: { base: BERX_5D_DNA.graphite, glow: BERX_5D_DNA.energy, amount: 0.35 },
      message: { base: BERX_5D_DNA.mist, glow: BERX_5D_DNA.energy, amount: 0.45 },
      /* creating is a focus moment, and focus is where energy belongs */
      create: { base: BERX_5D_DNA.steel, glow: BERX_5D_DNA.energy, amount: 0.8 }
    };
  }
});

// packages/spatial/src/shadowMap.ts
function berxShadowCamera(casters, lightDirection, mapSize = BERX_SHADOW_MAP_SIZE) {
  if (casters.length === 0) return void 0;
  const bounds = {
    min: { x: Infinity, y: Infinity, z: Infinity },
    max: { x: -Infinity, y: -Infinity, z: -Infinity }
  };
  for (const c of casters) {
    bounds.min.x = Math.min(bounds.min.x, c.position.x - c.radius);
    bounds.min.y = Math.min(bounds.min.y, c.position.y - c.radius);
    bounds.min.z = Math.min(bounds.min.z, c.position.z - c.radius);
    bounds.max.x = Math.max(bounds.max.x, c.position.x + c.radius);
    bounds.max.y = Math.max(bounds.max.y, c.position.y + c.radius);
    bounds.max.z = Math.max(bounds.max.z, c.position.z + c.radius);
  }
  const centre = {
    x: (bounds.min.x + bounds.max.x) * 0.5,
    y: (bounds.min.y + bounds.max.y) * 0.5,
    z: (bounds.min.z + bounds.max.z) * 0.5
  };
  const radius = Math.max(
    0.5,
    Math.hypot(bounds.max.x - centre.x, bounds.max.y - centre.y, bounds.max.z - centre.z)
  );
  const length = Math.hypot(lightDirection.x, lightDirection.y, lightDirection.z) || 1;
  const dir = { x: lightDirection.x / length, y: lightDirection.y / length, z: lightDirection.z / length };
  const back = radius * 2;
  const texelWorldSize = radius * 2 / mapSize;
  const basis = berxLookAt(dir, { x: 0, y: 0, z: 0 });
  const toLight = (v) => ({
    x: basis[0] * v.x + basis[4] * v.y + basis[8] * v.z,
    y: basis[1] * v.x + basis[5] * v.y + basis[9] * v.z,
    z: basis[2] * v.x + basis[6] * v.y + basis[10] * v.z
  });
  const toWorld = (v) => ({
    x: basis[0] * v.x + basis[1] * v.y + basis[2] * v.z,
    y: basis[4] * v.x + basis[5] * v.y + basis[6] * v.z,
    z: basis[8] * v.x + basis[9] * v.y + basis[10] * v.z
  });
  const inLight = toLight(centre);
  const snapped = toWorld({
    x: Math.round(inLight.x / texelWorldSize) * texelWorldSize,
    y: Math.round(inLight.y / texelWorldSize) * texelWorldSize,
    z: inLight.z
  });
  const eye = { x: snapped.x + dir.x * back, y: snapped.y + dir.y * back, z: snapped.z + dir.z * back };
  const view = berxLookAt(eye, snapped);
  const near = 0.01;
  const far = back + radius * 2;
  const projection = berxOrthographic(-radius, radius, -radius, radius, near, far);
  return {
    view: Array.from(view),
    projection: Array.from(projection),
    viewProjection: Array.from(berxMultiplyMat4(projection, view)),
    texelWorldSize,
    /* Scaled by the texel, so it is correct at any box size rather
       than tuned for one scene. The constants are the smallest that
       remove acne on a 2048 map at this world scale, measured on the
       real render rather than guessed. */
    depthBias: Math.max(1e-4, texelWorldSize * 1.5),
    normalBias: texelWorldSize * 1.4,
    mapSize,
    strength: BERX_SHADOW_STRENGTH
  };
}
function berxOrthographic(left, right, bottom, top, near, far) {
  const m = new Float32Array(16);
  const w = right - left || 1;
  const h = top - bottom || 1;
  const d = far - near || 1;
  m[0] = 2 / w;
  m[5] = 2 / h;
  m[10] = -2 / d;
  m[12] = -(right + left) / w;
  m[13] = -(top + bottom) / h;
  m[14] = -(far + near) / d;
  m[15] = 1;
  return m;
}
var BERX_SHADOW_MAP_SIZE, BERX_SHADOW_STRENGTH;
var init_shadowMap = __esm({
  "packages/spatial/src/shadowMap.ts"() {
    "use strict";
    init_frustum();
    BERX_SHADOW_MAP_SIZE = 2048;
    BERX_SHADOW_STRENGTH = 1;
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
  const modulation = berxTransitionModulation(frame.transition?.kind, frame.transition?.progress ?? 0);
  const projection = berxPerspective(c.fov * modulation.fov, width / height, c.near, c.far);
  const view = berxLookAt(c.position, c.target);
  const planes = berxFrustumPlanes(berxMultiplyMat4(projection, view));
  const all = frame.world.objects.filter((o) => o.visible);
  const inFrustum = all.filter((o) => berxSphereInFrustum(planes, o.transform.position, radiusOf(o)));
  const focused = frame.world.activeObjectId;
  const eye = c.position;
  const quality = options.quality ?? berxRenderQuality("high");
  const core = options.core ?? BERX_CORE_REST;
  const coreHaze = core.haze / BERX_CORE_REST.haze;
  const coreGrain = core.grain / BERX_CORE_REST.grain;
  const coreLight = 1 + (core.luminance - BERX_CORE_REST.luminance);
  const memory = options.memory ?? BERX_NO_MEMORY;
  const wasDrawn = new Set(memory.drawn);
  const rank = (o) => berxBudgetDistance(distanceTo(eye, o), wasDrawn.has(o.id));
  const opaque = inFrustum.filter((o) => o.material.opacity >= 1).sort((a, b) => {
    if (a.id === focused) return -1;
    if (b.id === focused) return 1;
    return rank(a) - rank(b);
  });
  const blended = inFrustum.filter((o) => o.material.opacity < 1).sort((a, b) => rank(b) - rank(a));
  const max = Math.max(1, Math.floor(options.maxObjects ?? quality.maxObjects ?? frame.world.objects.length));
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
    const distance3 = distanceTo(eye, o);
    const geo = geometryScale(spec);
    const radius = Math.max(geo.x, geo.y, geo.z) * Math.max(o.transform.scale.x, o.transform.scale.y, o.transform.scale.z);
    const lod = berxStableLod(distance3, BERX_LOD_DISTANCE, memory.lod[o.id]);
    if (lod === 1) lodReduced++;
    return {
      id: o.id,
      kind: o.kind,
      primitive: spec.kind,
      lod,
      radius,
      /* The transition's own scale is folded into the model matrix
         here rather than into the object, so a transition never
         mutates the world: the same world, mid-collapse, is still
         the world it was when the transition ends. */
      model: modelMatrix(
        o.transform.position,
        modulation.scale === 1 ? o.transform.scale : { x: o.transform.scale.x * modulation.scale, y: o.transform.scale.y * modulation.scale, z: o.transform.scale.z * modulation.scale },
        o.transform.rotation
      ),
      base: [...presentation.base],
      /* the palette decides the colour; the material decides how the
         surface behaves. Neither is guessed from the other. */
      emissive: [
        presentation.emissive[0] + material.emission[0] * o.energy + modulation.emissive,
        presentation.emissive[1] + material.emission[1] * o.energy + modulation.emissive,
        presentation.emissive[2] + material.emission[2] * o.energy + modulation.emissive
      ],
      /* the object's own state is authoritative: a screen may have
         changed a value since the named material was resolved */
      metalness: o.material.metalness,
      roughness: o.material.roughness,
      opacity: o.material.opacity * modulation.opacity,
      transmission: o.material.transmission,
      pointLights: berxResolvePointLights(litWorld, o.transform.position),
      media: options.mediaFor?.(o.id),
      label: o.label,
      distance: distance3
    };
  });
  const basis = cameraBasis(c);
  const labels = [];
  const viewProjection = berxMultiplyMat4(projection, view);
  const onScreen = (p) => {
    const m = viewProjection;
    return {
      x: m[0] * p.x + m[4] * p.y + m[8] * p.z + m[12],
      y: m[1] * p.x + m[5] * p.y + m[9] * p.z + m[13],
      w: m[3] * p.x + m[7] * p.y + m[11] * p.z + m[15]
    };
  };
  const BERX_LABEL_ADVANCE = 0.52;
  const kept = [];
  if (basis) {
    const named = drawn.filter((o) => o.label !== void 0 && o.label.trim().length > 0);
    for (const o of named.sort((a, b) => distanceTo(eye, a) - distanceTo(eye, b))) {
      const distance3 = distanceTo(eye, o);
      if (distance3 > BERX_LABEL_FADE_END) continue;
      const halfHeight = BERX_LABEL_HEIGHT * 0.5;
      const above = o.transform.scale.y * 0.5 + halfHeight * 1.6;
      const fade2 = distance3 <= BERX_LABEL_FADE_START ? 1 : 1 - (distance3 - BERX_LABEL_FADE_START) / (BERX_LABEL_FADE_END - BERX_LABEL_FADE_START);
      const position = {
        x: o.transform.position.x + basis.up.x * above,
        y: o.transform.position.y + basis.up.y * above,
        z: o.transform.position.z + basis.up.z * above
      };
      const clip = onScreen(position);
      if (clip.w <= 1e-4) continue;
      const ndcX = clip.x / clip.w, ndcY = clip.y / clip.w;
      const hh = halfHeight * projection[5] / clip.w;
      const hw = hh * BERX_LABEL_ADVANCE * o.label.trim().length * (height / Math.max(1, width));
      if (Math.abs(ndcX) > 1 || Math.abs(ndcY) > 1) continue;
      if (kept.some((k) => Math.abs(k.x - ndcX) < k.hw + hw && Math.abs(k.y - ndcY) < k.hh + hh)) continue;
      kept.push({ x: ndcX, y: ndcY, hw, hh });
      labels.push({
        id: o.id,
        text: o.label,
        position,
        halfHeight,
        /* names thin out with the world they belong to, or a
           dissolve would leave a field of floating text */
        alpha: fade2 * o.material.opacity * modulation.opacity,
        distance: distance3
      });
    }
    labels.reverse();
  }
  const forward = {
    x: c.target.x - c.position.x,
    y: c.target.y - c.position.y,
    z: c.target.z - c.position.z
  };
  const forwardLength = Math.hypot(forward.x, forward.y, forward.z) || 1;
  const viewAhead = { x: forward.x / forwardLength, y: forward.y / forwardLength, z: forward.z / forwardLength };
  let live;
  for (const item of items) {
    const energy = item.emissive[0] + item.emissive[1] + item.emissive[2];
    if (energy > 0.35 && (!live || energy > live.energy)) {
      live = { position: { x: item.model[12], y: item.model[13], z: item.model[14] }, energy };
    }
  }
  const particleFields = [];
  for (const kind of BERX_PARTICLE_KINDS) {
    const origin = berxParticleOrigin(kind, c.position, viewAhead, live?.position);
    if (!origin) continue;
    particleFields.push(berxParticleUniform(
      kind,
      origin,
      berxParticleCountFor(kind, quality) * Math.max(0.15, Math.min(2, coreGrain))
    ));
  }
  return {
    width,
    height,
    projection: Array.from(projection),
    view: Array.from(view),
    invViewProjection: Array.from(berxInvertMat4(berxMultiplyMat4(projection, view))),
    camera: { ...c.position },
    clearColor: [...BERX_WORLD_CLEAR],
    environment: berxEnvironmentUniform(lighting.environment),
    ambient: [
      lighting.ambient[0] * lighting.ambientIntensity,
      lighting.ambient[1] * lighting.ambientIntensity,
      lighting.ambient[2] * lighting.ambientIntensity
    ],
    key: {
      direction: { ...lighting.key.direction },
      colour: [...lighting.key.colour],
      /* The Core's light IS the key's, scaled — not a second light
         nobody placed. A search brightens the room it is searching. */
      intensity: lighting.key.intensity * (options.ambientMotion === false ? 0.85 : 1) * coreLight
    },
    items,
    labels,
    actionSlots: berxActionRing(
      frame.world.objects.find((o) => o.id === frame.world.activeObjectId),
      c,
      options.affordances ?? []
    ),
    /**
     * Everything drawn casts and receives. Not a per-object flag:
     * a world where some things cast shadows and others do not is a
     * world where a viewer learns the rendering rather than the
     * place. The cost is bounded by the same budget the main pass
     * already has, since it is the same list.
     */
    memory: berxRememberFrame(items),
    volumetric: (() => {
      const air = berxVolumetricUniform();
      air[0] = air[0] * Math.max(0.4, Math.min(2.5, coreHaze));
      return [...air, quality.volumetricSteps, quality.volumetricScale, 0, 0];
    })(),
    /**
     * The occlusion kernel and how many of it are live.
     *
     * In the list for the same reason the march's steps are: the tier
     * decides it, and a backend that generated its own would be asking
     * a different question from the one the oracle predicts.
     */
    ssao: [...berxSSAOKernelFor(quality).flatMap((k) => [k.x, k.y, k.z, 0])],
    ssaoSamples: quality.ssaoSamples,
    worldTime: frame.world.worldTime,
    particles: options.particles === false ? [] : particleFields,
    shadow: options.shadows === false ? void 0 : berxShadowCamera(
      drawn.map((o) => ({ position: o.transform.position, radius: radiusOf(o) })),
      lighting.key.direction,
      quality.shadowMapSize
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
    init_berxEnvironment();
    init_berxExposure();
    init_berxFraming();
    init_worldLighting();
    init_transitions();
    init_shadowMap();
    init_berxVolumetric();
    init_berxParticles();
    init_berxRenderQuality();
    init_stability();
    init_berxCore();
    BERX_LOD_DISTANCE = 18;
    BERX_WORLD_CLEAR = [
      berxRadianceFor(7 / 255),
      berxRadianceFor(8 / 255),
      berxRadianceFor(10 / 255)
    ];
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
    radiusOf = berxBoundingRadius;
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

// packages/spatial/src/haptics.ts
function berxHapticWaveform(pattern, intensity = 1) {
  const scale = Math.max(0, Math.min(1, intensity));
  if (scale === 0) return [];
  return BERX_HAPTICS[pattern].waveform.map((ms) => Math.max(1, Math.round(ms * scale)));
}
function berxHapticDuration(pattern, intensity = 1) {
  return berxHapticWaveform(pattern, intensity).reduce((total, ms) => total + ms, 0);
}
function berxHapticForMoment(moment) {
  return MOMENTS[moment];
}
var BERX_HAPTICS, BERX_HAPTIC_PATTERNS, MOMENTS, BerxHaptics;
var init_haptics = __esm({
  "packages/spatial/src/haptics.ts"() {
    "use strict";
    BERX_HAPTICS = Object.freeze({
      /** The lightest thing the hardware can do: something was chosen. */
      selection: { waveform: [10], ios: "light", meaning: "a thing was selected" },
      /** Slightly firmer: the camera has arrived and something is held. */
      focus: { waveform: [16], ios: "medium", meaning: "the world focused on something" },
      /** A departure and an arrival, which is what a travel is. */
      transition: { waveform: [28, 22, 48], ios: "heavy", meaning: "the viewer travelled somewhere" },
      /** Two taps and a longer settle — read as "done" without a sound. */
      success: { waveform: [18, 14, 18, 14, 56], ios: "success", meaning: "something completed" },
      /** Two long, blunt pulses. Deliberately unpleasant. */
      error: { waveform: [78, 48, 78], ios: "error", meaning: "something was refused or failed" }
    });
    BERX_HAPTIC_PATTERNS = Object.keys(BERX_HAPTICS);
    MOMENTS = Object.freeze({
      select: "selection",
      focus: "focus",
      /* Letting go is not an event the hand needs told about; a buzz for
         every blur is what makes a device feel noisy rather than alive. */
      blur: void 0,
      travel: "transition",
      arrive: "focus",
      back: "transition",
      "action-ok": "success",
      "action-refused": "error"
    });
    BerxHaptics = class {
      constructor(backend, now = () => Date.now()) {
        this.muted = false;
        this.busyUntil = 0;
        this.backend = backend;
        this.now = now;
      }
      setBackend(backend) {
        this.backend = backend;
      }
      /** Reduced motion silences haptics too — same accessibility signal. */
      setReducedMotion(reduced) {
        this.muted = reduced;
      }
      get available() {
        return this.backend !== void 0 && !this.muted;
      }
      play(pattern, intensity = 1) {
        if (!this.backend || this.muted) return false;
        const at = this.now();
        if (at < this.busyUntil) return false;
        const played = this.backend.play(pattern, intensity);
        if (played) this.busyUntil = at + berxHapticDuration(pattern, intensity);
        return played;
      }
      /** What the world did, rather than what the motor should do. */
      moment(moment, intensity = 1) {
        const pattern = berxHapticForMoment(moment);
        return pattern ? this.play(pattern, intensity) : false;
      }
    };
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
    init_camera();
    init_motion();
    init_performance();
    init_focus();
    init_typography();
    init_scene();
    init_temporal();
    init_relational();
    init_composition();
    init_BerxVoiceAssistant();
    init_berxPhrases();
    init_berxVoiceWorld();
    init_berxRegistrationVoice();
    init_worldLighting();
    init_berxEnvironment();
    init_berxSSAO();
    init_berxVolumetric();
    init_berxParticles();
    init_berxRenderQuality();
    init_berxExposure();
    init_berxFraming();
    init_renderPipeline();
    init_stability();
    init_berxWorldState();
    init_berxSpatialMemory();
    init_berxIntent();
    init_berxUtterance();
    init_berxActionGraph();
    init_berxSay();
    init_berxBirth();
    init_berxCore();
    init_berxCoreWorld();
    init_berxTouch();
    init_berxLivingWorld();
    init_berxReach();
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
    init_haptics();
    init_transitions();
    init_shadowMap();
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
function createBevelBox(width = 1, height = 1, depth = 1, bevel = 0) {
  const b = Math.max(0, Math.min(bevel, Math.min(width, height) * 0.4, depth * 0.5));
  if (b <= 0) return createBox(width, height, depth);
  const x = width / 2, y = height / 2, z = depth / 2;
  const ix = x - b, iy = y - b, iz = z - b;
  const v = [];
  const q = [];
  const quad = (ax, ay, az, bx, by, bz, cx, cy, cz, dx, dy, dz, nx, ny, nz) => {
    const o = v.length / 6;
    push(v, ax, ay, az, nx, ny, nz);
    push(v, bx, by, bz, nx, ny, nz);
    push(v, cx, cy, cz, nx, ny, nz);
    push(v, dx, dy, dz, nx, ny, nz);
    q.push(o, o + 1, o + 2, o, o + 2, o + 3);
  };
  const r = Math.SQRT1_2;
  quad(-ix, -iy, z, ix, -iy, z, ix, iy, z, -ix, iy, z, 0, 0, 1);
  quad(ix, -iy, -z, -ix, -iy, -z, -ix, iy, -z, ix, iy, -z, 0, 0, -1);
  quad(x, -iy, iz, x, -iy, -iz, x, iy, -iz, x, iy, iz, 1, 0, 0);
  quad(-x, -iy, -iz, -x, -iy, iz, -x, iy, iz, -x, iy, -iz, -1, 0, 0);
  quad(-ix, y, iz, ix, y, iz, ix, y, -iz, -ix, y, -iz, 0, 1, 0);
  quad(-ix, -y, -iz, ix, -y, -iz, ix, -y, iz, -ix, -y, iz, 0, -1, 0);
  quad(-ix, -y, iz, ix, -y, iz, ix, -iy, z, -ix, -iy, z, 0, -r, r);
  quad(-ix, iy, z, ix, iy, z, ix, y, iz, -ix, y, iz, 0, r, r);
  quad(x, -iy, iz, x, iy, iz, ix, iy, z, ix, -iy, z, r, 0, r);
  quad(-ix, -iy, z, -ix, iy, z, -x, iy, iz, -x, -iy, iz, -r, 0, r);
  quad(ix, -y, -iz, -ix, -y, -iz, -ix, -iy, -z, ix, -iy, -z, 0, -r, -r);
  quad(ix, iy, -z, -ix, iy, -z, -ix, y, -iz, ix, y, -iz, 0, r, -r);
  quad(x, iy, -iz, x, -iy, -iz, ix, -iy, -z, ix, iy, -z, r, 0, -r);
  quad(-x, -iy, -iz, -x, iy, -iz, -ix, iy, -z, -ix, -iy, -z, -r, 0, -r);
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
function createTorus(outer = 1, inner = 0.72, segments = 48, tube = 12) {
  const centre = (outer + inner) / 2, r = Math.max(1e-4, (outer - inner) / 2);
  const v = [];
  const q = [];
  for (let i = 0; i <= segments; i++) {
    const a = i / segments * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
    for (let j = 0; j <= tube; j++) {
      const b = j / tube * Math.PI * 2, cb = Math.cos(b), sb = Math.sin(b);
      const nx = ca * cb, ny = sa * cb, nz = sb;
      push(v, (centre + r * cb) * ca, (centre + r * cb) * sa, r * sb, nx, ny, nz);
    }
  }
  const row = tube + 1;
  for (let i = 0; i < segments; i++) for (let j = 0; j < tube; j++) {
    const a = i * row + j, b = a + 1, c = a + row, d = c + 1;
    q.push(a, c, b, b, c, d);
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
      return createTorus(0.62, 0.42, far ? 18 : 48, far ? 6 : 12);
    case "frame":
      return createFrame(1, 1, 0.12);
    case "surface":
      return createBevelBox(1, 1, 0.06, 0.02);
    case "portal":
      return createFrame(1, 1.2, 0.16);
    case "node":
      return createSphere(0.58, far ? 9 : 20, far ? 6 : 12);
    case "stack":
      return createBevelBox(1, 1, 0.32, 0.1);
    case "message":
      return createBevelBox(1, 0.46, 0.12, 0.05);
    case "create":
      return createSphere(0.58, far ? 11 : 28, far ? 7 : 18);
  }
}
var V, SV, SF, F, TV, TF, GV, GF, AV, AF, VV, VF, CV, CF, DF, POSTF, PV, PF, BerxThreeRuntimeRenderer;
var init_threeRuntime = __esm({
  "packages/spatial-web/src/threeRuntime.ts"() {
    "use strict";
    init_src();
    init_primitiveGeometry();
    init_mediaTextures();
    init_spatialText();
    V = `#version 300 es
precision highp float;layout(location=0)in vec3 p;layout(location=1)in vec3 n;uniform mat4 P,V,M;out vec3 N,W,L,LN;void main(){vec4 w=M*vec4(p,1.);W=w.xyz;N=mat3(M)*n;L=p;LN=n;gl_Position=P*V*w;}`;
    SV = `#version 300 es
precision highp float;layout(location=0)in vec3 p;uniform mat4 LVP,M;void main(){gl_Position=LVP*M*vec4(p,1.);}`;
    SF = `#version 300 es
precision highp float;void main(){}`;
    F = `#version 300 es
precision highp float;
in vec3 N,W,L,LN;
uniform vec3 CAM;                 // camera position, world space
uniform vec3 AMB;                 // ambient colour * intensity
// THE ROOM. Same five slots as the WGSL's uniform block, filled from the
// same berxEnvironmentUniform array, in the same order.
uniform vec4 ENV_ZEN;             // rgb zenith,          w = sun intensity
uniform vec4 ENV_HOR;             // rgb horizon,         w = sun sharpness
uniform vec4 ENV_GND;             // rgb ground * bounce, w = overall intensity
uniform vec3 ENV_SUN_DIR;         // toward the key light
uniform vec3 ENV_SUN;             // sun colour
uniform sampler2D AO_MAP;         // the occlusion this frame's pass wrote
uniform float AO_ON;              // 1 when the pass ran, 0 when it did not
uniform vec3 KEY_DIR, KEY_COL;    // directional key
uniform float KEY_I;
uniform vec3 PL_POS[4], PL_COL[4];
uniform float PL_I[4], PL_R[4];
uniform int PL_N;
uniform vec3 BASE, EMIT;
uniform float MET, ROUGH, OPAC, TRANS, HT;
uniform vec4 TS;
uniform sampler2D TEX;
// The light's own view-projection, from the shared core.
uniform mat4 LVP;
// x = 1/mapSize, y = depth bias, z = normal bias, w = strength (0 = off)
uniform vec4 SHADOW;
/**
 * A shadow sampler, not a plain sampler2D: the hardware does the depth
 * test per sample and averages the RESULTS, which is what makes a 3x3
 * tap a soft edge instead of four hard ones. Sampling depth and
 * comparing afterwards would average DEPTHS, and an averaged depth is a
 * surface that exists nowhere.
 */
uniform highp sampler2DShadow SHADOW_MAP;
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

/**
 * BERX ENVIRONMENT \u2014 the analytic room, in GLSL.
 *
 * Line for line the same three terms as @berx/spatial's
 * berxEnvironmentRadiance and the same function in world.wgsl: a sky
 * gradient over the upper hemisphere, the floor's weak return below it,
 * and a sun lobe around the key direction. GLSL's smoothstep is the same
 * Hermite polynomial berxEnvSmoothstep01 spells out in TypeScript, which
 * is why the builtin can be called here rather than reimplemented.
 *
 * The direction must already be normalised; the callers normalise.
 */
vec3 berxEnvironment(vec3 dir){
  float up=clamp(dir.y,0.,1.);
  float down=clamp(-dir.y,0.,1.);
  vec3 sky=mix(ENV_HOR.rgb,ENV_ZEN.rgb,smoothstep(0.,1.,up));
  // the floor's return is already scaled by the bounce factor host-side
  vec3 base=mix(sky,ENV_GND.rgb,smoothstep(0.,1.,down));
  // both vectors point TOWARD the light, so this peaks at 1 looking at it
  float cosA=max(dot(dir,ENV_SUN_DIR),0.);
  float glow=pow(cosA,ENV_HOR.w)*ENV_ZEN.w;
  return (base+ENV_SUN*glow)*ENV_GND.w;
}

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

/**
 * How much of the key light reaches this point. 1 is full light.
 *
 * The same maths as the WGSL source, with the two conventions that
 * genuinely differ between the APIs written out rather than hidden:
 * GL clip space runs z from -1 to 1 (WGSL runs 0 to 1), and GL texture
 * space has its origin at the bottom (WGSL at the top). Everything else
 * \u2014 the normal offset, the slope scale, the 3x3 kernel and the fact
 * that only the KEY is shadowed \u2014 is identical.
 */
float keyVisibility(vec3 world, vec3 n, float NoL){
  if(SHADOW.w<=0.) return 1.;
  float slope=clamp(1.-NoL,0.,1.);
  vec3 offset=world+n*(SHADOW.z*(1.+slope*2.));
  vec4 lc=LVP*vec4(offset,1.);
  vec3 ndc=lc.xyz/max(lc.w,1e-6);
  if(ndc.x<-1.||ndc.x>1.||ndc.y<-1.||ndc.y>1.||ndc.z>1.) return 1.;
  // GL: -1..1 to 0..1 for both the texture coordinate and the depth
  vec2 uv=ndc.xy*.5+.5;
  float depth=ndc.z*.5+.5-SHADOW.y;
  float sum=0.;
  for(int y=-1;y<=1;y++){
    for(int x=-1;x<=1;x++){
      vec2 tap=uv+vec2(float(x),float(y))*SHADOW.x;
      sum+=texture(SHADOW_MAP,vec3(tap,depth));
    }
  }
  return mix(1.,sum/9.,SHADOW.w);
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

  vec3 keyL=normalize(KEY_DIR);
  // The key alone is shadowed. Ambient and the point lights are not: a
  // surface out of the sun still receives the room.
  float visibility=keyVisibility(W,n,max(dot(n,keyL),0.));
  vec3 lit=shade(n,v,keyL,KEY_COL*KEY_I,diffuseColor,f0,a)*visibility;
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
  /* AMBIENT IS NOW THE ROOM \u2014 see the same block in world.wgsl. Diffuse
     samples the environment along the normal, specular along the
     reflection blended toward the normal by roughness, which is this
     backend's prefilter: there is no mip chain because there is no map. */
  float nov=max(dot(n,v),0.);
  vec3 refl=reflect(-v,n);
  vec3 envD=berxEnvironment(n);
  vec3 envS=berxEnvironment(normalize(mix(refl,n,ROUGH)));
  vec3 fres=F_Schlick(f0,nov);
  /* AMBIENT OCCLUSION SCALES THE ROOM, AND ONLY THE ROOM \u2014 see the same
     block in world.wgsl. Read at this fragment's own pixel, so there is
     nothing to filter. */
  float ao=AO_ON>.5?texelFetch(AO_MAP,ivec2(gl_FragCoord.xy),0).r:1.;
  vec3 amb=(envD*diffuseColor*(vec3(1.)-fres)+envS*fres)*ao;
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
    GV = `#version 300 es
precision highp float;layout(location=0)in vec3 p;layout(location=1)in vec3 n;uniform mat4 P,V,M;out vec3 VN,VP;void main(){vec4 w=M*vec4(p,1.);VN=mat3(V)*(mat3(M)*n);VP=(V*w).xyz;gl_Position=P*V*w;}`;
    GF = `#version 300 es
precision highp float;in vec3 VN,VP;out vec4 C;void main(){C=vec4(normalize(VN),-VP.z);}`;
    AV = `#version 300 es
precision highp float;void main(){vec2 q=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(q*2.-1.,0.,1.);}`;
    AF = `#version 300 es
precision highp float;
precision highp sampler2D;
uniform sampler2D GBUF;
// BERX_SSAO_SAMPLES offsets, then one vec4: radius, bias, strength, power
uniform vec4 K[17];
// x = width, y = height, z = focal length in pixels
// x = width, y = height, z = focal length in pixels, w = live taps
uniform vec4 DIM;
out vec4 C;
void main(){
  ivec2 at=ivec2(gl_FragCoord.xy);
  int w=int(DIM.x), h=int(DIM.y);
  vec4 centre=texelFetch(GBUF,at,0);
  if(centre.a<=0.){C=vec4(1.);return;}
  vec4 params=K[16];
  float radius=params.x, strength=params.z, power=params.w;
  vec3 n=normalize(centre.xyz);
  vec3 up=abs(n.z)>=.999?vec3(1.,0.,0.):vec3(0.,0.,1.);
  vec3 tx=normalize(cross(up,n));
  vec3 ty=cross(n,tx);
  // slope-scaled bias \u2014 see berxSSAOAt's own note
  float slope=1.-min(1.,abs(n.z));
  float bias=params.y*(1.+slope*4.);
  float occluded=0.;
  /* Loops to the LIVE tap count, not sixteen: a quality tier hands this
     a strided subset of the spiral and zero-fills the rest of the buffer,
     so the buffer's size \u2014 and therefore every bind group naming it \u2014
     survives a change of quality. */
  int taps=int(DIM.w);
  for(int j=0;j<16;j++){
    if(j>=taps) break;
    vec3 k=K[j].xyz;
    vec3 s=tx*k.x+ty*k.y+n*k.z;
    float sd=centre.a-s.z*radius;
    if(sd<=0.) continue;
    int sx=at.x+int(floor((s.x*radius*DIM.z)/sd+.5));
    int sy=at.y+int(floor((s.y*radius*DIM.z)/sd+.5));
    if(sx<0||sy<0||sx>=w||sy>=h) continue;
    vec4 there=texelFetch(GBUF,ivec2(sx,sy),0);
    if(there.a<=0.) continue;
    if(there.a<sd-bias){
      float range=radius/max(abs(centre.a-there.a),1e-4);
      occluded+=min(1.,range);
    }
  }
  float ratio=occluded/float(max(taps,1));
  C=vec4(max(0.,1.-pow(ratio,power)*strength),0.,0.,1.);
}`;
    VV = `#version 300 es
precision highp float;out vec2 UV;void main(){vec2 c=vec2((gl_VertexID==1)?3.:-1.,(gl_VertexID==2)?3.:-1.);UV=vec2(c.x*.5+.5,c.y*.5+.5);gl_Position=vec4(c,0.,1.);}`;
    VF = `#version 300 es
precision highp float;
precision highp sampler2DShadow;
in vec2 UV;
uniform mat4 INV_VP;            // pixel -> world ray
uniform mat4 VLVP;              // the light's own view-projection
uniform vec4 VSHADOW;           // x = 1/mapSize, y = depth bias, z unused, w = strength
uniform vec4 VPARAMS;           // x = density, y = phase g, z = max distance, w = intensity
uniform vec4 VDIMS;             // x = march width, y = march height, z = steps, w = march scale
uniform vec3 VEYE, VLIGHT_DIR, VLIGHT_COL, VFORWARD;
uniform float VLIGHT_I;
uniform sampler2D VGBUF;
uniform sampler2DShadow VSHADOW_MAP;
out vec4 C;

const float PI = 3.14159265359;

// The same curve as @berx/spatial's berxPhaseHG, clamp included: at g->1
// and cosTheta->1 the denominator goes to zero and the phase to
// infinity, which is the singular lobe that blows a shaft out to white.
float phaseHG(float cosTheta, float g){
  float g2=g*g;
  float denom=1.+g2-2.*g*cosTheta;
  return (1.-g2)/(4.*PI*pow(max(denom,1e-4),1.5));
}

// FNV-1a over the pixel coordinate \u2014 the same hash as
// berxVolumetricJitter, so a shaft dithers identically in four languages
// without shipping a noise texture.
float vjitter(int x,int y){
  uint h=2166136261u;
  h=h^(uint(x)&0xffffu); h=h*16777619u;
  h=h^(uint(y)&0xffffu); h=h*16777619u;
  return float(h>>8u)/16777216.;
}

float litAt(vec3 world){
  if(VSHADOW.w<=0.) return 1.;
  vec4 clip=VLVP*vec4(world,1.);
  vec3 ndc=clip.xyz/max(clip.w,1e-6);
  if(ndc.x<-1.||ndc.x>1.||ndc.y<-1.||ndc.y>1.||ndc.z>1.) return 1.;
  // GL: -1..1 to 0..1, and the origin is at the bottom
  vec2 uv=ndc.xy*.5+.5;
  return texture(VSHADOW_MAP,vec3(uv,ndc.z*.5+.5-VSHADOW.y));
}

void main(){
  int px=int(UV.x*VDIMS.x);
  // TOP-DOWN, deliberately, even though GL's own buffers are bottom-up:
  // the jitter is a hash of the pixel index, and WGSL's uv origin is at
  // the top. Hashing GL's bottom-up row gave the same physical pixel a
  // different march offset in the two backends \u2014 a real disagreement of
  // up to 49/255 between two ports that were otherwise identical, and
  // one only a cross-backend comparison could find.
  int py=int((1.-UV.y)*VDIMS.y);

  vec2 ndc=vec2(UV.x*2.-1.,UV.y*2.-1.);
  vec4 nearH=INV_VP*vec4(ndc,-1.,1.);
  vec4 farH=INV_VP*vec4(ndc,1.,1.);
  vec3 nearP=nearH.xyz/max(nearH.w,1e-6);
  vec3 farP=farH.xyz/max(farH.w,1e-6);
  vec3 dir=normalize(farP-nearP);

  // Distance to the first surface. The march stops there: air behind a
  // wall does not scatter light into the eye.
  // The G-buffer stores VIEW DEPTH \u2014 distance along the camera's forward
  // axis \u2014 and the march needs distance along THIS ray. For an off-axis
  // pixel those differ by 1/cos.
  // The G-buffer is at FRAME resolution while this pass may be running at
  // a fraction of it, so the fetch is explicit rather than a UV sample: a
  // filtered lookup would pick an unspecified one of the texels the march
  // pixel covers, and volumetric.wgsl picks the block's centre. Two ports
  // choosing differently is exactly the kind of divergence only a
  // cross-backend comparison finds, so both do the same arithmetic.
  //
  // px is the march column and the GL row is bottom-up, which is why this
  // uses UV.y directly where the jitter above used 1-UV.y.
  float vscale=max(VDIMS.w,1.);
  int gy=int(float(int(UV.y*VDIMS.y))*vscale+(vscale-1.)*.5);
  int gx=int(float(px)*vscale+(vscale-1.)*.5);
  float depth=texelFetch(VGBUF,ivec2(gx,gy),0).a;
  float along=max(dot(dir,normalize(VFORWARD)),1e-3);
  float surface=depth>0.?depth/along:VPARAMS.z;
  float far=min(VPARAMS.z,surface);
  if(far<=0.){ C=vec4(0.,0.,0.,1.); return; }

  int steps=int(VDIMS.z);
  float stepLength=far/float(steps);
  float phase=phaseHG(dot(dir,normalize(VLIGHT_DIR)),VPARAMS.y);
  float offset=vjitter(px,py);

  float inscatter=0.;
  for(int s=0;s<64;s++){
    if(s>=steps) break;
    float t=(float(s)+offset)*stepLength;
    vec3 p=VEYE+dir*t;
    float lit=litAt(p);
    if(lit<=0.) continue;
    float transmittance=exp(-VPARAMS.x*t);
    inscatter+=lit*phase*VPARAMS.x*stepLength*transmittance;
  }
  float energy=inscatter*VPARAMS.w;
  C=vec4(VLIGHT_COL*VLIGHT_I*energy,1.);
}`;
    CV = `#version 300 es
precision highp float;out vec2 UV;void main(){vec2 c=vec2((gl_VertexID==1)?3.:-1.,(gl_VertexID==2)?3.:-1.);UV=vec2(c.x*.5+.5,c.y*.5+.5);gl_Position=vec4(c,0.,1.);}`;
    CF = `#version 300 es
precision highp float;
in vec2 UV;
uniform sampler2D SRC;
out vec4 C;
void main(){
  vec2 size=vec2(textureSize(SRC,0));
  vec2 p=UV*size-.5;
  vec2 base=floor(p);
  vec2 f=p-base;
  vec2 hi=size-1.;
  ivec2 c00=ivec2(clamp(base,vec2(0.),hi));
  ivec2 c10=ivec2(clamp(base+vec2(1.,0.),vec2(0.),hi));
  ivec2 c01=ivec2(clamp(base+vec2(0.,1.),vec2(0.),hi));
  ivec2 c11=ivec2(clamp(base+vec2(1.,1.),vec2(0.),hi));
  vec3 top=mix(texelFetch(SRC,c00,0).rgb,texelFetch(SRC,c10,0).rgb,f.x);
  vec3 bottom=mix(texelFetch(SRC,c01,0).rgb,texelFetch(SRC,c11,0).rgb,f.x);
  C=vec4(mix(top,bottom,f.y),1.);
}`;
    DF = `#version 300 es
precision highp float;in vec2 UV;uniform highp sampler2D SRC;out vec4 C;void main(){C=vec4(texture(SRC,UV).r,0.,0.,1.);}`;
    POSTF = `#version 300 es
precision highp float;
in vec2 UV;
uniform sampler2D SRC;
uniform float EXPOSURE;
out vec4 C;
float shoulder(float x){
  float v=max(x,0.);
  return clamp((v*(2.51*v+.03))/(v*(2.43*v+.59)+.14),0.,1.);
}
void main(){
  /* A fetch, not a sample: one output pixel per input pixel, so a
     bilinear tap only adds a half-texel question each API answers its
     own way. It was worth three disagreeing pixels along the top edge. */
  vec3 e=texelFetch(SRC,ivec2(gl_FragCoord.xy),0).rgb*EXPOSURE;
  C=vec4(shoulder(e.r),shoulder(e.g),shoulder(e.b),1.);
}`;
    PV = `#version 300 es
precision highp float;
uniform mat4 PP, PVIEW;
uniform vec4 PORIGIN;   // xyz what the field is arranged around, w time
uniform vec4 PCOLOUR;   // rgb colour, a peak alpha
uniform vec4 PSHAPE;    // x extent, y speed, z size, w period
uniform vec4 PCOUNTS;   // x count, y kind (0 dust, 1 energy, 2 stars)
uniform vec3 PRIGHT, PUP;
out vec2 PUV;
out float PALPHA;

const float PI = 3.14159265359;

float phash(uint index, uint lane){
  uint h=2166136261u;
  h=h^(index&0xffffu); h=h*16777619u;
  h=h^((index>>16u)&0xffffu); h=h*16777619u;
  h=h^(lane&0xffffu); h=h*16777619u;
  return float(h>>8u)/16777216.;
}

void main(){
  uint index=uint(gl_VertexID)/6u;
  uint corner=uint(gl_VertexID)%6u;
  vec2 c;
  if(corner==0u) c=vec2(-1.,-1.);
  else if(corner==1u) c=vec2(1.,-1.);
  else if(corner==2u) c=vec2(1.,1.);
  else if(corner==3u) c=vec2(-1.,-1.);
  else if(corner==4u) c=vec2(1.,1.);
  else c=vec2(-1.,1.);

  float hx=phash(index,1u), hy=phash(index,2u), hz=phash(index,3u), hp=phash(index,4u);
  float extent=PSHAPE.x, speed=PSHAPE.y, size=PSHAPE.z, period=PSHAPE.w;
  float phase=fract(PORIGIN.w/period+hp);

  vec3 centre; float alpha; float psize;
  if(PCOUNTS.y>.5 && PCOUNTS.y<1.5){
    // energy: a spiral leaving a surface, not a column of dots
    float angle=hx*PI*2.+phase*PI*4.;
    float radius=extent*(.25+hy*.55)*(1.-phase*.45);
    centre=vec3(PORIGIN.x+cos(angle)*radius,
                PORIGIN.y-extent*.4+phase*extent*1.8,
                PORIGIN.z+sin(angle)*radius);
    alpha=PCOLOUR.a*sin(phase*PI);
    psize=size*(.6+hz*.8);
  } else {
    float drift=speed==0.?0.:phase*extent;
    float wx=fract((hx*extent+drift*.35)/extent)*extent-extent*.5;
    float wy=fract((hy*extent+drift)/extent)*extent-extent*.5;
    float wz=fract((hz*extent+drift*.2)/extent)*extent-extent*.5;
    centre=vec3(PORIGIN.x+wx,PORIGIN.y+wy,PORIGIN.z+wz);
    alpha=PCOUNTS.y>1.5?PCOLOUR.a*(.65+.35*sin(phase*PI*2.)):PCOLOUR.a;
    psize=size*(.7+hz*.6);
  }

  vec3 world=centre+PRIGHT*(c.x*psize)+PUP*(c.y*psize);
  PUV=c;
  PALPHA=alpha;
  gl_Position=PP*PVIEW*vec4(world,1.);
}`;
    PF = `#version 300 es
precision highp float;
in vec2 PUV;
in float PALPHA;
uniform vec4 PCOLOUR;
out vec4 C;
void main(){
  // A round, soft mote. A square particle reads as a missing texture and
  // a hard-edged circle reads as a UI dot.
  float r=length(PUV);
  if(r>1.) discard;
  float falloff=1.-r*r;
  float a=PALPHA*falloff*falloff;
  if(a<.002) discard;
  // premultiplied: drawn additively, so the colour carries the alpha
  C=vec4(PCOLOUR.rgb*a,a);
}`;
    BerxThreeRuntimeRenderer = class {
      constructor(canvas, options = {}) {
        this.kind = "webgl2";
        /* what this backend really does, and nothing it does not */
        this.capabilities = { perspective: true, depthBuffer: true, physicallyLitMaterials: true, shadows: true, postProcessing: false };
        this.meshes = /* @__PURE__ */ new Map();
        this.ssaoSize = { w: 0, h: 0 };
        /**
         * The linear frame, and the target everything before post draws into.
         *
         * `sceneFbo` is what the world, label, particle and composite passes
         * are bound to. It is null only when a half-float colour attachment is
         * not renderable here — see ensureHdr.
         */
        this.sceneFbo = null;
        this.hdrW = 0;
        this.hdrH = 0;
        this.hdrSamples = 0;
        this.PSRC = null;
        this.PEXP = null;
        this.volSize = { w: 0, h: 0 };
        this.shadowSize = 0;
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
        this.ENV_ZEN = gl.getUniformLocation(this.program, "ENV_ZEN");
        this.ENV_HOR = gl.getUniformLocation(this.program, "ENV_HOR");
        this.ENV_GND = gl.getUniformLocation(this.program, "ENV_GND");
        this.ENV_SUN_DIR = gl.getUniformLocation(this.program, "ENV_SUN_DIR");
        this.ENV_SUN = gl.getUniformLocation(this.program, "ENV_SUN");
        this.AO_MAP = gl.getUniformLocation(this.program, "AO_MAP");
        this.AO_ON = gl.getUniformLocation(this.program, "AO_ON");
        this.floatColour = !!gl.getExtension("EXT_color_buffer_float");
        this.blankAo = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.blankAo);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, 1, 1, 0, gl.RED, gl.FLOAT, new Float32Array([1]));
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        this.gbufProgram = program(gl, GV, GF);
        this.aoProgram = program(gl, AV, AF);
        this.GP = gl.getUniformLocation(this.gbufProgram, "P");
        this.GV_ = gl.getUniformLocation(this.gbufProgram, "V");
        this.GM = gl.getUniformLocation(this.gbufProgram, "M");
        this.GBUF = gl.getUniformLocation(this.aoProgram, "GBUF");
        this.K = gl.getUniformLocation(this.aoProgram, "K");
        this.DIM = gl.getUniformLocation(this.aoProgram, "DIM");
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
        this.LVP = gl.getUniformLocation(this.program, "LVP");
        this.SHADOW = gl.getUniformLocation(this.program, "SHADOW");
        this.SHADOW_MAP = gl.getUniformLocation(this.program, "SHADOW_MAP");
        this.shadowProgram = program(gl, SV, SF);
        this.SLVP = gl.getUniformLocation(this.shadowProgram, "LVP");
        this.SM = gl.getUniformLocation(this.shadowProgram, "M");
        this.volProgram = program(gl, VV, VF);
        this.compositeProgram = program(gl, CV, CF);
        this.particleProgram = program(gl, PV, PF);
        this.PP = gl.getUniformLocation(this.particleProgram, "PP");
        this.PVIEW = gl.getUniformLocation(this.particleProgram, "PVIEW");
        this.PORIGIN = gl.getUniformLocation(this.particleProgram, "PORIGIN");
        this.PCOLOUR = gl.getUniformLocation(this.particleProgram, "PCOLOUR");
        this.PSHAPE = gl.getUniformLocation(this.particleProgram, "PSHAPE");
        this.PCOUNTS = gl.getUniformLocation(this.particleProgram, "PCOUNTS");
        this.PRIGHT = gl.getUniformLocation(this.particleProgram, "PRIGHT");
        this.PUP = gl.getUniformLocation(this.particleProgram, "PUP");
        this.shadowNearest = gl.createSampler() ?? void 0;
        if (this.shadowNearest) {
          gl.samplerParameteri(this.shadowNearest, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
          gl.samplerParameteri(this.shadowNearest, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);
          gl.samplerParameteri(this.shadowNearest, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
          gl.samplerParameteri(this.shadowNearest, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
          gl.samplerParameteri(this.shadowNearest, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.samplerParameteri(this.shadowNearest, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        }
        this.VINV = gl.getUniformLocation(this.volProgram, "INV_VP");
        this.VLVP = gl.getUniformLocation(this.volProgram, "VLVP");
        this.VSHADOW = gl.getUniformLocation(this.volProgram, "VSHADOW");
        this.VPARAMS = gl.getUniformLocation(this.volProgram, "VPARAMS");
        this.VDIMS = gl.getUniformLocation(this.volProgram, "VDIMS");
        this.VEYE = gl.getUniformLocation(this.volProgram, "VEYE");
        this.VLDIR = gl.getUniformLocation(this.volProgram, "VLIGHT_DIR");
        this.VLCOL = gl.getUniformLocation(this.volProgram, "VLIGHT_COL");
        this.VLI = gl.getUniformLocation(this.volProgram, "VLIGHT_I");
        this.VFWD = gl.getUniformLocation(this.volProgram, "VFORWARD");
        this.VGBUF = gl.getUniformLocation(this.volProgram, "VGBUF");
        this.VSMAP = gl.getUniformLocation(this.volProgram, "VSHADOW_MAP");
        this.CSRC = gl.getUniformLocation(this.compositeProgram, "SRC");
        this.depthReadProgram = program(gl, CV, DF);
        this.DSRC = gl.getUniformLocation(this.depthReadProgram, "SRC");
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
          const half = Math.max(1, Math.floor(this.width / 2));
          const shift = (sign) => ({ ...frame, camera: berxEyeCamera(frame.camera, options.stereo.ipd, sign) });
          gl.viewport(0, 0, this.width, this.height);
          gl.clearColor(BERX_WORLD_CLEAR[0], BERX_WORLD_CLEAR[1], BERX_WORLD_CLEAR[2], 1);
          gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
          let calls = 0, tris = 0, lod = 0, frustum = 0, budget = 0, visibleCount = 0;
          for (const [index, eye] of [shift(-1), shift(1)].entries()) {
            this.drawEye(eye, options, half, this.height, false, index * half);
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
      /**
      * Draw one eye into a viewport starting at `originX`.
      *
      * REAL BUG THIS FIXES: this used to set `gl.viewport(0,0,width,height)`
      * unconditionally, which threw away the x offset the stereo loop had
      * just set — so BOTH eyes drew into the left half and the right half of
      * a stereo frame was empty. It cannot simply leave the viewport alone
      * either, because renderShadowMap below re-points it at the shadow map;
      * the origin has to travel with the call.
      */
      /**
       * The G-buffer and the occlusion computed from it.
       *
       * Runs before the world pass because the world pass reads the AO map.
       * Returns false when it could not run at all — without
       * EXT_color_buffer_float there is no float colour attachment to write a
       * view depth into, and an occlusion pass that silently wrote nothing
       * would leave the world lit by whatever the map last held.
       */
      renderSSAO(list, width, height) {
        if (!this.floatColour) return false;
        const gl = this.gl;
        if (this.ssaoSize.w !== width || this.ssaoSize.h !== height) {
          if (this.gbufTexture) gl.deleteTexture(this.gbufTexture);
          if (this.gbufDepth) gl.deleteRenderbuffer(this.gbufDepth);
          if (this.gbufFbo) gl.deleteFramebuffer(this.gbufFbo);
          if (this.aoTexture) gl.deleteTexture(this.aoTexture);
          if (this.aoFbo) gl.deleteFramebuffer(this.aoFbo);
          this.gbufTexture = gl.createTexture();
          gl.bindTexture(gl.TEXTURE_2D, this.gbufTexture);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, null);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          this.gbufDepth = gl.createRenderbuffer();
          gl.bindRenderbuffer(gl.RENDERBUFFER, this.gbufDepth);
          gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, width, height);
          this.gbufFbo = gl.createFramebuffer();
          gl.bindFramebuffer(gl.FRAMEBUFFER, this.gbufFbo);
          gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.gbufTexture, 0);
          gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.gbufDepth);
          this.aoTexture = gl.createTexture();
          gl.bindTexture(gl.TEXTURE_2D, this.aoTexture);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, width, height, 0, gl.RED, gl.FLOAT, null);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          this.aoFbo = gl.createFramebuffer();
          gl.bindFramebuffer(gl.FRAMEBUFFER, this.aoFbo);
          gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.aoTexture, 0);
          if (!this.aoVao) this.aoVao = gl.createVertexArray();
          this.ssaoSize = { w: width, h: height };
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.gbufFbo);
        gl.viewport(0, 0, width, height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);
        gl.depthMask(true);
        gl.disable(gl.BLEND);
        gl.useProgram(this.gbufProgram);
        gl.uniformMatrix4fv(this.GP, false, new Float32Array(list.projection));
        gl.uniformMatrix4fv(this.GV_, false, new Float32Array(list.view));
        for (const item of list.items) {
          const mesh = this.getMesh(item.primitive, item.lod);
          gl.uniformMatrix4fv(this.GM, false, new Float32Array(item.model));
          gl.bindVertexArray(mesh.vao);
          gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_SHORT, 0);
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.aoFbo);
        gl.viewport(0, 0, width, height);
        gl.disable(gl.DEPTH_TEST);
        gl.depthMask(false);
        gl.useProgram(this.aoProgram);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, this.gbufTexture);
        gl.uniform1i(this.GBUF, 2);
        gl.uniform4fv(this.K, new Float32Array(berxSSAOUniform(void 0, list.ssaoSamples)));
        gl.uniform4f(this.DIM, width, height, list.projection[5] * height * 0.5, list.ssaoSamples);
        gl.bindVertexArray(this.aoVao);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.bindVertexArray(null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.sceneFbo);
        gl.enable(gl.DEPTH_TEST);
        gl.depthMask(true);
        gl.enable(gl.BLEND);
        gl.activeTexture(gl.TEXTURE0);
        return true;
      }
      /**
       * The air with something in it.
       *
       * Three fields, drawn after the world so the depth buffer already holds
       * everything solid: a mote behind a place is hidden by it. Depth WRITES
       * are off — particles never occlude each other into flicker — and the
       * blend is additive, because a mote is light rather than a surface.
       *
       * Where each field sits is a fact about the world, not a setting: dust
       * and stars are arranged around the VIEWER (they are the room and the
       * distance), and energy around whatever the world says is most alive
       * (list.items carries the energy the server raised). A world with
       * nothing live draws no energy particles at all, which is what keeps
       * BERX Energy rare by construction rather than by promise.
       */
      renderParticles(list) {
        const gl = this.gl;
        if (!this.particleVao) this.particleVao = gl.createVertexArray() ?? void 0;
        if (!this.particleVao || !list.basis || list.particles.length === 0) return 0;
        gl.useProgram(this.particleProgram);
        gl.bindVertexArray(this.particleVao);
        gl.uniformMatrix4fv(this.PP, false, new Float32Array(list.projection));
        gl.uniformMatrix4fv(this.PVIEW, false, new Float32Array(list.view));
        gl.uniform3f(this.PRIGHT, list.basis.right.x, list.basis.right.y, list.basis.right.z);
        gl.uniform3f(this.PUP, list.basis.up.x, list.basis.up.y, list.basis.up.z);
        gl.depthMask(false);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE);
        let calls = 0;
        for (const field of list.particles) {
          gl.uniform4f(this.PORIGIN, field[12], field[13], field[14], list.worldTime);
          gl.uniform4f(this.PCOLOUR, field[0], field[1], field[2], field[3]);
          gl.uniform4f(this.PSHAPE, field[4], field[5], field[6], field[7]);
          gl.uniform4f(this.PCOUNTS, field[8], field[9], 0, 0);
          gl.drawArrays(gl.TRIANGLES, 0, field[8] * 6);
          calls++;
        }
        gl.bindVertexArray(null);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.depthMask(true);
        return calls;
      }
      /**
       * The key light, made visible in the air.
       *
       * Runs AFTER the world pass and composites additively: light in the air
       * ADDS to what is behind it — it does not replace it, and a volumetric
       * pass that blends over the world is a fog overlay, not scattering.
       *
       * It needs the G-buffer the occlusion pass already builds (for the
       * distance to the first surface along each ray) and the shadow map the
       * world pass already builds (for which parts of the ray are lit). Both
       * are reused rather than rebuilt: a second G-buffer would be a second
       * opinion about where the surfaces are.
       *
       * Returns false when it could not run, so the caller can say so rather
       * than show a frame that quietly has no shafts in it.
       */
      renderVolumetric(list, width, height) {
        if (!this.floatColour || !list.shadow || !this.shadowTexture || !this.gbufTexture) return false;
        const gl = this.gl;
        const scale = Math.max(1, Math.round(list.volumetric[5] || 1));
        const marchW = Math.max(1, Math.ceil(width / scale));
        const marchH = Math.max(1, Math.ceil(height / scale));
        if (this.volSize.w !== marchW || this.volSize.h !== marchH) {
          if (this.volTexture) gl.deleteTexture(this.volTexture);
          if (this.volFbo) gl.deleteFramebuffer(this.volFbo);
          this.volTexture = gl.createTexture();
          gl.bindTexture(gl.TEXTURE_2D, this.volTexture);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, marchW, marchH, 0, gl.RGBA, gl.FLOAT, null);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          this.volFbo = gl.createFramebuffer();
          gl.bindFramebuffer(gl.FRAMEBUFFER, this.volFbo);
          gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.volTexture, 0);
          this.volSize = { w: marchW, h: marchH };
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.volFbo);
        gl.viewport(0, 0, marchW, marchH);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.disable(gl.DEPTH_TEST);
        gl.depthMask(false);
        gl.disable(gl.BLEND);
        gl.useProgram(this.volProgram);
        const viewProj = berxMultiplyMat4(new Float32Array(list.projection), new Float32Array(list.view));
        gl.uniformMatrix4fv(this.VINV, false, berxInvertMat4(viewProj));
        gl.uniformMatrix4fv(this.VLVP, false, new Float32Array(list.shadow.viewProjection));
        gl.uniform4f(this.VSHADOW, 1 / list.shadow.mapSize, list.shadow.depthBias, 0, list.shadow.strength);
        gl.uniform4f(this.VPARAMS, list.volumetric[0], list.volumetric[1], list.volumetric[2], list.volumetric[3]);
        gl.uniform4f(this.VDIMS, marchW, marchH, list.volumetric[4], scale);
        gl.uniform3f(this.VEYE, list.camera.x, list.camera.y, list.camera.z);
        gl.uniform3f(this.VLDIR, list.key.direction.x, list.key.direction.y, list.key.direction.z);
        gl.uniform3f(this.VLCOL, list.key.colour[0], list.key.colour[1], list.key.colour[2]);
        gl.uniform1f(this.VLI, list.key.intensity);
        gl.uniform3f(this.VFWD, -list.view[2], -list.view[6], -list.view[10]);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, this.gbufTexture);
        gl.uniform1i(this.VGBUF, 2);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.shadowTexture);
        gl.uniform1i(this.VSMAP, 1);
        if (this.shadowNearest) gl.bindSampler(1, this.shadowNearest);
        gl.bindVertexArray(this.aoVao);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.bindVertexArray(null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.sceneFbo);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.enable(gl.BLEND);
        gl.enable(gl.DEPTH_TEST);
        gl.depthMask(true);
        gl.bindSampler(1, null);
        gl.activeTexture(gl.TEXTURE0);
        return true;
      }
      /**
       * The air, added over the world.
       *
       * Split from the march above rather than done at the end of it, and the
       * split is the point: the march has to happen BEFORE the world pass —
       * that is where the declared pipeline puts it, and where WebGPU has
       * always had it — while the composite has to happen after, because it
       * adds to what the world pass drew. One function doing both put this
       * backend's march after the world, which worked (it renders into its
       * own target and samples nothing the world pass writes) and was still a
       * different pipeline from the other two. The pipeline gate reads the
       * pass names each backend records, and that is how it was found.
       */
      /**
       * The linear frame BERX draws into, built to fit the canvas.
       *
       * MULTISAMPLED, because moving off the default framebuffer would
       * otherwise silently drop the antialiasing the canvas was created
       * with — and the WebGPU backend keeps its four samples, so the two
       * would stop being comparable. A multisample renderbuffer plus a blit
       * is the WebGL2 spelling of WebGPU's resolveTarget.
       *
       * Returns false where a half-float colour attachment is not
       * renderable. That is reported rather than worked around: the
       * exposure still runs on an 8-bit frame and still fixes the darkness,
       * but the world pass will have clamped at 1.0 first, so the shoulder
       * has nothing above white left to roll off. Saying which of the two is
       * happening is the difference between a known limit and a mystery.
       */
      ensureHdr(width, height) {
        if (!this.floatColour) return false;
        const gl = this.gl;
        if (this.hdrFbo && this.hdrW === width && this.hdrH === height) return true;
        this.releaseHdr();
        this.hdrW = width;
        this.hdrH = height;
        this.hdrTex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.hdrTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, width, height, 0, gl.RGBA, gl.HALF_FLOAT, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        this.hdrFbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.hdrFbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.hdrTex, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        const canvasSamples = gl.getParameter(gl.SAMPLES);
        this.hdrSamples = Math.max(1, Math.min(canvasSamples || 4, gl.getParameter(gl.MAX_SAMPLES)));
        this.msColor = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, this.msColor);
        gl.renderbufferStorageMultisample(gl.RENDERBUFFER, this.hdrSamples, gl.RGBA16F, width, height);
        this.msDepth = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, this.msDepth);
        gl.renderbufferStorageMultisample(gl.RENDERBUFFER, this.hdrSamples, gl.DEPTH_COMPONENT24, width, height);
        this.msFbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.msFbo);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, this.msColor);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.msDepth);
        const complete = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        if (!complete) {
          this.releaseHdr();
          return false;
        }
        if (!this.postProgram) {
          this.postProgram = program(gl, CV, POSTF);
          this.PSRC = gl.getUniformLocation(this.postProgram, "SRC");
          this.PEXP = gl.getUniformLocation(this.postProgram, "EXPOSURE");
        }
        return true;
      }
      releaseHdr() {
        const gl = this.gl;
        if (this.hdrTex) gl.deleteTexture(this.hdrTex);
        if (this.hdrFbo) gl.deleteFramebuffer(this.hdrFbo);
        if (this.msFbo) gl.deleteFramebuffer(this.msFbo);
        if (this.msColor) gl.deleteRenderbuffer(this.msColor);
        if (this.msDepth) gl.deleteRenderbuffer(this.msDepth);
        this.hdrTex = void 0;
        this.hdrFbo = void 0;
        this.msFbo = void 0;
        this.msColor = void 0;
        this.msDepth = void 0;
        this.hdrW = 0;
        this.hdrH = 0;
        this.hdrSamples = 0;
      }
      /**
       * POST: resolve the samples, expose, and hand the screen the result.
       *
       * AFTER the composite, which is the ordering fact that matters:
       * in-scatter is light, so the air is part of what is being exposed.
       * Tone-mapping the surfaces and then adding the air would put unmapped
       * values on top of mapped ones — two pictures added together, not a
       * brighter one.
       */
      exposeToScreen(originX, width, height) {
        if (!this.msFbo || !this.hdrFbo || !this.postProgram) return false;
        const gl = this.gl;
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.msFbo);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.hdrFbo);
        gl.blitFramebuffer(0, 0, this.hdrW, this.hdrH, 0, 0, this.hdrW, this.hdrH, gl.COLOR_BUFFER_BIT, gl.NEAREST);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        this.sceneFbo = null;
        gl.viewport(originX, 0, width, height);
        gl.useProgram(this.postProgram);
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, this.hdrTex);
        gl.uniform1i(this.PSRC, 3);
        gl.uniform1f(this.PEXP, BERX_EXPOSURE);
        gl.disable(gl.BLEND);
        gl.disable(gl.DEPTH_TEST);
        gl.depthMask(false);
        gl.bindVertexArray(this.aoVao);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.bindVertexArray(null);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.enable(gl.DEPTH_TEST);
        gl.depthMask(true);
        gl.activeTexture(gl.TEXTURE0);
        return true;
      }
      compositeAir(originX, width, height) {
        if (!this.volTexture) return false;
        const gl = this.gl;
        gl.viewport(originX, 0, width, height);
        gl.useProgram(this.compositeProgram);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, this.volTexture);
        gl.uniform1i(this.CSRC, 2);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE);
        gl.disable(gl.DEPTH_TEST);
        gl.depthMask(false);
        gl.bindVertexArray(this.aoVao);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.bindVertexArray(null);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.enable(gl.DEPTH_TEST);
        gl.depthMask(true);
        gl.activeTexture(gl.TEXTURE0);
        return true;
      }
      /**
       * The shadow map's depth, as readable floats.
       *
       * WebGL2 cannot readPixels a depth texture, so this samples it as an
       * ordinary texture with the comparison mode temporarily off, into a
       * float target. The mode is put back: leaving it off would turn every
       * later sampler2DShadow read into undefined behaviour.
       *
       * It exists for the gate. The oracle has to perform the SAME lookup
       * the march performed, and a CPU twin that reconstructs visibility
       * from geometry instead would be testing a different question.
       */
      readShadowMap() {
        if (!this.shadowTexture || this.shadowSize === 0 || !this.floatColour) return void 0;
        const gl = this.gl;
        const size = this.shadowSize;
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, size, size, 0, gl.RED, gl.FLOAT, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        const fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        gl.viewport(0, 0, size, size);
        gl.disable(gl.DEPTH_TEST);
        gl.depthMask(false);
        gl.disable(gl.BLEND);
        gl.useProgram(this.depthReadProgram);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, this.shadowTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.NONE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.uniform1i(this.DSRC, 2);
        gl.bindVertexArray(this.aoVao);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        const rgba2 = new Float32Array(size * size * 4);
        gl.readPixels(0, 0, size, size, gl.RGBA, gl.FLOAT, rgba2);
        const depth = new Float32Array(size * size);
        for (let i = 0; i < depth.length; i++) depth[i] = rgba2[i * 4];
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.bindVertexArray(null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.deleteFramebuffer(fbo);
        gl.deleteTexture(texture);
        gl.enable(gl.DEPTH_TEST);
        gl.depthMask(true);
        gl.enable(gl.BLEND);
        gl.activeTexture(gl.TEXTURE0);
        return { depth, size };
      }
      /**
       * The in-scatter buffer this backend produced, for verification.
       *
       * The gate runs the shared core's berxVolumetricAt over the same rays
       * and the same shadow map and compares. Reading the buffer rather than
       * the composited frame is what separates "the march is right" from
       * "the composite is right" — two different failures that look the same
       * on screen.
       */
      readVolumetricBuffer() {
        if (!this.volTexture || this.volSize.w === 0) return void 0;
        const gl = this.gl;
        const w = this.volSize.w, h = this.volSize.h;
        const rgba2 = new Float32Array(w * h * 4);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.volFbo);
        gl.readPixels(0, 0, w, h, gl.RGBA, gl.FLOAT, rgba2);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        return { rgba: rgba2, width: w, height: h };
      }
      /**
       * The G-buffer and the AO map this backend produced, for verification.
       *
       * The occlusion gate runs the shared core's berxSSAOAt over these exact
       * numbers, exactly as it does for WebGPU. Reading the inputs AND the
       * output is the only way to tell a wrong sign from a wrong formula.
       */
      readSSAOBuffers() {
        if (!this.gbufFbo || !this.aoFbo) return void 0;
        const gl = this.gl;
        const w = this.ssaoSize.w, h = this.ssaoSize.h;
        const gbuffer = new Float32Array(w * h * 4);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.gbufFbo);
        gl.readPixels(0, 0, w, h, gl.RGBA, gl.FLOAT, gbuffer);
        const ao = new Float32Array(w * h * 4);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.aoFbo);
        gl.readPixels(0, 0, w, h, gl.RGBA, gl.FLOAT, ao);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        const red = new Float32Array(w * h);
        for (let i = 0; i < w * h; i++) red[i] = ao[i * 4];
        return { gbuffer, ao: red, width: w, height: h };
      }
      drawEye(frame, options, width, height, clear, originX = 0) {
        const gl = this.gl;
        gl.useProgram(this.program);
        const list = berxBuildDrawList(frame, {
          width,
          height,
          maxObjects: options.maxObjects,
          ambientMotion: options.ambientMotion,
          quality: options.quality,
          core: options.core,
          shadows: options.shadows,
          lighting: this.lighting,
          mediaFor: (id) => this.media.get(id),
          affordances: this.affordances,
          /* What the last frame decided, so this one does not decide it again
             from scratch and come out differently. Carried by the RENDERER
             rather than by every caller: a runtime that draws continuously
             should not have to be told to be stable. */
          memory: options.stable === false ? void 0 : this.memory
        });
        this.memory = list.memory;
        const stages = [];
        if (list.shadow) stages.push("shadows");
        this.renderShadowMap(list);
        const wantsGbuffer = options.ssao !== false || options.volumetric !== false;
        const gbufferReady = wantsGbuffer ? this.renderSSAO(list, width, height) : false;
        if (gbufferReady) {
          stages.push("gbuffer");
          if (options.ssao !== false) stages.push("ssao");
        }
        const aoReady = options.ssao === false ? false : gbufferReady;
        const airReady = options.volumetric === false ? false : this.renderVolumetric(list, width, height);
        if (airReady) stages.push("volumetric");
        const exposed = this.ensureHdr(this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
        this.sceneFbo = exposed ? this.msFbo : null;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.sceneFbo);
        gl.useProgram(this.program);
        stages.push("world");
        gl.viewport(originX, 0, width, height);
        if (clear) {
          gl.clearColor(list.clearColor[0], list.clearColor[1], list.clearColor[2], 1);
          gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        }
        if (list.shadow && this.shadowTexture) {
          gl.uniformMatrix4fv(this.LVP, false, new Float32Array(list.shadow.viewProjection));
          gl.uniform4f(this.SHADOW, 1 / list.shadow.mapSize, list.shadow.depthBias, list.shadow.normalBias, list.shadow.strength);
          gl.activeTexture(gl.TEXTURE1);
          gl.bindTexture(gl.TEXTURE_2D, this.shadowTexture);
          gl.uniform1i(this.SHADOW_MAP, 1);
        } else {
          gl.uniform4f(this.SHADOW, 0, 0, 0, 0);
          gl.activeTexture(gl.TEXTURE1);
          gl.bindTexture(gl.TEXTURE_2D, this.ensureShadowTarget(1).texture);
          gl.uniform1i(this.SHADOW_MAP, 1);
        }
        gl.activeTexture(gl.TEXTURE0);
        gl.uniformMatrix4fv(this.P, false, new Float32Array(list.projection));
        gl.uniformMatrix4fv(this.V, false, new Float32Array(list.view));
        this.textures.beginFrame();
        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(this.TEX, 0);
        gl.uniform3f(this.CAM, list.camera.x, list.camera.y, list.camera.z);
        gl.uniform3f(this.AMB, list.ambient[0], list.ambient[1], list.ambient[2]);
        const e = list.environment;
        gl.uniform4f(this.ENV_ZEN, e[0], e[1], e[2], e[3]);
        gl.uniform4f(this.ENV_HOR, e[4], e[5], e[6], e[7]);
        gl.uniform4f(this.ENV_GND, e[8], e[9], e[10], e[11]);
        gl.uniform3f(this.ENV_SUN_DIR, e[12], e[13], e[14]);
        gl.uniform3f(this.ENV_SUN, e[16], e[17], e[18]);
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, aoReady ? this.aoTexture : this.blankAo);
        gl.uniform1i(this.AO_MAP, 3);
        gl.uniform1f(this.AO_ON, aoReady ? 1 : 0);
        gl.activeTexture(gl.TEXTURE0);
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
        if (labelCalls > 0) stages.push("labels");
        const particleCalls = options.particles === false ? 0 : this.renderParticles(list);
        if (particleCalls > 0) stages.push("particles");
        if (airReady && this.compositeAir(originX, width, height)) stages.push("composite");
        if (exposed && this.exposeToScreen(originX, width, height)) stages.push("post");
        this.stats = {
          visible: list.stats.visible,
          inFrustum: list.stats.inFrustum,
          drawCalls: drawCalls + labelCalls + particleCalls,
          triangles,
          lodReduced: list.stats.lodReduced,
          budgetCut: list.stats.budgetCut,
          residentTextures: this.textures.residentCount,
          residentLabels: this.labels.residentCount,
          meshVariants: this.meshes.size,
          stages
        };
      }
      /**
       * The depth-only pass, from the light.
       *
       * Front faces are culled rather than back faces — the standard trick,
       * and worth stating because it looks wrong: recording the BACK of each
       * caster puts the recorded depth on the far side of the object, which
       * moves the whole surface away from the comparison and removes
       * self-shadowing acne without a bias large enough to detach the
       * shadow from the object's foot.
       *
       * Nothing is decided here. Which objects cast, where the light stands
       * and how big its box is all come from list.shadow, which the shared
       * core computed — so this backend cannot disagree with the others
       * about where a shadow falls.
       */
      renderShadowMap(list) {
        const gl = this.gl;
        if (!list.shadow) {
          return;
        }
        const target = this.ensureShadowTarget(list.shadow.mapSize);
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
        gl.viewport(0, 0, list.shadow.mapSize, list.shadow.mapSize);
        gl.clear(gl.DEPTH_BUFFER_BIT);
        gl.useProgram(this.shadowProgram);
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.FRONT);
        gl.uniformMatrix4fv(this.SLVP, false, new Float32Array(list.shadow.viewProjection));
        for (const item of list.items) {
          if (item.opacity < 0.95) {
            continue;
          }
          const mesh = this.getMesh(item.primitive, item.lod);
          gl.bindVertexArray(mesh.vao);
          gl.uniformMatrix4fv(this.SM, false, new Float32Array(item.model));
          gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_SHORT, 0);
        }
        gl.bindVertexArray(null);
        gl.cullFace(gl.BACK);
        gl.disable(gl.CULL_FACE);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      }
      /** The depth target, built once and rebuilt only if the size changes. */
      ensureShadowTarget(size) {
        const gl = this.gl;
        if (this.shadowFbo && this.shadowTexture && this.shadowSize === size) {
          return { fbo: this.shadowFbo, texture: this.shadowTexture };
        }
        if (this.shadowFbo) gl.deleteFramebuffer(this.shadowFbo);
        if (this.shadowTexture) gl.deleteTexture(this.shadowTexture);
        const texture = gl.createTexture();
        const fbo = gl.createFramebuffer();
        if (!texture || !fbo) throw Error("BERX 5D shadow target allocation failed");
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, size, size, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, texture, 0);
        const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);
        if (status !== gl.FRAMEBUFFER_COMPLETE) throw Error(`BERX 5D shadow framebuffer incomplete: 0x${status.toString(16)}`);
        this.shadowFbo = fbo;
        this.shadowTexture = texture;
        this.shadowSize = size;
        return { fbo, texture };
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
        if (this.shadowFbo) gl.deleteFramebuffer(this.shadowFbo);
        if (this.shadowTexture) gl.deleteTexture(this.shadowTexture);
        this.shadowFbo = void 0;
        this.shadowTexture = void 0;
        this.shadowSize = 0;
        gl.deleteProgram(this.shadowProgram);
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
        this.shadowFbo = void 0;
        this.shadowTexture = void 0;
        this.shadowSize = 0;
      }
    };
  }
});

// packages/spatial-shaders/src/index.ts
var BERX_WORLD_WGSL, BERX_LABEL_WGSL, BERX_VOLUMETRIC_WGSL, BERX_SSAO_WGSL, BERX_PARTICLES_WGSL, BERX_POST_WGSL;
var init_src2 = __esm({
  "packages/spatial-shaders/src/index.ts"() {
    "use strict";
    BERX_WORLD_WGSL = "// The BERX forward pass, in WGSL. This file is the only copy of it.\n//\n// Two backends run this exact text: @berx/spatial-web's WebGPU renderer,\n// which imports it through @berx/spatial-shaders, and the native\n// berx-spatial-native crate, which include_str!s it. A shader duplicated\n// per backend is how two renderers quietly stop drawing the same world.\n//\n// The same microfacet BRDF the WebGL2 backend runs: GGX, height-correlated\n// Smith visibility, Schlick Fresnel, metalness splitting the diffuse and\n// specular lobes, one directional key, up to four windowed point lights, and\n// and image-based lighting from an ANALYTIC environment \u2014 a closed-form\n// room rather than a captured cubemap, because BERX ships no HDR asset and\n// a closed form is the only thing four languages can evaluate identically.\n// There is no post chain here, and both backends' reported capabilities say\n// so.\n//\n// The key light casts. Its camera is fitted in the shared core\n// (@berx/spatial's berxShadowCamera) so every backend puts the light in\n// exactly the same place, and this file only reads the depth it captured:\n// 3x3 PCF, a normal-offset sample, and a shadow that removes the KEY term\n// only. Ambient and the point lights are untouched, because a surface in\n// shadow still receives the bounced room \u2014 zeroing the pixel is what makes\n// a render look like a cutout rather than a place.\n//\n// One thing differs from the GLSL source, and it is a clip-space convention\n// rather than shading: WGSL depth runs 0..1 where GL runs -1..1, so the host\n// hands this shader a projection already remapped.\n//\n// Media is a planar projection onto the face that points at you, exactly as\n// in the GLSL pass: object-space position and normal give the UVs from the\n// local XY extent, and the texture is applied only where the surface faces\n// +Z, so an avatar on an orb reads as a face rather than as a photograph\n// smeared around a ball. A backend with no image to bind binds a 1x1 texture\n// and leaves the flag at zero; nothing is approximated with a colour.\n\nstruct Globals {\n  proj: mat4x4<f32>,\n  view: mat4x4<f32>,\n  camera: vec4<f32>,\n  ambient: vec4<f32>,\n  key_dir: vec4<f32>,\n  key_col: vec4<f32>,   // rgb, intensity in w\n  // The light's own view-projection, already in this API's depth range.\n  light_vp: mat4x4<f32>,\n  // x = 1/mapSize, y = depth bias, z = normal bias, w = strength (0 = off)\n  shadow: vec4<f32>,\n  // THE ROOM, packed by the shared core's berxEnvironmentUniform. The\n  // order is that function's, not this file's: changing it here without\n  // changing it there is how a renderer ends up lit by the ground\n  // colour. w components carry the scalars so the block stays five\n  // vec4s rather than five vec4s and four loose floats.\n  env_zenith: vec4<f32>,   // rgb zenith,          w = sun intensity\n  env_horizon: vec4<f32>,  // rgb horizon,         w = sun sharpness\n  env_ground: vec4<f32>,   // rgb ground * bounce, w = overall intensity\n  env_sun_dir: vec4<f32>,  // xyz toward the key light\n  env_sun: vec4<f32>,      // rgb sun colour\n  // x = 1 when an SSAO pass ran for this frame, 0 when it did not.\n  ssao: vec4<f32>,\n};\n\nstruct Draw {\n  model: mat4x4<f32>,\n  base: vec4<f32>,              // rgb base colour, w = local half-extent in X\n  emissive: vec4<f32>,          // rgb emission,    w = local half-extent in Y\n  surface: vec4<f32>,           // metalness, roughness, opacity, transmission\n  pl_pos: array<vec4<f32>, 4>,  // xyz position, w range\n  pl_col: array<vec4<f32>, 4>,  // rgb colour, w intensity\n  // x = point light count, yz = UV cover/contain correction, w = has texture\n  counts: vec4<f32>,\n};\n\n@group(0) @binding(0) var<uniform> g: Globals;\n// A comparison sampler, not a plain one: the hardware does the depth test\n// per sample and averages the RESULTS, which is what makes a 3x3 tap a soft\n// edge instead of four hard ones. Sampling depth and comparing afterwards\n// would average DEPTHS, and an averaged depth is a surface that exists\n// nowhere.\n@group(0) @binding(1) var shadow_sampler: sampler_comparison;\n@group(0) @binding(2) var shadow_texture: texture_depth_2d;\n// The occlusion the SSAO pass computed for this frame, at screen\n// resolution. Read with textureLoad rather than sampled: it is looked up\n// at exactly the fragment's own pixel, so there is nothing to filter and\n// no sampler to keep in step across three backends. A backend with the\n// pass switched off binds a 1x1 white texture and ssao_on stays 0.\n@group(0) @binding(3) var ao_texture: texture_2d<f32>;\n@group(1) @binding(0) var<uniform> d: Draw;\n@group(2) @binding(0) var media_sampler: sampler;\n@group(2) @binding(1) var media_texture: texture_2d<f32>;\n\nstruct VsOut {\n  @builtin(position) clip: vec4<f32>,\n  @location(0) n: vec3<f32>,\n  @location(1) w: vec3<f32>,\n  // object space, so media projects onto the form rather than the screen\n  @location(2) local: vec3<f32>,\n  @location(3) local_n: vec3<f32>,\n};\n\n/**\n * The depth-only pass, from the light.\n *\n * The same vertex data and the same model matrix as the main pass \u2014 a\n * shadow cast by a different shape from the one drawn is worse than no\n * shadow, because it is a shape that is not there.\n */\n@vertex\nfn vs_shadow(@location(0) p: vec3<f32>, @location(1) n: vec3<f32>) -> @builtin(position) vec4<f32> {\n  return g.light_vp * d.model * vec4<f32>(p, 1.0);\n}\n\n@vertex\nfn vs(@location(0) p: vec3<f32>, @location(1) n: vec3<f32>) -> VsOut {\n  var o: VsOut;\n  let w = d.model * vec4<f32>(p, 1.0);\n  o.w = w.xyz;\n  o.n = (mat3x3<f32>(d.model[0].xyz, d.model[1].xyz, d.model[2].xyz)) * n;\n  o.local = p;\n  o.local_n = n;\n  o.clip = g.proj * g.view * w;\n  return o;\n}\n\nconst PI: f32 = 3.14159265359;\n\nfn d_ggx(noh: f32, a: f32) -> f32 {\n  let a2 = a * a;\n  let den = noh * noh * (a2 - 1.0) + 1.0;\n  return a2 / max(PI * den * den, 1e-7);\n}\n\nfn v_smith(nov: f32, nol: f32, a: f32) -> f32 {\n  let a2 = a * a;\n  let v = nol * sqrt(nov * nov * (1.0 - a2) + a2);\n  let l = nov * sqrt(nol * nol * (1.0 - a2) + a2);\n  return 0.5 / max(v + l, 1e-7);\n}\n\nfn f_schlick(f0: vec3<f32>, u: f32) -> vec3<f32> {\n  let m = clamp(1.0 - u, 0.0, 1.0);\n  let m2 = m * m;\n  return f0 + (vec3<f32>(1.0) - f0) * (m2 * m2 * m);\n}\n\n/**\n * BERX ENVIRONMENT \u2014 the analytic room, in WGSL.\n *\n * The same three terms as @berx/spatial's berxEnvironmentRadiance, in\n * the same order, from the same constants: a sky gradient over the\n * upper hemisphere, the floor's weak return below it, and a sun lobe\n * around the key direction. There is no cubemap to sample because BERX\n * ships no captured HDR environment; this is a closed form, which is\n * the only reason four languages can evaluate it identically.\n *\n * `dir` must already be normalised \u2014 the caller normalises, and a\n * hidden normalise here would be a place for the ports to differ.\n * `smoothstep(0,1,x)` is WGSL's builtin, which is the same Hermite\n * polynomial berxEnvSmoothstep01 spells out in TypeScript.\n */\nfn berx_environment(dir: vec3<f32>) -> vec3<f32> {\n  let up = clamp(dir.y, 0.0, 1.0);\n  let down = clamp(-dir.y, 0.0, 1.0);\n  let sky = mix(g.env_horizon.rgb, g.env_zenith.rgb, smoothstep(0.0, 1.0, up));\n  // the floor's return is already scaled by `bounce` on the host side\n  let base = mix(sky, g.env_ground.rgb, smoothstep(0.0, 1.0, down));\n  // both vectors point TOWARD the light, so this peaks at 1 looking at it\n  let cos_a = max(dot(dir, g.env_sun_dir.xyz), 0.0);\n  let glow = pow(cos_a, g.env_horizon.w) * g.env_zenith.w;\n  return (base + g.env_sun.rgb * glow) * g.env_ground.w;\n}\n\nfn shade(n: vec3<f32>, v: vec3<f32>, l: vec3<f32>, radiance: vec3<f32>,\n         diffuse_color: vec3<f32>, f0: vec3<f32>, a: f32) -> vec3<f32> {\n  let h = normalize(v + l);\n  let nol = max(dot(n, l), 0.0);\n  if (nol <= 0.0) { return vec3<f32>(0.0); }\n  let nov = max(dot(n, v), 1e-4);\n  let noh = max(dot(n, h), 0.0);\n  let voh = max(dot(v, h), 0.0);\n  let f = f_schlick(f0, voh);\n  let vis = v_smith(nov, nol, a);\n  let dist = d_ggx(noh, a);\n  let spec = f * (dist * vis);\n  // energy that was not reflected is the only energy left to scatter\n  let kd = vec3<f32>(1.0) - f;\n  let diff = kd * diffuse_color / PI;\n  return (diff + spec) * radiance * nol;\n}\n\n/**\n * How much of the key light reaches this point. 1 is full light.\n *\n * The sample is pushed along the surface normal before projecting, which\n * is what stops a lit surface shadowing itself at grazing angles without\n * the constant depth bias that would detach a shadow from the foot of\n * the thing casting it.\n */\nfn key_visibility(world: vec3<f32>, n: vec3<f32>, nol: f32) -> f32 {\n  if (g.shadow.w <= 0.0) { return 1.0; }\n  // more offset where the light grazes, none where it is head-on\n  let slope = clamp(1.0 - nol, 0.0, 1.0);\n  let offset = world + n * (g.shadow.z * (1.0 + slope * 2.0));\n  let light_clip = g.light_vp * vec4<f32>(offset, 1.0);\n  let ndc = light_clip.xyz / max(light_clip.w, 1e-6);\n  // outside the light's own box: lit, not shadowed. A world larger than\n  // the map must not grow a hard black edge where the map ends.\n  if (ndc.x < -1.0 || ndc.x > 1.0 || ndc.y < -1.0 || ndc.y > 1.0 || ndc.z > 1.0) { return 1.0; }\n  let uv = vec2<f32>(ndc.x * 0.5 + 0.5, 0.5 - ndc.y * 0.5);\n  let depth = ndc.z - g.shadow.y;\n  var sum = 0.0;\n  for (var y: i32 = -1; y <= 1; y = y + 1) {\n    for (var x: i32 = -1; x <= 1; x = x + 1) {\n      let tap = uv + vec2<f32>(f32(x), f32(y)) * g.shadow.x;\n      sum = sum + textureSampleCompareLevel(shadow_texture, shadow_sampler, tap, depth);\n    }\n  }\n  let lit = sum / 9.0;\n  return mix(1.0, lit, g.shadow.w);\n}\n\n@fragment\nfn fs(i: VsOut) -> @location(0) vec4<f32> {\n  // Media is a planar projection onto the face that points at you.\n  //\n  // The sample is taken unconditionally and then selected, rather than\n  // taken inside the test: textureSample needs uniform control flow, and\n  // whether a fragment is on the front face and inside the picture is a\n  // per-fragment fact. A backend with nothing to show binds a 1x1\n  // texture and leaves counts.w at zero, so the sample is discarded.\n  let half_extent = vec2<f32>(max(d.base.w, 1e-4), max(d.emissive.w, 1e-4));\n  let uv = (i.local.xy / half_extent) * 0.5 * d.counts.yz + vec2<f32>(0.5);\n  let sampled = textureSample(media_texture, media_sampler, vec2<f32>(uv.x, 1.0 - uv.y)).rgb;\n  let inside = uv.x >= 0.0 && uv.x <= 1.0 && uv.y >= 0.0 && uv.y <= 1.0;\n  let facing = normalize(i.local_n).z > 0.5;\n  let base = select(d.base.rgb, sampled, d.counts.w > 0.5 && facing && inside);\n  let n = normalize(i.n);\n  let v = normalize(g.camera.xyz - i.w);\n  let a = max(d.surface.y * d.surface.y, 1e-3);\n  // metals have no diffuse term and tint their reflection; dielectrics\n  // reflect 4% white and keep their colour in the diffuse lobe\n  let diffuse_color = base * (1.0 - d.surface.x);\n  let f0 = mix(vec3<f32>(0.04), base, vec3<f32>(d.surface.x));\n\n  let key_l = normalize(g.key_dir.xyz);\n  // The key alone is shadowed. Ambient and the point lights are not: a\n  // surface out of the sun still receives the room.\n  let visibility = key_visibility(i.w, n, max(dot(n, key_l), 0.0));\n  var lit = shade(n, v, key_l, g.key_col.rgb * g.key_col.w, diffuse_color, f0, a) * visibility;\n\n  let count = i32(d.counts.x);\n  for (var k: i32 = 0; k < 4; k = k + 1) {\n    if (k >= count) { break; }\n    let lp = d.pl_pos[k];\n    let lc = d.pl_col[k];\n    let delta = lp.xyz - i.w;\n    let dist = length(delta);\n    if (dist > lp.w) { continue; }\n    // inverse-square, windowed so a light ends where its range says\n    let win = clamp(1.0 - pow(dist / lp.w, 4.0), 0.0, 1.0);\n    let atten = win * win / max(dist * dist, 1e-4);\n    lit = lit + shade(n, v, delta / max(dist, 1e-4), lc.rgb * lc.w * atten, diffuse_color, f0, a);\n  }\n\n  /* AMBIENT IS NOW THE ROOM, not one colour.\n     Diffuse takes the environment along the normal \u2014 what a matte\n     surface actually faces. Specular takes it along the reflection,\n     blended toward the normal by roughness: a rough surface's lobe is\n     wide, so it sees an average of the room rather than a mirror of it,\n     and that blend is this backend's prefilter. There is no prefiltered\n     mip chain because there is no map to prefilter. */\n  let nov = max(dot(n, v), 0.0);\n  let refl = reflect(-v, n);\n  let env_d = berx_environment(n);\n  let env_s = berx_environment(normalize(mix(refl, n, d.surface.y)));\n  let fres = f_schlick(f0, nov);\n  /* AMBIENT OCCLUSION SCALES THE ROOM, AND ONLY THE ROOM.\n     A point in the crease where two surfaces meet can see very little of\n     the environment, which is the darkening the eye reads as contact.\n     The key light already has its own shadow; multiplying a direct light\n     by an ambient term is how a render grows a black core wherever two\n     things touch. g.ssao.x is 1 when the pass ran, 0 when it did not. */\n  let ao = select(1.0, textureLoad(ao_texture, vec2<i32>(i.clip.xy), 0).r, g.ssao.x > 0.5);\n  let amb = (env_d * diffuse_color * (vec3<f32>(1.0) - fres) + env_s * fres) * ao;\n  let colour = lit + amb + d.emissive.rgb;\n  // transmission lets the ground through a glass surface rather than\n  // fading it to nothing\n  let alpha = clamp(d.surface.z * (1.0 - d.surface.w * 0.55), 0.02, 1.0);\n  return vec4<f32>(colour, alpha);\n}\n\n/* ------------------------------------------------------------------ *\n * THE G-BUFFER, for ambient occlusion\n * ------------------------------------------------------------------ *\n *\n * View-space normal in rgb, view-space depth in metres in a. Not a\n * hardware depth texture, and the reason is portability rather than\n * convenience: reconstructing a view position from a depth buffer needs\n * the projection's own conventions, and WGSL's depth range runs 0..1\n * where GL's runs -1..1 \u2014 so three backends reconstructing \"the same\"\n * position would be three different reconstructions. A linear view depth\n * written here is the same number everywhere, and the shared core's\n * berxSSAOAt reads exactly these two fields.\n */\n\nstruct GbufOut {\n  @builtin(position) clip: vec4<f32>,\n  @location(0) view_normal: vec3<f32>,\n  @location(1) view_pos: vec3<f32>,\n};\n\n@vertex\nfn vs_gbuffer(@location(0) p: vec3<f32>, @location(1) n: vec3<f32>) -> GbufOut {\n  var o: GbufOut;\n  let w = d.model * vec4<f32>(p, 1.0);\n  let world_n = (mat3x3<f32>(d.model[0].xyz, d.model[1].xyz, d.model[2].xyz)) * n;\n  // into view space: the rotation part of the view matrix\n  o.view_normal = (mat3x3<f32>(g.view[0].xyz, g.view[1].xyz, g.view[2].xyz)) * world_n;\n  o.view_pos = (g.view * w).xyz;\n  o.clip = g.proj * g.view * w;\n  return o;\n}\n\n@fragment\nfn fs_gbuffer(i: GbufOut) -> @location(0) vec4<f32> {\n  // The view looks down -Z, so depth in front of the eye is -view_pos.z.\n  return vec4<f32>(normalize(i.view_normal), -i.view_pos.z);\n}\n";
    BERX_LABEL_WGSL = "// Names standing in the world, in WGSL. This file is the only copy of it.\n//\n// Unlit on purpose: a name is not a surface in the room, it is a name, and\n// shading it would make it dimmer the further it turned from the key light \u2014\n// the opposite of what a label is for. It is still real geometry, at a real\n// world position with a real height in metres, and depth-tested, so anything\n// in front of it hides it.\n//\n// The quad turns to face the camera by being built from the camera's own\n// right and up vectors, which the shared core hands over with the label's\n// position. Nothing here decides where a name goes.\n\nstruct LabelGlobals {\n  proj: mat4x4<f32>,\n  view: mat4x4<f32>,\n  right: vec4<f32>,\n  up: vec4<f32>,\n};\n\nstruct Label {\n  // xyz world centre, w unused\n  centre: vec4<f32>,\n  // xy half-extent in metres, z alpha, w unused\n  size: vec4<f32>,\n};\n\n@group(0) @binding(0) var<uniform> g: LabelGlobals;\n@group(1) @binding(0) var<uniform> l: Label;\n@group(2) @binding(0) var glyph_sampler: sampler;\n@group(2) @binding(1) var glyph_texture: texture_2d<f32>;\n\nstruct VsOut {\n  @builtin(position) clip: vec4<f32>,\n  @location(0) uv: vec2<f32>,\n};\n\n@vertex\nfn vs(@builtin(vertex_index) v: u32) -> VsOut {\n  // two triangles, as a quad in the camera's plane\n  var corners = array<vec2<f32>, 6>(\n    vec2<f32>(-1.0, -1.0), vec2<f32>(1.0, -1.0), vec2<f32>(1.0, 1.0),\n    vec2<f32>(-1.0, -1.0), vec2<f32>(1.0, 1.0), vec2<f32>(-1.0, 1.0),\n  );\n  let q = corners[v];\n  var o: VsOut;\n  // the rasterised glyphs run top row first, so V is flipped here rather\n  // than in the upload \u2014 writeTexture has no flip of its own\n  o.uv = vec2<f32>(q.x * 0.5 + 0.5, 0.5 - q.y * 0.5);\n  let w = l.centre.xyz + g.right.xyz * (q.x * l.size.x) + g.up.xyz * (q.y * l.size.y);\n  o.clip = g.proj * g.view * vec4<f32>(w, 1.0);\n  return o;\n}\n\n@fragment\nfn fs(i: VsOut) -> @location(0) vec4<f32> {\n  let t = textureSample(glyph_texture, glyph_sampler, i.uv);\n  let a = t.a * l.size.z;\n  if (a < 0.01) { discard; }\n  return vec4<f32>(t.rgb, a);\n}\n";
    BERX_VOLUMETRIC_WGSL = "// BERX volumetric light, in WGSL. This file is the only copy of it.\n//\n// Two backends run this exact text: @berx/spatial-web's WebGPU renderer,\n// which imports it through @berx/spatial-shaders, and the native\n// berx-spatial-native crate, which include_str!s it. WebGL2 runs the same\n// maths as a fullscreen fragment pass (see threeRuntime.ts) \u2014 the march\n// below is line for line the same sequence.\n//\n// A fullscreen FRAGMENT pass rather than a compute one, unlike ssao.wgsl,\n// and for a reason: WebGL2 has no compute stage, so a fragment shape is\n// the only one all three backends can run identically. SSAO writes to a\n// storage texture it then reads at a different pixel, which a fragment\n// pass cannot do; this one only ever writes the pixel it is on.\n//\n// What is NOT here is anything that decides the answer: the density, the\n// phase asymmetry, the march length and the intensity all arrive in `v`\n// from @berx/spatial's berxVolumetricUniform, and the loop is the same\n// sequence of operations as that module's berxVolumetricAt \u2014 the CPU twin\n// the gate predicts pixels with.\n\nstruct VolGlobals {\n  // the inverse of projection * view, for turning a pixel into a ray\n  inv_view_proj: mat4x4<f32>,\n  // xyz eye position, w unused\n  eye: vec4<f32>,\n  // xyz toward the key light, w unused\n  light_dir: vec4<f32>,\n  // rgb the key's colour, w its intensity\n  light_col: vec4<f32>,\n  // the light's own view-projection, in this API's depth range\n  light_vp: mat4x4<f32>,\n  // x = 1/mapSize, y = depth bias, z unused, w = shadow strength\n  shadow: vec4<f32>,\n  // x = density, y = phase g, z = max distance, w = intensity\n  params: vec4<f32>,\n  // x = march width, y = march height, z = steps, w = march scale\n  //\n  // The march may run at a FRACTION of the frame: a shaft is a smooth,\n  // low-frequency thing with no edges of its own \u2014 only the ones the\n  // shadow map gives it \u2014 so it survives being computed at half\n  // resolution and upsampled, and the cost is quadratic in that choice.\n  // xy are therefore the MARCH's dimensions, and w says how many frame\n  // pixels one of them covers, which is all the G-buffer fetch needs.\n  dims: vec4<f32>,\n  // xyz the camera's forward direction, w unused. Turns the G-buffer's\n  // view depth into a distance along THIS ray.\n  forward: vec4<f32>,\n};\n\n@group(0) @binding(0) var<uniform> v: VolGlobals;\n@group(0) @binding(1) var shadow_sampler: sampler_comparison;\n@group(0) @binding(2) var shadow_texture: texture_depth_2d;\n// rgb = view-space normal, a = linear view depth in metres (0 = nothing)\n@group(0) @binding(3) var gbuffer: texture_2d<f32>;\n\n// The composite's own resources, on a second group: a WGSL module cannot\n// declare two different resources at the same @group/@binding, and the\n// composite reads what the march wrote rather than what the march read.\n@group(1) @binding(0) var vol_sampler: sampler;\n@group(1) @binding(1) var vol_texture: texture_2d<f32>;\n\nconst PI: f32 = 3.14159265359;\n\nstruct VsOut {\n  @builtin(position) clip: vec4<f32>,\n  @location(0) uv: vec2<f32>,\n};\n\n@vertex\nfn vs_fullscreen(@builtin(vertex_index) i: u32) -> VsOut {\n  // one triangle covering the screen: fewer vertices than a quad and no\n  // seam down the diagonal where two triangles meet\n  var corners = array<vec2<f32>, 3>(\n    vec2<f32>(-1.0, -1.0), vec2<f32>(3.0, -1.0), vec2<f32>(-1.0, 3.0),\n  );\n  let c = corners[i];\n  var o: VsOut;\n  o.clip = vec4<f32>(c, 0.0, 1.0);\n  o.uv = vec2<f32>(c.x * 0.5 + 0.5, 0.5 - c.y * 0.5);\n  return o;\n}\n\n/**\n * Henyey\u2013Greenstein. The same curve as @berx/spatial's berxPhaseHG,\n * including the clamp: at g\u21921 and cosTheta\u21921 the denominator goes to\n * zero and the phase to infinity, which is the singular lobe that blows\n * a shaft out to white.\n */\nfn phase_hg(cos_theta: f32, g: f32) -> f32 {\n  let g2 = g * g;\n  let denom = 1.0 + g2 - 2.0 * g * cos_theta;\n  return (1.0 - g2) / (4.0 * PI * pow(max(denom, 1e-4), 1.5));\n}\n\n/**\n * FNV-1a over the pixel coordinate \u2014 the same hash as\n * berxVolumetricJitter, which is why a shaft dithers identically in\n * four languages without shipping a noise texture.\n */\nfn jitter(x: i32, y: i32) -> f32 {\n  var h: u32 = 0x811c9dc5u;\n  h = h ^ (u32(x) & 0xffffu);\n  h = h * 0x01000193u;\n  h = h ^ (u32(y) & 0xffffu);\n  h = h * 0x01000193u;\n  return f32(h >> 8u) / 16777216.0;\n}\n\n/** 1 where the key light reaches this point, 0 where the map says it does not. */\nfn lit_at(world: vec3<f32>) -> f32 {\n  if (v.shadow.w <= 0.0) { return 1.0; }\n  let clip = v.light_vp * vec4<f32>(world, 1.0);\n  let ndc = clip.xyz / max(clip.w, 1e-6);\n  // outside the light's own box the air is lit, not dark: a world larger\n  // than the map must not grow a hard black wall where the map ends\n  if (ndc.x < -1.0 || ndc.x > 1.0 || ndc.y < -1.0 || ndc.y > 1.0 || ndc.z > 1.0) { return 1.0; }\n  let uv = vec2<f32>(ndc.x * 0.5 + 0.5, 0.5 - ndc.y * 0.5);\n  return textureSampleCompareLevel(shadow_texture, shadow_sampler, uv, ndc.z - v.shadow.y);\n}\n\n@fragment\nfn fs_volumetric(i: VsOut) -> @location(0) vec4<f32> {\n  let px = i32(i.uv.x * v.dims.x);\n  let py = i32(i.uv.y * v.dims.y);\n\n  // The ray through this pixel, from the inverse view-projection. Two\n  // points on it rather than a direction guess, so the reconstruction is\n  // exactly the camera's own.\n  let ndc = vec2<f32>(i.uv.x * 2.0 - 1.0, 1.0 - i.uv.y * 2.0);\n  let near_h = v.inv_view_proj * vec4<f32>(ndc, 0.0, 1.0);\n  let far_h = v.inv_view_proj * vec4<f32>(ndc, 1.0, 1.0);\n  let near_p = near_h.xyz / max(near_h.w, 1e-6);\n  let far_p = far_h.xyz / max(far_h.w, 1e-6);\n  let dir = normalize(far_p - near_p);\n\n  // Distance to the first surface. The march stops there: air behind a\n  // wall does not scatter light into the eye, and marching past it is how\n  // a volumetric pass glows through solid objects.\n  //\n  // The G-buffer stores VIEW DEPTH \u2014 distance along the camera's forward\n  // axis \u2014 and the march needs distance along THIS ray. For an off-axis\n  // pixel those differ by 1/cos, and using the depth directly cuts the\n  // march short by that factor: a measurable error toward the corners of\n  // the frame, and one the CPU twin would reproduce only by making the\n  // same mistake.\n  // The G-buffer is always at FRAME resolution \u2014 the occlusion pass reads\n  // it per pixel and cannot be cheapened the same way \u2014 so a march pixel\n  // maps to the centre of the block it covers. At scale 1 this is exactly\n  // (px, py), which is why turning the scale on changes nothing at HIGH.\n  let scale = max(v.dims.w, 1.0);\n  let gxy = vec2<f32>(f32(px), f32(py)) * scale + vec2<f32>((scale - 1.0) * 0.5);\n  let g = textureLoad(gbuffer, vec2<i32>(gxy), 0);\n  let along = max(dot(dir, normalize(v.forward.xyz)), 1e-3);\n  let surface = select(v.params.z, g.a / along, g.a > 0.0);\n  let far = min(v.params.z, surface);\n  if (far <= 0.0) { return vec4<f32>(0.0, 0.0, 0.0, 1.0); }\n\n  let steps = i32(v.dims.z);\n  let step_length = far / f32(steps);\n  let phase = phase_hg(dot(dir, normalize(v.light_dir.xyz)), v.params.y);\n  let offset = jitter(px, py);\n\n  var inscatter = 0.0;\n  for (var s: i32 = 0; s < steps; s = s + 1) {\n    let t = (f32(s) + offset) * step_length;\n    let p = v.eye.xyz + dir * t;\n    let lit = lit_at(p);\n    if (lit <= 0.0) { continue; }\n    // Beer\u2013Lambert: what scatters here still has to reach the eye\n    let transmittance = exp(-v.params.x * t);\n    inscatter = inscatter + lit * phase * v.params.x * step_length * transmittance;\n  }\n\n  let energy = inscatter * v.params.w;\n  // The scattering is grey; the colour is the key light's own. Keeping\n  // them apart means a change of light colour cannot silently change the\n  // amount of scattering.\n  return vec4<f32>(v.light_col.rgb * v.light_col.w * energy, 1.0);\n}\n\n/**\n * The additive composite.\n *\n * Light in the air ADDS to what is behind it. A composite that blended\n * over the world would be a fog overlay: it would darken something, and\n * scattering never darkens anything. The blend state on the pipeline is\n * ONE/ONE for exactly that reason, and this shader only has to hand back\n * the in-scatter it was given.\n */\n@fragment\nfn fs_composite(i: VsOut) -> @location(0) vec4<f32> {\n  /**\n   * A bilinear tap, written out rather than asked of a sampler.\n   *\n   * The march target is rgba32float, and a 32-bit float texture is not\n   * filterable in WebGPU without an optional feature no phone is\n   * guaranteed to have. Dropping to rgba16float would have bought\n   * hardware filtering \u2014 and would have moved the volumetric gate's\n   * oracle tolerance from 1e-7 to about 1e-3 to accommodate it, which is\n   * loosening a measurement to fit a change rather than the other way\n   * round. Four loads and three mixes cost less than that.\n   *\n   * At scale 1 the sample lands exactly on a texel centre, f is zero in\n   * both axes, and this returns the same value a nearest tap did \u2014 so\n   * the full-resolution picture is unchanged, bit for bit.\n   */\n  let size = vec2<f32>(textureDimensions(vol_texture));\n  let p = i.uv * size - vec2<f32>(0.5);\n  let base = floor(p);\n  let f = p - base;\n  let hi = size - vec2<f32>(1.0);\n  let c00 = vec2<i32>(clamp(base, vec2<f32>(0.0), hi));\n  let c10 = vec2<i32>(clamp(base + vec2<f32>(1.0, 0.0), vec2<f32>(0.0), hi));\n  let c01 = vec2<i32>(clamp(base + vec2<f32>(0.0, 1.0), vec2<f32>(0.0), hi));\n  let c11 = vec2<i32>(clamp(base + vec2<f32>(1.0, 1.0), vec2<f32>(0.0), hi));\n  let top = mix(textureLoad(vol_texture, c00, 0).rgb, textureLoad(vol_texture, c10, 0).rgb, f.x);\n  let bottom = mix(textureLoad(vol_texture, c01, 0).rgb, textureLoad(vol_texture, c11, 0).rgb, f.x);\n  return vec4<f32>(mix(top, bottom, f.y), 1.0);\n}\n";
    BERX_SSAO_WGSL = "// BERX SSAO, in WGSL. This file is the only copy of it.\n//\n// Two backends run this exact text: @berx/spatial-web's WebGPU renderer,\n// which imports it through @berx/spatial-shaders, and the native\n// berx-spatial-native crate, which include_str!s it. WebGL2 has no\n// compute stage, so it runs the same maths as a fullscreen fragment pass\n// (see threeRuntime.ts) \u2014 the loop is line for line this one.\n//\n// It is a separate module from world.wgsl rather than another entry point\n// in it because a WGSL module cannot declare two different resources at\n// the same @group/@binding, and this pass needs its own bind group.\n\n/* ------------------------------------------------------------------ *\n * SSAO \u2014 the compute pass\n * ------------------------------------------------------------------ *\n *\n * The loop is here because a pixel has to ask its neighbours, and that\n * cannot be a closed form. What is NOT here is anything that decides the\n * answer: the sample kernel, the radius, the bias, the strength and the\n * falloff all arrive in `k` from @berx/spatial's berxSSAOUniform, and the\n * accumulation below is the same sequence of operations as that module's\n * berxSSAOAt \u2014 which is the CPU twin the gate predicts pixels with.\n *\n * There is no per-pixel random rotation and no blur pass to hide one.\n * The kernel is an evenly-spaced golden-angle spiral, which does not need\n * the rotation, and a blur would add a radius three backends would have\n * to agree on for no gain.\n */\n\nstruct SsaoKernel {\n  // BERX_SSAO_SAMPLES hemisphere offsets, then one vec4 of parameters:\n  // x = radius, y = bias, z = strength, w = power.\n  s: array<vec4<f32>, 17>,\n};\n\n@group(0) @binding(0) var<uniform> sk: SsaoKernel;\n@group(0) @binding(1) var gbuffer: texture_2d<f32>;\n@group(0) @binding(2) var ao_out: texture_storage_2d<r32float, write>;\n// x = width, y = height, z = focal length in pixels, w unused\n// x = width, y = height, z = focal length in pixels, w = LIVE TAPS\n//\n// The kernel buffer is always sixteen vec4s so that a change of quality\n// cannot change its size \u2014 and therefore cannot invalidate a bind group\n// naming it. A tier that can only afford eight gets a STRIDE through the\n// spiral in the first eight slots, zeroes in the rest, and this count.\n@group(0) @binding(3) var<uniform> sdim: vec4<f32>;\n\n@compute @workgroup_size(8, 8)\nfn cs_ssao(@builtin(global_invocation_id) id: vec3<u32>) {\n  let w = i32(sdim.x);\n  let h = i32(sdim.y);\n  let x = i32(id.x);\n  let y = i32(id.y);\n  if (x >= w || y >= h) { return; }\n\n  let centre = textureLoad(gbuffer, vec2<i32>(x, y), 0);\n  // nothing was drawn here, so there is nothing to occlude\n  if (centre.a <= 0.0) {\n    textureStore(ao_out, vec2<i32>(x, y), vec4<f32>(1.0, 0.0, 0.0, 1.0));\n    return;\n  }\n\n  let params = sk.s[16];\n  let radius = params.x;\n  let strength = params.z;\n  let power = params.w;\n  let n = normalize(centre.xyz);\n\n  // A deterministic basis, not a noise-texture rotation \u2014 see the note\n  // above and berxSSAOAt's own.\n  var up = vec3<f32>(0.0, 0.0, 1.0);\n  if (abs(n.z) >= 0.999) { up = vec3<f32>(1.0, 0.0, 0.0); }\n  let tx = normalize(cross(up, n));\n  let ty = cross(n, tx);\n  // Slope-scaled bias \u2014 see berxSSAOAt's own note. A sample lands on a\n  // whole pixel, and on an oblique surface the geometry there is up to\n  // half a pixel of slope away in depth; a constant bias leaves every\n  // tilted surface with a uniform haze.\n  let slope = 1.0 - min(1.0, abs(n.z));\n  let bias = params.y * (1.0 + slope * 4.0);\n\n  var occluded = 0.0;\n  let taps = i32(sdim.w);\n  for (var j: i32 = 0; j < 16; j = j + 1) {\n    if (j >= taps) { break; }\n    let k = sk.s[j].xyz;\n    let s = tx * k.x + ty * k.y + n * k.z;\n    let sample_depth = centre.a - s.z * radius;\n    if (sample_depth <= 0.0) { continue; }\n    let sx = x + i32(round((s.x * radius * sdim.z) / sample_depth));\n    let sy = y - i32(round((s.y * radius * sdim.z) / sample_depth));\n    if (sx < 0 || sy < 0 || sx >= w || sy >= h) { continue; }\n    let there = textureLoad(gbuffer, vec2<i32>(sx, sy), 0);\n    if (there.a <= 0.0) { continue; }\n    if (there.a < sample_depth - bias) {\n      // range check: without it every silhouette grows a dark halo from\n      // whatever happens to be far behind it\n      let range = radius / max(abs(centre.a - there.a), 1e-4);\n      occluded = occluded + min(1.0, range);\n    }\n  }\n\n  let ratio = occluded / f32(max(taps, 1));\n  let ao = max(0.0, 1.0 - pow(ratio, power) * strength);\n  textureStore(ao_out, vec2<i32>(x, y), vec4<f32>(ao, 0.0, 0.0, 1.0));\n}\n";
    BERX_PARTICLES_WGSL = "// BERX particles, in WGSL. This file is the only copy of it.\n//\n// Two backends run this exact text: @berx/spatial-web's WebGPU renderer,\n// which imports it through @berx/spatial-shaders, and the native\n// berx-spatial-native crate, which include_str!s it. WebGL2 runs the same\n// maths as a GLSL port (see threeRuntime.ts) \u2014 the hash and the placement\n// below are the same sequence.\n//\n// NOTHING IS READ FROM A BUFFER. Each vertex works out where its own\n// particle is from a hash of its index, exactly as @berx/spatial's\n// berxParticleAt does \u2014 which is what makes the field identical in four\n// languages without a buffer to keep in sync, and what lets a CPU twin\n// say where every particle will be before the GPU draws it.\n//\n// Six vertices per particle, expanded from the vertex index alone: a\n// camera-facing quad needs no vertex buffer at all when its corners come\n// from arithmetic.\n\nstruct ParticleGlobals {\n  proj: mat4x4<f32>,\n  view: mat4x4<f32>,\n  // xyz what the field is arranged around, w the time in seconds\n  origin: vec4<f32>,\n  // rgb colour, a peak alpha\n  colour: vec4<f32>,\n  // x = extent, y = speed, z = size, w = period\n  shape: vec4<f32>,\n  // x = count, y = kind (0 dust, 1 energy, 2 stars), zw unused\n  counts: vec4<f32>,\n  // the camera's right and up, for the quads that face it\n  right: vec4<f32>,\n  up: vec4<f32>,\n};\n\n@group(0) @binding(0) var<uniform> p: ParticleGlobals;\n\nconst PI: f32 = 3.14159265359;\n\n/**\n * FNV-1a over an index and a lane \u2014 the same hash as\n * berxParticleHash. `lane` turns one index into several independent\n * numbers without needing four hashes or a table.\n */\nfn phash(index: u32, lane: u32) -> f32 {\n  var h: u32 = 0x811c9dc5u;\n  h = h ^ (index & 0xffffu);\n  h = h * 0x01000193u;\n  h = h ^ ((index >> 16u) & 0xffffu);\n  h = h * 0x01000193u;\n  h = h ^ (lane & 0xffffu);\n  h = h * 0x01000193u;\n  return f32(h >> 8u) / 16777216.0;\n}\n\nstruct Particle {\n  centre: vec3<f32>,\n  alpha: f32,\n  size: f32,\n};\n\n/** The same placement as berxParticleAt, term for term. */\nfn particle_at(index: u32) -> Particle {\n  let hx = phash(index, 1u);\n  let hy = phash(index, 2u);\n  let hz = phash(index, 3u);\n  let hp = phash(index, 4u);\n  let extent = p.shape.x;\n  let speed = p.shape.y;\n  let size = p.shape.z;\n  let period = p.shape.w;\n  let alpha = p.colour.a;\n  let phase = fract(p.origin.w / period + hp);\n\n  var out: Particle;\n  if (p.counts.y > 0.5 && p.counts.y < 1.5) {\n    // energy: a spiral leaving a surface, not a column of dots\n    let angle = hx * PI * 2.0 + phase * PI * 4.0;\n    let radius = extent * (0.25 + hy * 0.55) * (1.0 - phase * 0.45);\n    out.centre = vec3<f32>(\n      p.origin.x + cos(angle) * radius,\n      p.origin.y - extent * 0.4 + phase * extent * 1.8,\n      p.origin.z + sin(angle) * radius,\n    );\n    // fades in and out over its own life: a particle that appears at\n    // full brightness is a flicker, not a rising ember\n    out.alpha = alpha * sin(phase * PI);\n    out.size = size * (0.6 + hz * 0.8);\n    return out;\n  }\n\n  // dust and stars: a hashed cube around the origin, drifting. The drift\n  // wraps by construction, so there is no respawn and no lifetime\n  // bookkeeping to desynchronise between backends.\n  var drift = phase * extent;\n  if (speed == 0.0) { drift = 0.0; }\n  let wx = fract((hx * extent + drift * 0.35) / extent) * extent - extent * 0.5;\n  let wy = fract((hy * extent + drift) / extent) * extent - extent * 0.5;\n  let wz = fract((hz * extent + drift * 0.2) / extent) * extent - extent * 0.5;\n  out.centre = vec3<f32>(p.origin.x + wx, p.origin.y + wy, p.origin.z + wz);\n  // stars twinkle very slightly; dust does not \u2014 a twinkling mote in the\n  // near field reads as a rendering error\n  if (p.counts.y > 1.5) {\n    out.alpha = alpha * (0.65 + 0.35 * sin(phase * PI * 2.0));\n  } else {\n    out.alpha = alpha;\n  }\n  out.size = size * (0.7 + hz * 0.6);\n  return out;\n}\n\nstruct VsOut {\n  @builtin(position) clip: vec4<f32>,\n  @location(0) uv: vec2<f32>,\n  @location(1) alpha: f32,\n};\n\n@vertex\nfn vs_particles(@builtin(vertex_index) v: u32) -> VsOut {\n  let index = v / 6u;\n  let corner = v % 6u;\n  var corners = array<vec2<f32>, 6>(\n    vec2<f32>(-1.0, -1.0), vec2<f32>(1.0, -1.0), vec2<f32>(1.0, 1.0),\n    vec2<f32>(-1.0, -1.0), vec2<f32>(1.0, 1.0), vec2<f32>(-1.0, 1.0),\n  );\n  let q = corners[corner];\n  let particle = particle_at(index);\n  let world = particle.centre\n    + p.right.xyz * (q.x * particle.size)\n    + p.up.xyz * (q.y * particle.size);\n  var o: VsOut;\n  o.uv = q;\n  o.alpha = particle.alpha;\n  o.clip = p.proj * p.view * vec4<f32>(world, 1.0);\n  return o;\n}\n\n@fragment\nfn fs_particles(i: VsOut) -> @location(0) vec4<f32> {\n  // A round, soft mote. A square particle reads as a missing texture,\n  // and a hard-edged circle reads as a UI dot.\n  let r = length(i.uv);\n  if (r > 1.0) { discard; }\n  let falloff = 1.0 - r * r;\n  let a = i.alpha * falloff * falloff;\n  if (a < 0.002) { discard; }\n  // premultiplied: these are drawn additively, so the colour carries the\n  // alpha and the blend adds it to whatever is behind\n  return vec4<f32>(p.colour.rgb * a, a);\n}\n";
    BERX_POST_WGSL = "// BERX post, in WGSL. This file is the only copy of it.\n//\n// Two backends run this exact text: @berx/spatial-web's WebGPU renderer,\n// which imports it through @berx/spatial-shaders, and the native\n// berx-spatial-native crate, which include_str!s it. WebGL2 runs the same\n// maths as a fullscreen fragment pass (see threeRuntime.ts) \u2014 the five\n// constants below are the same five numbers there and in Rust and in\n// @berx/spatial's berxExposure, which is the CPU twin the gate predicts\n// pixels with.\n//\n// This stage was declared `absent` in renderPipeline.ts for the whole of\n// the project's life, and the honesty of that label is what made the\n// problem findable: there was no tone-map, so the frame was whatever the\n// world pass wrote, and what the world pass wrote was every brand colour\n// dimmed by the room's own light transport. #15191E on #07080A came out\n// 7 against 7 out of 255 \u2014 an object and a void the same colour to\n// within half a code value.\n//\n// WHAT RUNS HERE, in order, and the order is the whole point:\n//\n//   linear HDR  ->  x exposure  ->  shoulder  ->  8-bit frame\n//\n// The input is the frame AFTER the air has been added, because\n// in-scatter is light and light is part of what is being exposed.\n// Tone-mapping the surfaces and then adding the air would put unmapped\n// values on top of mapped ones, which is not a brighter picture \u2014 it is\n// two different pictures added together.\n\nstruct PostGlobals {\n  // x = exposure gain, y..w unused\n  params: vec4<f32>,\n};\n\n@group(0) @binding(0) var frame_texture: texture_2d<f32>;\n@group(0) @binding(1) var<uniform> p: PostGlobals;\n\nstruct VsOut {\n  @builtin(position) clip: vec4<f32>,\n  @location(0) uv: vec2<f32>,\n};\n\n@vertex\nfn vs_post(@builtin(vertex_index) i: u32) -> VsOut {\n  // one triangle covering the screen: fewer vertices than a quad and no\n  // seam down the diagonal where two triangles meet\n  var corners = array<vec2<f32>, 3>(\n    vec2<f32>(-1.0, -1.0), vec2<f32>(3.0, -1.0), vec2<f32>(-1.0, 3.0),\n  );\n  let c = corners[i];\n  var o: VsOut;\n  o.clip = vec4<f32>(c, 0.0, 1.0);\n  o.uv = vec2<f32>(c.x * 0.5 + 0.5, 0.5 - c.y * 0.5);\n  return o;\n}\n\n// The ACES filmic fit (Narkowicz). Five constants, four languages, one\n// set of numbers.\n//\n// Chosen over a Reinhard curve for what it does to HUE, which is the\n// thing a brand palette cannot afford to lose: past white it desaturates\n// toward white the way film does, instead of clipping each channel on\n// its own and turning a bright teal into a cyan and then into a flat\n// white. It also lifts the middle \u2014 f(0.18) = 0.267 \u2014 which is why the\n// gain does not have to be larger than the measured transport says.\nfn shoulder(x: f32) -> f32 {\n  let v = max(x, 0.0);\n  let mapped = (v * (2.51 * v + 0.03)) / (v * (2.43 * v + 0.59) + 0.14);\n  return clamp(mapped, 0.0, 1.0);\n}\n\n@fragment\nfn fs_post(i: VsOut) -> @location(0) vec4<f32> {\n  // A LOAD, not a sample. This pass is one output pixel per input\n  // pixel, so there is nothing to filter and a bilinear tap only\n  // introduces a half-texel question each API answers its own way \u2014 it\n  // was worth exactly three disagreeing pixels along the top edge\n  // between the two web backends. An integer fetch has no such\n  // question and makes them identical by construction.\n  let hdr = textureLoad(frame_texture, vec2<i32>(i.clip.xy), 0);\n  let e = hdr.rgb * p.params.x;\n  // Per channel, and the shoulder is what keeps that from being three\n  // independent clips: two colours that both pass 1.0 stay different\n  // numbers on screen instead of both being white.\n  return vec4<f32>(shoulder(e.r), shoulder(e.g), shoulder(e.b), 1.0);\n}\n";
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
      return createTorus(0.62, 0.42, far ? 18 : 48, far ? 6 : 12);
    case "frame":
      return createFrame(1, 1, 0.12);
    case "surface":
      return createBevelBox(1, 1, 0.06, 0.02);
    case "portal":
      return createFrame(1, 1.2, 0.16);
    case "node":
      return createSphere(0.58, far ? 9 : 20, far ? 6 : 12);
    case "stack":
      return createBevelBox(1, 1, 0.32, 0.1);
    case "message":
      return createBevelBox(1, 0.46, 0.12, 0.05);
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
var DRAW_STRIDE, GLOBALS_BYTES, SHADOW_FORMAT, VOL_GLOBALS_BYTES, PARTICLE_GLOBALS_BYTES, LABEL_STRIDE, LABEL_GLOBALS_BYTES, SAMPLE_COUNT, BerxWebGPURuntimeRenderer;
var init_webgpuRuntime = __esm({
  "packages/spatial-web/src/webgpuRuntime.ts"() {
    "use strict";
    init_src();
    init_src2();
    init_primitiveGeometry();
    init_webgpuMediaTextures();
    init_webgpuText();
    DRAW_STRIDE = 256;
    GLOBALS_BYTES = 368;
    SHADOW_FORMAT = "depth32float";
    VOL_GLOBALS_BYTES = 240;
    PARTICLE_GLOBALS_BYTES = 224;
    LABEL_STRIDE = 256;
    LABEL_GLOBALS_BYTES = 160;
    SAMPLE_COUNT = 4;
    BerxWebGPURuntimeRenderer = class _BerxWebGPURuntimeRenderer {
      constructor(canvas, device, context, format, hdrFormat, pipeline, drawLayout, mediaLayout, labelPipeline, labelLayout, shadowPipeline, gbufferPipeline, ssaoPipeline, volPipeline, compositePipeline, volLayout, compositeLayout, particlePipeline, particleLayout, postPipeline, postLayout, options) {
        this.canvas = canvas;
        this.device = device;
        this.context = context;
        this.format = format;
        this.hdrFormat = hdrFormat;
        this.pipeline = pipeline;
        this.drawLayout = drawLayout;
        this.labelPipeline = labelPipeline;
        this.labelLayout = labelLayout;
        this.shadowPipeline = shadowPipeline;
        this.gbufferPipeline = gbufferPipeline;
        this.ssaoPipeline = ssaoPipeline;
        this.volPipeline = volPipeline;
        this.compositePipeline = compositePipeline;
        this.volLayout = volLayout;
        this.compositeLayout = compositeLayout;
        this.particlePipeline = particlePipeline;
        this.particleLayout = particleLayout;
        this.postPipeline = postPipeline;
        this.postLayout = postLayout;
        this.kind = "webgpu";
        /* what this backend really does, and nothing it does not */
        this.capabilities = {
          perspective: true,
          depthBuffer: true,
          physicallyLitMaterials: true,
          shadows: true,
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
        /** Frame pixels per march pixel in the target above. 0 = none built. */
        this.volScale = 0;
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
        this.ssaoKernel = device.createBuffer({
          size: BERX_SSAO_FLOATS * 4,
          usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        device.queue.writeBuffer(this.ssaoKernel, 0, new Float32Array(berxSSAOUniform()));
        this.ssaoDims = device.createBuffer({ size: 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
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
        this.blankAo = device.createTexture({
          size: { width: 1, height: 1 },
          format: "r32float",
          usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
        });
        device.queue.writeTexture({ texture: this.blankAo }, new Float32Array([1]), { bytesPerRow: 4, rowsPerImage: 1 }, { width: 1, height: 1 });
        this.blankBind = device.createBindGroup({
          layout: mediaLayout,
          entries: [
            { binding: 0, resource: this.mediaSampler },
            { binding: 1, resource: blank.createView() }
          ]
        });
        this.globals = device.createBuffer({ size: GLOBALS_BYTES, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
        this.shadowSampler = device.createSampler({
          compare: "less",
          magFilter: "linear",
          minFilter: "linear",
          addressModeU: "clamp-to-edge",
          addressModeV: "clamp-to-edge"
        });
        this.shadowMap = device.createTexture({
          size: { width: 1, height: 1 },
          format: SHADOW_FORMAT,
          usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });
        this.shadowSize = 0;
        this.globalsBind = this.buildGlobalsBind();
        this.shadowGlobalsBind = device.createBindGroup({
          layout: shadowPipeline.getBindGroupLayout(0),
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
        const hdrFormat = "rgba16float";
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
          entries: [
            {
              binding: 0,
              visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
              buffer: { type: "uniform", minBindingSize: GLOBALS_BYTES }
            },
            /* A comparison sampler, not a filtering one: the hardware
               does the depth test per sample and averages the results,
               which is what makes the 3x3 tap a soft edge. */
            { binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: { type: "comparison" } },
            { binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "depth", viewDimension: "2d" } },
            /* The occlusion the compute pass wrote. Unfilterable-float
               because it is read with textureLoad at the fragment's own
               pixel — there is nothing to filter. */
            { binding: 3, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "unfilterable-float", viewDimension: "2d" } }
          ]
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
              format: hdrFormat,
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
        const shadowGlobalsLayout = device.createBindGroupLayout({
          entries: [{
            binding: 0,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            buffer: { type: "uniform", minBindingSize: GLOBALS_BYTES }
          }]
        });
        const shadowPipeline = device.createRenderPipeline({
          layout: device.createPipelineLayout({ bindGroupLayouts: [shadowGlobalsLayout, drawLayout] }),
          vertex: {
            module,
            entryPoint: "vs_shadow",
            buffers: [{
              arrayStride: 24,
              attributes: [
                { shaderLocation: 0, offset: 0, format: "float32x3" },
                { shaderLocation: 1, offset: 12, format: "float32x3" }
              ]
            }]
          },
          primitive: { topology: "triangle-list", frontFace: "ccw", cullMode: "front" },
          depthStencil: { format: SHADOW_FORMAT, depthWriteEnabled: true, depthCompare: "less" }
        });
        const gbufferGlobalsLayout = device.createBindGroupLayout({
          entries: [{
            binding: 0,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            buffer: { type: "uniform", minBindingSize: GLOBALS_BYTES }
          }]
        });
        const gbufferPipeline = device.createRenderPipeline({
          layout: device.createPipelineLayout({ bindGroupLayouts: [gbufferGlobalsLayout, drawLayout] }),
          vertex: {
            module,
            entryPoint: "vs_gbuffer",
            buffers: [{
              arrayStride: 24,
              attributes: [
                { shaderLocation: 0, offset: 0, format: "float32x3" },
                { shaderLocation: 1, offset: 12, format: "float32x3" }
              ]
            }]
          },
          fragment: { module, entryPoint: "fs_gbuffer", targets: [{ format: "rgba32float" }] },
          primitive: { topology: "triangle-list", frontFace: "ccw", cullMode: "back" },
          depthStencil: { format: "depth32float", depthWriteEnabled: true, depthCompare: "less" }
        });
        const ssaoModule = device.createShaderModule({ code: BERX_SSAO_WGSL });
        const ssaoPipeline = device.createComputePipeline({
          layout: "auto",
          compute: { module: ssaoModule, entryPoint: "cs_ssao" }
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
              format: hdrFormat,
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
        const volModule = device.createShaderModule({ code: BERX_VOLUMETRIC_WGSL });
        const volLayout = device.createBindGroupLayout({
          entries: [
            { binding: 0, visibility: GPUShaderStage.FRAGMENT, buffer: { type: "uniform", minBindingSize: VOL_GLOBALS_BYTES } },
            /* nearest, not filtering: 32 dithered taps along a ray do not
               need hardware PCF, and a filtered lookup would make the
               result depend on a texel-weighting convention the CPU twin
               would have to guess at */
            { binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: { type: "comparison" } },
            { binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "depth", viewDimension: "2d" } },
            { binding: 3, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "unfilterable-float", viewDimension: "2d" } }
          ]
        });
        const volPipeline = device.createRenderPipeline({
          layout: device.createPipelineLayout({ bindGroupLayouts: [volLayout] }),
          vertex: { module: volModule, entryPoint: "vs_fullscreen" },
          fragment: { module: volModule, entryPoint: "fs_volumetric", targets: [{ format: "rgba32float" }] },
          primitive: { topology: "triangle-list" }
        });
        const compositeLayout = device.createBindGroupLayout({
          entries: [
            { binding: 0, visibility: GPUShaderStage.FRAGMENT, sampler: { type: "non-filtering" } },
            { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "unfilterable-float", viewDimension: "2d" } }
          ]
        });
        const compositePipeline = device.createRenderPipeline({
          /* group 0 is declared in the same module and must still be in the
             layout even though this entry point does not read it */
          layout: device.createPipelineLayout({ bindGroupLayouts: [volLayout, compositeLayout] }),
          vertex: { module: volModule, entryPoint: "vs_fullscreen" },
          fragment: {
            module: volModule,
            entryPoint: "fs_composite",
            targets: [{
              format: hdrFormat,
              /* ONE/ONE: light in the air adds to what is behind it */
              blend: {
                color: { srcFactor: "one", dstFactor: "one", operation: "add" },
                alpha: { srcFactor: "one", dstFactor: "one", operation: "add" }
              }
            }]
          },
          primitive: { topology: "triangle-list" },
          /* the world pass it joins is multisampled, and a pipeline whose
             sample count disagrees with its attachment is rejected outright */
          depthStencil: { format: "depth32float", depthWriteEnabled: false, depthCompare: "always" },
          multisample: { count: SAMPLE_COUNT }
        });
        const particleModule = device.createShaderModule({ code: BERX_PARTICLES_WGSL });
        const particleLayout = device.createBindGroupLayout({
          entries: [{
            binding: 0,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            buffer: { type: "uniform", hasDynamicOffset: true, minBindingSize: PARTICLE_GLOBALS_BYTES }
          }]
        });
        const particlePipeline = device.createRenderPipeline({
          layout: device.createPipelineLayout({ bindGroupLayouts: [particleLayout] }),
          vertex: { module: particleModule, entryPoint: "vs_particles" },
          fragment: {
            module: particleModule,
            entryPoint: "fs_particles",
            targets: [{
              format: hdrFormat,
              blend: {
                /* premultiplied and additive: the shader hands back a
                   colour that already carries its alpha */
                color: { srcFactor: "one", dstFactor: "one", operation: "add" },
                alpha: { srcFactor: "one", dstFactor: "one", operation: "add" }
              }
            }]
          },
          primitive: { topology: "triangle-list" },
          depthStencil: { format: "depth32float", depthWriteEnabled: false, depthCompare: "less" },
          multisample: { count: SAMPLE_COUNT }
        });
        const postModule = device.createShaderModule({ code: BERX_POST_WGSL });
        const postLayout = device.createBindGroupLayout({
          entries: [
            { binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "float" } },
            { binding: 1, visibility: GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } }
          ]
        });
        const postPipeline = device.createRenderPipeline({
          layout: device.createPipelineLayout({ bindGroupLayouts: [postLayout] }),
          vertex: { module: postModule, entryPoint: "vs_post" },
          fragment: { module: postModule, entryPoint: "fs_post", targets: [{ format }] },
          primitive: { topology: "triangle-list" }
        });
        const renderer = new _BerxWebGPURuntimeRenderer(canvas, device, context, format, hdrFormat, pipeline, drawLayout, mediaLayout, labelPipeline, labelLayout, shadowPipeline, gbufferPipeline, ssaoPipeline, volPipeline, compositePipeline, volLayout, compositeLayout, particlePipeline, particleLayout, postPipeline, postLayout, options);
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
        this.hdr?.destroy();
        this.postBind = void 0;
        this.offscreen = this.device.createTexture({
          size: { width: this.width, height: this.height },
          format: this.format,
          usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC
        });
        this.hdr = this.device.createTexture({
          size: { width: this.width, height: this.height },
          format: this.hdrFormat,
          usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });
        this.msaa = this.device.createTexture({
          size: { width: this.width, height: this.height },
          sampleCount: SAMPLE_COUNT,
          format: this.hdrFormat,
          usage: GPUTextureUsage.RENDER_ATTACHMENT
        });
        this.depth = this.device.createTexture({
          size: { width: this.width, height: this.height },
          sampleCount: SAMPLE_COUNT,
          format: "depth32float",
          usage: GPUTextureUsage.RENDER_ATTACHMENT
        });
        this.volTexture?.destroy();
        this.volTexture = void 0;
        this.volScale = 0;
        this.gbuffer = this.device.createTexture({
          size: { width: this.width, height: this.height },
          format: "rgba32float",
          usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC
        });
        this.gbufferDepth = this.device.createTexture({
          size: { width: this.width, height: this.height },
          format: "depth32float",
          usage: GPUTextureUsage.RENDER_ATTACHMENT
        });
        this.aoMap = this.device.createTexture({
          size: { width: this.width, height: this.height },
          format: "r32float",
          usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC
        });
        this.globalsBind = this.buildGlobalsBind();
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
          shadows: options.shadows,
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
      /** The bind group the world pass uses: globals plus the depth map. */
      buildGlobalsBind() {
        return this.device.createBindGroup({
          layout: this.pipeline.getBindGroupLayout(0),
          entries: [
            { binding: 0, resource: { buffer: this.globals } },
            { binding: 1, resource: this.shadowSampler },
            { binding: 2, resource: this.shadowMap.createView() },
            { binding: 3, resource: (this.aoMap ?? this.blankAo).createView() }
          ]
        });
      }
      /**
       * The depth target the light writes, rebuilt only when the size
       * changes. Rebuilding the bind group with it is not optional: a bind
       * group holds the VIEW, so a new texture with the old group bound
       * would sample the destroyed one.
       */
      ensureShadowMap(size) {
        if (this.shadowSize === size) return;
        this.shadowMap.destroy();
        this.shadowMap = this.device.createTexture({
          size: { width: size, height: size },
          format: SHADOW_FORMAT,
          usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });
        this.shadowSize = size;
        this.globalsBind = this.buildGlobalsBind();
        this.volBind = void 0;
      }
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
        if (list.shadow) {
          this.ensureShadowMap(list.shadow.mapSize);
          globals.set(glToWgpuDepth(list.shadow.viewProjection), 48);
          globals.set([
            1 / list.shadow.mapSize,
            list.shadow.depthBias,
            list.shadow.normalBias,
            list.shadow.strength
          ], 64);
        } else {
          globals.set([0, 0, 0, 0], 64);
        }
        globals.set(list.environment, 68);
        globals.set([pass_?.ssao === false ? 0 : 1, 0, 0, 0], 88);
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
        const stages = [];
        const encoder = device.createCommandEncoder();
        if (list.shadow) {
          stages.push("shadows");
          const shadowPass = encoder.beginRenderPass({
            colorAttachments: [],
            depthStencilAttachment: {
              view: this.shadowMap.createView(),
              depthClearValue: 1,
              depthLoadOp: "clear",
              depthStoreOp: "store"
            }
          });
          shadowPass.setPipeline(this.shadowPipeline);
          shadowPass.setBindGroup(0, this.shadowGlobalsBind);
          resolved.forEach(({ item, mesh }, i) => {
            if (item.opacity < 0.95) return;
            shadowPass.setBindGroup(1, this.drawBind, [i * DRAW_STRIDE]);
            shadowPass.setVertexBuffer(0, mesh.vertices);
            shadowPass.setIndexBuffer(mesh.indices, "uint16");
            shadowPass.drawIndexed(mesh.count);
          });
          shadowPass.end();
        }
        const haveGbuffer = this.gbuffer && this.aoMap && this.gbufferDepth;
        const wantsGbuffer = pass_?.ssao !== false || pass_?.volumetric !== false;
        const gbufferOn = wantsGbuffer && haveGbuffer;
        const ssaoOn = pass_?.ssao !== false && gbufferOn;
        if (gbufferOn) {
          stages.push("gbuffer");
          const gPass = encoder.beginRenderPass({
            colorAttachments: [{
              view: this.gbuffer.createView(),
              /* depth 0 means "nothing was drawn here", which is what
                 the occlusion pass tests for. */
              clearValue: { r: 0, g: 0, b: 0, a: 0 },
              loadOp: "clear",
              storeOp: "store"
            }],
            depthStencilAttachment: {
              view: this.gbufferDepth.createView(),
              depthClearValue: 1,
              depthLoadOp: "clear",
              depthStoreOp: "store"
            }
          });
          gPass.setPipeline(this.gbufferPipeline);
          gPass.setBindGroup(0, this.shadowGlobalsBind);
          resolved.forEach(({ mesh }, i) => {
            gPass.setBindGroup(1, this.drawBind, [i * DRAW_STRIDE]);
            gPass.setVertexBuffer(0, mesh.vertices);
            gPass.setIndexBuffer(mesh.indices, "uint16");
            gPass.drawIndexed(mesh.count);
          });
          gPass.end();
          const focalPx = list.projection[5] * this.height * 0.5;
          device.queue.writeBuffer(this.ssaoDims, 0, new Float32Array([this.width, this.height, focalPx, list.ssaoSamples]));
          device.queue.writeBuffer(this.ssaoKernel, 0, new Float32Array(berxSSAOUniform(void 0, list.ssaoSamples)));
          const ssaoBind = device.createBindGroup({
            layout: this.ssaoPipeline.getBindGroupLayout(0),
            entries: [
              { binding: 0, resource: { buffer: this.ssaoKernel } },
              { binding: 1, resource: this.gbuffer.createView() },
              { binding: 2, resource: this.aoMap.createView() },
              { binding: 3, resource: { buffer: this.ssaoDims } }
            ]
          });
          if (ssaoOn) {
            stages.push("ssao");
            const aoPass = encoder.beginComputePass();
            aoPass.setPipeline(this.ssaoPipeline);
            aoPass.setBindGroup(0, ssaoBind);
            aoPass.dispatchWorkgroups(Math.ceil(this.width / 8), Math.ceil(this.height / 8));
            aoPass.end();
          }
        }
        const marchScale = Math.max(1, Math.round(list.volumetric[5] || 1));
        const marchWidth = Math.max(1, Math.ceil(this.width / marchScale));
        const marchHeight = Math.max(1, Math.ceil(this.height / marchScale));
        const volumetricOn = pass_?.volumetric !== false && gbufferOn && list.shadow && this.ensureMarchTarget(marchScale, marchWidth, marchHeight);
        if (volumetricOn) {
          stages.push("volumetric");
          if (!this.volUniform) {
            this.volUniform = device.createBuffer({ size: VOL_GLOBALS_BYTES, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
          }
          if (!this.volSampler) {
            this.volSampler = device.createSampler({
              compare: "less",
              magFilter: "nearest",
              minFilter: "nearest",
              addressModeU: "clamp-to-edge",
              addressModeV: "clamp-to-edge"
            });
          }
          if (!this.volPointSampler) {
            this.volPointSampler = device.createSampler({ magFilter: "nearest", minFilter: "nearest" });
          }
          const viewProj = berxMultiplyMat4(new Float32Array(list.projection), new Float32Array(list.view));
          const volGlobals = new Float32Array(VOL_GLOBALS_BYTES / 4);
          volGlobals.set(berxInvertMat4(viewProj), 0);
          volGlobals.set([list.camera.x, list.camera.y, list.camera.z, 0], 16);
          volGlobals.set([list.key.direction.x, list.key.direction.y, list.key.direction.z, 0], 20);
          volGlobals.set([list.key.colour[0], list.key.colour[1], list.key.colour[2], list.key.intensity], 24);
          volGlobals.set(glToWgpuDepth(list.shadow.viewProjection), 28);
          volGlobals.set([1 / list.shadow.mapSize, list.shadow.depthBias, 0, list.shadow.strength], 44);
          volGlobals.set(list.volumetric.slice(0, 4), 48);
          volGlobals.set([marchWidth, marchHeight, list.volumetric[4], marchScale], 52);
          volGlobals.set([-list.view[2], -list.view[6], -list.view[10], 0], 56);
          device.queue.writeBuffer(this.volUniform, 0, volGlobals);
          if (!this.volBind) {
            this.volBind = device.createBindGroup({
              layout: this.volLayout,
              entries: [
                { binding: 0, resource: { buffer: this.volUniform } },
                { binding: 1, resource: this.volSampler },
                { binding: 2, resource: this.shadowMap.createView() },
                { binding: 3, resource: this.gbuffer.createView() }
              ]
            });
          }
          const volBind = this.volBind;
          const volPass = encoder.beginRenderPass({
            colorAttachments: [{
              view: this.volTexture.createView(),
              clearValue: { r: 0, g: 0, b: 0, a: 1 },
              loadOp: "clear",
              storeOp: "store"
            }]
          });
          volPass.setPipeline(this.volPipeline);
          volPass.setBindGroup(0, volBind);
          volPass.draw(3);
          volPass.end();
        }
        const pass = encoder.beginRenderPass({
          colorAttachments: [{
            view: this.msaa.createView(),
            /* Always the linear frame now: post is what reaches the
               screen, and a world pass that resolved straight to it
               would be the un-exposed picture again. */
            resolveTarget: this.hdr.createView(),
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
        stages.push("world");
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
        const labelCalls = this.drawLabels(pass, list);
        if (labelCalls > 0) stages.push("labels");
        drawCalls += labelCalls;
        if (pass_?.particles !== false && list.basis && list.particles.length > 0) {
          const stride = 256;
          if (!this.particleUniform) {
            this.particleUniform = device.createBuffer({
              size: stride * BERX_PARTICLE_KINDS.length,
              usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
            });
            this.particleBind = device.createBindGroup({
              layout: this.particleLayout,
              entries: [{ binding: 0, resource: { buffer: this.particleUniform, size: PARTICLE_GLOBALS_BYTES } }]
            });
          }
          list.particles.forEach((field, slot) => {
            const globals2 = new Float32Array(PARTICLE_GLOBALS_BYTES / 4);
            globals2.set(glToWgpuDepth(list.projection), 0);
            globals2.set(list.view, 16);
            globals2.set([field[12], field[13], field[14], list.worldTime], 32);
            globals2.set([field[0], field[1], field[2], field[3]], 36);
            globals2.set([field[4], field[5], field[6], field[7]], 40);
            globals2.set([field[8], field[9], 0, 0], 44);
            globals2.set([list.basis.right.x, list.basis.right.y, list.basis.right.z, 0], 48);
            globals2.set([list.basis.up.x, list.basis.up.y, list.basis.up.z, 0], 52);
            device.queue.writeBuffer(this.particleUniform, slot * stride, globals2);
          });
          stages.push("particles");
          pass.setPipeline(this.particlePipeline);
          list.particles.forEach((field, slot) => {
            pass.setBindGroup(0, this.particleBind, [slot * stride]);
            pass.draw(field[8] * 6);
            drawCalls++;
          });
        }
        if (volumetricOn) {
          if (!this.compositeBind) {
            this.compositeBind = device.createBindGroup({
              layout: this.compositeLayout,
              entries: [
                { binding: 0, resource: this.volPointSampler },
                { binding: 1, resource: this.volTexture.createView() }
              ]
            });
          }
          stages.push("composite");
          pass.setPipeline(this.compositePipeline);
          pass.setBindGroup(0, this.volBind);
          pass.setBindGroup(1, this.compositeBind);
          pass.draw(3);
          drawCalls++;
        }
        pass.end();
        if (!this.postUniform) {
          this.postUniform = device.createBuffer({
            size: 16,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
          });
        }
        device.queue.writeBuffer(this.postUniform, 0, new Float32Array([BERX_EXPOSURE, 0, 0, 0]));
        if (!this.postBind) {
          this.postBind = device.createBindGroup({
            layout: this.postLayout,
            entries: [
              { binding: 0, resource: this.hdr.createView() },
              { binding: 1, resource: { buffer: this.postUniform } }
            ]
          });
        }
        const postPass = encoder.beginRenderPass({
          colorAttachments: [{
            view: (offscreen ? this.offscreen : this.context.getCurrentTexture()).createView(),
            clearValue: { r: 0, g: 0, b: 0, a: 1 },
            loadOp: "clear",
            storeOp: "store"
          }]
        });
        stages.push("post");
        postPass.setPipeline(this.postPipeline);
        postPass.setBindGroup(0, this.postBind);
        postPass.draw(3);
        postPass.end();
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
          meshVariants: this.meshes.size,
          stages
        } : {
          visible: list.stats.visible,
          inFrustum: list.stats.inFrustum,
          drawCalls,
          triangles,
          lodReduced: list.stats.lodReduced,
          budgetCut: list.stats.budgetCut,
          residentTextures: this.textures.residentCount,
          residentLabels: this.labels.residentCount,
          meshVariants: this.meshes.size,
          stages
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
      /**
       * The G-buffer and the AO map, off the GPU.
       *
       * These exist for verification and for nothing else: the occlusion
       * gate predicts a pixel of the AO map by running the shared core's
       * berxSSAOAt over the G-buffer this returns. Reading the inputs AND
       * the output is what turns "the backends agree" into "the shader
       * computed what the core says", which is a different claim.
       */
      async readFloatTexture(texture, channels) {
        const unpadded = this.width * channels * 4;
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
        return new Float32Array(out.buffer, out.byteOffset, out.byteLength / 4);
      }
      async readbackGbuffer() {
        return this.readFloatTexture(this.gbuffer, 4);
      }
      async readbackAo() {
        return this.readFloatTexture(this.aoMap, 1);
      }
      /**
       * The march's target, at the resolution this quality tier asked for.
       *
       * Not built in resize(), because its size depends on the tier and the
       * tier arrives with the draw list. Rebuilt only when that size
       * actually changes — and when it does, the two bind groups that name
       * it are dropped with it, which is the whole reason they are fields
       * rather than locals.
       */
      ensureMarchTarget(scale, width, height) {
        if (this.volTexture && this.volScale === scale) return true;
        this.volTexture?.destroy();
        this.volTexture = this.device.createTexture({
          size: { width, height },
          format: "rgba32float",
          usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC
        });
        this.volScale = scale;
        this.volBind = void 0;
        this.compositeBind = void 0;
        return true;
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
        this.hdr?.destroy();
        this.postUniform?.destroy();
        this.hdr?.destroy();
        this.postBind = void 0;
        this.device.destroy();
      }
    };
  }
});

// packages/spatial-web/src/index.ts
init_src();

// packages/spatial-web/src/voiceToWorld.ts
init_src();

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
    energy: clamp012(energy),
    depth: placement.depth ?? DEFAULT_DEPTH,
    createdAt: now,
    updatedAt: now
  };
}
var clamp012 = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
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

// packages/spatial-web/src/voiceToWorld.ts
var TONE_OF = Object.freeze({
  /* A failure is an invitation to try another way, not an apology. */
  error: "holding",
  recovering: "tender",
  discovering: "warm",
  success: "warm"
});
var ENTITIES = Object.freeze({
  nearbyNow: (got, now) => {
    const r = got;
    return [
      ...(r?.events ?? []).map((e) => mapNearbyEventToSpatial(e)),
      ...(r?.places ?? []).map((p) => mapNearbyPlaceToSpatial(p, now))
    ];
  },
  nearbyPlaces: (got, now) => (got?.places ?? []).map((p) => mapNearbyPlaceToSpatial(p, now)),
  events: (got) => (got?.events ?? []).map((e) => mapEventToSpatial(e)),
  searchUsers: (got) => (got?.users ?? []).map((u) => mapUserToSpatial(u)),
  feed: (got) => (got?.posts ?? []).map((p) => mapFeedItemToSpatial(p))
});
var callFor = (capability, client, situation) => {
  const method = client[capability];
  if (typeof method !== "function") return void 0;
  const call = method.bind(client);
  const here = situation.location;
  switch (capability) {
    case "nearbyNow":
      return here ? () => call(here.lat, here.lng, 5, false, true) : void 0;
    case "nearbyPlaces":
      return here ? () => call(here.lat, here.lng, 5) : void 0;
    case "events":
      return () => call({});
    case "searchUsers":
      return () => call("");
    case "feed":
      return () => call(20, 0);
    default:
      return () => call();
  }
};
function berxVoiceToWorld(options) {
  let state = berxLivingWorld();
  const turns = [];
  const now = options.now ?? (() => Date.now());
  const situationNow = () => {
    const world = options.host.world;
    const frame = world?.latestFrame;
    const position = world?.worldPosition;
    return berxSituation({
      nowMs: now(),
      cursor: world?.cursor ?? berxTemporalCursor(Math.floor(now() / 1e3)),
      region: position?.region ?? "world",
      focusId: frame?.world.activeObjectId,
      viewerId: world?.viewer,
      objects: frame?.world.objects ?? [],
      eye: frame?.camera.position ?? { x: 0, y: 0, z: 0 },
      location: options.location?.(),
      allowed: options.permissions?.() ?? {
        microphone: true,
        location: options.location?.() !== void 0,
        notifications: false,
        presence: false
      }
    });
  };
  const composed = /* @__PURE__ */ new Map();
  const bridge = {
    async execute(plan, situation) {
      const results = [];
      let entities = [];
      composed.clear();
      for (const step of plan.steps) {
        if (!step.capability) {
          results.push({ step, state: "done" });
          continue;
        }
        const call = callFor(step.capability, options.client, situation);
        if (!call) {
          results.push({
            step,
            state: "failed",
            reason: situation.location === void 0 && (step.capability === "nearbyNow" || step.capability === "nearbyPlaces") ? "\u044F \u043D\u0435 \u0437\u043D\u0430\u044E, \u0433\u0434\u0435 \u0442\u044B" : `${step.capability} \u043D\u0435\u0442 \u043D\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0435`
          });
          break;
        }
        try {
          const got = await call();
          results.push({ step, state: "done", got });
          const mapped = ENTITIES[step.capability]?.(got, now()) ?? [];
          for (const m of mapped) composed.set(m.object.id, m);
          entities = mapped.map((m) => ({ id: m.object.id, label: m.object.label }));
        } catch (error) {
          results.push({ step, state: "failed", reason: error instanceof Error ? error.message : "\u0441\u0435\u0440\u0432\u0435\u0440 \u043D\u0435 \u043E\u0442\u0432\u0435\u0442\u0438\u043B" });
          break;
        }
      }
      return { results, entities };
    },
    travel(objectId) {
      return options.host.world?.travelTo(objectId) ?? false;
    },
    back() {
      return options.host.back();
    }
  };
  let generation = 0;
  let running = false;
  const silence = () => {
    options.stopSpeaking?.();
    options.voice?.stop();
  };
  const speakIt = async (turn, mine) => {
    const backend = options.voice;
    if (!backend?.available || turn.say.text === "") return;
    if (mine !== generation) return;
    options.host.coreCause({ kind: "speech", speaking: true });
    try {
      await backend.speak(turn.say.text, berxVoiceProsody(TONE_OF[turn.core.state] ?? "calm"));
    } finally {
      if (mine === generation) options.host.coreCause({ kind: "speech", speaking: false });
    }
  };
  const run = async (utterance) => {
    const mine = ++generation;
    running = true;
    try {
      state = { ...state, core: options.host.core };
      const turn = await berxSpeakToWorld(state, utterance, situationNow(), bridge, (intent) => {
        state = { ...state, memory: berxRequested(state.memory, intent.kind) };
      }, (cause) => {
        if (mine === generation) options.host.coreCause(cause);
      });
      if (mine !== generation) return turn;
      state = { core: turn.core, memory: turn.memory };
      turns.push(turn);
      applyToWorld(turn);
      options.onTurn?.(turn);
      await speakIt(turn, mine);
      return turn;
    } finally {
      if (mine === generation) running = false;
    }
  };
  const interrupt = async (utterance) => {
    silence();
    return run(utterance);
  };
  return {
    get busy() {
      return running;
    },
    interrupt,
    async say(utterance) {
      return run(utterance);
    },
    async hear(timeoutMs = 8e3) {
      const backend = options.voice;
      if (!backend) return void 0;
      options.host.coreCause({ kind: "voice", speaking: true });
      let heard;
      try {
        heard = await backend.listen(timeoutMs);
      } catch {
        heard = void 0;
      }
      if (!heard || heard.transcript.trim() === "") {
        options.host.coreCause({ kind: "voice", speaking: false });
        return void 0;
      }
      return running ? interrupt(heard.transcript) : run(heard.transcript);
    },
    get state() {
      return state;
    },
    get turns() {
      return turns;
    }
  };
  function applyToWorld(turn) {
    const world = options.host.world;
    if (turn.change !== "composed" || !world) return;
    const viewer = world.viewer;
    for (const shown of turn.shown) {
      const mapping = composed.get(shown.id);
      if (!mapping) continue;
      const asked = viewer && viewer !== shown.id ? [{
        id: `${viewer}->${shown.id}:asked`,
        from: viewer,
        to: shown.id,
        /* 'related' is the honest type: the viewer asked a
           question and this was in the answer. Nothing about
           it is contained, located-at or created-by, and
           claiming one of those would be inventing a fact
           about the world from the fact that it was found. */
        type: "related",
        strength: 0.5
      }] : [];
      world.ingest([{
        object: mapping.object,
        relations: [...mapping.relations, ...asked],
        media: mapping.media
      }]);
    }
    const canvas = options.host.canvas;
    world.frameWorld(canvas.width, canvas.height);
  }
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
  const rgb4 = /^rgba?\(([^,]+),([^,]+),([^,)]+)(?:,([^)]+))?\)$/.exec(color.replace(/\s/g, ""));
  if (rgb4) return `rgba(${rgb4[1]}, ${rgb4[2]}, ${rgb4[3]}, ${alpha})`;
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

// packages/spatial-web/src/runtimeHost5d.ts
init_src();
init_threeRuntime();

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

// packages/spatial-web/src/hapticsWeb.ts
init_src();
var BerxWebHaptics = class {
  constructor(source) {
    const navigatorLike = globalThis.navigator;
    const candidate = source ?? navigatorLike;
    this.source = typeof candidate?.vibrate === "function" ? candidate : void 0;
  }
  /** False where the browser has no vibration API at all. */
  get supported() {
    return this.source !== void 0;
  }
  play(pattern, intensity = 1) {
    if (!this.source) return false;
    const waveform = berxHapticWaveform(pattern, intensity);
    if (waveform.length === 0) return false;
    try {
      return this.source.vibrate(waveform.length === 1 ? waveform[0] : waveform) !== false;
    } catch {
      return false;
    }
  }
  /** Stops whatever is playing — what a page hiding should do. */
  stop() {
    try {
      this.source?.vibrate(0);
    } catch {
    }
  }
};

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
  let particles = options.particles !== false;
  let volumetric = options.volumetric !== false;
  const haptics = new BerxHaptics(options.haptics === false ? void 0 : options.haptics ?? new BerxWebHaptics());
  haptics.setReducedMotion(reducedMotion);
  const pixelRatioCap = Math.max(1, options.pixelRatioCap ?? 2);
  let quality = { quality: "balanced", pixelRatio: 1, maxObjects: 80, ambientMotion: true };
  const renderTier = berxResolveRenderTier({
    deviceMemoryGb: navigator.deviceMemory,
    logicalCores: navigator.hardwareConcurrency,
    pixelRatio: typeof window !== "undefined" ? window.devicePixelRatio : 1,
    saveData: navigator.connection?.saveData,
    prefersReducedMotion: reducedMotion
  });
  const renderQuality = berxRenderQuality(renderTier.tier);
  let core = berxCoreAt("idle");
  const coreCause = (cause) => {
    core = berxCoreEnter(core, berxCoreCause(core.state, cause, core.unresolved));
  };
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
    if (object) {
      coreCause({ kind: "arrived", region: world?.worldPosition.region ?? "world" });
      announce(`${nameOf(object)} \u0432 \u0444\u043E\u043A\u0443\u0441\u0435`);
      haptics.moment("focus");
    }
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
      core = berxCoreStep(core, dt);
      renderer.render(world ? world.frame(dt) : runtime.frame(dt), {
        maxObjects: quality.maxObjects,
        ambientMotion: quality.ambientMotion,
        particles,
        volumetric,
        quality: renderQuality,
        core: core.field
      });
    } else {
      if (world) world.frame(dt);
      else runtime.frame(dt);
    }
    raf = requestAnimationFrame(frame);
  };
  const onPointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    coreCause({ kind: "presence", near: true });
    dragging = true;
    lastX = downX = e.clientX;
    lastY = downY = e.clientY;
    try {
      canvas.setPointerCapture?.(e.pointerId);
    } catch {
    }
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
    try {
      canvas.releasePointerCapture?.(e.pointerId);
    } catch {
    }
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
      haptics.moment("select");
      void world.act(slot.affordance.id).then((done) => {
        announce(done ? `${slot.affordance.label}: \u0433\u043E\u0442\u043E\u0432\u043E` : `${slot.affordance.label}: \u043D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C`);
        haptics.moment(done ? "action-ok" : "action-refused");
      }).catch((error) => {
        haptics.moment("action-refused");
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
          haptics.moment("travel");
        } else handled = false;
        break;
      }
      case "Escape":
      case "Backspace":
        handled = world ? world.back() : runtime.back();
        if (handled) {
          announce("\u041D\u0430\u0437\u0430\u0434");
          haptics.moment("back");
        }
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
    coreCause({ kind: "outcome", outcome: { ok: false, awaiting: false, results: [] } });
    renderer.handleContextLost();
    options.onContextChange?.("lost");
    announce("\u0413\u0440\u0430\u0444\u0438\u043A\u0430 \u043F\u0440\u0435\u0440\u0432\u0430\u043B\u0430\u0441\u044C. BERX \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442 \u0441\u0446\u0435\u043D\u0443.");
  };
  const onDeviceLost = async (reason) => {
    contextAlive = false;
    coreCause({ kind: "outcome", outcome: { ok: false, awaiting: false, results: [] } });
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
    /**
     * What this session is actually driving, exposed so a gate can
     * check that it IS driving it.
     *
     * Both of these were built and verified before anything called
     * them, and no gate could see the gap because every gate drove the
     * modules directly. These two getters are what verify:5d-wiring
     * reads: the tier a real session resolved, and the Core a real
     * frame loop stepped.
     */
    get renderTier() {
      return { ...renderTier, quality: renderQuality };
    },
    get core() {
      return {
        state: core.state,
        previous: core.previous,
        unresolved: core.unresolved,
        field: { ...core.field, offset: { ...core.field.offset } }
      };
    },
    coreCause,
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
    setParticles: (on) => {
      particles = on;
    },
    setVolumetric: (on) => {
      volumetric = on;
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

// packages/spatial-web/src/runtimeEntry.ts
init_threeRuntime();
init_primitiveGeometry();
init_mediaTextures();
init_spatialText();

// packages/spatial-web/src/spatialAudioWeb.ts
init_src();
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
init_src();

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
  berxRasteriseLabel,
  berxVoiceToWorld,
  createBerx5DWebHost,
  createBerxCard,
  createBerxControl,
  createBerxEnergy,
  createBerxLayer,
  createBerxSceneRoot,
  createBevelBox,
  createBox,
  createFrame,
  createRing,
  createSphere,
  createTorus,
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
