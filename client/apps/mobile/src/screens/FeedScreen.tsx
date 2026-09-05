/**
 * BERX-031 — Home Feed. A v9 HOME scene over the real feed endpoint.
 *
 * What changed for v9: the screen is now a resolved scene rather than
 * a flat list on a black background. Depth, material, lighting and
 * motion come from the BERX-031 contract via <BerxScreenScene>, the
 * seven states come from <BerxDataBoundary>, and the rows are real
 * spatial cards on the content plane with the story tray on the
 * control plane above them.
 *
 * What did NOT change: the data. `api.feed()` and `api.storiesFeed()`
 * are the same real calls, and two honest limits are carried forward
 * rather than papered over now that the UI looks richer:
 *
 *  - This is the caller's own wall (their posts plus friends' posts on
 *    it), not an aggregated following feed. The empty state says so.
 *  - Feed items deliberately carry no like_count or liked flag —
 *    feed.php avoids an N+1 count per item. So there is no reaction
 *    control here: a heart with no state behind it would be exactly
 *    the fake functionality v9 forbids. Reactions live on the post
 *    detail scene, where like_count is real.
 */
import {useCallback, useEffect, useState} from 'react';
import {RefreshControl, StyleSheet, View, Pressable} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxFeedItem, BerxStoryFeedGroup} from '@berx/api/types';
import {berxCount, relativeTimeLabel} from '@berx/domain';
import type {BerxScreenState} from '@berx/spatial';
import {spacing} from '@berx/design-system/tokens';
import {IconPlus} from '../../../../packages/design-system/src/components/BerxIcons';
import {BerxSceneHeader} from '../../../../packages/design-system/src/spatial/BerxSceneHeader';
import {BerxText} from '../../../../packages/design-system/src/spatial/BerxText';
import {BerxDataBoundary} from '../../../../packages/design-system/src/spatial/BerxDataBoundary';
import {BerxSpatialCard} from '../../../../packages/design-system/src/spatial/BerxSpatialCard';
import {BerxIdentity} from '../../../../packages/design-system/src/spatial/BerxIdentity';
import {BerxSceneList} from '../../../../packages/design-system/src/spatial/BerxSceneList';
import {BerxStoryTray} from '../../../../packages/design-system/src/spatial/BerxStoryTray';
import {useBerxSceneScroll} from '../../../../packages/design-system/src/spatial/BerxSpatialScene';
import {BerxPartialNotice} from '../../../../packages/design-system/src/spatial/BerxPartialNotice';
import {BerxScreenScene, useBerxScreen} from '../spatial/BerxScreenScene';
import {useBerxConnectivity} from '../spatial/useBerxConnectivity';
import {classifyFailure, type BerxFailure} from '../spatial/screenState';
import {berxAnalytics} from '../spatial/analytics';

interface Props {
	api: BerxApiClient;
	onOpenPost: (guid: number) => void;
	onOpenProfile: (username: string) => void;
	onCreatePost: () => void;
	onOpenStoryGroup: (group: BerxStoryFeedGroup) => void;
	onCreateStory: () => void;
}

export default function FeedScreen(props: Props) {
	return (
		<BerxScreenScene screenId="BERX-031" testID="berx-031">
			<FeedSceneBody {...props} />
		</BerxScreenScene>
	);
}

