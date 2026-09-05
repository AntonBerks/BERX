/**
 * BerxHeader — the way back, and the name of where you are.
 *
 * This was an opaque black bar with a hairline under it, drawn across
 * the top of seventy-two screens. Whatever the scene behind it was
 * doing — the light entering the room, the horizon, the media — the
 * top of every screen was a flat black strip with a grey line, and
 * the room started underneath it. That is the "flat layer above the
 * scene" the archive rejects, shipped in the one place every screen
 * shares.
 *
 * It is now three real things in a lit room and nothing else:
 *
 *   a back control that is a control — a round object on the control
 *   plane, with the scene's own control material, catching the same
 *   key light every other surface catches, at a real 44dp target;
 *
 *   the name of the scene, in the type scale, leading-aligned rather
 *   than centred, because a centred title between two invisible
 *   spacers is a navigation bar's convention and this is not a bar;
 *
 *   and nothing behind either of them. The atmosphere is the
 *   background. That is what having one is for.
 *
 * Outside a scene it still renders — an auth screen's first frame
 * exists before the scene does — and falls back to the flat tokens,
 * which is the honest degradation rather than a crash.
 */
import React from 'react';
import {View, Pressable, StyleSheet} from 'react-native';
import {spacing} from '../tokens';
import {BerxText} from '../spatial/BerxText';
import {BerxSurface} from '../spatial/BerxSurface';
import {useBerxSceneOptional} from '../spatial/BerxSpatialScene';
import {BerxIcon} from '../icons';

export interface BerxHeaderProps {
	title?: string;
	onBack?: () => void;
	/** Real context under the title — a count, a state. Never a tagline. */
	subtitle?: string;
	/**
	 * What the scene is about, beside its name — the person you are
	 * talking to, the place you are in. It sits between the way back
	 * and the title, so a room that has a subject shows it rather than
	 * naming it twice.
	 */
	leading?: React.ReactNode;
	/** Controls belonging to this scene, on the same plane as the back control. */
	actions?: React.ReactNode;
}

export function BerxHeader({title, onBack, subtitle, leading, actions}: BerxHeaderProps) {
	const scene = useBerxSceneOptional();
	const controls = scene?.scene.layers.D4;

	return (
		<View style={styles.header}>
			{onBack ? (
				<Pressable
					onPress={onBack}
					hitSlop={8}
					accessibilityRole="button"
					accessibilityLabel="Назад"
					style={styles.backTarget}>
					{controls ? (
						<BerxSurface
							surface={controls.surface}
							lighting={controls.lighting}
							radius={22}
							style={styles.backSurface}>
							<BerxIcon name="chevronLeft" size={18} state="active" decorative />
						</BerxSurface>
					) : (
						<BerxIcon name="chevronLeft" size={18} state="active" decorative />
					)}
				</Pressable>
			) : null}
			{leading ? <View style={styles.leading}>{leading}</View> : null}
			<View style={styles.text}>
				{title ? (
					<BerxText role="subtitle" emphasis="primary" heading numberOfLines={1}>
						{title}
					</BerxText>
				) : null}
				{subtitle ? (
					<BerxText role="meta" emphasis="secondary" numberOfLines={1}>
						{subtitle}
					</BerxText>
				) : null}
			</View>
			{actions ? <View style={styles.actions}>{actions}</View> : null}
		</View>
	);
}

const styles = StyleSheet.create({
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.md,
		paddingHorizontal: spacing.lg,
		paddingTop: spacing.lg,
		paddingBottom: spacing.md,
	},
	/* 44dp target around a 40dp object: the control is what you see,
	   the target is what you hit */
	backTarget: {width: 44, height: 44, alignItems: 'center', justifyContent: 'center'},
	backSurface: {width: 40, height: 40, alignItems: 'center', justifyContent: 'center'},
	leading: {flexShrink: 0},
	text: {flex: 1, gap: 1},
	actions: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
});
