/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * ONE reusable screen for every video listing surface — discovery
 * feed, My Videos, Profile Videos, Creator Videos — not four
 * separate implementations. Passing `userGuid` filters to one
 * owner's videos (api.userVideos); omitting it loads the real
 * discovery feed (api.videoFeed). Real data throughout.
 */
import {useCallback, useEffect, useState} from 'react';
import {View} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxVideoPost} from '@berx/api/types';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxVideoCard} from '../../../../packages/design-system/src/components/BerxVideoCard';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxFamilyScene} from '../spatial/BerxScreenScene';
import {classifyFailure} from '../spatial/screenState';
import {useBerxConnectivity} from '../spatial/useBerxConnectivity';
import {BerxSceneList} from '../../../../packages/design-system/src/spatial/BerxSceneList';
import {BerxIconButton} from '../../../../packages/design-system/src/icons';

export interface VideoFeedScreenProps {
	api: BerxApiClient;
	userGuid?: number;
	isOwn?: boolean;
	title: string;
	onOpenVideo: (postGuid: number) => void;
	onOpenProfile: (username: string) => void;
	onCreate?: () => void;
	onBack?: () => void;
}

export default function VideoFeedScreen(props: VideoFeedScreenProps) {
	return (
		<BerxFamilyScene family="HOME" atmosphereKind="immersive" testID="video-feed">
			<VideoFeedScreenBody {...props} />
		</BerxFamilyScene>
	);
}

function VideoFeedScreenBody({api, userGuid, isOwn, title, onOpenVideo, onOpenProfile, onCreate, onBack}: VideoFeedScreenProps) {
	/* a fetch that failed while the device is offline is an offline
	   state, not a server error — the difference is the whole point */
	const {offline} = useBerxConnectivity();
	/* a 403 or a 404 is not transient; a Retry button there is a lie */
	const [retryable, setRetryable] = useState(true);
	const [items, setItems] = useState<BerxVideoPost[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = userGuid !== undefined ? await api.userVideos(userGuid) : await api.videoFeed();
			setItems(res.videos);
		} catch (e) {
			/* the real reason, not one generic error: an expired session,
			   a forbidden resource and a dead server are different problems,
			   and being offline is a fourth. A 403 or a 404 also stops
			   offering a Retry that cannot work. */
			const failure = classifyFailure(e, offline);
			setError(failure.message);
			setRetryable(failure.retryable);
		} finally {
			setLoading(false);
		}
	}, [api, userGuid, offline]);

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
			actions={isOwn && onCreate ? <BerxIconButton name="upload" accessibilityLabel="Загрузить видео" onPress={onCreate} /> : undefined}
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
				<BerxErrorState message={error} onRetry={retryable ? load : undefined} />
			</View>
		);

	return (
		/* no opaque fill: the scene paints the room */
		<View style={{flex: 1}}>
			{/* the upload sits on the control plane beside the scene's
			    name, not as a full-width bar across the top of the room */}
			{header}
			{items.length === 0 ? (
				<BerxEmptyState title="Видео пока нет" subtitle={isOwn ? 'Загрузите первое видео.' : undefined} />
			) : (
				<BerxSceneList
					data={items}
					keyExtractor={(v: BerxVideoPost) => String(v.post_guid)}
					/* the gutter and the rhythm come from the layout contract */
					contentContainerStyle={{paddingBottom: 48}}
					renderItem={({item}: {item: BerxVideoPost}) => (
						<BerxVideoCard video={item} onPress={(v) => onOpenVideo(v.post_guid)} onOpenProfile={onOpenProfile} />
					)}
				/>
			)}
		</View>
	);
}
