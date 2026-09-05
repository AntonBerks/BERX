/**
 * BerxButton — the control every screen presses.
 *
 * It was the most-used object in BERX and the one furthest outside
 * the spatial system: three flat fills, a hardcoded glass token that
 * had nothing to do with the scene's own material, no light on it, no
 * depth under it. A screen could compose its content perfectly and
 * then put four flat rectangles at the bottom of it.
 *
 * A control now sits on the control plane and is made of what that
 * plane is made of:
 *
 *   SECONDARY is the D4 material itself — the scene's own control
 *   surface, with its key light, its lit edge and its rim. It changes
 *   with the colour world and the device's blur budget because every
 *   other surface does.
 *
 *   PRIMARY is the one object on a screen allowed to emit. It carries
 *   the active colour world's accent as a real fill with the accent's
 *   own glow around it, which is what makes it read as nearer than
 *   the content rather than merely more colourful than it.
 *
 *   DANGER is drawn, not filled: an outline in the danger colour on
 *   the same control material. A destructive action should look
 *   deliberate to reach for, not attractive.
 *
 * Pressing moves it. The scene's own focus motion drives a small
 * scale, so a control responds with the same physics the cards do,
 * and under reduced motion the scale is gone — resolveMotion has
 * already replaced the preset — leaving the state change visible
 * without the movement.
 *
 * Outside a scene it renders from the flat tokens rather than
 * throwing: an auth screen's first frame exists before the scene
 * does.
 */
import React, {useCallback, useRef} from 'react';
import {Animated, Pressable, ActivityIndicator, StyleSheet, View, type PressableProps} from 'react-native';
import {rgba} from '@berx/spatial';
import {colors, radius, spacing} from '../tokens';
import {BerxText} from '../spatial/BerxText';
import {BerxSurface} from '../spatial/BerxSurface';
import {useBerxSceneOptional} from '../spatial/BerxSpatialScene';

export type BerxButtonVariant = 'primary' | 'secondary' | 'danger';

export interface BerxButtonProps extends Omit<PressableProps, 'style'> {
	label: string;
	variant?: BerxButtonVariant;
	loading?: boolean;
	fullWidth?: boolean;
}

export function BerxButton({label, variant = 'primary', loading, fullWidth, disabled, ...rest}: BerxButtonProps) {
	const isDisabled = disabled === true || loading === true;
	const scene = useBerxSceneOptional();
	const controls = scene?.scene.layers.D4;
	const accent = scene?.scene.accent ?? colors.accent;
	const press = useRef(new Animated.Value(0)).current;

	/* the scene's own focus preset: same duration, same easing, and
	   the same absence of scale under reduced motion */
	const focusMotion = scene?.scene.motion.focus;
	const target = focusMotion?.to?.scale ?? 1;
	const scale = press.interpolate({inputRange: [0, 1], outputRange: [1, 1 - (target - 1)]});

	const animate = useCallback(
		(to: number) => {
			Animated.timing(press, {
				toValue: to,
				duration: focusMotion?.durationMs ?? 160,
				useNativeDriver: true,
			}).start();
		},
		[press, focusMotion?.durationMs],
	);

	const body = (
		<View style={styles.body}>
			{loading ? (
				<ActivityIndicator color={variant === 'primary' ? colors.black : accent} />
			) : (
				<BerxText
					role="label"
					emphasis={variant === 'danger' ? 'primary' : 'primary'}
					style={variant === 'primary' ? styles.labelOnPrimary : variant === 'danger' ? {color: colors.danger} : undefined}>
					{label}
				</BerxText>
			)}
		</View>
	);

	const shape = [styles.base, fullWidth ? styles.fullWidth : null, isDisabled ? styles.disabled : null];

	return (
		<Pressable
			disabled={isDisabled}
			accessibilityRole="button"
			accessibilityLabel={label}
			accessibilityState={{disabled: isDisabled, busy: loading === true}}
			onPressIn={() => animate(1)}
			onPressOut={() => animate(0)}
			{...rest}>
			<Animated.View style={[shape, {transform: [{scale}]}]}>
				{variant === 'primary' ? (
					/* the emitting object: a real accent fill, with the
					   accent's own light around it rather than a shadow */
					<View
						style={[
							styles.fill,
							{
								backgroundColor: accent,
								shadowColor: accent,
								shadowOpacity: 1,
								shadowRadius: 18,
								shadowOffset: {width: 0, height: 0},
								elevation: 8,
							},
						]}>
						{body}
					</View>
				) : controls ? (
					<BerxSurface
						surface={controls.surface}
						lighting={controls.lighting}
						radius={radius.pill}
						style={variant === 'danger' ? {borderColor: rgba(colors.danger, 0.55), borderWidth: 1} : undefined}>
						{body}
					</BerxSurface>
				) : (
					<View
						style={[
							styles.fill,
							styles.flatFallback,
							variant === 'danger' ? {borderColor: rgba(colors.danger, 0.55)} : null,
						]}>
						{body}
					</View>
				)}
			</Animated.View>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	/* no overflow clipping here: the primary variant's light is a
	   shadow drawn outside its own box, and hidden overflow would cut
	   it off at the edge it is supposed to be leaving */
	base: {borderRadius: radius.pill},
	fill: {borderRadius: radius.pill, overflow: 'hidden'},
	flatFallback: {backgroundColor: colors.glass2, borderWidth: 1, borderColor: colors.borderSoft},
	body: {
		paddingVertical: spacing.md,
		paddingHorizontal: spacing.xl,
		alignItems: 'center',
		justifyContent: 'center',
		/* real touch-target minimum, not arbitrary */
		minHeight: 48,
	},
	fullWidth: {width: '100%'},
	disabled: {opacity: 0.5},
	labelOnPrimary: {color: colors.black},
});
