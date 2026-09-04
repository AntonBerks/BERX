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
import {FlatList, StyleSheet, View} from 'react-native';
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
import {BerxFamilyScene} from '../spatial/BerxScreenScene';

export interface DatingMatchesScreenProps {
	api: BerxApiClient;
	onOpenConversation: (otherGuid: number, otherUsername: string) => void;
	onBack: () => void;
}

export default function DatingMatchesScreen(props: DatingMatchesScreenProps) {
	return (
		<BerxFamilyScene family="SOCIAL" testID="dating-matches">
			<DatingMatchesSceneBody {...props} />
		</BerxFamilyScene>
	);
}

function DatingMatchesSceneBody({api, onOpenConversation, onBack}: DatingMatchesScreenProps) {
	const {onScroll, scrollEventThrottle} = useBerxSceneScroll();
	const [matches, setMatches] = useState<BerxDatingMatch[]>([]);
	const [state, setState] = useState<BerxScreenState>('loading');
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState<number | null>(null);

	const load = useCallback(async () => {
		setState('loading');
		try {
			const res = await api.datingMatches();
			setMatches(res.matches);
			setError(null);
			setState(res.matches.length === 0 ? 'empty' : 'default');
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить совпадения');
			setState('error');
		}
	}, [api]);

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
				emptyTitle="Пока нет совпадений"
				emptyBody="Лайкните кого-то в разделе «Знакомства» — совпадение появится, когда симпатия окажется взаимной."
				style={styles.body}>
				<FlatList
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
									<View style={styles.actions}>
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
									</View>
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
	list: {padding: spacing.lg, gap: spacing.md},
	actions: {flexDirection: 'row', gap: spacing.sm},
});
