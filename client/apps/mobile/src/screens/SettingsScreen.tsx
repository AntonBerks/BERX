/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * Real hub only: every row here links to a screen backed by a real
 * API. No rows for password/email change — those belong to
 * ProfileScreen's own edit flow, not duplicated here.
 *
 * DIRECTION CORRECTION, IN WRITING. The "Оформление" Day/Night switch
 * this file used to explicitly document as removed ("BERX has one
 * systemic dark identity, not a palette a person picks") is back, by
 * the project owner's own direct, personal, two-part confirmation this
 * session: the palette values first, then explicitly this runtime-
 * switching capability itself. See theme/index.tsx's own header for
 * the full, on-record reasoning — this row is that decision's real UI,
 * not a silent reversal.
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

import {useBerxColors, useBerxThemeSettings, BERX_ACCENT_LIST} from '../../../../packages/design-system/src/theme';
import type {BerxThemeMode, BerxAccentKey} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

const MODE_OPTIONS: {key: BerxThemeMode; label: string}[] = [
	{key: 'auto', label: 'Авто'},
	{key: 'day', label: 'День'},
	{key: 'night', label: 'Ночь'},
];

/** The mode segmented control + five accent swatches — real state from useBerxThemeSettings(), not a local mock. Selecting either takes effect immediately (the whole app re-paints through the same context) and persists (see preferencesStorage's own header). */
function AppearanceSection() {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const {mode, accentKey, setMode, setAccentKey} = useBerxThemeSettings();
	return (
		<>
			<Text style={styles.sectionLabel}>Оформление</Text>
			<View style={styles.group}>
				<View style={styles.appearanceBlock}>
					<Text style={styles.appearanceLabel}>Тема</Text>
					<View style={styles.modeRow}>
						{MODE_OPTIONS.map((opt) => {
							const active = mode === opt.key;
							return (
								<Pressable
									key={opt.key}
									onPress={() => setMode(opt.key)}
									style={[styles.modePill, active && {backgroundColor: colors.accent, borderColor: colors.accent}]}>
									<Text style={[styles.modePillText, active && {color: colors.onAccent}]}>{opt.label}</Text>
								</Pressable>
							);
						})}
					</View>
				</View>
				<View style={[styles.appearanceBlock, styles.appearanceBlockLast]}>
					<Text style={styles.appearanceLabel}>Акцентный цвет</Text>
					<View style={styles.swatchRow}>
						{BERX_ACCENT_LIST.map((a) => {
							const active = accentKey === a.key;
							return (
								<Pressable key={a.key} onPress={() => setAccentKey(a.key as BerxAccentKey)} style={styles.swatchTap} hitSlop={6}>
									<View style={[styles.swatch, {backgroundColor: a.hex}, active && styles.swatchActive, active && {borderColor: a.hex}]}>
										{active ? <View style={styles.swatchCheck} /> : null}
									</View>
									<Text style={styles.swatchLabel}>{a.label}</Text>
								</Pressable>
							);
						})}
					</View>
				</View>
			</View>
		</>
	);
}

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
			<AppearanceSection />
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
	appearanceBlock: {paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderSoft},
	appearanceBlockLast: {borderBottomWidth: 0},
	appearanceLabel: {fontSize: typography.sizeSm, color: colors.textDim, marginBottom: spacing.sm},
	modeRow: {flexDirection: 'row', gap: spacing.sm},
	modePill: {
		flex: 1,
		alignItems: 'center',
		paddingVertical: spacing.sm,
		borderRadius: radius.pill,
		borderWidth: 1,
		borderColor: colors.borderStrong,
		backgroundColor: colors.glass1,
	},
	modePillText: {fontSize: typography.sizeSm, color: colors.text, fontWeight: typography.weightMedium},
	swatchRow: {flexDirection: 'row', justifyContent: 'space-between'},
	swatchTap: {alignItems: 'center', gap: spacing.xs},
	swatch: {
		width: 40,
		height: 40,
		borderRadius: 20,
		borderWidth: 2,
		borderColor: 'transparent',
		alignItems: 'center',
		justifyContent: 'center',
	},
	swatchActive: {borderWidth: 3},
	swatchCheck: {width: 8, height: 8, borderRadius: 4, backgroundColor: colors.onAccent},
	swatchLabel: {fontSize: 10, color: colors.textFaint},
});
