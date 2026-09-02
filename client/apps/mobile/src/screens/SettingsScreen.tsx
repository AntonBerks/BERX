/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * Real hub only: every row here links to a screen backed by a real
 * API. No rows for password/email change — those belong to
 * ProfileScreen's own edit flow, not duplicated here.
 *
 * BERX WORLD — "Оформление" now opens the real Color World Engine
 * (packages/design-system/src/worlds.ts) instead of a plain Day/Night
 * switch: Night/Ice, Day/Ice, Sun, Aurora — four full palettes, not a
 * light/dark pair. No invented preference storage (no persistence
 * module is installable here, so the choice lives for the session;
 * that limitation is stated, not hidden — same as the Day/Night
 * switch it replaces).
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

import {useBerxColors, useBerxTheme} from '../../../../packages/design-system/src/theme';
import {BERX_WORLDS} from '../../../../packages/design-system/src/worlds';
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
	/** Opens the real Color World Engine picker (WorldSelectScreen) — see this file's own header. */
	onOpenWorldSelect?: () => void;
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

export default function SettingsScreen({onOpenDeviceSessions, onOpenNotificationPreferences, onOpenInviteFriends, onOpenBlockedUsers, onOpenMutedUsers, onOpenDeleteAccount, onOpenDatingPrivacy, onOpenCircles, onOpenSitePage, onOpenWorldSelect, onBack}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	// BERX WORLD — the real Color World Engine (see this file's own
	// header and packages/design-system/src/worlds.ts).
	const theme = useBerxTheme();
	const currentWorld = BERX_WORLDS[theme.world];
	return (
		<View style={styles.screen}>
			<BerxHeader title="Настройки" onBack={onBack} />
			<Text style={styles.sectionLabel}>Оформление</Text>
			<View style={styles.group}>
				{onOpenWorldSelect ? (
					<Pressable style={styles.row} onPress={onOpenWorldSelect}>
						<View>
							<Text style={styles.rowLabel}>Мир</Text>
							<Text style={styles.themeHint}>{currentWorld.name}</Text>
						</View>
						<Text style={styles.chevron}>›</Text>
					</Pressable>
				) : (
					<Text style={styles.themeHint}>Мир: {currentWorld.name}</Text>
				)}
			</View>

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
	themeRow: {flexDirection: 'row', gap: spacing.xs, padding: spacing.md},
	themeChip: {
		flex: 1,
		alignItems: 'center',
		paddingVertical: spacing.sm,
		borderRadius: radius.pill,
		backgroundColor: colors.glass2,
		borderWidth: 1,
		borderColor: colors.borderSoft,
	},
	themeChipActive: {backgroundColor: colors.accentSoft, borderColor: colors.accent},
	themeChipText: {color: colors.textDim, fontSize: typography.sizeSm, fontWeight: typography.weightMedium},
	themeChipTextActive: {color: colors.accent},
	themeHint: {color: colors.textFaint, fontSize: typography.sizeXs, paddingHorizontal: spacing.md, paddingBottom: spacing.md},
	screen: {flex: 1, backgroundColor: colors.bg},
	sectionLabel: {fontSize: typography.sizeXs, color: colors.textFaint, fontWeight: typography.weightBold, textTransform: 'uppercase', paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.xs},
	group: {marginHorizontal: spacing.md, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.surface},
	row: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderSoft},
	rowLabel: {fontSize: typography.sizeBase, color: colors.white},
	rowLabelDanger: {color: colors.danger},
	chevron: {fontSize: typography.sizeLg, color: colors.textFaint},
});
