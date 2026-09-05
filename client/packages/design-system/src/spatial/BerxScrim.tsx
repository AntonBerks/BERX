/**
 * BerxScrim — how real media meets real text.
 *
 * A flat wash over a photograph is the cheapest way to make text
 * legible and the fastest way to lose the photograph: the hero of a
 * place, an event or a person was being covered by a 55% sheet of the
 * background colour, which is the archive's "media flattened into an
 * ordinary thumbnail" in one line of code. The bottom of the frame
 * then took a second, hard-edged 52%-tall block — a rectangle, not a
 * falloff.
 *
 * This is the falloff instead. The image is clear where nothing is
 * written on it and darkens toward the text, reaching the scene's own
 * background where the title sits so contrast is carried by the ramp
 * rather than by covering the picture. Painted as a real gradient
 * with react-native-svg, along the vertical the composition actually
 * uses.
 */
import {StyleSheet, View} from 'react-native';
import Svg, {Defs, LinearGradient, Rect, Stop} from 'react-native-svg';
import {rgba} from '@berx/spatial';

export interface BerxScrimProps {
	/** The scene's substrate colour — the scrim is made of the room, not of black. */
	color: string;
	/**
	 * Where the text block begins, 0..1 down the frame. The ramp is
	 * fully opaque by then and clear well above it.
	 */
	textStart?: number;
	/** Peak opacity at the bottom edge. */
	strength?: number;
	/** Distinct id per instance, so two scrims cannot share a definition. */
	id?: string;
}

export function BerxScrim({color, textStart = 0.52, strength = 0.94, id = 'berx-scrim'}: BerxScrimProps) {
	const clearTo = Math.max(0, textStart - 0.34);

	return (
		<View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
			<Svg width="100%" height="100%">
				<Defs>
					<LinearGradient id={id} x1="0%" y1="0%" x2="0%" y2="100%">
						{/* clear: the media is the subject here */}
						<Stop offset="0%" stopColor={rgba(color, 0)} />
						<Stop offset={`${clearTo * 100}%`} stopColor={rgba(color, strength * 0.12)} />
						{/* the ramp: where the eye travels from picture to words */}
						<Stop offset={`${textStart * 100}%`} stopColor={rgba(color, strength * 0.62)} />
						<Stop offset="100%" stopColor={rgba(color, strength)} />
					</LinearGradient>
				</Defs>
				<Rect x={0} y={0} width="100%" height="100%" fill={`url(#${id})`} />
			</Svg>
		</View>
	);
}