function FeedSceneBody({api, onOpenPost, onOpenProfile, onCreatePost, onOpenStoryGroup, onCreateStory}: Props) {
	const screen = useBerxScreen();
	const {onScroll, scrollEventThrottle} = useBerxSceneScroll();

	const [items, setItems] = useState<BerxFeedItem[]>([]);
	const [storyGroups, setStoryGroups] = useState<BerxStoryFeedGroup[]>([]);
	const {offline} = useBerxConnectivity();
	const [state, setState] = useState<BerxScreenState>('loading');
	const [refreshing, setRefreshing] = useState(false);
	const [failure, setFailure] = useState<BerxFailure | null>(null);
	/**
	 * Session-local, and labelled as such: the stories feed has no
	 * per-viewer seen flag, so this is only "opened in this run of the
	 * app" — never presented as server truth.
	 */
	const [openedThisSession, setOpenedThisSession] = useState<ReadonlySet<number>>(new Set());
	/**
	 * Stories failing while the feed loads is partial data, not an
	 * error and not emptiness. An empty rail here used to be
	 * indistinguishable from nobody having posted a story.
	 */
	const [storiesFailed, setStoriesFailed] = useState(false);

	const load = useCallback(async () => {
		try {
			const [feedRes, storiesRes] = await Promise.all([
				api.feed(20, 0),
				/* stories failing must not take the feed down with it —
				   but it must not pass silently either */
				api.storiesFeed().catch(() => null),
			]);
			setItems(feedRes.items);
			setStoryGroups(storiesRes?.feed ?? []);
			setStoriesFailed(storiesRes === null);
			setFailure(null);
			setState(feedRes.items.length === 0 ? 'empty' : 'default');
		} catch (e) {
			/**
			 * A real classification instead of one generic error: an
			 * expired session, a forbidden feed and a dead server are
			 * different problems with different answers, and the device
			 * being offline is a fourth.
			 */
			const next = classifyFailure(e, offline);
			setFailure(next);
			setState(next.state);
			berxAnalytics.error(screen, `feed:${next.kind}`);
		} finally {
			setRefreshing(false);
		}
	}, [api, screen, offline]);

	useEffect(() => {
		load();
	}, [load]);

	const refresh = useCallback(() => {
		setRefreshing(true);
		load();
	}, [load]);

	const openStories = useCallback(
		(ownerGuid: number) => {
			const group = storyGroups.find((g) => g.owner_guid === ownerGuid);
			if (!group) return;
			setOpenedThisSession((prev) => new Set(prev).add(ownerGuid));
			berxAnalytics.primaryAction(screen, ownerGuid);
			onOpenStoryGroup(group);
		},
		[storyGroups, onOpenStoryGroup, screen],
	);

	/**
	 * The scene names itself instead of wearing a title bar: the
	 * wordmark as the overline, the screen's own name at display size,
	 * and a real count underneath — not a slogan, and not a number the
	 * feed does not have. The compose action sits on the control
	 * plane beside it, where it is nearer than the title and never
	 * over it.
	 */
	const header = (
		<BerxSceneHeader
			mark
			title="Лента"
			subtitle={items.length > 0 ? `${berxCount(items.length, 'пост', 'поста', 'постов')} на вашей стене` : undefined}
			actions={
				<Pressable
					onPress={onCreatePost}
					accessibilityRole="button"
					accessibilityLabel="Создать пост"
					style={styles.headerAction}>
					<IconPlus size={20} color={screen.scene.accent} />
				</Pressable>
			}
			testID="feed-header"
		/>
	);

	const tray = storiesFailed ? (
		/* partial data: the feed is here, the stories are not, and an
		   empty rail would have said the opposite */
		<BerxPartialNotice message="Истории не загрузились" onRetry={load} testID="feed-stories-partial" />
	) : (
		<BerxStoryTray
			onCreate={onCreateStory}
			onOpen={openStories}
			items={storyGroups.map((g) => ({
				ownerGuid: g.owner_guid,
				name: g.owner_username ?? `#${g.owner_guid}`,
				count: g.stories.length,
				seen: openedThisSession.has(g.owner_guid) ? true : undefined,
			}))}
		/>
	);

	return (
		<View style={styles.screen}>
			{header}
			<BerxDataBoundary
				state={state}
				onRetry={load}
				retryable={failure?.retryable ?? true}
				errorMessage={failure?.message}
				/* cached items are shown with the offline indicator rather than hidden */
				hasCachedContent={items.length > 0}
				emptyTitle="Пока нет постов"
				emptyBody="Это ваша стена — ваши посты и посты друзей на ней, а не общая лента всех подписок."
				emptyAction={{label: 'Написать пост', onPress: onCreatePost}}
				style={styles.body}>
				<BerxSceneList
					screen={screen}
					data={items}
					keyExtractor={(item: BerxFeedItem) => String(item.guid)}
					onScroll={onScroll}
					scrollEventThrottle={scrollEventThrottle}
					refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={screen.scene.accent} />}
					ListHeaderComponent={tray}
					/* virtualization window from the resolved performance budget */
					initialNumToRender={Math.min(items.length, 6)}
					maxToRenderPerBatch={6}
					windowSize={Math.max(3, Math.round(screen.scene.budget.listWindowSize / 3))}
					removeClippedSubviews
					/* the padding and the rhythm come from the layout
					   contract now, not from a number this screen picked */
					contentContainerStyle={styles.list}
					renderItem={({item}: {item: BerxFeedItem}) => (
						<BerxSpatialCard
							depth="D3"
							onPress={() => onOpenPost(item.guid)}
							accessibilityLabel={`Пост от ${item.owner_username ?? 'BERX'}, ${relativeTimeLabel(item.time_created)}`}
							accessibilityHint="Открыть пост"
							testID={`feed-post-${item.guid}`}>
							<BerxIdentity
								userGuid={item.owner_guid}
								name={item.owner_username ?? 'BERX'}
								subtitle={relativeTimeLabel(item.time_created)}
								size={38}
								/* the author was tappable before v9 and still is */
								onPress={item.owner_username ? () => onOpenProfile(item.owner_username as string) : undefined}
							/>
							{/* the post itself reads at body measure, with the
							    space above it doing the separating — a rule
							    across the card would be a second border inside
							    an object that already has one edge */}
							<BerxText role="body" style={styles.postText}>
								{item.text}
							</BerxText>
						</BerxSpatialCard>
					)}
				/>
			</BerxDataBoundary>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1},
	body: {flex: 1},
	/* 44dp, per the v9 accessibility contract — it was a bare icon before */
	headerAction: {minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center'},
	/* only the bottom is this screen's business: the floating tab bar
	   sits over the end of the list. The gutter and the gap between
	   objects come from the layout contract. */
	list: {paddingBottom: spacing.xxxl},
	postText: {marginTop: spacing.sm},
});
