/* BERX 5D ULTIMATE v9 — the scene contracts the site uses.
 * GENERATED from client/packages/scenes by
 * client/scripts/build-spatial-web.mjs. Do not edit by hand.
 */
export const BERX_SITE_CONTRACTS = {
 "BERX-001": {
  "schemaVersion": "9.0",
  "screenId": "BERX-001",
  "title": "Welcome / Cinematic Reveal",
  "family": "AUTH",
  "purpose": "Production scene contract for Welcome / Cinematic Reveal.",
  "experience": {
   "mood": "calm",
   "primaryGoal": "one dominant user goal",
   "cognitiveLoad": "low-to-medium"
  },
  "route": {
   "name": "welcome-cinematic-reveal",
   "path": "/welcome-cinematic-reveal",
   "params": [
    "id?"
   ]
  },
  "scene": {
   "camera": {
    "perspectivePx": 1200,
    "fovDeg": 42,
    "tiltDeg": 0
   },
   "depthProfile": {
    "environment": "D0",
    "atmosphere": "D1",
    "structure": "D2",
    "content": "D3",
    "controls": "D4",
    "focus": "D5"
   },
   "layerOrder": [
    "D0",
    "D1",
    "D2",
    "D3",
    "D4",
    "D5"
   ],
   "focalPoint": "primary-content",
   "material": "DeepGlass",
   "lightRecipe": "hero",
   "background": "cinematic-environment"
  },
  "layout": {
   "mobile": "single-column",
   "tablet": "two-zone",
   "desktop": "12-column spatial grid",
   "safeArea": true,
   "maxContentWidth": 1280,
   "gutter": 16,
   "sectionGap": 24
  },
  "components": [
   "BerxScrimHero",
   "BerxGlassSurface",
   "BerxInput",
   "BerxPrimaryButton",
   "BerxProgressRing"
  ],
  "states": [
   "default",
   "loading",
   "empty",
   "error",
   "success",
   "disabled",
   "offline"
  ],
  "interaction": {
   "primaryAction": "explicit",
   "gestures": [
    "tap",
    "swipe",
    "scroll"
   ],
   "spatial": [
    "micro-parallax",
    "shared-element-transition"
   ],
   "dragAlternative": "required where dragging exists"
  },
  "motion": {
   "enter": "spatialEnter",
   "exit": "exit",
   "focus": "focus",
   "ambient": "ambient",
   "reducedMotion": "crossFade"
  },
  "data": {
   "source": "BERX domain/API adapter",
   "serverAuthoritative": true,
   "fakeDataAllowed": false,
   "cache": "stale-while-revalidate where appropriate",
   "domains": []
  },
  "analytics": {
   "view": "BERX-001.view",
   "primaryAction": "BERX-001.primary_action",
   "error": "BERX-001.error"
  },
  "accessibility": {
   "wcag": "2.2 AA target",
   "touchTarget": "preferred 44dp; web minimum per applicable WCAG",
   "focusVisible": true,
   "reducedMotion": true,
   "contrastFallback": "opaque surface mode"
  },
  "performance": {
   "fpsTarget": 60,
   "blurLayersMobile": "<=3",
   "virtualizeLists": true,
   "lazyMedia": true,
   "avoidContinuousLayoutReads": true
  },
  "assetRefs": [
   "ASSET-0001-hero",
   "ASSET-0001-media"
  ],
  "qa": [
   "visual hierarchy",
   "spatial continuity",
   "state completeness",
   "a11y",
   "performance",
   "offline"
  ]
 },
 "BERX-176": {
  "schemaVersion": "9.0",
  "screenId": "BERX-176",
  "title": "Messages",
  "family": "MESSAGES",
  "purpose": "Production scene contract for Messages.",
  "experience": {
   "mood": "intimate",
   "primaryGoal": "one dominant user goal",
   "cognitiveLoad": "low-to-medium"
  },
  "route": {
   "name": "messages",
   "path": "/messages",
   "params": [
    "id?"
   ]
  },
  "scene": {
   "camera": {
    "perspectivePx": 1200,
    "fovDeg": 42,
    "tiltDeg": 0
   },
   "depthProfile": {
    "environment": "D0",
    "atmosphere": "D1",
    "structure": "D2",
    "content": "D2",
    "controls": "D4",
    "focus": "D5"
   },
   "layerOrder": [
    "D0",
    "D1",
    "D2",
    "D3",
    "D4",
    "D5"
   ],
   "focalPoint": "primary-content",
   "material": "DeepGlass",
   "lightRecipe": "card",
   "background": "cinematic-environment"
  },
  "layout": {
   "mobile": "single-column",
   "tablet": "two-zone",
   "desktop": "12-column spatial grid",
   "safeArea": true,
   "maxContentWidth": 1280,
   "gutter": 16,
   "sectionGap": 24
  },
  "components": [
   "BerxChatRow",
   "BerxMessageBubble",
   "BerxComposer",
   "BerxTypingIndicator",
   "BerxCallSurface"
  ],
  "states": [
   "default",
   "loading",
   "empty",
   "error",
   "success",
   "disabled",
   "offline"
  ],
  "interaction": {
   "primaryAction": "explicit",
   "gestures": [
    "tap",
    "swipe",
    "scroll"
   ],
   "spatial": [
    "micro-parallax",
    "shared-element-transition"
   ],
   "dragAlternative": "required where dragging exists"
  },
  "motion": {
   "enter": "spatialEnter",
   "exit": "exit",
   "focus": "focus",
   "ambient": "ambient",
   "reducedMotion": "crossFade"
  },
  "data": {
   "source": "BERX domain/API adapter",
   "serverAuthoritative": true,
   "fakeDataAllowed": false,
   "cache": "stale-while-revalidate where appropriate",
   "domains": [
    "Conversation",
    "Message"
   ]
  },
  "analytics": {
   "view": "BERX-176.view",
   "primaryAction": "BERX-176.primary_action",
   "error": "BERX-176.error"
  },
  "accessibility": {
   "wcag": "2.2 AA target",
   "touchTarget": "preferred 44dp; web minimum per applicable WCAG",
   "focusVisible": true,
   "reducedMotion": true,
   "contrastFallback": "opaque surface mode"
  },
  "performance": {
   "fpsTarget": 60,
   "blurLayersMobile": "<=3",
   "virtualizeLists": true,
   "lazyMedia": true,
   "avoidContinuousLayoutReads": true
  },
  "assetRefs": [
   "ASSET-0176-hero",
   "ASSET-0176-media"
  ],
  "qa": [
   "visual hierarchy",
   "spatial continuity",
   "state completeness",
   "a11y",
   "performance",
   "offline"
  ]
 },
 "BERX-201": {
  "schemaVersion": "9.0",
  "screenId": "BERX-201",
  "title": "Places Discovery",
  "family": "PLACES",
  "purpose": "Production scene contract for Places Discovery.",
  "experience": {
   "mood": "sensory",
   "primaryGoal": "one dominant user goal",
   "cognitiveLoad": "low-to-medium"
  },
  "route": {
   "name": "places-discovery",
   "path": "/places-discovery",
   "params": [
    "id?"
   ]
  },
  "scene": {
   "camera": {
    "perspectivePx": 1200,
    "fovDeg": 42,
    "tiltDeg": 0
   },
   "depthProfile": {
    "environment": "D0",
    "atmosphere": "D1",
    "structure": "D2",
    "content": "D3",
    "controls": "D4",
    "focus": "D5"
   },
   "layerOrder": [
    "D0",
    "D1",
    "D2",
    "D3",
    "D4",
    "D5"
   ],
   "focalPoint": "primary-content",
   "material": "ClearGlass",
   "lightRecipe": "hero",
   "background": "cinematic-environment"
  },
  "layout": {
   "mobile": "single-column",
   "tablet": "two-zone",
   "desktop": "12-column spatial grid",
   "safeArea": true,
   "maxContentWidth": 1280,
   "gutter": 16,
   "sectionGap": 24
  },
  "components": [
   "BerxPlaceHero",
   "BerxMap",
   "BerxPlaceHours",
   "BerxPlaceRating",
   "BerxPlaceCard"
  ],
  "states": [
   "default",
   "loading",
   "empty",
   "error",
   "success",
   "disabled",
   "offline"
  ],
  "interaction": {
   "primaryAction": "explicit",
   "gestures": [
    "tap",
    "swipe",
    "scroll"
   ],
   "spatial": [
    "micro-parallax",
    "shared-element-transition"
   ],
   "dragAlternative": "required where dragging exists"
  },
  "motion": {
   "enter": "spatialEnter",
   "exit": "exit",
   "focus": "focus",
   "ambient": "ambient",
   "reducedMotion": "crossFade"
  },
  "data": {
   "source": "BERX domain/API adapter",
   "serverAuthoritative": true,
   "fakeDataAllowed": false,
   "cache": "stale-while-revalidate where appropriate",
   "domains": [
    "Place"
   ]
  },
  "analytics": {
   "view": "BERX-201.view",
   "primaryAction": "BERX-201.primary_action",
   "error": "BERX-201.error"
  },
  "accessibility": {
   "wcag": "2.2 AA target",
   "touchTarget": "preferred 44dp; web minimum per applicable WCAG",
   "focusVisible": true,
   "reducedMotion": true,
   "contrastFallback": "opaque surface mode"
  },
  "performance": {
   "fpsTarget": 60,
   "blurLayersMobile": "<=3",
   "virtualizeLists": true,
   "lazyMedia": true,
   "avoidContinuousLayoutReads": true
  },
  "assetRefs": [
   "ASSET-0201-hero",
   "ASSET-0201-media"
  ],
  "qa": [
   "visual hierarchy",
   "spatial continuity",
   "state completeness",
   "a11y",
   "performance",
   "offline"
  ]
 },
 "BERX-226": {
  "schemaVersion": "9.0",
  "screenId": "BERX-226",
  "title": "Events Discovery",
  "family": "EVENTS",
  "purpose": "Production scene contract for Events Discovery.",
  "experience": {
   "mood": "anticipatory",
   "primaryGoal": "one dominant user goal",
   "cognitiveLoad": "low-to-medium"
  },
  "route": {
   "name": "events-discovery",
   "path": "/events-discovery",
   "params": [
    "id?"
   ]
  },
  "scene": {
   "camera": {
    "perspectivePx": 1200,
    "fovDeg": 42,
    "tiltDeg": 0
   },
   "depthProfile": {
    "environment": "D0",
    "atmosphere": "D1",
    "structure": "D2",
    "content": "D3",
    "controls": "D4",
    "focus": "D5"
   },
   "layerOrder": [
    "D0",
    "D1",
    "D2",
    "D3",
    "D4",
    "D5"
   ],
   "focalPoint": "primary-content",
   "material": "Crystal",
   "lightRecipe": "hero",
   "background": "cinematic-environment"
  },
  "layout": {
   "mobile": "single-column",
   "tablet": "two-zone",
   "desktop": "12-column spatial grid",
   "safeArea": true,
   "maxContentWidth": 1280,
   "gutter": 16,
   "sectionGap": 24
  },
  "components": [
   "BerxEventHero",
   "BerxTicket",
   "BerxCountdown",
   "BerxShareSheet",
   "BerxMapPin"
  ],
  "states": [
   "default",
   "loading",
   "empty",
   "error",
   "success",
   "disabled",
   "offline"
  ],
  "interaction": {
   "primaryAction": "explicit",
   "gestures": [
    "tap",
    "swipe",
    "scroll"
   ],
   "spatial": [
    "micro-parallax",
    "shared-element-transition"
   ],
   "dragAlternative": "required where dragging exists"
  },
  "motion": {
   "enter": "spatialEnter",
   "exit": "exit",
   "focus": "focus",
   "ambient": "ambient",
   "reducedMotion": "crossFade"
  },
  "data": {
   "source": "BERX domain/API adapter",
   "serverAuthoritative": true,
   "fakeDataAllowed": false,
   "cache": "stale-while-revalidate where appropriate",
   "domains": [
    "Event"
   ]
  },
  "analytics": {
   "view": "BERX-226.view",
   "primaryAction": "BERX-226.primary_action",
   "error": "BERX-226.error"
  },
  "accessibility": {
   "wcag": "2.2 AA target",
   "touchTarget": "preferred 44dp; web minimum per applicable WCAG",
   "focusVisible": true,
   "reducedMotion": true,
   "contrastFallback": "opaque surface mode"
  },
  "performance": {
   "fpsTarget": 60,
   "blurLayersMobile": "<=3",
   "virtualizeLists": true,
   "lazyMedia": true,
   "avoidContinuousLayoutReads": true
  },
  "assetRefs": [
   "ASSET-0226-hero",
   "ASSET-0226-media"
  ],
  "qa": [
   "visual hierarchy",
   "spatial continuity",
   "state completeness",
   "a11y",
   "performance",
   "offline"
  ]
 },
 "BERX-266": {
  "schemaVersion": "9.0",
  "screenId": "BERX-266",
  "title": "Communities",
  "family": "COMMUNITY",
  "purpose": "Production scene contract for Communities.",
  "experience": {
   "mood": "belonging",
   "primaryGoal": "one dominant user goal",
   "cognitiveLoad": "low-to-medium"
  },
  "route": {
   "name": "communities",
   "path": "/communities",
   "params": [
    "id?"
   ]
  },
  "scene": {
   "camera": {
    "perspectivePx": 1200,
    "fovDeg": 42,
    "tiltDeg": 0
   },
   "depthProfile": {
    "environment": "D0",
    "atmosphere": "D1",
    "structure": "D2",
    "content": "D3",
    "controls": "D4",
    "focus": "D5"
   },
   "layerOrder": [
    "D0",
    "D1",
    "D2",
    "D3",
    "D4",
    "D5"
   ],
   "focalPoint": "primary-content",
   "material": "FrostGlass",
   "lightRecipe": "card",
   "background": "cinematic-environment"
  },
  "layout": {
   "mobile": "single-column",
   "tablet": "two-zone",
   "desktop": "12-column spatial grid",
   "safeArea": true,
   "maxContentWidth": 1280,
   "gutter": 16,
   "sectionGap": 24
  },
  "components": [
   "BerxCommunityCard",
   "BerxAvatarCluster",
   "BerxMediaCard",
   "BerxTabs",
   "BerxComposer"
  ],
  "states": [
   "default",
   "loading",
   "empty",
   "error",
   "success",
   "disabled",
   "offline"
  ],
  "interaction": {
   "primaryAction": "explicit",
   "gestures": [
    "tap",
    "swipe",
    "scroll"
   ],
   "spatial": [
    "micro-parallax",
    "shared-element-transition"
   ],
   "dragAlternative": "required where dragging exists"
  },
  "motion": {
   "enter": "spatialEnter",
   "exit": "exit",
   "focus": "focus",
   "ambient": "ambient",
   "reducedMotion": "crossFade"
  },
  "data": {
   "source": "BERX domain/API adapter",
   "serverAuthoritative": true,
   "fakeDataAllowed": false,
   "cache": "stale-while-revalidate where appropriate",
   "domains": [
    "Community"
   ]
  },
  "analytics": {
   "view": "BERX-266.view",
   "primaryAction": "BERX-266.primary_action",
   "error": "BERX-266.error"
  },
  "accessibility": {
   "wcag": "2.2 AA target",
   "touchTarget": "preferred 44dp; web minimum per applicable WCAG",
   "focusVisible": true,
   "reducedMotion": true,
   "contrastFallback": "opaque surface mode"
  },
  "performance": {
   "fpsTarget": 60,
   "blurLayersMobile": "<=3",
   "virtualizeLists": true,
   "lazyMedia": true,
   "avoidContinuousLayoutReads": true
  },
  "assetRefs": [
   "ASSET-0266-hero",
   "ASSET-0266-media"
  ],
  "qa": [
   "visual hierarchy",
   "spatial continuity",
   "state completeness",
   "a11y",
   "performance",
   "offline"
  ]
 },
 "BERX-031": {
  "schemaVersion": "9.0",
  "screenId": "BERX-031",
  "title": "Home Feed",
  "family": "HOME",
  "purpose": "Production scene contract for Home Feed.",
  "experience": {
   "mood": "alive",
   "primaryGoal": "one dominant user goal",
   "cognitiveLoad": "low-to-medium"
  },
  "route": {
   "name": "home-feed",
   "path": "/home-feed",
   "params": [
    "id?"
   ]
  },
  "scene": {
   "camera": {
    "perspectivePx": 1200,
    "fovDeg": 42,
    "tiltDeg": 0
   },
   "depthProfile": {
    "environment": "D0",
    "atmosphere": "D1",
    "structure": "D2",
    "content": "D3",
    "controls": "D4",
    "focus": "D5"
   },
   "layerOrder": [
    "D0",
    "D1",
    "D2",
    "D3",
    "D4",
    "D5"
   ],
   "focalPoint": "primary-content",
   "material": "ClearGlass",
   "lightRecipe": "card",
   "background": "cinematic-environment"
  },
  "layout": {
   "mobile": "single-column",
   "tablet": "two-zone",
   "desktop": "12-column spatial grid",
   "safeArea": true,
   "maxContentWidth": 1280,
   "gutter": 16,
   "sectionGap": 24
  },
  "components": [
   "BerxStoryTray",
   "BerxMediaCard",
   "BerxReactionPicker",
   "BerxBottomNav",
   "BerxNowPulse"
  ],
  "states": [
   "default",
   "loading",
   "empty",
   "error",
   "success",
   "disabled",
   "offline"
  ],
  "interaction": {
   "primaryAction": "explicit",
   "gestures": [
    "tap",
    "swipe",
    "scroll"
   ],
   "spatial": [
    "micro-parallax",
    "shared-element-transition"
   ],
   "dragAlternative": "required where dragging exists"
  },
  "motion": {
   "enter": "spatialEnter",
   "exit": "exit",
   "focus": "focus",
   "ambient": "ambient",
   "reducedMotion": "crossFade"
  },
  "data": {
   "source": "BERX domain/API adapter",
   "serverAuthoritative": true,
   "fakeDataAllowed": false,
   "cache": "stale-while-revalidate where appropriate",
   "domains": [
    "Moment",
    "Media",
    "User"
   ]
  },
  "analytics": {
   "view": "BERX-031.view",
   "primaryAction": "BERX-031.primary_action",
   "error": "BERX-031.error"
  },
  "accessibility": {
   "wcag": "2.2 AA target",
   "touchTarget": "preferred 44dp; web minimum per applicable WCAG",
   "focusVisible": true,
   "reducedMotion": true,
   "contrastFallback": "opaque surface mode"
  },
  "performance": {
   "fpsTarget": 60,
   "blurLayersMobile": "<=3",
   "virtualizeLists": true,
   "lazyMedia": true,
   "avoidContinuousLayoutReads": true
  },
  "assetRefs": [
   "ASSET-0031-hero",
   "ASSET-0031-media"
  ],
  "qa": [
   "visual hierarchy",
   "spatial continuity",
   "state completeness",
   "a11y",
   "performance",
   "offline"
  ]
 },
 "BERX-291": {
  "schemaVersion": "9.0",
  "screenId": "BERX-291",
  "title": "Business Dashboard",
  "family": "BUSINESS",
  "purpose": "Production scene contract for Business Dashboard.",
  "experience": {
   "mood": "precise",
   "primaryGoal": "one dominant user goal",
   "cognitiveLoad": "low-to-medium"
  },
  "route": {
   "name": "business-dashboard",
   "path": "/business-dashboard",
   "params": [
    "id?"
   ]
  },
  "scene": {
   "camera": {
    "perspectivePx": 1200,
    "fovDeg": 42,
    "tiltDeg": 0
   },
   "depthProfile": {
    "environment": "D0",
    "atmosphere": "D1",
    "structure": "D2",
    "content": "D3",
    "controls": "D4",
    "focus": "D5"
   },
   "layerOrder": [
    "D0",
    "D1",
    "D2",
    "D3",
    "D4",
    "D5"
   ],
   "focalPoint": "primary-content",
   "material": "DarkMetal",
   "lightRecipe": "card",
   "background": "cinematic-environment"
  },
  "layout": {
   "mobile": "single-column",
   "tablet": "two-zone",
   "desktop": "12-column spatial grid",
   "safeArea": true,
   "maxContentWidth": 1280,
   "gutter": 16,
   "sectionGap": 24
  },
  "components": [
   "BerxBusinessHero",
   "BerxBusinessMetric",
   "BerxGlassSurface",
   "BerxHorizontalRail",
   "BerxFilterBar"
  ],
  "states": [
   "default",
   "loading",
   "empty",
   "error",
   "success",
   "disabled",
   "offline"
  ],
  "interaction": {
   "primaryAction": "explicit",
   "gestures": [
    "tap",
    "swipe",
    "scroll"
   ],
   "spatial": [
    "micro-parallax",
    "shared-element-transition"
   ],
   "dragAlternative": "required where dragging exists"
  },
  "motion": {
   "enter": "spatialEnter",
   "exit": "exit",
   "focus": "focus",
   "ambient": "ambient",
   "reducedMotion": "crossFade"
  },
  "data": {
   "source": "BERX domain/API adapter",
   "serverAuthoritative": true,
   "fakeDataAllowed": false,
   "cache": "stale-while-revalidate where appropriate",
   "domains": [
    "Business",
    "Place"
   ]
  },
  "analytics": {
   "view": "BERX-291.view",
   "primaryAction": "BERX-291.primary_action",
   "error": "BERX-291.error"
  },
  "accessibility": {
   "wcag": "2.2 AA target",
   "touchTarget": "preferred 44dp; web minimum per applicable WCAG",
   "focusVisible": true,
   "reducedMotion": true,
   "contrastFallback": "opaque surface mode"
  },
  "performance": {
   "fpsTarget": 60,
   "blurLayersMobile": "<=3",
   "virtualizeLists": true,
   "lazyMedia": true,
   "avoidContinuousLayoutReads": true
  },
  "assetRefs": [
   "ASSET-0291-hero",
   "ASSET-0291-media"
  ],
  "qa": [
   "visual hierarchy",
   "spatial continuity",
   "state completeness",
   "a11y",
   "performance",
   "offline"
  ]
 }
};
