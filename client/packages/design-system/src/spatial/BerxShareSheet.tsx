/**
 * BerxShareSheet — the OS share sheet, not a BERX one.
 *
 * React Native's Share API opens the real system sheet, so nothing
 * about this is simulated and nothing is stored: BERX has no share
 * resource, and inventing an in-app share dialog that only copies a
 * link would be a worse version of what the OS already does well.
 *
 * A share that fails or is dismissed reports honestly rather than
 * showing a success toast for something that did not happen.
 */
import {useCallback, useState} from 'react';
import {Pressable, Share, StyleSheet, Text} from 'react-native';
import {rgba} from '@berx/spatial';
import {useBerxScene} from './BerxSpatialScene';
import {colors, spacing, typography} from '../tokens';

export interface BerxShareSheetProps {
	/** Canonical, publicly reachable URL for the object being shared. */
	url: string;
	title: string;
	message?: string;
	label?: string;
	onShared?: () => void;
	testID?: string;
}

export function BerxShareSheet({url, title, message, label = 'Поделиться', onShared, testID}: BerxShareSheetProps) {
	const {scene} = useBerxScene();
	const [error, setError] = useState<string | null>(null);

	const share = useCallback(async () => {
		setError(null);
		try {
			const result = await Share.share({url, title, message: message ?? `${title}\n${url}`}, {dialogTitle: title});
			/* 'dismissedAction' is a real outcome: the user chose not to share */
			if (result.action === Share.sharedAction) onShared?.();
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось открыть меню «Поделиться»');
		}
	}, [url, title, message, onShared]);

	return (
		<>
			<Pressable
				testID={testID}
				accessibilityRole="button"
				accessibilityLabel={`${label}: ${title}`}
				onPress={share}
				style={({pressed}) => [
					styles.button,
					{borderColor: scene.layers.D4.surface.borderColor, backgroundColor: rgba(scene.accent, pressed ? 0.16 : 0.08)},
				]}>
				<Text style={[styles.label, {color: scene.accent}]}>{label}</Text>
			</Pressable>
			{error ? (
				<Text accessibilityLiveRegion="polite" style={styles.error}>
					{error}
				</Text>
			) : null}
		</>
	);
}

const styles = StyleSheet.create({
	button: {minHeight: 44, paddingHorizontal: spacing.lg, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center'},
	label: {fontSize: typography.sizeSm, fontWeight: typography.weightMedium},
	error: {color: colors.danger, fontSize: typography.sizeXs, marginTop: 4},
});
