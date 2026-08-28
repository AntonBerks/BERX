/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * MAX BUILD — real, enforced notification preferences. Real data:
 * api.notificationPrefs()/setNotificationPref() (components/OssnApi/
 * v1/notificationprefs.php). Unlike a cosmetic settings toggle, muting
 * a type here actually reaches OssnNotifications::add() itself — see
 * classes/OssnNotificationPrefs.php's own header — so a muted
 * notification is never created server-side, not just hidden on this
 * device. Each toggle saves immediately (one real PATCH per type),
 * matching NOTIFICATION_LABELS in NotificationsScreen.tsx exactly —
 * the same finite, honest list of BERX-issued notification types, not
 * every core OSSN notification string that exists anywhere in the fork.
 */
import {useCallback, useEffect, useState} from 'react';
import {View, Text, Switch, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxNotificationPrefs, BerxNotificationPrefType} from '@berx/api/types';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxLoadingState, BerxErrorState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';

interface Props {
	api: BerxApiClient;
	onBack?: () => void;
}

const LABELS: Record<BerxNotificationPrefType, string> = {
	'dating:match': 'Новое совпадение',
	'dating:interest': 'Вы понравились кому-то',
	'dating:photo:request': 'Запрос доступа к фото',
	'dating:photo:granted': 'Вам открыли доступ к фото',
	'berx:place:review': 'Отзыв о вашем месте',
	'berx:place:comment': 'Комментарий к вашему месту',
	'berx:place:checkin': 'Кто-то отметился в вашем месте',
	'berx:offer:claimed': 'Забронировано ваше предложение',
	'berx:event:rsvp': 'Кто-то идёт на ваше событие',
	'berx:event:checkin': 'Кто-то отметился на вашем событии',
	'berx:event:comment': 'Комментарий к вашему событию',
	'berx:event:invite': 'Приглашение на событие',
	'ossnpoke:poke': 'Вас «толкнули»',
	'like:post': 'Понравился ваш пост',
	'like:post:group:wall': 'Понравился ваш пост в сообществе',
	'comments:post': 'Комментарий к вашему посту',
	'comments:post:group:wall': 'Комментарий к посту в сообществе',
	'wall:friends:tag': 'Вас отметили в посте',
	'group:joinrequest': 'Заявка на вступление в сообщество',
	'berx:plan:invite': 'Приглашение в план',
	'berx:plan:accepted': 'Кто-то согласился на ваш план',
	'berx:plan:converted': 'Ваш план стал событием',
	'berx:moment:tag': 'Вас отметили в моменте',
	'berx:world:invite': 'Приглашение в мир',
	'berx:world:joined': 'Кто-то вступил в ваш мир',
};

const ORDER: BerxNotificationPrefType[] = [
	'like:post',
	'comments:post',
	'wall:friends:tag',
	'like:post:group:wall',
	'comments:post:group:wall',
	'group:joinrequest',
	'berx:plan:invite',
	'berx:plan:accepted',
	'berx:plan:converted',
	'berx:moment:tag',
	'berx:world:invite',
	'berx:world:joined',
	'berx:place:review',
	'berx:place:comment',
	'berx:place:checkin',
	'berx:offer:claimed',
	'berx:event:rsvp',
	'berx:event:checkin',
	'berx:event:comment',
	'berx:event:invite',
	'ossnpoke:poke',
	'dating:match',
	'dating:interest',
	'dating:photo:request',
	'dating:photo:granted',
];

export default function NotificationPreferencesScreen({api, onBack}: Props) {
	const [prefs, setPrefs] = useState<BerxNotificationPrefs | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [busyType, setBusyType] = useState<BerxNotificationPrefType | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await api.notificationPrefs();
			setPrefs(res.prefs);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить настройки уведомлений');
		} finally {
			setLoading(false);
		}
	}, [api]);

	useEffect(() => {
		load();
	}, [load]);

	async function toggle(type: BerxNotificationPrefType, next: boolean) {
		if (!prefs) return;
		setPrefs({...prefs, [type]: next}); // real optimistic flip — reverted below only on a real server rejection
		setBusyType(type);
		try {
			const res = await api.setNotificationPref(type, next);
			setPrefs(res.prefs);
		} catch {
			setPrefs((prev: BerxNotificationPrefs | null) => (prev ? {...prev, [type]: !next} : prev));
		} finally {
			setBusyType(null);
		}
	}

	if (loading) return <BerxLoadingState />;
	if (error || !prefs) return <BerxErrorState message={error ?? 'Настройки недоступны'} onRetry={load} />;

	return (
		<View style={styles.screen}>
			<BerxHeader onBack={onBack} title="Уведомления" />
			<BerxFadeIn style={styles.content}>
				<Text style={styles.hint}>Отключённые здесь уведомления не приходят вовсе — не только не показываются на этом устройстве.</Text>
				{ORDER.map((type) => (
					<View key={type} style={styles.row}>
						<Text style={styles.label}>{LABELS[type]}</Text>
						<Switch
							value={prefs[type]}
							onValueChange={(v: boolean) => toggle(type, v)}
							disabled={busyType === type}
							trackColor={{false: colors.glass2, true: colors.accentSoft}}
							thumbColor={prefs[type] ? colors.accent : colors.textFaint}
						/>
					</View>
				))}
			</BerxFadeIn>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	content: {padding: spacing.lg, gap: spacing.md},
	hint: {fontSize: typography.sizeXs, color: colors.textFaint, marginBottom: spacing.sm},
	row: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderSoft},
	label: {flex: 1, fontSize: typography.sizeBase, color: colors.white, fontWeight: typography.weightMedium, marginRight: spacing.md},
});
