/**
 * BERX-032 — Stories Tray. The HOME family's second named contract.
 *
 * Real data: api.storiesFeed() for other people's live stories and
 * api.ownStories() for the viewer's own, which is the only place
 * time_expires is returned — so this screen can show how long each of
 * your own stories has left, which the feed's tray cannot.
 *
 * The stories feed carries no per-viewer seen flag (only
 * POST /stories/{id}/view, which writes one), so a ring is dimmed
 * only for a group opened in this session and says nothing about
 * "seen" otherwise.
 */
import {useCallback, useEffect, useState} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxOwnStorySummary, BerxStoryFeedGroup} from '@berx/api/types';
import type {BerxScreenState} from '@berx/spatial';
import {spacing} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxStoryTray} from '../../../../packages/design-system/src/spatial/BerxStoryTray';
import {BerxSpatialCard} from '../../../../packages/design-system/src/spatial/BerxSpatialCard';
import {BerxCountdown} from '../../../../packages/design-system/src/spatial/BerxCountdown';
import {BerxDataBoundary} from '../../../../packages/design-system/src/spatial/BerxDataBoundary';
import {useBerxSceneScroll} from '../../../../packages/design-system/src/spatial/BerxSpatialScene';
import {BerxPartialNotice} from '../../../../packages/design-system/src/spatial/BerxPartialNotice';
import {BerxScreenScene, useBerxScreen} from '../spatial/BerxScreenScene';
import {classifyFailure} from '../spatial/screenState';
import {useBerxConnectivity} from '../spatial/useBerxConnectivity';
import {berxAnalytics} from '../spatial/analytics';
import {BerxText} from '../../../../packages/design-system/src/spatial/BerxText';

export interface StoriesRailScreenProps {
	api: BerxApiClient;
	onOpenGroup: (group: BerxStoryFeedGroup) => void;
	onCreateStory: () => void;
	onBack?: () => void;
}

export default function StoriesRailScreen(props: StoriesRailScreenProps) {
	return (
		<BerxScreenScene screenId="BERX-032" testID="berx-032">
			<StoriesSceneBody {...props} />
		</BerxScreenScene>
	);
}

function StoriesSceneBody({api, onOpenGroup, onCreateStory, onBack}: StoriesRailScreenProps) {
	const screen = useBerxScreen();
	const {onScroll, scrollEventThrottle} = useBerxSceneScroll();

	const [groups, setGroups] = useState<BerxStoryFeedGroup[]>([]);
	const [own, setOwn] = useState<BerxOwnStorySummary[]>([]);
	/* your own stories failing is not the same as having none */
	const [ownFailed, setOwnFailed] = useState(false);
	const [opened, setOpened] = useState<ReadonlySet<number>>(new Set());
	/* a fetch that failed while the device is offline is an offline
	   state, not a server error — the difference is the whole point */
	const {offline} = useBerxConnectivity();
	const [state, setState] = useState<BerxScreenState>('loading');
	const [error, setError] = useState<string | null>(null);
	/* a 403 or a 404 is not transient; a Retry button there is a lie */
	const [retryable, setRetryable] = useState(true);
	const [deletingId, setDeletingId] = useState<number | null>(null);

	const load = useCallback(async () => {
		setState('loading');
		try {
			const [feed, mine] = await Promise.all([
				api.storiesFeed(),
				/* own stories are a separate, optional read — a failure here
				   must not hide everyone else's, and must not be reported
				   as you having none either */
				api.ownStories().catch(() => null),
			]);
			setGroups(feed.feed);
			setOwn(mine?.stories ?? []);
			setOwnFailed(mine === null);
			setError(null);
			setState(feed.feed.length === 0 && (mine?.stories.length ?? 0) === 0 && mine !== null ? 'empty' : 'default');
		} catch (e) {
			/* the real reason, not one generic error: an expired session,
			   a forbidden resource and a dead server are different
			   problems, and being offline is a fourth */
			const failure = classifyFailure(e, offline);
			setError(failure.message);
			setRetryable(failure.retryable);
			setState(failure.state);
			berxAnalytics.error(screen, 'stories');
		}
	}, [api, screen, offline]);

	useEffect(() => {
		load();
	}, [load]);

	const open = useCallback(
		(ownerGuid: number) => {
			const group = groups.find((g) => g.owner_guid === ownerGuid);
			if (!group) return;
			setOpened((prev) => new Set(prev).add(ownerGuid));
			berxAnalytics.primaryAction(screen, ownerGuid);
			onOpenGroup(group);
		},
		[groups, onOpenGroup, screen],
	);

	const remove = useCallback(
		async (id: number) => {
			setDeletingId(id);
			try {
				await api.deleteStory(id);
				setOwn((prev) => prev.filter((s) => s.id !== id));
			} catch {
				/* the list stays as the server left it */
				berxAnalytics.mutationError(screen, 'story-delete');
			} finally {
				setDeletingId(null);
			}
		},
		[api, screen],
	);

	return (
		<View style={styles.screen}>
			<BerxHeader onBack={onBack} title="Истории" />

			<BerxDataBoundary
				state={state}
				onRetry={load}
				errorMessage={error ?? undefined}
				/* a forbidden or missing resource cannot be retried into existence */
				retryable={retryable}
				emptyTitle="Пока нет активных историй"
				emptyBody="Истории живут 24 часа с момента публикации."
				emptyAction={{label: 'Создать историю', onPress: onCreateStory}}
				style={styles.body}>
				<ScrollView
					onScroll={onScroll}
					scrollEventThrottle={scrollEventThrottle}
					contentContainerStyle={styles.scroll}
					showsVerticalScrollIndicator={false}>
					<BerxStoryTray
						onCreate={onCreateStory}
						onOpen={open}
						items={groups.map((g) => ({
							ownerGuid: g.owner_guid,
							name: g.owner_username ?? `#${g.owner_guid}`,
							count: g.stories.length,
							/* session-local only — the feed has no seen flag */
							seen: opened.has(g.owner_guid) ? true : undefined,
						}))}
					/>

					{ownFailed ? (
						/* partial data: everyone else's stories are here, yours
						   did not load, and an absent section would have read
						   as you not having posted one */
						<BerxPartialNotice
							message="Ваши истории не загрузились"
							onRetry={load}
							testID="stories-own-partial"
						/>
					) : null}

					{own.length > 0 ? (
						<View style={styles.section}>
							<BerxText role="micro" emphasis="tertiary" heading>
								Ваши истории
							</BerxText>
							{own.map((s) => (
								<BerxSpatialCard key={s.id} depth="D3" padding={spacing.md} radius={18}>
									<View style={styles.ownRow}>
										<View style={styles.ownText}>
											<BerxText role="meta" numberOfLines={2}>
												{s.caption || 'Без подписи'}
											</BerxText>
											{/* real expiry from the server, counted down */}
											<BerxCountdown startsAtUnix={s.time_expires} label="Исчезнет" />
										</View>
										<BerxButton
											label="Удалить"
											variant="secondary"
											loading={deletingId === s.id}
											onPress={() => remove(s.id)}
										/>
									</View>
								</BerxSpatialCard>
							))}
						</View>
					) : null}
				</ScrollView>
			</BerxDataBoundary>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1},
	body: {flex: 1},
	scroll: {paddingBottom: spacing.xxxl},
	section: {paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.sm},
	ownRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.md},
	ownText: {flex: 1, gap: spacing.xs},
});
