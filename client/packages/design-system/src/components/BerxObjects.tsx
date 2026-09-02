/**
 * BERX OBJECTS — one 3D language, many objects.
 *
 * A checkpoint, a badge, a reward and a ticket are not four unrelated
 * illustrations. They are the same material seen four ways: BERX's
 * glass slab, lit along one leading edge, with something on it.
 *
 * That is the whole rule, and it is what stops a product's 3D from
 * becoming a bag of stickers. A checkpoint is a slab standing upright
 * with the mark cut into it. A badge is a slab seen face-on with a rim.
 * A reward is a stack of slabs. A ticket is a long slab with a notch.
 * Same geometry, same light, same palette — so a user who has seen one
 * recognises the next.
 *
 * All of it is drawn: no model is downloaded, none is claimed, and
 * nothing here is a placeholder for one.
 */
import {useMemo} from 'react';
import {View, ViewStyle} from 'react-native';
import Svg, {Defs, LinearGradient, RadialGradient, Stop, Path, Polygon, Circle, G} from 'react-native-svg';

interface BaseProps {
	size?: number;
	/** The light on the leading edges. */
	light?: string;
	/** The body of the glass, away from the light. */
	body?: string;
	/** Dimmed, for a state that has not been earned or reached yet. */
	dim?: boolean;
	style?: ViewStyle;
}

/** Shared defs so every object in the family is lit identically. */
function ObjectDefs({uid, light, body, dim}: {uid: string; light: string; body: string; dim: boolean}) {
	const k = dim ? 0.28 : 1;
	return (
		<Defs>
			<LinearGradient id={`${uid}-face`} x1="0" y1="0" x2="0.8" y2="1">
				<Stop offset="0%" stopColor={light} stopOpacity={0.42 * k} />
				<Stop offset="45%" stopColor={body} stopOpacity={0.86} />
				<Stop offset="100%" stopColor={body} stopOpacity={0.96} />
			</LinearGradient>
			<LinearGradient id={`${uid}-edge`} x1="0" y1="0" x2="1" y2="0.8">
				<Stop offset="0%" stopColor={light} stopOpacity={0.95 * k} />
				<Stop offset="40%" stopColor={light} stopOpacity={0.3 * k} />
				<Stop offset="100%" stopColor={light} stopOpacity={0.06 * k} />
			</LinearGradient>
			<LinearGradient id={`${uid}-side`} x1="0" y1="0" x2="1" y2="0">
				<Stop offset="0%" stopColor={body} stopOpacity={0.98} />
				<Stop offset="100%" stopColor={light} stopOpacity={0.2 * k} />
			</LinearGradient>
			<RadialGradient id={`${uid}-halo`} cx="50%" cy="50%" r="50%">
				<Stop offset="0%" stopColor={light} stopOpacity={0.2 * k} />
				<Stop offset="45%" stopColor={light} stopOpacity={0.06 * k} />
				<Stop offset="100%" stopColor={light} stopOpacity={0} />
			</RadialGradient>
			<RadialGradient id={`${uid}-shadow`} cx="50%" cy="50%" r="50%">
				<Stop offset="0%" stopColor="#000000" stopOpacity={0.5} />
				<Stop offset="100%" stopColor="#000000" stopOpacity={0} />
			</RadialGradient>
		</Defs>
	);
}

const DEFAULT_LIGHT = '#FF6A45';
const DEFAULT_BODY = '#171320';

/**
 * CHECKPOINT — a slab standing upright on the ground, with the BERX
 * monogram cut through it. The thing you arrive at.
 */
export function BerxCheckpoint({size = 120, light = DEFAULT_LIGHT, body = DEFAULT_BODY, dim = false, style}: BaseProps) {
	const uid = useMemo(() => Math.random().toString(36).slice(2, 8), []);
	return (
		<View pointerEvents="none" style={[{width: size, height: size}, style]}>
			<Svg width={size} height={size} viewBox="0 0 120 120">
				<ObjectDefs uid={uid} light={light} body={body} dim={dim} />
				<Circle cx="60" cy="60" r="58" fill={`url(#${uid}-halo)`} />
				{/* Ground contact, so the object is standing rather than floating. */}
				<Path d="M22 104 A38 8 0 0 0 98 104 A38 8 0 0 0 22 104 Z" fill={`url(#${uid}-shadow)`} />
				{/* The standing slab, in perspective: narrower at the base. */}
				<Polygon points="34,26 86,26 78,100 42,100" fill={`url(#${uid}-face)`} stroke={`url(#${uid}-edge)`} strokeWidth={1.4} />
				{/* Its thickness, catching a little of the light down one side. */}
				<Polygon points="86,26 92,30 84,102 78,100" fill={`url(#${uid}-side)`} />
				{/* The monogram cut into the face — the same two crossing strokes
				    as the logo, at the slab's own scale. */}
				<Path
					d="M46 44 L74 82 M74 44 L46 82"
					stroke={light}
					strokeOpacity={dim ? 0.3 : 0.9}
					strokeWidth={6}
					strokeLinecap="round"
					fill="none"
				/>
			</Svg>
		</View>
	);
}

/**
 * BADGE — the same slab seen face-on, rimmed, with a rank notch. What
 * you were given for arriving.
 */
