/**
 * BERX V9 SCENE FAMILIES — the composition layer.
 *
 * ARCHITECTURE (the owner's own sequence):
 *   5D Foundation -> SCENE FAMILIES -> shared spatial components
 *   -> individual screen contracts -> real domain/API -> 300 scenes.
 *
 * The foundation (./depth.ts) owns geometry: where D0-D5 sit, how they
 * project, how they parallax. This file owns COMPOSITION: what each
 * layer is FOR in a given kind of scene, which material carries it,
 * which light recipe, and which order the eye is meant to travel.
 *
 * EVERY VALUE HERE IS EXTRACTED FROM THE ARCHIVE, not authored:
 *   - `material`, `mood`, `lightRecipe`, `contentDepth` and `components`
 *     are read off the V9 scene contracts (all 300 agree per family, so
 *     these are the family's own declared values);
 *   - `d2`/`d3`/`d4` composition strings are the V2 DESIGN_SPEC.md
 *     "D2 — Primary / D3 — Glass / D4 — Foreground" lines, mapped from
 *     the V2 family taxonomy (11) onto the V9 one (13) — the two splits
 *     that V9 adds (AUTH and CREATOR) are noted where they inherit.
 *
 * A family is a STARTING POINT, never a ceiling: a screen inherits its
 * family's composition and then overrides from its own contract (its
 * material, its component set, its data binding, its content priority).
 * See ./scenes.ts for how the two combine per screen.
 */
import type {BerxV9Depth, BerxV9Material} from './tokens';

export type BerxV9Family =
	| 'AUTH' | 'HOME' | 'PROFILE' | 'EXPLORE' | 'NOW' | 'SOCIAL' | 'MESSAGES'
	| 'PLACES' | 'EVENTS' | 'EXPERIENCE' | 'COMMUNITY' | 'CREATOR' | 'BUSINESS';

export type BerxV9LightRecipe = 'hero' | 'card';

export interface BerxV9FamilyProfile {
	family: BerxV9Family;
	/** The family's own declared mood (V9 contracts). Drives energy, not colour. */
	mood: string;
	material: BerxV9Material;
	lightRecipe: BerxV9LightRecipe;
	/** Which layer carries this family's primary content (MESSAGES puts it at D2 — the conversation IS the environment). */
	contentDepth: BerxV9Depth;
	/** What each composition layer is for, in this family. From V2 DESIGN_SPEC. */
	composition: {d2: string; d3: string; d4: string};
	/** The family's own component set, from its V9 contracts. */
	components: string[];
	/**
	 * Does this family's D5 (energy/live feedback) carry ongoing state,
	 * or only momentary confirmation? The archive's rule is "D5 only when
	 * state changes" — families whose subject is genuinely live (NOW,
	 * MESSAGES, EVENTS) are the ones allowed a persistent D5.
	 */
	liveD5: boolean;
}

const P = (
	family: BerxV9Family, mood: string, material: BerxV9Material, lightRecipe: BerxV9LightRecipe,
	contentDepth: BerxV9Depth, d2: string, d3: string, d4: string, components: string[], liveD5: boolean
): BerxV9FamilyProfile => ({family, mood, material, lightRecipe, contentDepth, composition: {d2, d3, d4}, components, liveD5});

