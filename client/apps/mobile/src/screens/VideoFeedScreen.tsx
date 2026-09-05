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
			setError(e instanceof Error ? e.message : 'Не удалось загрузить видео');
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
			{/* the upload sits on the control plane beside the scene's
			    name, not as a full-width bar across the top of the room */}
			<BerxHeader
				title={title}
				onBack={onBack}
				actions={isOwn && onCreate ? <BerxIconButton name="upload" accessibilityLabel="Загрузить видео" onPress={onCreate} /> : undefined}
			/>
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
