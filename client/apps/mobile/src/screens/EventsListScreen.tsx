/**
 * BERX-226 — Events Discovery. The EVENTS family's v9 scene.
 *
 * Real data: api.events() and api.eventCategories() from
 * components/OssnApi/v1/events.php. RSVP and capacity are real, so
 * the card shows the viewer's real is_going state and the real
 * seats_left, and the RSVP toggle only reflects a change the server
 * has already accepted.
 *
 * There is no ticket anywhere on this screen. Events have RSVP and
 * capacity but no payment, ticket issuance or barcode resource, so
 * BerxTicket and BerxWalletCard stay BLOCKED — a ticket that cannot
 * be redeemed is the fake functionality the constitution forbids.
 */
import {useCallback, useEffect, useState} from 'react';
import {FlatList, StyleSheet, View} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxEvent, BerxPlaceCategory} from '@berx/api/types';
import type {BerxScreenState} from '@berx/spatial';
import {spacing} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxFilterBar} from '../../../../packages/design-system/src/spatial/BerxFilterBar';
import {BerxObjectCard} from '../../../../packages/design-system/src/spatial/BerxObjectCard';
import {BerxCountdown} from '../../../../packages/design-system/src/spatial/BerxCountdown';
import {BerxDataBoundary} from '../../../../packages/design-system/src/spatial/BerxDataBoundary';
import {useBerxSceneScroll} from '../../../../packages/design-system/src/spatial/BerxSpatialScene';
import {BerxActionShelf} from '../../../../packages/design-system/src/spatial/BerxActionShelf';
import {BerxScreenScene, useBerxScreen, useBerxSceneAtmosphere} from '../spatial/BerxScreenScene';
import {classifyFailure} from '../spatial/screenState';
import {useBerxConnectivity} from '../spatial/useBerxConnectivity';
import {berxAnalytics} from '../spatial/analytics';

export interface EventsListScreenProps {
	api: BerxApiClient;
	onOpenEvent: (guid: number) => void;
	onCreate: () => void;
	onOpenMine: () => void;
	onBack?: () => void;
}

export default function EventsListScreen(props: EventsListScreenProps) {
	return (
		<BerxScreenScene screenId="BERX-226" testID="berx-226">
			<EventsSceneBody {...props} />
		</BerxScreenScene>
	);
}

/** The first event in the list that has a poster — a real one or none. */
function firstCover(items: readonly {cover_url: string | null}[]): {uri: string} | undefined {
	const url = items.find((i) => i.cover_url)?.cover_url;
	return url ? {uri: url} : undefined;
}

