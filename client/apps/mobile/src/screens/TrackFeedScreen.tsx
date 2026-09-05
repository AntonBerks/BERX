/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * ONE reusable screen for discovery feed, My Tracks, Profile Tracks,
 * and Creator Tracks — same pattern as VideoFeedScreen. Real data
 * throughout (api.trackFeed/userTracks).
 */
import {useCallback, useEffect, useState} from 'react';
import {View} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxTrackPost} from '@berx/api/types';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxTrackCard} from '../../../../packages/design-system/src/components/BerxTrackCard';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxFamilyScene} from '../spatial/BerxScreenScene';
import {BerxSceneList} from '../../../../packages/design-system/src/spatial/BerxSceneList';
import {BerxIconButton} from '../../../../packages/design-system/src/icons';

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

	/* hoisted: the way back has to survive loading and failure — it
	   used to render only once the data arrived, so a failed fetch left
	   a pushed screen with no exit */
	const header = (
		<BerxHeader
			title={title}
			onBack={onBack}
			actions={isOwn && onCreate ? <BerxIconButton name="upload" accessibilityLabel="Загрузить трек" onPress={onCreate} /> : undefined}
		/>
	);

	if (loading)
		return (
			<View style={{flex: 1}}>
				{header}
				<BerxLoadingState />
			</View>
		);
	if (error)
		return (
			<View style={{flex: 1}}>
				{header}
				<BerxErrorState message={error} onRetry={load} />
			</View>
		);

	return (
		/* no opaque fill: the scene paints the room */
		<View style={{flex: 1}}>
			{/* the upload sits on the control plane beside the scene's
			    name, not as a full-width bar across the top of the room */}
			{header}
			{items.length === 0 ? (
				<BerxEmptyState title="Треков пока нет" subtitle={isOwn ? 'Загрузите первый трек.' : undefined} />
			) : (
				<BerxSceneList
					data={items}
					keyExtractor={(t: BerxTrackPost) => String(t.post_guid)}
					/* the gutter and the rhythm come from the layout contract */
					contentContainerStyle={{paddingBottom: 48}}
					renderItem={({item}: {item: BerxTrackPost}) => (
						<BerxTrackCard track={item} onPress={(t) => onOpenTrack(t.post_guid)} onOpenProfile={onOpenProfile} />
					)}
				/>
			)}
		</View>
	);
}
