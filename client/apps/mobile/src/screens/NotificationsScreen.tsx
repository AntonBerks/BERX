/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * MAX BUILD — real "context chain" notifications (ACTOR → ACTION →
 * OBJECT → CONTEXT → DESTINATION). notifications.php now resolves a
 * real poster_username/poster_icon and a real subject_title/
 * subject_kind for every notification type this codebase's real
 * backend actually produces — see that file's own header for the
 * full per-type audit (native OSSN's old, stable notification
 * pipeline already fires 'like:post'/'comments:post'/
 * 'comments:post:group:wall'/'like:post:group:wall'/
 * 'wall:friends:tag'/'group:joinrequest' on every real like/comment/
 * tag/join-request BERX's own routes trigger — this screen just never
 * recognized any of them before, so they rendered as a raw type
 * string like "comments:post"). Routing is now driven by the real
 * subject_kind the server resolved, not a hand-maintained per-type
 * if/else list — a type this screen doesn't have separate copy for
 * still gets a real actor-based sentence and still deep-links
 * correctly as long as the server could resolve a subject.
 *
 * Honest routing scope unchanged for the handful of types with no
 * separate subject: 'dating:match' opens the real match conversation
 * (poster_guid); 'dating:interest'/'dating:photo:request'/
 * 'dating:photo:granted' route to the Dating tab (no dedicated
 * "who liked you"/"photo request" screen exists yet — honest-but-
 * imprecise, never a fake specific destination); 'ossnpoke:poke'
 * opens the poker's own profile.
 */
import {useCallback, useEffect, useState} from 'react';
import {View, Text, Image, FlatList, Pressable, RefreshControl, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxNotification} from '@berx/api/types';
import {relativeTimeLabel} from '@berx/domain';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxErrorState, BerxEmptyState, BerxSkeleton} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';

interface Props {
	api: BerxApiClient;
	onOpenConversation: (otherGuid: number) => void;
	onOpenDating: () => void;
	/** subject_kind === 'place' — real OssnPlaces::getPlace(subject_guid). */
	onOpenPlace: (guid: number) => void;
	/** subject_kind === 'event' — real OssnEvents::getEvent(subject_guid). */
	onOpenEvent: (guid: number) => void;
	/** subject_kind === 'post' — real OssnWall::GetPost(subject_guid). */
	onOpenPost?: (guid: number) => void;
	/** subject_kind === 'community' — real OssnGroup::getGroup(subject_guid). */
	onOpenCommunity?: (guid: number) => void;
	/** Real numeric-guid-or-username identifier — used with String(poster_guid) for 'ossnpoke:poke'. */
	onOpenProfile?: (identifier: string) => void;
	onBack?: () => void;
}

/** Real verb per type — paired with the server's own real poster_username/subject_title, never invented copy for a type with no real backend behind it. */
const NOTIFICATION_VERB: Record<string, string> = {
	'like:post': 'нравится ваш пост',
	'like:post:group:wall': 'нравится ваш пост в сообществе',
	'comments:post': 'прокомментировал(а) ваш пост',
	'comments:post:group:wall': 'прокомментировал(а) ваш пост в сообществе',
	'wall:friends:tag': 'отметил(а) вас в посте',
	'group:joinrequest': 'хочет вступить в',
	'dating:match': 'Новое совпадение',
	'dating:interest': 'Вы понравились кому-то',
	'dating:photo:request': 'запрашивает доступ к вашим фото',
	'dating:photo:granted': 'открыл(а) вам доступ к фото',
	'berx:place:review': 'оставил(а) отзыв о',
	'berx:place:checkin': 'отметился(-лась) в',
	'berx:offer:claimed': 'забронировал(а) предложение в',
	'berx:place:comment': 'прокомментировал(а) ваш пост о месте',
	'berx:event:rsvp': 'идёт на',
	'berx:event:comment': 'прокомментировал(а)',
	'berx:event:invite': 'пригласил(а) вас на',
	'berx:event:waitlist:promoted': 'вы переведены из листа ожидания в участники',
	'ossnpoke:poke': 'толкнул(а) вас',
};

