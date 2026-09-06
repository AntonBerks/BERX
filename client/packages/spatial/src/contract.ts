/**
 * The v9 screen/scene contract, as a type.
 *
 * Mirrors 01_SCREENS_V9/contracts/BERX-***.scene.json exactly
 * (schemaVersion 9.0). The 300 real contracts live in
 * @berx/scenes; this file is only their shape, kept next to the
 * runtime that consumes it so a contract change breaks the build
 * rather than silently rendering the wrong scene.
 */
import type {
	BerxColorWorldName,
	BerxDepthKey,
	BerxLightRecipeName,
	BerxMaterialName,
	BerxMotionPresetName,
} from './tokens';
import type {BerxPlatform} from './performance';

export const BERX_FAMILIES = [
	'AUTH',
	'HOME',
	'EXPLORE',
	'NOW',
	'PROFILE',
	'SOCIAL',
	'MESSAGES',
	'PLACES',
	'EVENTS',
	'EXPERIENCE',
	'COMMUNITY',
	'CREATOR',
	'BUSINESS',
] as const;

export type BerxFamily = (typeof BERX_FAMILIES)[number];

/**
 * The states a whole surface can be in.
 *
 * Seven of these were here from the first v9 pass. Two were missing,
 * and their absence made BERX say something untrue:
 *
 *   `private` — the thing exists and this viewer may not see it. It
 *   was landing on `disabled`, which says "this control is switched
 *   off" about a resource that is working perfectly and simply is not
 *   theirs. Private is not missing, and a screen that conflates them
 *   either invites a pointless retry or implies the object is gone.
 *
 *   `unsupported` — BERX cannot do this at all, because the capability
 *   does not exist behind it. It was landing on `error`, or on a line
 *   of prose each screen wrote for itself. Not-supported is not
 *   failed: there is nothing to retry and nothing went wrong, and
 *   saying so honestly is what keeps a missing capability from being
 *   quietly faked.
 */
export const BERX_SCREEN_STATES = [
	'default',
	'loading',
	'empty',
	'error',
	'success',
	'disabled',
	'offline',
	'private',
	'unsupported',
] as const;

export type BerxScreenState = (typeof BERX_SCREEN_STATES)[number];

export type BerxMood =
	| 'calm'
	| 'alive'
	| 'curious'
	| 'urgent'
	| 'identity'
	| 'connected'
	| 'intimate'
	| 'sensory'
	| 'anticipatory'
	| 'aspirational'
	| 'belonging'
	| 'expressive'
	| 'precise';

export interface BerxDepthProfile {
	environment: BerxDepthKey;
	atmosphere: BerxDepthKey;
	structure: BerxDepthKey;
	content: BerxDepthKey;
	controls: BerxDepthKey;
	focus: BerxDepthKey;
}

export interface BerxSceneContract {
	schemaVersion: '9.0';
	screenId: string;
	title: string;
	family: BerxFamily;
	purpose: string;
	experience: {mood: BerxMood; primaryGoal: string; cognitiveLoad: string};
	route: {name: string; path: string; params: string[]};
	scene: {
		camera: {perspectivePx: number; fovDeg: number; tiltDeg: number};
		depthProfile: BerxDepthProfile;
		layerOrder: BerxDepthKey[];
		focalPoint: string;
		material: BerxMaterialName;
		lightRecipe: BerxLightRecipeName;
		background: string;
		colorWorld?: BerxColorWorldName;
	};
	layout: {
		mobile: string;
		tablet: string;
		desktop: string;
		safeArea: boolean;
		maxContentWidth: number;
		gutter: number;
		sectionGap: number;
	};
	components: string[];
	states: BerxScreenState[];
	interaction: {
		primaryAction: string;
		gestures: string[];
		spatial: string[];
		dragAlternative: string;
	};
	motion: {
		enter: BerxMotionPresetName;
		exit: BerxMotionPresetName;
		focus: BerxMotionPresetName;
		ambient: BerxMotionPresetName;
		reducedMotion: BerxMotionPresetName;
	};
	data: {
		source: string;
		serverAuthoritative: boolean;
		fakeDataAllowed: false;
		cache: string;
		/**
		 * BERX addition to the archive schema: which real domain(s)
		 * this scene reads. Empty means the scene is a shell whose
		 * data source has not been established — it renders an honest
		 * boundary, never invented content.
		 */
		domains: string[];
	};
	analytics: {view: string; primaryAction: string; error: string};
	accessibility: {
		wcag: string;
		touchTarget: string;
		focusVisible: boolean;
		reducedMotion: boolean;
		contrastFallback: string;
	};
	performance: {
		fpsTarget: number;
		blurLayersMobile: string;
		virtualizeLists: boolean;
		lazyMedia: boolean;
		avoidContinuousLayoutReads: boolean;
	};
	assetRefs: string[];
	qa: string[];
	platforms?: BerxPlatform[];
}
