/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * Honest routing scope: only 'dating:match' is confirmed and wired to
 * a real destination (Conversation with the matched user, via
 * poster_guid) — verified against components/OssnDating/ossn_com.php's
 * own notification type strings earlier this session, not guessed.
 * 'dating:interest' / 'dating:photo:request' / 'dating:photo:granted'
 * route to the Dating tab as the closest real screen — there's no
 * dedicated "who liked you" or "photo request" screen built yet, so
 * this is honest-but-imprecise rather than a fake specific
 * destination. Any other/unrecognized type just marks read without
 * navigating — never silently pretends to go somewhere.
 */
import {useCallback, useEffect, useState} from 'react';
import {View, Text, FlatList, Pressable, RefreshControl, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxNotification} from '@berx/api/types';
import {relativeTimeLabel} from '@berx/domain';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';

interface Props {
	api: BerxApiClient;
	onOpenConversation: (otherGuid: number) => void;
	onOpenDating: () => void;
	/** subject_guid on berx:place:* notifications IS the place guid — see ossn_com.php in OssnPlaces (notify()'s subject_guid arg is always $place->guid). */
	onOpenPlace: (guid: number) => void;
	/** Same real pattern for events — see OssnEvents' notify() calls. */
	onOpenEvent: (guid: number) => void;
	onBack?: () => void;
}

const NOTIFICATION_LABELS: Record<string, string> = {
	'dating:match': 'Новое совпадение',
	'dating:interest': 'Вы понравились кому-то',
	'dating:photo:request': 'Запрос доступа к фото',
	'dating:photo:granted': 'Вам открыли доступ к фото',
	'berx:place:review': 'Новый отзыв о вашем месте',
	'berx:place:comment': 'Новый комментарий к вашему месту',
	'berx:event:rsvp': 'Кто-то идёт на ваше событие',
	'berx:event:comment': 'Новый комментарий к вашему событию',
	'berx:event:invite': 'Приглашение на событие',
};

export default function NotificationsScreen({api, onOpenConversation, onOpenDating, onOpenPlace, onOpenEvent, onBack}: Props) {
	const [items, setItems] = useState<BerxNotification[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	const load = useCallback(async () => {
		try {
			const res = await api.notifications(false, 30, 1);
			setItems(res.notifications);
			setError(null);
		} catch {
			setError('Не удалось загрузить уведомления');
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, [api]);

	useEffect(() => {
		load();
	}, [load]);

	async function handlePress(n: BerxNotification) {
		if (!n.viewed) {
			api.markNotificationRead(n.guid).catch(() => undefined); // best-effort — a failed mark-as-read shouldn't block navigation
			setItems((prev: BerxNotification[]) => prev.map((it: BerxNotification) => (it.guid === n.guid ? {...it, viewed: true} : it)));
		}
		if (n.type === 'dating:match') {
			onOpenConversation(n.poster_guid);
		} else if (n.type === 'dating:interest' || n.type === 'dating:photo:request' || n.type === 'dating:photo:granted') {
			onOpenDating();
		} else if (n.type === 'berx:place:review' || n.type === 'berx:place:comment') {
			onOpenPlace(n.subject_guid);
		} else if (n.type === 'berx:event:rsvp' || n.type === 'berx:event:comment' || n.type === 'berx:event:invite') {
			onOpenEvent(n.subject_guid);
		}
		// Anything else: marked read, no navigation — honest, not a fake destination.
	}

	async function markAllRead() {
		setBusy(true);
		try {
			await api.markAllNotificationsRead();
			setItems((prev: BerxNotification[]) => prev.map((it: BerxNotification) => ({...it, viewed: true})));
		} catch {
			// best-effort banner-less failure — list stays as-is, user can retry via the button again
		} finally {
			setBusy(false);
		}
	}

	async function deleteAll() {
		setBusy(true);
		try {
			await api.deleteAllNotifications();
			setItems([]);
		} catch {
			// list stays as-is on failure — never optimistically cleared before the server confirms
		} finally {
			setBusy(false);
		}
	}

	async function deleteOne(guid: number) {
		try {
			await api.deleteNotification(guid);
			setItems((prev: BerxNotification[]) => prev.filter((it: BerxNotification) => it.guid !== guid));
		} catch {
			// list stays as-is on failure — never optimistically removed before the server confirms
		}
	}

	return (
		<View style={styles.screen}>
			<BerxHeader onBack={onBack} title="Уведомления" />
			{items.length > 0 ? (
				<View style={styles.actionsRow}>
					<Pressable onPress={markAllRead} disabled={busy} hitSlop={8}>
						<Text style={styles.actionLink}>Прочитать всё</Text>
					</Pressable>
					<Pressable onPress={deleteAll} disabled={busy} hitSlop={8}>
						<Text style={[styles.actionLink, styles.actionLinkDanger]}>Удалить всё</Text>
					</Pressable>
				</View>
			) : null}
			{loading ? (
				<BerxLoadingState label="Загрузка..." />
			) : error ? (
				<BerxErrorState message={error} onRetry={load} />
			) : items.length === 0 ? (
				<BerxEmptyState title="Пока нет уведомлений" />
			) : (
				<FlatList
					data={items}
					keyExtractor={(n: BerxNotification) => String(n.guid)}
					refreshControl={
						<RefreshControl
							refreshing={refreshing}
							onRefresh={() => {
								setRefreshing(true);
								load();
							}}
							tintColor={colors.accent}
						/>
					}
					renderItem={({item}: {item: BerxNotification}) => (
						<Pressable style={[styles.row, !item.viewed && styles.rowUnread]} onPress={() => handlePress(item)}>
							{!item.viewed ? <View style={styles.dot} /> : null}
							<View style={styles.rowText}>
								<Text style={styles.label}>{NOTIFICATION_LABELS[item.type] ?? item.type}</Text>
								<Text style={styles.time}>{relativeTimeLabel(item.time_created)}</Text>
							</View>
							<Pressable onPress={() => deleteOne(item.guid)} hitSlop={8}>
								<Text style={styles.remove}>✕</Text>
							</Pressable>
						</Pressable>
					)}
				/>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.black},
	actionsRow: {flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm},
	actionLink: {color: colors.accent, fontSize: typography.sizeSm, fontWeight: typography.weightMedium},
	actionLinkDanger: {color: colors.danger},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: spacing.lg,
		borderBottomWidth: 1,
		borderBottomColor: colors.borderSoft,
		gap: spacing.sm,
	},
	rowUnread: {backgroundColor: colors.glass1},
	dot: {width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent},
	rowText: {flex: 1},
	label: {color: colors.text, fontSize: typography.sizeBase},
	time: {color: colors.textFaint, fontSize: typography.sizeXs, marginTop: spacing.xs},
	remove: {fontSize: typography.sizeSm, color: colors.textFaint, padding: 4},
});
