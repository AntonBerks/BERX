/**
 * Dating / Matches — a SOCIAL-family v9 scene.
 *
 * Real data: `/dating/matches`. Two real actions per match:
 * messaging, which goes to the same real conversation thread as any
 * other, and unmatching via `/dating/unmatch` — a real endpoint that
 * had no UI at all, so a match could be made and never undone.
 *
 * Unmatching re-reads the list rather than splicing locally, because
 * the server decides what a match list contains after the call.
 */
import {useCallback, useEffect, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxDatingMatch} from '@berx/api/types';
import type {BerxScreenState} from '@berx/spatial';
import {spacing} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxIdentity} from '../../../../packages/design-system/src/spatial/BerxIdentity';
import {BerxSpatialCard} from '../../../../packages/design-system/src/spatial/BerxSpatialCard';
import {BerxDataBoundary} from '../../../../packages/design-system/src/spatial/BerxDataBoundary';
import {useBerxSceneScroll} from '../../../../packages/design-system/src/spatial/BerxSpatialScene';
import {BerxActionShelf} from '../../../../packages/design-system/src/spatial/BerxActionShelf';
import {BerxFamilyScene} from '../spatial/BerxScreenScene';
import {classifyFailure} from '../spatial/screenState';
import {useBerxConnectivity} from '../spatial/useBerxConnectivity';
import {BerxSceneList} from '../../../../packages/design-system/src/spatial/BerxSceneList';

export interface DatingMatchesScreenProps {
	api: BerxApiClient;
	onOpenConversation: (otherGuid: number, otherUsername: string) => void;
	onBack: () => void;
}

export default function DatingMatchesScreen(props: DatingMatchesScreenProps) {
	return (
		<BerxFamilyScene family="SOCIAL" atmosphereKind="identity" testID="dating-matches">
			<DatingMatchesSceneBody {...props} />
		</BerxFamilyScene>
	);
}

function DatingMatchesSceneBody({api, onOpenConversation, onBack}: DatingMatchesScreenProps) {
	const {onScroll, scrollEventThrottle} = useBerxSceneScroll();
	const [matches, setMatches] = useState<BerxDatingMatch[]>([]);
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
		try {
			const res = await api.datingMatches();
			setMatches(res.matches);
			setError(null);
			setState(res.matches.length === 0 ? 'empty' : 'default');
		} catch (e) {
			/* the real reason, not one generic error: an expired session,
			   a forbidden resource and a dead server are different
			   problems, and being offline is a fourth */
			const failure = classifyFailure(e, offline);
			setError(failure.message);
			setRetryable(failure.retryable);
			setState(failure.state);
		}
	}, [api, offline]);

	useEffect(() => {
		load();
	}, [load]);

	const unmatch = useCallback(
		async (guid: number) => {
			setBusy(guid);
			try {
				await api.unmatchDating(guid);
				/* the server decides what the list holds afterwards */
				await load();
			} catch {
				/* list stays as the server left it */
			} finally {
				setBusy(null);
			}
		},
		[api, load],
	);

	return (
		<View style={styles.screen}>
			<BerxHeader onBack={onBack} title="Совпадения" />
			<BerxDataBoundary
				state={state}
				onRetry={load}
				errorMessage={error ?? undefined}
				/* a forbidden or missing resource cannot be retried into existence */
				retryable={retryable}
				emptyTitle="Пока нет совпадений"
				emptyBody="Лайкните кого-то в разделе «Знакомства» — совпадение появится, когда симпатия окажется взаимной."
				style={styles.body}>
				<BerxSceneList
					data={matches}
					keyExtractor={(m: BerxDatingMatch) => String(m.guid)}
					onScroll={onScroll}
					scrollEventThrottle={scrollEventThrottle}
					contentContainerStyle={styles.list}
					removeClippedSubviews
					renderItem={({item}: {item: BerxDatingMatch}) => (
						<BerxSpatialCard depth="D3" padding={spacing.md} radius={18}>
							<BerxIdentity
								userGuid={item.guid}
								name={item.fullname || item.username}
								handle={item.username}
								onPress={() => onOpenConversation(item.guid, item.username)}
								trailing={
									<BerxActionShelf variant="anchored">
										<BerxButton
											label="Написать"
											onPress={() => onOpenConversation(item.guid, item.username)}
										/>
										<BerxButton
											label="Убрать"
											variant="secondary"
											loading={busy === item.guid}
											onPress={() => unmatch(item.guid)}
										/>
									</BerxActionShelf>
								}
							/>
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
	list: {paddingBottom: spacing.xxxl},
	actions: {flexDirection: 'row', gap: spacing.sm},
});
