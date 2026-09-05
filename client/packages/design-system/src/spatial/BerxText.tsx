/**
 * BerxText — the only way text is set in BERX.
 *
 * A screen asks for a role, not a size. That is what makes the type
 * a system: `role="title"` is the same object name on every screen,
 * at the right size for the device, in the scene's own colour, with
 * the tracking its size needs. Nothing has to hand-roll a 24px bold
 * with -0.35 tracking and then get it slightly wrong on the next
 * screen.
 *
 * Colour comes from the scene rather than from a constant, so an
 * accent line is the active colour world's accent and a secondary
 * line keeps its relationship to whatever it is being read over —
 * glass, media or solid.
 */
import React, {useMemo} from 'react';
import {Text, type StyleProp, type TextStyle} from 'react-native';
import {useWindowDimensions} from 'react-native';
import {BERX_TYPE_EMPHASIS_ALPHA, rgba, resolveType, type BerxTypeEmphasis, type BerxTypeRole} from '@berx/spatial';
import {useBerxSceneOptional} from './BerxSpatialScene';
import {colors} from '../tokens';

export interface BerxTextProps {
	role?: BerxTypeRole;
	emphasis?: BerxTypeEmphasis;
	children?: React.ReactNode;
	style?: StyleProp<TextStyle>;
	numberOfLines?: number;
	/** Marks the line as a heading for assistive technology. */
	heading?: boolean;
	accessibilityLabel?: string;
	testID?: string;
	onPress?: () => void;
}

export function BerxText({
	role = 'body',
	emphasis,
	children,
	style,
	numberOfLines,
	heading,
	accessibilityLabel,
	testID,
	onPress,
}: BerxTextProps) {
	const {width} = useWindowDimensions();
	/* usable outside a scene: a login screen's first frame renders
	   before the scene exists, and type is not the thing that should
	   fail there */
	const scene = useBerxSceneOptional();

	const resolved = useMemo(
		() => resolveType(role, {viewportWidth: width, emphasis}),
		[role, width, emphasis],
	);

	const color = useMemo(() => {
		if (resolved.emphasis === 'accent') return scene?.scene.accent ?? colors.accent;
		const alpha = BERX_TYPE_EMPHASIS_ALPHA[resolved.emphasis];
		const base = colors.text;
		return alpha >= 1 ? base : rgba(base, alpha);
	}, [resolved.emphasis, scene]);

	return (
		<Text
			testID={testID}
			onPress={onPress}
			numberOfLines={numberOfLines}
			accessibilityRole={heading ? 'header' : undefined}
			accessibilityLabel={accessibilityLabel}
			style={[
				{
					color,
					fontSize: resolved.fontSize,
					lineHeight: resolved.lineHeightPx,
					fontWeight: resolved.fontWeight,
					letterSpacing: resolved.letterSpacing,
					textTransform: resolved.textTransform,
				},
				style,
			]}>
			{children}
		</Text>
	);
}
