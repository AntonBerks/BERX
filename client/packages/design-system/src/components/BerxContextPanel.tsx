/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see BerxButton.tsx header.
 *
 * BERX CONTEXT PANEL — the surface that answers "what is this thing I
 * just touched?" without leaving the screen. It sits at Glass level 4
 * (the highest, reserved for surfaces that take focus) over whatever
 * spatial surface spawned it: a pin on BerxMapSurface, a card in a
 * rail, a person in a grid.
 *
 * It renders nothing it was not given. No placeholder title, no "—"
 * filler row, no invented subtitle: a caller with only a title gets a
 * panel with only a title. Meta rows are dropped when their value is
 * null rather than shown empty, because an empty row reads as missing
 * data the product has and is hiding.
 */
import React from 'react';
import {View, Text, Pressable, StyleSheet, ViewStyle} from 'react-native';
import {spacing, typography, radius as radiusTokens} from '../tokens';
import type {BerxColorTokens} from '../tokens';
import {useBerxColors} from '../theme';
import {BerxGlassSurface} from './BerxGlassSurface';

export interface BerxContextPanelAction {
	key: string;
	label: string;
	onPress: () => void;
	primary?: boolean;
}

export interface BerxContextPanelProps {
	title: string;
	/** Short kind/category line above the title. Omitted when the caller has none. */
	eyebrow?: string | null;
	subtitle?: string | null;
	/** Real facts only — any row whose value is null is dropped, never rendered blank. */
	meta?: {key: string; label: string; value: string | null}[];
	actions?: BerxContextPanelAction[];
	onClose?: () => void;
	children?: React.ReactNode;
	style?: ViewStyle;
}

export function BerxContextPanel({
	title,
	eyebrow,
	subtitle,
	meta,
	actions,
	onClose,
	children,
	style,
}: BerxContextPanelProps) {
	const colors = useBerxColors();
	const styles = React.useMemo(() => makeStyles(colors), [colors]);
	const realMeta = (meta ?? []).filter(
		(m: {value: string | null}) => typeof m.value === 'string' && m.value.length > 0,
	);

	return (
		<BerxGlassSurface level={4} padding={0} radius={radiusTokens.lg} style={[styles.panel, style] as ViewStyle}>
			<View style={styles.grabber} />
			<View style={styles.body}>
				<View style={styles.headRow}>
					<View style={styles.headText}>
						{eyebrow ? <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text> : null}
						<Text style={styles.title} numberOfLines={2}>
							{title}
						</Text>
						{subtitle ? (
							<Text style={styles.subtitle} numberOfLines={2}>
								{subtitle}
							</Text>
						) : null}
					</View>
					{onClose ? (
						<Pressable style={styles.close} onPress={onClose} hitSlop={8}>
							<Text style={styles.closeGlyph}>×</Text>
						</Pressable>
					) : null}
				</View>

				{realMeta.length > 0 ? (
					<View style={styles.metaRow}>
						{realMeta.map((m: {key: string; label: string; value: string | null}) => (
							<View key={m.key} style={styles.metaCell}>
								<Text style={styles.metaValue}>{m.value}</Text>
								<Text style={styles.metaLabel}>{m.label}</Text>
							</View>
						))}
					</View>
				) : null}

				{children}

				{actions && actions.length > 0 ? (
					<View style={styles.actions}>
						{actions.map((a: BerxContextPanelAction) => (
							<Pressable
								key={a.key}
								onPress={a.onPress}
								style={[styles.action, a.primary && styles.actionPrimary]}>
								<Text style={[styles.actionText, a.primary && styles.actionTextPrimary]}>{a.label}</Text>
							</Pressable>
						))}
					</View>
				) : null}
			</View>
		</BerxGlassSurface>
	);
}

const makeStyles = (colors: BerxColorTokens) =>
	StyleSheet.create({
		panel: {overflow: 'hidden'},
		grabber: {
			alignSelf: 'center',
			width: 36,
			height: 4,
			borderRadius: 2,
			backgroundColor: colors.borderSoft,
			marginTop: spacing.sm,
		},
		body: {padding: spacing.md, gap: spacing.sm},
		headRow: {flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm},
		headText: {flex: 1, gap: 2},
		eyebrow: {fontSize: typography.sizeXs, color: colors.accent, letterSpacing: 1, fontWeight: typography.weightBold},
		title: {fontSize: typography.sizeXl, color: colors.white, fontWeight: typography.weightBold},
		subtitle: {fontSize: typography.sizeSm, color: colors.textDim},
		close: {
			width: 30,
			height: 30,
			borderRadius: 15,
			alignItems: 'center',
			justifyContent: 'center',
			backgroundColor: colors.glass2,
		},
		closeGlyph: {fontSize: typography.sizeLg, color: colors.textDim, lineHeight: 20},
		metaRow: {flexDirection: 'row', gap: spacing.sm},
		metaCell: {flex: 1, gap: 1},
		metaValue: {fontSize: typography.sizeBase, color: colors.white, fontWeight: typography.weightBold},
		metaLabel: {fontSize: typography.sizeXs, color: colors.textFaint, textTransform: 'uppercase'},
		actions: {flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs},
		action: {
			flex: 1,
			alignItems: 'center',
			paddingVertical: spacing.sm,
			borderRadius: radiusTokens.pill,
			backgroundColor: colors.glass2,
			borderWidth: 1,
			borderColor: colors.borderSoft,
		},
		actionPrimary: {backgroundColor: colors.accentSoft, borderColor: colors.accent},
		actionText: {fontSize: typography.sizeSm, color: colors.textDim, fontWeight: typography.weightMedium},
		actionTextPrimary: {color: colors.accent},
	});
