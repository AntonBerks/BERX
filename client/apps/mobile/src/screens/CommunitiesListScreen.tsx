/**
 * BERX-266 — Communities. The COMMUNITY family's v9 scene.
 *
 * Real data: api.communities() and api.myCommunities() from the real
 * groups endpoints. Membership drives the action, and all three
 * states are real: a member sees "Выйти", a non-member "Вступить",
 * and someone whose request the server has recorded sees that it is
 * pending — no button that assumes the answer.
 */
import {useCallback, useEffect, useState} from 'react';
import {FlatList, StyleSheet, View} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxCommunity} from '@berx/api/types';
import type {BerxScreenState} from '@berx/spatial';
import {spacing} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxCommunityCard} from '../../../../packages/design-system/src/spatial/BerxCommunityCard';
import type {BerxMembership} from '../../../../packages/design-system/src/spatial/BerxCommunityCard';
import {BerxFilterBar} from '../../../../packages/design-system/src/spatial/BerxFilterBar';
import {BerxDataBoundary} from '../../../../packages/design-system/src/spatial/BerxDataBoundary';
import {useBerxSceneScroll} from '../../../../packages/design-system/src/spatial/BerxSpatialScene';
import {BerxActionShelf} from '../../../../packages/design-system/src/spatial/BerxActionShelf';
import {BerxScreenScene, useBerxScreen} from '../spatial/BerxScreenScene';
import {classifyFailure} from '../spatial/screenState';
import {useBerxConnectivity} from '../spatial/useBerxConnectivity';
import {berxAnalytics} from '../spatial/analytics';

export interface CommunitiesListScreenProps {
	api: BerxApiClient;
	onOpenCommunity: (guid: number) => void;
	onCreate: () => void;
	onBack?: () => void;
}

export default function CommunitiesListScreen(props: CommunitiesListScreenProps) {
	return (
		<BerxScreenScene screenId="BERX-266" testID="berx-266">
			<CommunitiesSceneBody {...props} />
		</BerxScreenScene>
	);
}

function CommunitiesSceneBody({api, onOpenCommunity, onCreate, onBack}: CommunitiesListScreenProps) {
	const screen = useBerxScreen();
	const {onScroll, scrollEventThrottle} = useBerxSceneScroll();

	const [scope, setScope] = useState<'all' | 'mine'>('all');
	const [items, setItems] = useState<BerxCommunity[]>([]);
	/* a fetch that failed while the device is offline is an offline
	   state, not a server error — the difference is the whole point */
	const {offline} = useBerxConnectivity();
	const [state, setState] = useState<BerxScreenState>('loading');
	const [error, setError] = useState<string | null>(null);
	/* a 403 or a 404 is not transient; a Retry button there is a lie */
	const [retryable, setRetryable] = useState(true);
	const [busy, setBusy] = useState<number | null>(null);

	const load = useCallback(async () => {
		setState('loading');
		setError(null);
		try {
			const res = scope === 'mine' ? await api.myCommunities() : await api.communities();
			setItems(res.communities);
			setState(res.communities.length === 0 ? 'empty' : 'default');
		} catch (e) {
			/* the real reason, not one generic error: an expired session,
			   a forbidden resource and a dead server are different
			   problems, and being offline is a fourth */
			const failure = classifyFailure(e, offline);
			setError(failure.message);
			setRetryable(failure.retryable);
			setState(failure.state);
			berxAnalytics.error(screen, 'communities');
		}
	}, [api, scope, screen, offline]);

	useEffect(() => {
		load();
	}, [load]);

	const toggleMembership = useCallback(
		async (community: BerxCommunity) => {
			setBusy(community.guid);
			berxAnalytics.mutationStart(screen, community.guid);
			const started = Date.now();
			try {
				if (community.is_member) await api.leaveCommunity(community.guid);
				else await api.joinCommunity(community.guid);
				/**
				 * Re-read rather than flipping locally: a closed community
				 * turns a join into a pending request, and only the server
				 * knows which of the two just happened.
				 */
				await load();
				berxAnalytics.mutationSuccess(screen, Date.now() - started, community.guid);
			} catch {
				berxAnalytics.mutationError(screen, 'membership');
			} finally {
				setBusy(null);
			}
		},
		[api, load, screen],
	);

	return (
		<View style={styles.screen}>
			<BerxHeader title="Сообщества" onBack={onBack} />

			<View style={styles.toolbar}>
				<BerxFilterBar
					options={[
						{key: 'all', label: 'Все'},
						{key: 'mine', label: 'Мои'},
					]}
					selected={[scope]}
					onToggle={(key) => setScope(key as 'all' | 'mine')}
					multiple={false}
					accessibilityLabel="Какие сообщества показать"
				/>
				<BerxActionShelf variant="anchored">
					<BerxButton label="Создать сообщество" onPress={onCreate} />
				</BerxActionShelf>
			</View>

			<BerxDataBoundary
				state={state}
				onRetry={load}
				errorMessage={error ?? undefined}
				/* a forbidden or missing resource cannot be retried into existence */
				retryable={retryable}
				emptyTitle={scope === 'mine' ? 'Вы пока никуда не вступили' : 'Сообществ пока нет'}
				emptyBody={
					scope === 'mine'
						? 'Найдите сообщество во вкладке «Все» — или создайте своё.'
						: 'Создайте первое сообщество вокруг того, что вам важно.'
				}
				emptyAction={{label: 'Создать сообщество', onPress: onCreate}}
				style={styles.body}>
				<FlatList
					data={items}
					keyExtractor={(c: BerxCommunity) => String(c.guid)}
					onScroll={onScroll}
					scrollEventThrottle={scrollEventThrottle}
					contentContainerStyle={styles.list}
					removeClippedSubviews
					windowSize={Math.max(3, Math.round(screen.scene.budget.listWindowSize / 3))}
					renderItem={({item}: {item: BerxCommunity}) => {
						const membership: BerxMembership = item.is_member ? 'member' : 'none';
						return (
							<BerxCommunityCard
								communityGuid={item.guid}
								name={item.name}
								description={item.description}
								/**
								 * No cover and no member count: the communities
								 * endpoint returns guid, name, description,
								 * owner_guid, privacy and is_member, and nothing
								 * else. A grey placeholder image and a "0
								 * участников" would both be inventions.
								 */
								membership={membership}
								onPress={() => onOpenCommunity(item.guid)}
								actions={
									<BerxButton
										label={item.is_member ? 'Выйти' : 'Вступить'}
										variant={item.is_member ? 'secondary' : 'primary'}
										loading={busy === item.guid}
										onPress={() => toggleMembership(item)}
									/>
								}
							/>
						);
					}}
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
