/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see BerxButton.tsx header.
 *
 * The piece that was missing entirely from the first vertical slice:
 * BerxNavigator always had pop()/canGoBack, but nothing in the UI
 * ever called it — a user who pushed into PostDetail or a pushed
 * Profile had no way back. This header is that way back.
 */
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {colors, spacing, typography} from '../tokens';

export interface BerxHeaderProps {
	title?: string;
	onBack?: () => void;
}

export function BerxHeader({title, onBack}: BerxHeaderProps) {
	return (
		<View style={styles.header}>
			{onBack ? (
				<Pressable onPress={onBack} hitSlop={12} style={styles.backButton}>
					<Text style={styles.backText}>‹ Назад</Text>
				</Pressable>
			) : (
				<View style={styles.backButton} />
			)}
			{title ? (
				<Text style={styles.title} numberOfLines={1}>
					{title}
				</Text>
			) : null}
			<View style={styles.rightSpacer} />
		</View>
	);
}

const styles = StyleSheet.create({
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.md,
		borderBottomWidth: 1,
		borderBottomColor: colors.borderSoft,
		backgroundColor: colors.black,
	},
	backButton: {minWidth: 64, justifyContent: 'center'},
	backText: {color: colors.accent, fontSize: typography.sizeBase},
	title: {flex: 1, color: colors.text, fontSize: typography.sizeLg, fontWeight: typography.weightMedium, textAlign: 'center'},
	rightSpacer: {minWidth: 64},
});
