/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * ONE reusable screen for discovery feed, My Tracks, Profile Tracks,
 * and Creator Tracks — same pattern as VideoFeedScreen. Real data
 * throughout (api.trackFeed/userTracks).
 */
import {useCallback, useEffect, useState} from 'react';
import {View, FlatList, RefreshControl} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxTrackPost} from '@berx/api/types';
import {colors} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxTrackCard} from '../../../../packages/design-system/src/components/BerxTrackCard';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';

interface Props {
	api: BerxApiClient;
	userGuid?: number;
	isOwn?: boolean;
	title: string;
	onOpenTrack: (postGuid: number) => void;
	onOpenProfile: (username: string) => void;
	onCreate?: () => void;
	onBack?: () => void;
}

export default function TrackFeedScreen({api, userGuid, isOwn, title, onOpenTrack, onOpenProfile, onCreate, onBack}: Props) {
	const [items, setItems] = useState<BerxTrackPost[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = userGuid !== undefined ? await api.userTracks(userGuid) : await api.trackFeed();
			setItems(res.tracks);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить треки');
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, [api, userGuid]);

	useEffect(() => {
		load();
	}, [load]);

	if (loading) return <BerxLoadingState />;
	if (error) return <BerxErrorState message={error} onRetry={load} />;

	return (
		<View style={{flex: 1, backgroundColor: colors.bg}}>
			<BerxHeader title={title} onBack={onBack} />
			{isOwn && onCreate ? (
				<View style={{padding: 16}}>
					<BerxButton label="Загрузить трек" onPress={onCreate} fullWidth />
				</View>
			) : null}
			{items.length === 0 ? (
				<BerxEmptyState title="Треков пока нет" subtitle={isOwn ? 'Загрузите первый трек.' : undefined} />
			) : (
				<BerxFadeIn style={{flex: 1}}>
					<FlatList
						data={items}
						keyExtractor={(t: BerxTrackPost) => String(t.post_guid)}
						contentContainerStyle={{padding: 16}}
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
						renderItem={({item}: {item: BerxTrackPost}) => (
							<BerxTrackCard track={item} onPress={(t) => onOpenTrack(t.post_guid)} onOpenProfile={onOpenProfile} />
						)}
					/>
				</BerxFadeIn>
			)}
		</View>
	);
}