function notificationText(n: BerxNotification): string {
	const actor = n.poster_username ?? 'Кто-то';
	const verb = NOTIFICATION_VERB[n.type];
	if (n.type === 'dating:match') return verb;
	if (verb && n.subject_title) return `${actor} ${verb} «${n.subject_title}»`;
	if (verb) return `${actor} ${verb}`;
	return `${actor}: ${n.type}`;
}

export default function NotificationsScreen({api, onOpenConversation, onOpenDating, onOpenPlace, onOpenEvent, onOpenPost, onOpenCommunity, onOpenProfile, onBack}: Props) {
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
		// Real destination, driven by the server's own subject_kind
		// resolution — covers every type the server can resolve a real
		// subject for, not just a hand-maintained list.
		if (n.subject_kind === 'post' && onOpenPost) {
			onOpenPost(n.subject_guid);
			return;
		}
		if (n.subject_kind === 'place') {
			onOpenPlace(n.subject_guid);
			return;
		}
		if (n.subject_kind === 'event') {
			onOpenEvent(n.subject_guid);
			return;
		}
		if (n.subject_kind === 'community' && onOpenCommunity) {
			onOpenCommunity(n.subject_guid);
			return;
		}
		// Real, honest fallbacks for types with no separate subject.
		if (n.type === 'dating:match') {
			onOpenConversation(n.poster_guid);
		} else if (n.type === 'dating:interest' || n.type === 'dating:photo:request' || n.type === 'dating:photo:granted') {
			onOpenDating();
		} else if (n.type === 'ossnpoke:poke' && onOpenProfile) {
			onOpenProfile(String(n.poster_guid));
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
				<View style={styles.list}>
					{[0, 1, 2, 3, 4, 5].map((i) => (
						<View key={i} style={styles.row}>
							<BerxSkeleton width={40} height={40} style={styles.skeletonAvatar} />
							<View style={styles.rowText}>
								<BerxSkeleton width="60%" height={13} />
								<BerxSkeleton width="30%" height={11} style={styles.skeletonGap} />
							</View>
						</View>
					))}
				</View>
			) : error ? (
				<BerxErrorState message={error} onRetry={load} />
			) : items.length === 0 ? (
				<BerxEmptyState title="Пока нет уведомлений" />
			) : (
				<BerxFadeIn style={styles.fadeFlex}>
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
								{item.poster_icon ? (
									<Image source={{uri: item.poster_icon}} style={styles.avatar} />
								) : (
									<View style={styles.avatarFallback} />
								)}
								<View style={styles.rowText}>
									<Text style={styles.label}>{notificationText(item)}</Text>
									<Text style={styles.time}>{relativeTimeLabel(item.time_created)}</Text>
								</View>
								<Pressable onPress={() => deleteOne(item.guid)} hitSlop={8}>
									<Text style={styles.remove}>✕</Text>
								</Pressable>
							</Pressable>
						)}
					/>
				</BerxFadeIn>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.black},
	actionsRow: {flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm},
	actionLink: {color: colors.accent, fontSize: typography.sizeSm, fontWeight: typography.weightMedium},
	actionLinkDanger: {color: colors.danger},
	fadeFlex: {flex: 1},
	list: {flex: 1},
	skeletonAvatar: {borderRadius: 20},
	skeletonGap: {marginTop: 4},
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
	avatar: {width: 40, height: 40, borderRadius: 20, backgroundColor: colors.graphite},
	avatarFallback: {width: 40, height: 40, borderRadius: 20, backgroundColor: colors.graphite},
	rowText: {flex: 1},
	label: {color: colors.text, fontSize: typography.sizeBase},
	time: {color: colors.textFaint, fontSize: typography.sizeXs, marginTop: spacing.xs},
	remove: {fontSize: typography.sizeSm, color: colors.textFaint, padding: 4},
});
