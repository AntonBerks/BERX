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
 * circular chip + a chevron from the one licensed BerxIcon family, a
 * hairline bottom edge instead of a flat 1px border, and the accent
 * glow token already defined but unused elsewhere in this pass.
 *
 * `floating`, opt-in: this header stops taking its own space in the
 * layout and sits ON TOP of whatever the screen renders next instead —
 * position:absolute, with a genuine BlurView backdrop (BerxGlassBar)
 * so scrolling content visibly softens as it passes underneath rather
 * than a flat panel breaking the photo below it into two dead zones.
 * Every one of the 30+ existing callers keeps the exact prior in-flow
 * behaviour untouched (default false) — this is additive, not a
 * redefinition of what BerxHeader already does everywhere else. A
 * floating caller owns clearing its own content below by the real
 * measured height this component reports back via `onHeight`, the
 * same way a screen would size any other element it does not control
 * the intrinsic height of.
 */
import {useMemo} from 'react';
import {View, Text, Pressable, StyleSheet, LayoutChangeEvent} from 'react-native';
import {spacing, typography, radius} from '../tokens';

import {useBerxColors} from '../theme';
import {useBerxInsets} from '../insets';
import type {BerxColorTokens} from '../tokens';
import {BerxIcon} from '../icons/BerxIcon';
import {BerxGlassBar} from './BerxGlassBar';

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
	/** Real glass, floating above scrolling content instead of sitting in-flow above it. Default false — unchanged behaviour for every existing caller. */
	floating?: boolean;
	/** Fires with the header's own real rendered height (inset included) whenever it's known — a floating caller needs this to pad its content clear of the bar it no longer occupies layout space for. */
	onHeight?: (height: number) => void;
}

export function BerxHeader({title, subtitle, onBack, topInset = true, floating = false, onHeight}: BerxHeaderProps) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	// Real measured inset. BERX drew from y=0 before this, so the back
	// chip sat under the status bar on every notched device.
	const insets = useBerxInsets();

	function handleLayout(e: LayoutChangeEvent) {
		onHeight?.(e.nativeEvent.layout.height);
	}

	const content = (
		<>
			{onBack ? (
				<Pressable onPress={onBack} hitSlop={12} style={({pressed}: {pressed: boolean}) => [styles.backButton, styles.backChip, pressed && styles.backChipPressed]}>
					<BerxIcon name="chevron-left" size={16} color={colors.accent}  />
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
		</>
	);

	if (floating) {
		return (
			<BerxGlassBar level={2} style={styles.floatingBar} onLayout={handleLayout}>
				<View style={[styles.header, styles.headerNoBorder, topInset && {paddingTop: insets.top}]}>{content}</View>
			</BerxGlassBar>
		);
	}

	return (
		<View style={[styles.header, topInset && {paddingTop: insets.top}]} onLayout={handleLayout}>
			{content}
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
	// The floating bar already draws its own real hairline + backdrop —
	// this inner row must not paint a second flat background or a
	// second border on top of it.
	headerNoBorder: {borderBottomWidth: 0, backgroundColor: 'transparent'},
	floatingBar: {position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10},
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
