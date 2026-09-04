/**
 * BerxReactionPicker — the real reaction BERX has.
 *
 * OssnLikes stores one like per user per object. There is no
 * multi-emoji reaction table, so this is a like control with real,
 * server-confirmed state rather than six faces that would all write
 * the same row and lie about which one was chosen.
 *
 * The count updates only after the server confirms. An optimistic
 * count that later disagrees with the server is a small lie the user
 * has no way to detect.
 */
import {useCallback, useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {rgba} from '@berx/spatial';
import {useBerxScene} from './BerxSpatialScene';
import {colors, spacing, typography} from '../tokens';

export interface BerxReactionPickerProps {
	/** Server truth: has the viewer liked this object. */
	liked: boolean;
	/** Server truth: total likes. */
	count: number;
	/** Must resolve only once the server has confirmed, and reject on failure. */
	onToggle: () => Promise<void>;
	disabled?: boolean;
	disabledReason?: string;
	testID?: string;
}

export function BerxReactionPicker({liked, count, onToggle, disabled, disabledReason, testID}: BerxReactionPickerProps) {
	const {scene} = useBerxScene();
	const [pending, setPending] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const press = useCallback(async () => {
		if (pending || disabled) return;
		setPending(true);
		setError(null);
		try {
			await onToggle();
		} catch (e) {
			/* the mutation failed: the count stays where the server left it */
			setError(e instanceof Error ? e.message : 'Не удалось сохранить');
		} finally {
			setPending(false);
		}
	}, [pending, disabled, onToggle]);

	const label = liked ? `Убрать отметку «нравится», всего ${count}` : `Нравится, всего ${count}`;

	return (
		<View style={styles.root}>
			<Pressable
				testID={testID}
				accessibilityRole="button"
				accessibilityLabel={label}
				accessibilityState={{selected: liked, disabled: disabled === true, busy: pending}}
				accessibilityHint={disabled ? disabledReason : undefined}
				disabled={disabled || pending}
				onPress={press}
				style={({pressed}) => [
					styles.button,
					{
						borderColor: liked ? rgba(scene.accent, 0.5) : scene.layers.D4.surface.borderColor,
						backgroundColor: liked ? rgba(scene.accent, 0.12) : 'transparent',
						opacity: disabled ? 0.45 : pressed || pending ? 0.7 : 1,
					},
				]}>
				<Text style={[styles.glyph, {color: liked ? scene.accent : colors.textDim}]}>{liked ? '♥' : '♡'}</Text>
				<Text style={[styles.count, {color: liked ? scene.accent : colors.textDim}]}>{count}</Text>
			</Pressable>
			{error ? (
				<Text accessibilityLiveRegion="polite" style={styles.error}>
					{error}
				</Text>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	root: {gap: 2},
	button: {
		minHeight: 44,
		minWidth: 44,
		paddingHorizontal: spacing.md,
		borderRadius: 999,
		borderWidth: 1,
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.xs,
	},
	glyph: {fontSize: typography.sizeLg},
	count: {fontSize: typography.sizeSm, fontWeight: typography.weightMedium},
	error: {color: colors.danger, fontSize: typography.sizeXs},
});
