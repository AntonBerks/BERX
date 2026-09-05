/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * ONE reusable screen for discovery feed, My Tracks, Profile Tracks,
 * and Creator Tracks — same pattern as VideoFeedScreen. Real data
 * throughout (api.trackFeed/userTracks).
 */
import {useCallback, useEffect, useState} from 'react';
import {View, FlatList} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxTrackPost} from '@berx/api/types';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxTrackCard} from '../../../../packages/design-system/src/components/BerxTrackCard';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxFamilyScene} from '../spatial/BerxScreenScene';

export interface TrackFeedScreenProps {
	api: BerxApiClient;
	userGuid?: number;
	isOwn?: boolean;
	title: string;
	onOpenTrack: (postGuid: number) => void;
	onOpenProfile: (username: string) => void;
	onCreate?: () => void;
	onBack?: () => void;
}

export default function TrackFeedScreen(props: TrackFeedScreenProps) {
	return (
		<BerxFamilyScene family="HOME" atmosphereKind="immersive" testID="track-feed">
			<TrackFeedScreenBody {...props} />
		</BerxFamilyScene>
	);
}

function TrackFeedScreenBody({api, userGuid, isOwn, title, onOpenTrack, onOpenProfile, onCreate, onBack}: TrackFeedScreenProps) {
	const [items, setItems] = useState<BerxTrackPost[]>([]);
	const [loading, setLoading] = useState(true);
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
		}
	}, [api, userGuid]);

	useEffect(() => {
		load();
	}, [load]);

	if (loading) return <BerxLoadingState />;
	if (error) return <BerxErrorState message={error} onRetry={load} />;

	return (
		/* no opaque fill: the scene paints the room */
		<View style={{flex: 1}}>
			<BerxHeader title={title} onBack={onBack} />
			{isOwn && onCreate ? (
				<View style={{padding: 16}}>
					<BerxButton label="Загрузить трек" onPress={onCreate} fullWidth />
				</View>
			) : null}
			{items.length === 0 ? (
				<BerxEmptyState title="Треков пока нет" subtitle={isOwn ? 'Загрузите первый трек.' : undefined} />
			) : (
				<FlatList
					data={items}
					keyExtractor={(t: BerxTrackPost) => String(t.post_guid)}
					contentContainerStyle={{padding: 16}}
					renderItem={({item}: {item: BerxTrackPost}) => (
						<BerxTrackCard track={item} onPress={(t) => onOpenTrack(t.post_guid)} onOpenProfile={onOpenProfile} />
					)}
				/>
			)}
		</View>
	);
}
