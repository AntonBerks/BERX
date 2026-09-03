/**
 * BERX ORB — the primary BERX 3D object.
 *
 * Original, not a downloaded model. A sphere of dark glass lit from
 * one side by the same horizon that lights the scene it stands in:
 * a bright rim where the light wraps the edge, a broad soft terminator
 * across the body, a small specular hit where the sky reflects, an
 * internal core that glows through the glass, and a contact shadow so
 * the object has somewhere to be.
 *
 * The horizontal ring is the BERX plane — the same architectural
 * element the emblem, checkpoints, badges and rewards are built from,
 * so the whole 3D language is one material rather than a set of props.
 *
 * Premium, soft, minimal, architectural. Never cartoon, never gaming,
 * never neon-on-black.
 */
import {useMemo} from 'react';
import {View, ViewStyle} from 'react-native';
import Svg, {Defs, RadialGradient, LinearGradient, Stop, Circle, Ellipse, Path, G} from 'react-native-svg';
import {useBerxColors} from '../theme';

export interface BerxOrbProps {
	size?: number;
	/** The light wrapping the object — defaults to the LIVE BERX accent (useBerxColors().accent), so an orb left unspecified follows a runtime accent change; pass an explicit value only to override it for one specific object. */
	light?: string;
	/** Secondary bounce from the opposite side — defaults to a fixed cool blue, deliberately NOT accent-reactive: a bounce light that changed hue with the primary accent would stop reading as bounce and start reading as a second accent. */
	fill?: string;
	/** Body colour of the glass. */
	body?: string;
	/** Draw the BERX plane ring through the sphere. */
	ring?: boolean;
	/** Draw the contact shadow under the object. */
	shadow?: boolean;
	style?: ViewStyle;
}

export function BerxOrb({
	size = 200,
	light,
	fill = '#3E8FD9',
	body = '#0B1016',
	ring = true,
	shadow = true,
	style,
}: BerxOrbProps) {
	const colors = useBerxColors();
	const resolvedLight = light ?? colors.accent;
	const uid = useMemo(() => Math.random().toString(36).slice(2, 8), []);
	return (
		<View pointerEvents="none" style={[{width: size, height: size}, style]}>
			<Svg width={size} height={size} viewBox="0 0 200 200">
				<Defs>
					{/* Body: lit lower-left, falling into darkness upper-right. */}
					<RadialGradient id={`${uid}-body`} cx="32%" cy="70%" r="78%">
						<Stop offset="0%" stopColor={resolvedLight} stopOpacity={0.55} />
						<Stop offset="26%" stopColor={resolvedLight} stopOpacity={0.2} />
						<Stop offset="58%" stopColor={body} stopOpacity={0.94} />
						<Stop offset="100%" stopColor={body} stopOpacity={1} />
					</RadialGradient>
					{/* Rim: a thin bright edge where the key wraps the silhouette. */}
					<LinearGradient id={`${uid}-rim`} x1="0.1" y1="0.95" x2="0.85" y2="0.1">
						<Stop offset="0%" stopColor={resolvedLight} stopOpacity={0.95} />
						<Stop offset="30%" stopColor={resolvedLight} stopOpacity={0.35} />
						<Stop offset="62%" stopColor={fill} stopOpacity={0.22} />
						<Stop offset="100%" stopColor={fill} stopOpacity={0.5} />
					</LinearGradient>
					{/* Core: the glow living inside the glass. */}
					<RadialGradient id={`${uid}-core`} cx="50%" cy="50%" r="50%">
						<Stop offset="0%" stopColor={resolvedLight} stopOpacity={0.85} />
						<Stop offset="40%" stopColor={resolvedLight} stopOpacity={0.28} />
						<Stop offset="100%" stopColor={resolvedLight} stopOpacity={0} />
					</RadialGradient>
					{/* Specular: the sky reflected in a small, soft hit. */}
					<RadialGradient id={`${uid}-spec`} cx="50%" cy="50%" r="50%">
						<Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.7} />
						<Stop offset="55%" stopColor="#FFFFFF" stopOpacity={0.14} />
						<Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
					</RadialGradient>
					<RadialGradient id={`${uid}-shadow`} cx="50%" cy="50%" r="50%">
						<Stop offset="0%" stopColor="#000000" stopOpacity={0.55} />
						<Stop offset="60%" stopColor="#000000" stopOpacity={0.16} />
						<Stop offset="100%" stopColor="#000000" stopOpacity={0} />
					</RadialGradient>
					<LinearGradient id={`${uid}-ring`} x1="0" y1="0" x2="1" y2="0">
						<Stop offset="0%" stopColor={resolvedLight} stopOpacity={0.9} />
						<Stop offset="45%" stopColor={resolvedLight} stopOpacity={0.28} />
						<Stop offset="100%" stopColor={fill} stopOpacity={0.55} />
					</LinearGradient>
					{/* The halo the glass throws into the air around it. */}
					<RadialGradient id={`${uid}-halo`} cx="50%" cy="50%" r="50%">
						<Stop offset="52%" stopColor={resolvedLight} stopOpacity={0} />
						<Stop offset="62%" stopColor={resolvedLight} stopOpacity={0.16} />
						<Stop offset="78%" stopColor={resolvedLight} stopOpacity={0.06} />
						<Stop offset="100%" stopColor={resolvedLight} stopOpacity={0} />
					</RadialGradient>
				</Defs>

				{shadow ? <Ellipse cx="100" cy="182" rx="62" ry="12" fill={`url(#${uid}-shadow)`} /> : null}
				<Circle cx="100" cy="98" r="96" fill={`url(#${uid}-halo)`} />
				{/* Rim first, body over it, so the rim survives only at the edge. */}
				<Circle cx="100" cy="98" r="74" fill={`url(#${uid}-rim)`} />
				<Circle cx="100" cy="98" r="71.5" fill={`url(#${uid}-body)`} />
				<Circle cx="100" cy="98" r="52" fill={`url(#${uid}-core)`} />

				{/* THE BERX PLANE — the object is cut by the same architectural
				    plane the emblem is stacked from. Front half only: the back
				    half is behind the glass and reads through it, dimmer. */}
				{ring ? (
					<G>
						<Ellipse
							cx="100"
							cy="104"
							rx="92"
							ry="19"
							fill="none"
							stroke={`url(#${uid}-ring)`}
							strokeWidth={1.4}
							opacity={0.34}
						/>
						<Path
							d="M8 104 A92 19 0 0 0 192 104"
							fill="none"
							stroke={`url(#${uid}-ring)`}
							strokeWidth={2.2}
							strokeLinecap="round"
						/>
					</G>
				) : null}

				<Ellipse cx="72" cy="66" rx="22" ry="15" fill={`url(#${uid}-spec)`} transform="rotate(-24 72 66)" />
			</Svg>
		</View>
	);
}
