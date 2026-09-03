/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * Real hub only: every row here links to a screen backed by a real
 * API. No rows for password/email change — those belong to
 * ProfileScreen's own edit flow, not duplicated here.
 *
 * BERX WORLD — the old "Оформление" Day/Night switch (and a later,
 * now-reverted Color World Engine picker) is removed: BERX has one
 * systemic dark identity, not a palette a person picks. Spatial depth/
 * glass/atmosphere is the design language; it isn't a theme setting.
 *
 * MAX BUILD — real "Уведомления" row: notification preferences now
 * have a real, enforced backend (see classes/OssnNotificationPrefs.php
 * and NotificationPreferencesScreen.tsx) — the earlier documented
 * absence of per-user settings storage no longer applies to this one
 * category.
 *
 * MAX BUILD — real "О приложении" section: OssnSitePages (real,
 * admin-editable About/Terms/Privacy content) had zero API caller
 * anywhere before this — see SitePageScreen.tsx's own header.
 */
import {useMemo} from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';

import {useBerxColors} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

interface Props {
	onOpenDeviceSessions: () => void;
	onOpenNotificationPreferences: () => void;
	onOpenInviteFriends: () => void;
	onOpenBlockedUsers: () => void;
	onOpenMutedUsers?: () => void;
	onOpenDeleteAccount: () => void;
	onOpenDatingPrivacy: () => void;
	onOpenCircles?: () => void;
	onOpenSitePage?: (prefix: 'about' | 'terms' | 'privacy') => void;
	onBack?: () => void;
}

function Row({label, onPress, danger}: {label: string; onPress: () => void; danger?: boolean}) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	return (
		<Pressable style={styles.row} onPress={onPress}>
			<Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
			<Text style={styles.chevron}>›</Text>
		</Pressable>
	);
}

export default function SettingsScreen({onOpenDeviceSessions, onOpenNotificationPreferences, onOpenInviteFriends, onOpenBlockedUsers, onOpenMutedUsers, onOpenDeleteAccount, onOpenDatingPrivacy, onOpenCircles, onOpenSitePage, onBack}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	return (
		<View style={styles.screen}>
			<BerxHeader title="Настройки" onBack={onBack} />
			<Text style={styles.sectionLabel}>Уведомления</Text>
			<View style={styles.group}>
				<Row label="Уведомления" onPress={onOpenNotificationPreferences} />
			</View>

			<Text style={styles.sectionLabel}>Рост</Text>
			<View style={styles.group}>
				<Row label="Пригласить друзей" onPress={onOpenInviteFriends} />
			</View>

			<Text style={styles.sectionLabel}>Приватность и безопасность</Text>
			<View style={styles.group}>
				<Row label="Устройства и сессии" onPress={onOpenDeviceSessions} />
				<Row label="Заблокированные" onPress={onOpenBlockedUsers} />
				{onOpenMutedUsers ? <Row label="Заглушённые" onPress={onOpenMutedUsers} /> : null}
				<Row label="Приватность знакомств" onPress={onOpenDatingPrivacy} />
				{onOpenCircles ? <Row label="Круги" onPress={onOpenCircles} /> : null}
			</View>

			<Text style={styles.sectionLabel}>Аккаунт</Text>
			<View style={styles.group}>
				<Row label="Удалить аккаунт" onPress={onOpenDeleteAccount} danger />
			</View>

			{onOpenSitePage ? (
				<>
					<Text style={styles.sectionLabel}>О приложении</Text>
					<View style={styles.group}>
						<Row label="О BERX" onPress={() => onOpenSitePage('about')} />
						<Row label="Условия использования" onPress={() => onOpenSitePage('terms')} />
						<Row label="Конфиденциальность" onPress={() => onOpenSitePage('privacy')} />
					</View>
				</>
			) : null}
		</View>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	sectionLabel: {fontSize: typography.sizeXs, color: colors.textFaint, fontWeight: typography.weightBold, textTransform: 'uppercase', paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.xs},
	group: {marginHorizontal: spacing.md, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.surface},
	row: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderSoft},
	rowLabel: {fontSize: typography.sizeBase, color: colors.white},
	rowLabelDanger: {color: colors.danger},
	chevron: {fontSize: typography.sizeLg, color: colors.textFaint},
});