function EventsSceneBody({api, onOpenEvent, onCreate, onOpenMine, onBack}: EventsListScreenProps) {
	const screen = useBerxScreen();
	const {onScroll, scrollEventThrottle} = useBerxSceneScroll();

	const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
	const [category, setCategory] = useState<string | undefined>(undefined);
	const [categories, setCategories] = useState<BerxPlaceCategory[]>([]);
	const [items, setItems] = useState<BerxEvent[]>([]);
	/* a fetch that failed while the device is offline is an offline
	   state, not a server error — the difference is the whole point */
	const {offline} = useBerxConnectivity();
	const [state, setState] = useState<BerxScreenState>('loading');
	const [error, setError] = useState<string | null>(null);
	/* a 403 or a 404 is not transient; a Retry button there is a lie */
	const [retryable, setRetryable] = useState(true);
	const [rsvpBusy, setRsvpBusy] = useState<number | null>(null);

	useEffect(() => {
		api
			.eventCategories()
			.then((r) => setCategories(r.categories))
			.catch(() => undefined);
	}, [api]);

	/* the first event with a poster lights the temporal room */
	useBerxSceneAtmosphere(firstCover(items));

	const load = useCallback(async () => {
		setState('loading');
		setError(null);
		try {
			const res = await api.events({category, past: tab === 'past'});
			setItems(res.events);
			setState(res.events.length === 0 ? 'empty' : 'default');
		} catch (e) {
			/* the real reason, not one generic error: an expired session,
			   a forbidden resource and a dead server are different
			   problems, and being offline is a fourth */
			const failure = classifyFailure(e, offline);
			setError(failure.message);
			setRetryable(failure.retryable);
			setState(failure.state);
			berxAnalytics.error(screen, 'events');
		}
	}, [api, category, tab, screen, offline]);

	useEffect(() => {
		load();
	}, [load]);

	const toggleRsvp = useCallback(
		async (event: BerxEvent) => {
			setRsvpBusy(event.guid);
			berxAnalytics.mutationStart(screen, event.guid);
			const started = Date.now();
			try {
				if (event.is_going) await api.cancelRsvp(event.guid);
				else await api.rsvpEvent(event.guid);
				/**
				 * Re-fetch rather than flipping the flag locally: capacity
				 * means an RSVP can be accepted or refused, and seats_left
				 * has to come back from the server either way.
				 */
				await load();
				berxAnalytics.mutationSuccess(screen, Date.now() - started, event.guid);
			} catch {
				berxAnalytics.mutationError(screen, 'rsvp');
			} finally {
				setRsvpBusy(null);
			}
		},
		[api, load, screen],
	);

	return (
		<View style={styles.screen}>
			<BerxHeader title="События" onBack={onBack} />

			<View style={styles.toolbar}>
				<BerxFilterBar
					options={[
						{key: 'upcoming', label: 'Предстоящие'},
						{key: 'past', label: 'Прошедшие'},
					]}
					selected={[tab]}
					onToggle={(key) => setTab(key as 'upcoming' | 'past')}
					multiple={false}
					accessibilityLabel="Когда"
				/>
				<BerxActionShelf variant="anchored">
					<BerxButton label="Мои события" variant="secondary" onPress={onOpenMine} />
					<BerxButton label="Создать" onPress={onCreate} />
				</BerxActionShelf>
				<BerxFilterBar
					options={categories.map((c) => ({key: c.slug, label: c.label}))}
					selected={category ? [category] : []}
					onToggle={(key) => setCategory(category === key ? undefined : key)}
					multiple={false}
					accessibilityLabel="Категории событий"
				/>
			</View>

			<BerxDataBoundary
				state={state}
				onRetry={load}
				errorMessage={error ?? undefined}
				/* a forbidden or missing resource cannot be retried into existence */
				retryable={retryable}
				emptyTitle={tab === 'past' ? 'Прошедших событий нет' : 'Событий пока нет'}
				emptyBody={tab === 'past' ? 'Здесь появятся события, которые уже закончились.' : 'Создайте первое событие рядом с вами.'}
				emptyAction={tab === 'past' ? undefined : {label: 'Создать событие', onPress: onCreate}}
				style={styles.body}>
				<FlatList
					data={items}
					keyExtractor={(e: BerxEvent) => String(e.guid)}
					onScroll={onScroll}
					scrollEventThrottle={scrollEventThrottle}
					contentContainerStyle={styles.list}
					removeClippedSubviews
					windowSize={Math.max(3, Math.round(screen.scene.budget.listWindowSize / 3))}
					renderItem={({item}: {item: BerxEvent}) => (
						<BerxObjectCard
							title={item.title}
							subtitle={[item.place?.title ?? item.location ?? undefined, item.category ?? undefined]
								.filter(Boolean)
								.join(' · ')}
							body={item.description}
							media={item.cover_url ? {uri: item.cover_url} : undefined}
							mediaAlt={item.cover_url ? `Афиша события ${item.title}` : undefined}
							onPress={() => onOpenEvent(item.guid)}
							/* only counts the server actually returns */
							facts={[
								{label: 'идут', value: item.attendee_count},
								...(item.seats_left !== null ? [{label: 'мест осталось', value: item.seats_left}] : []),
							]}
							badges={item.has_ended ? undefined : <BerxCountdown startsAtUnix={item.starts} />}
							actions={
								item.has_ended ? undefined : (
									<BerxButton
										label={item.is_going ? 'Не пойду' : 'Пойду'}
										variant={item.is_going ? 'secondary' : 'primary'}
										loading={rsvpBusy === item.guid}
										/* a full event the viewer is not already in cannot be joined */
										disabled={!item.is_going && item.seats_left === 0}
										onPress={() => toggleRsvp(item)}
									/>
								)
							}
						/>
					)}
				/>
			</BerxDataBoundary>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1},
	toolbar: {paddingTop: spacing.sm, gap: spacing.sm},
	actions: {flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg},
	body: {flex: 1},
	list: {padding: spacing.lg, gap: spacing.md},
});
