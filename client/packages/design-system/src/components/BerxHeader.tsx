/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see BerxButton.tsx header.
 *
 * The piece that was missing entirely from the first vertical slice:
 * BerxNavigator always had pop()/canGoBack, but nothing in the UI
 * ever called it — a user who pushed into PostDetail or a pushed
 * Profile had no way back. This header is that way back.
 *
 * MAX BUILD — the back control was a plain "‹ Назад" text glyph, the
 * one visibly "OSSN web-admin" leftover on every single screen in the
 * app (BerxHeader is used everywhere). Replaced with a real glass
 * circular chip + IconChevronLeft (same plain-View icon construction
 * as the rest of BerxIcons.tsx — no icon font/SVG lib installed), a
 * hairline bottom edge instead of a flat 1px border, and the accent
 * glow token already defined but unused elsewhere in this pass.
 */
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {colors, spacing, typography, radius} from '../tokens';
import {IconChevronLeft} from './BerxIcons';

export interface BerxHeaderProps {
	title?: string;
	onBack?: () => void;
}

export function BerxHeader({title, onBack}: BerxHeaderProps) {
	return (
		<View style={styles.header}>
			{onBack ? (
				<Pressable onPress={onBack} hitSlop={12} style={({pressed}: {pressed: boolean}) => [styles.backButton, styles.backChip, pressed && styles.backChipPressed]}>
					<IconChevronLeft size={16} color={colors.accent} />
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
		paddingVertical: spacing.sm,
		borderBottomWidth: 1,
		borderBottomColor: colors.glassBusinessHairline,
		backgroundColor: colors.black,
	},
	backButton: {minWidth: 40, justifyContent: 'center'},
	backChip: {
		width: 36,
		height: 36,
		borderRadius: radius.pill,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: colors.glass2,
		borderWidth: 1,
		borderColor: colors.borderSoft,
	},
	backChipPressed: {backgroundColor: colors.glass3, opacity: 0.9},
	title: {flex: 1, color: colors.text, fontSize: typography.sizeLg, fontWeight: typography.weightMedium, textAlign: 'center'},
	rightSpacer: {minWidth: 40},
});