export const BERX_V9_FAMILIES: Record<BerxV9Family, BerxV9FamilyProfile> = {
	// AUTH is V9's own split; V2 routed these through `system`, whose
	// composition it inherits, with the hero light its contracts declare.
	AUTH: P('AUTH', 'calm', 'DeepGlass', 'hero', 'D3',
		'minimal spatial system surface', 'status / explanation', 'confirm / change / return',
		['BerxScrimHero', 'BerxGlassSurface', 'BerxInput', 'BerxPrimaryButton', 'BerxProgressRing'], false),
	HOME: P('HOME', 'alive', 'ClearGlass', 'card', 'D3',
		'context-rich media', 'social context + metadata', 'engage / save / share',
		['BerxStoryTray', 'BerxMediaCard', 'BerxReactionPicker', 'BerxNowPulse', 'BerxBottomNav'], false),
	PROFILE: P('PROFILE', 'identity', 'ClearGlass', 'hero', 'D3',
		'human portrait / social cover', 'connections and presence', 'connect / follow / message',
		['BerxProfileHero', 'BerxProfileTabs', 'BerxStatRail', 'BerxMomentGrid', 'BerxAvatar'], false),
	EXPLORE: P('EXPLORE', 'curious', 'ClearGlass', 'card', 'D3',
		'context-rich media', 'social context + metadata', 'navigate / filter / open',
		['BerxSearchField', 'BerxFilterBar', 'BerxHorizontalRail', 'BerxMediaCard', 'BerxSpatialCard'], false),
	NOW: P('NOW', 'urgent', 'LiquidGlass', 'card', 'D3',
		'live spatial map', 'nearby people / places / events', 'navigate / filter / open',
		['BerxNowScene', 'BerxNowRail', 'BerxNowPulse', 'BerxEnergyHalo', 'BerxMap', 'BerxMapPin', 'BerxPlaceCard'], true),
	SOCIAL: P('SOCIAL', 'connected', 'FrostGlass', 'card', 'D3',
		'human portrait / social cover', 'connections and presence', 'connect / follow / message',
		['BerxIdentity', 'BerxAvatarCluster', 'BerxGlassSurface', 'BerxPrimaryButton', 'BerxBottomNav'], false),
	MESSAGES: P('MESSAGES', 'intimate', 'DeepGlass', 'card', 'D2',
		'conversation identity', 'media / context / presence', 'send / share / call',
		['BerxChatRow', 'BerxMessageBubble', 'BerxComposer', 'BerxTypingIndicator', 'BerxCallSurface'], true),
	PLACES: P('PLACES', 'sensory', 'ClearGlass', 'hero', 'D3',
		'cinematic environmental photography', 'people + recent moments + practical context', 'go / reserve / save',
		['BerxPlaceHero', 'BerxPlaceCard', 'BerxPlaceHours', 'BerxPlaceRating', 'BerxMap'], false),
	EVENTS: P('EVENTS', 'anticipatory', 'Crystal', 'hero', 'D3',
		'event atmosphere / venue', 'attendees + schedule + location', 'join / ticket / calendar',
		['BerxEventHero', 'BerxTicket', 'BerxCountdown', 'BerxMapPin', 'BerxShareSheet'], true),
	EXPERIENCE: P('EXPERIENCE', 'aspirational', 'ClearGlass', 'card', 'D3',
		'action + place + people', 'booking + reviews + availability', 'book / join / save',
		['BerxExperienceCard', 'BerxTripCard', 'BerxCollectionCard', 'BerxProgressRing', 'BerxPrimaryButton'], false),
	COMMUNITY: P('COMMUNITY', 'belonging', 'FrostGlass', 'card', 'D3',
		'context-rich media', 'social context + metadata', 'engage / save / share',
		['BerxCommunityCard', 'BerxAvatarCluster', 'BerxComposer', 'BerxMediaCard', 'BerxTabs'], false),
	// CREATOR is V9's own split; V2 routed it through `business`.
	CREATOR: P('CREATOR', 'expressive', 'LiquidGlass', 'card', 'D3',
		'premium venue/product media', 'analytics / customers / offers', 'manage / promote / respond',
		['BerxCreatorCard', 'BerxWalletCard', 'BerxRewardCard', 'BerxBusinessMetric', 'BerxMediaGrid'], false),
	BUSINESS: P('BUSINESS', 'precise', 'DarkMetal', 'card', 'D3',
		'premium venue/product media', 'analytics / customers / offers', 'manage / promote / respond',
		['BerxBusinessHero', 'BerxBusinessMetric', 'BerxHorizontalRail', 'BerxFilterBar', 'BerxGlassSurface'], false),
};

/**
 * Light recipes, turned from the archive's two named values into the
 * two numbers a scene needs. `hero` puts a strong key on the focal
 * layer (identity and arrival moments); `card` spreads a flatter,
 * lower-energy light so a grid of many objects stays readable. Both
 * spend the accent as LIGHT, never as a surface tint — the archive's
 * "restrained cyan energy".
 */
export const BERX_V9_LIGHT: Record<BerxV9LightRecipe, {keyStrength: number; ambient: number; focalOnly: boolean}> = {
	hero: {keyStrength: 0.42, ambient: 0.16, focalOnly: true},
	card: {keyStrength: 0.22, ambient: 0.1, focalOnly: false},
};