export function BerxBadge({size = 96, light = DEFAULT_LIGHT, body = DEFAULT_BODY, dim = false, tier = 1, style}: BaseProps & {tier?: number}) {
	const uid = useMemo(() => Math.random().toString(36).slice(2, 8), []);
	const notches = Math.max(0, Math.min(4, tier));
	return (
		<View pointerEvents="none" style={[{width: size, height: size}, style]}>
			<Svg width={size} height={size} viewBox="0 0 120 120">
				<ObjectDefs uid={uid} light={light} body={body} dim={dim} />
				<Circle cx="60" cy="60" r="58" fill={`url(#${uid}-halo)`} />
				{/* A hexagonal slab: the plane, closed. */}
				<Polygon
					points="60,16 98,38 98,82 60,104 22,82 22,38"
					fill={`url(#${uid}-face)`}
					stroke={`url(#${uid}-edge)`}
					strokeWidth={2}
				/>
				<Polygon points="60,28 88,44 88,76 60,92 32,76 32,44" fill="none" stroke={light} strokeOpacity={dim ? 0.18 : 0.4} strokeWidth={1} />
				<Path
					d="M50 48 L70 72 M70 48 L50 72"
					stroke={light}
					strokeOpacity={dim ? 0.3 : 0.95}
					strokeWidth={5}
					strokeLinecap="round"
					fill="none"
				/>
				{/* Rank is real geometry, not a number printed on a sticker. */}
				<G>
					{Array.from({length: notches}, (_v, i: number) => (
						<Circle key={i} cx={60 + (i - (notches - 1) / 2) * 9} cy={98} r={2.4} fill={light} fillOpacity={dim ? 0.3 : 0.9} />
					))}
				</G>
			</Svg>
		</View>
	);
}

/**
 * REWARD — a stack of slabs, the top one lit. What accumulates.
 */
export function BerxReward({size = 110, light = DEFAULT_LIGHT, body = DEFAULT_BODY, dim = false, style}: BaseProps) {
	const uid = useMemo(() => Math.random().toString(36).slice(2, 8), []);
	const layers = [0, 1, 2];
	return (
		<View pointerEvents="none" style={[{width: size, height: size}, style]}>
			<Svg width={size} height={size} viewBox="0 0 120 120">
				<ObjectDefs uid={uid} light={light} body={body} dim={dim} />
				<Circle cx="60" cy="60" r="58" fill={`url(#${uid}-halo)`} />
				<Path d="M24 100 A36 7 0 0 0 96 100 A36 7 0 0 0 24 100 Z" fill={`url(#${uid}-shadow)`} />
				{layers.map((i: number) => {
					const y = 78 - i * 20;
					return (
						<G key={i}>
							<Polygon
								points={`26,${y} 60,${y - 15} 94,${y} 60,${y + 15}`}
								fill={`url(#${uid}-face)`}
								stroke={`url(#${uid}-edge)`}
								strokeWidth={i === layers.length - 1 ? 1.8 : 1}
								strokeOpacity={0.35 + i * 0.3}
							/>
							<Polygon points={`26,${y} 60,${y + 15} 60,${y + 22} 26,${y + 7}`} fill={`url(#${uid}-side)`} />
							<Polygon points={`94,${y} 60,${y + 15} 60,${y + 22} 94,${y + 7}`} fill={`url(#${uid}-side)`} opacity={0.7} />
						</G>
					);
				})}
			</Svg>
		</View>
	);
}

/**
 * TICKET — a long slab with a real notch through it. What lets you in.
 */
export function BerxTicket({size = 130, light = DEFAULT_LIGHT, body = DEFAULT_BODY, dim = false, style}: BaseProps) {
	const uid = useMemo(() => Math.random().toString(36).slice(2, 8), []);
	return (
		<View pointerEvents="none" style={[{width: size, height: size * 0.62}, style]}>
			<Svg width={size} height={size * 0.62} viewBox="0 0 130 80">
				<ObjectDefs uid={uid} light={light} body={body} dim={dim} />
				<Path
					d="M10 18 H78 A8 8 0 0 0 78 34 V46 A8 8 0 0 0 78 62 H10 Z"
					fill={`url(#${uid}-face)`}
					stroke={`url(#${uid}-edge)`}
					strokeWidth={1.6}
				/>
				<Path
					d="M78 18 H120 V62 H78 A8 8 0 0 1 78 46 V34 A8 8 0 0 1 78 18 Z"
					fill={`url(#${uid}-face)`}
					stroke={`url(#${uid}-edge)`}
					strokeWidth={1.6}
					opacity={0.72}
				/>
				{/* The perforation, drawn as real punctuation rather than a
				    dashed line, so it survives being scaled. */}
				{Array.from({length: 5}, (_v, i: number) => (
					<Circle key={i} cx={78} cy={24 + i * 8} r={1.1} fill={light} fillOpacity={dim ? 0.2 : 0.55} />
				))}
				<Path
					d="M26 32 L44 52 M44 32 L26 52"
					stroke={light}
					strokeOpacity={dim ? 0.3 : 0.92}
					strokeWidth={4.5}
					strokeLinecap="round"
					fill="none"
				/>
			</Svg>
		</View>
	);
}
