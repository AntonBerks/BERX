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
import {View, Text, FlatList, RefreshControl, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxNotification} from '@berx/api/types';
import {relativeTimeLabel} from '@berx/domain';
import type {BerxScreenState} from '@berx/spatial';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxSpatialCard} from '../../../../packages/design-system/src/spatial/BerxSpatialCard';
import {BerxDataBoundary} from '../../../../packages/design-system/src/spatial/BerxDataBoundary';
import {BerxEnergyHalo} from '../../../../packages/design-system/src/spatial/BerxEnergyHalo';
import {useBerxScene, useBerxSceneScroll} from '../../../../packages/design-system/src/spatial/BerxSpatialScene';
import {BerxActionShelf} from '../../../../packages/design-system/src/spatial/BerxActionShelf';
import {BerxFamilyScene} from '../spatial/BerxScreenScene';

export interface NotificationsScreenProps {
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

export default function NotificationsScreen(props: NotificationsScreenProps) {
	return (
		<BerxFamilyScene family="PROFILE" atmosphereKind="social" testID="notifications">
			<NotificationsScreenBody {...props} />
		</BerxFamilyScene>
	);
}

function NotificationsScreenBody({api, onOpenConversation, onOpenDating, onOpenPlace, onOpenEvent, onBack}: NotificationsScreenProps) {
	const {scene} = useBerxScene();
	const {onScroll, scrollEventThrottle} = useBerxSceneScroll();
	const [items, setItems] = useState<BerxNotification[]>([]);
	const [state, setState] = useState<BerxScreenState>('loading');
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	const load = useCallback(async () => {
		try {
			const res = await api.notifications(false, 30, 1);
			setItems(res.notifications);
			setError(null);
			setState(res.notifications.length === 0 ? 'empty' : 'default');
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить уведомления');
			setState('error');
		} finally {
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
			setState('empty');
		} catch {
			// list stays as-is on failure — never optimistically cleared before the server confirms
		} finally {
			setBusy(false);
		}
	}

	const unreadCount = items.filter((n) => !n.viewed).length;

	return (
		<View style={styles.screen}>
			<BerxHeader onBack={onBack} title="Уведомления" />

			{items.length > 0 ? (
				<BerxActionShelf variant="anchored">
					<BerxButton label="Прочитать всё" variant="secondary" onPress={markAllRead} disabled={busy || unreadCount === 0} />
					<BerxButton label="Удалить всё" variant="secondary" onPress={deleteAll} disabled={busy} />
				</BerxActionShelf>
			) : null}

			<BerxDataBoundary
				state={state}
				onRetry={load}
				errorMessage={error ?? undefined}
				emptyTitle="Пока нет уведомлений"
				emptyBody="Здесь появятся отклики на ваши места, события, знакомства и сообщения."
				style={styles.body}>
				<FlatList
					data={items}
					keyExtractor={(n: BerxNotification) => String(n.guid)}
					onScroll={onScroll}
					scrollEventThrottle={scrollEventThrottle}
					contentContainerStyle={styles.list}
					removeClippedSubviews
					windowSize={Math.max(3, Math.round(scene.budget.listWindowSize / 3))}
					refreshControl={
						<RefreshControl
							refreshing={refreshing}
							onRefresh={() => {
								setRefreshing(true);
								load();
							}}
							tintColor={scene.accent}
						/>
					}
					renderItem={({item}: {item: BerxNotification}) => {
						const label = NOTIFICATION_LABELS[item.type] ?? item.type;
						return (
							<BerxSpatialCard
								depth="D3"
								padding={spacing.md}
								radius={18}
								onPress={() => handlePress(item)}
								accessibilityLabel={`${label}, ${relativeTimeLabel(item.time_created)}${item.viewed ? '' : ', непрочитано'}`}>
								<View style={styles.row}>
									{/* unread carries the scene's energy; read is a neutral spacer of the same size */}
									<View style={styles.marker}>
										{item.viewed ? null : <BerxEnergyHalo size={14} intensity={0.9} />}
									</View>
									<View style={styles.rowText}>
										<Text style={[styles.label, item.viewed ? styles.labelRead : null]}>{label}</Text>
										<Text style={styles.time}>{relativeTimeLabel(item.time_created)}</Text>
									</View>
								</View>
							</BerxSpatialCard>
						);
					}}
				/>
			</BerxDataBoundary>
		</View>
	);
}

const styles = StyleSheet.create({
	/* the scene paints the ground now */
	screen: {flex: 1},
	body: {flex: 1},
	list: {padding: spacing.lg, gap: spacing.sm},
	/* were 8px hit-slop links; now real 44dp controls */
	actionsRow: {flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm},
	marker: {width: 16, alignItems: 'center'},
	labelRead: {color: colors.textDim, fontWeight: typography.weightRegular},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: spacing.lg,
		borderBottomWidth: 1,
		borderBottomColor: colors.borderSoft,
		gap: spacing.sm,
	},
	dot: {width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent},
	rowText: {flex: 1},
	label: {color: colors.text, fontSize: typography.sizeBase},
	time: {color: colors.textFaint, fontSize: typography.sizeXs, marginTop: spacing.xs},
});
