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
import {View, FlatList, RefreshControl} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxVideoPost} from '@berx/api/types';
import {colors} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxVideoCard} from '../../../../packages/design-system/src/components/BerxVideoCard';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';

interface Props {
	api: BerxApiClient;
	userGuid?: number;
	isOwn?: boolean;
	title: string;
	onOpenVideo: (postGuid: number) => void;
	onOpenProfile: (username: string) => void;
	onCreate?: () => void;
	onBack?: () => void;
}

export default function VideoFeedScreen({api, userGuid, isOwn, title, onOpenVideo, onOpenProfile, onCreate, onBack}: Props) {
	const [items, setItems] = useState<BerxVideoPost[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
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
					<BerxButton label="Загрузить видео" onPress={onCreate} fullWidth />
				</View>
			) : null}
			{items.length === 0 ? (
				<BerxEmptyState title="Видео пока нет" subtitle={isOwn ? 'Загрузите первое видео.' : undefined} />
			) : (
				<BerxFadeIn style={{flex: 1}}>
					<FlatList
						data={items}
						keyExtractor={(v: BerxVideoPost) => String(v.post_guid)}
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
						renderItem={({item}: {item: BerxVideoPost}) => (
							<BerxVideoCard video={item} onPress={(v) => onOpenVideo(v.post_guid)} onOpenProfile={onOpenProfile} />
						)}
					/>
				</BerxFadeIn>
			)}
		</View>
	);
}
