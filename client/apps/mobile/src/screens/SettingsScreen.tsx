/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * Real hub only: every row here links to a screen backed by a real
 * API. No rows for password/email change, notification preferences,
 * or theme — those either have no backend (per-user settings storage
 * doesn't exist in OSSN at all, see BERX_DECISIONS.md) or belong to
 * ProfileScreen's own edit flow, not duplicated here.
 */
import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';

interface Props {
	onOpenDeviceSessions: () => void;
	onOpenBlockedUsers: () => void;
	onOpenDeleteAccount: () => void;
	onOpenDatingPrivacy: () => void;
	onOpenCircles?: () => void;
	onBack?: () => void;
}

function Row({label, onPress, danger}: {label: string; onPress: () => void; danger?: boolean}) {
	return (
		<Pressable style={styles.row} onPress={onPress}>
			<Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
			<Text style={styles.chevron}>›</Text>
		</Pressable>
	);
}

export default function SettingsScreen({onOpenDeviceSessions, onOpenBlockedUsers, onOpenDeleteAccount, onOpenDatingPrivacy, onOpenCircles, onBack}: Props) {
	return (
		<View style={styles.screen}>
			<BerxHeader title="Настройки" onBack={onBack} />
			<Text style={styles.sectionLabel}>Приватность и безопасность</Text>
			<View style={styles.group}>
				<Row label="Устройства и сессии" onPress={onOpenDeviceSessions} />
				<Row label="Заблокированные" onPress={onOpenBlockedUsers} />
				<Row label="Приватность знакомств" onPress={onOpenDatingPrivacy} />
				{onOpenCircles ? <Row label="Круги" onPress={onOpenCircles} /> : null}
			</View>

			<Text style={styles.sectionLabel}>Аккаунт</Text>
			<View style={styles.group}>
				<Row label="Удалить аккаунт" onPress={onOpenDeleteAccount} danger />
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	sectionLabel: {fontSize: typography.sizeXs, color: colors.textFaint, fontWeight: typography.weightBold, textTransform: 'uppercase', paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.xs},
	group: {marginHorizontal: spacing.md, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.surface},
	row: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderSoft},
	rowLabel: {fontSize: typography.sizeBase, color: colors.white},
	rowLabelDanger: {color: colors.danger},
	chevron: {fontSize: typography.sizeLg, color: colors.textFaint},
});
