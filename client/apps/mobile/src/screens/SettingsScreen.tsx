/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * Real hub only: every row here links to a screen backed by a real
 * API. No rows for password/email change — those belong to
 * ProfileScreen's own edit flow, not duplicated here.
 *
 * OPUS 5 — "Оформление" is a real, live theme switch over the
 * centralized palette (packages/design-system/src/theme). The earlier
 * "BERX is Premium Dark only, by decision" note no longer applies:
 * Night and Day are both complete palettes now. 'Авто' resolves from
 * the device's own real local hour — no invented preference storage
 * (no persistence module is installable here, so the choice lives for
 * the session; that limitation is stated, not hidden).
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
import type {BerxThemeMode} from '../../../../packages/design-system/src/theme';
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
	// BERX THEME — a real, live switch over the centralized palette (see
	// packages/design-system/src/theme). 'Авто' resolves from the
	// device's own real local hour, deterministically.
	const theme = useBerxTheme();
	const themeEnvLabel = theme.env === 'day' ? 'дневная' : 'ночная';
	const themeOptions: {key: BerxThemeMode; label: string}[] = [
		{key: 'night', label: 'Ночь'},
		{key: 'day', label: 'День'},
		{key: 'auto', label: 'Авто'},
	];
	return (
		<View style={styles.screen}>
			<BerxHeader title="Настройки" onBack={onBack} />
			<Text style={styles.sectionLabel}>Оформление</Text>
			<View style={styles.group}>
				<View style={styles.themeRow}>
					{themeOptions.map((opt: {key: BerxThemeMode; label: string}) => (
						<Pressable
							key={opt.key}
							style={[styles.themeChip, theme.mode === opt.key && styles.themeChipActive]}
							onPress={() => theme.setMode(opt.key)}>
							<Text style={[styles.themeChipText, theme.mode === opt.key && styles.themeChipTextActive]}>{opt.label}</Text>
						</Pressable>
					))}
				</View>
				<Text style={styles.themeHint}>
					Сейчас: {themeEnvLabel} среда
					{theme.mode === 'auto' ? ' · по местному времени' : ''}
				</Text>
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
