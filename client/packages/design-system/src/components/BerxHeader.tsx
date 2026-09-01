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
import {useMemo} from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {spacing, typography, radius} from '../tokens';
import {IconChevronLeft} from './BerxIcons';

import {useBerxColors} from '../theme';
import {useBerxInsets} from '../insets';
import type {BerxColorTokens} from '../tokens';

export interface BerxHeaderProps {
	title?: string;
	/** Optional small line under the title — e.g. real presence ("в сети"). */
	subtitle?: string;
	onBack?: () => void;
	/**
	 * Whether this header is the topmost thing on its screen and so owns
	 * the status-bar/notch inset. False when something above it already
	 * paid it — otherwise a screen that stacks two headers inset twice.
	 */
	topInset?: boolean;
}

export function BerxHeader({title, subtitle, onBack, topInset = true}: BerxHeaderProps) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	// Real measured inset. BERX drew from y=0 before this, so the back
	// chip sat under the status bar on every notched device.
	const insets = useBerxInsets();
	return (
		<View style={[styles.header, topInset && {paddingTop: insets.top}]}>
			{onBack ? (
				<Pressable onPress={onBack} hitSlop={12} style={({pressed}: {pressed: boolean}) => [styles.backButton, styles.backChip, pressed && styles.backChipPressed]}>
					<IconChevronLeft size={16} color={colors.accent} />
				</Pressable>
			) : (
				<View style={styles.backButton} />
			)}
			{title ? (
				<View style={styles.titleColumn}>
					<Text style={styles.title} numberOfLines={1}>
						{title}
					</Text>
					{subtitle ? (
						<Text style={styles.subtitle} numberOfLines={1}>
							{subtitle}
						</Text>
					) : null}
				</View>
			) : null}
			<View style={styles.rightSpacer} />
		</View>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
		borderBottomWidth: 1,
		borderBottomColor: colors.glassBusinessHairline,
		backgroundColor: colors.bg,
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
	titleColumn: {flex: 1, alignItems: 'center'},
	title: {color: colors.text, fontSize: typography.sizeLg, fontWeight: typography.weightMedium, textAlign: 'center'},
	subtitle: {color: colors.accent, fontSize: typography.sizeXs, marginTop: 1},
	rightSpacer: {minWidth: 40},
});
