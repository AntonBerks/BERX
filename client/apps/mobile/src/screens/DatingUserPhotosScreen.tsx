/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * MAX BUILD — the other half of DatingPhotosScreen's gap:
 * api.requestDatingPhotoAccess() was always a real, working client
 * method with zero UI caller, because there was nowhere in the app a
 * viewer could even see that another user HAD private photos to
 * request. New GET /dating/photos/user/{guid} (real, added this
 * batch) lists a match's photos with a real per-photo `can_view` —
 * unlocked ones render the actual image (via the same authenticated
 * /media stream DatingPhotosScreen uses), locked ones show a lock
 * placeholder with a real "Запросить доступ" action.
 *
 * Reachable only from a real, existing match (DatingMatchesScreen) —
 * requestPhotoAccess() itself has no mutual-match precondition
 * server-side, but surfacing this from an unmatched stranger's
 * profile isn't a flow this app builds anywhere else, so this screen
 * isn't either.
 */
import {useCallback, useEffect, useState} from 'react';
import {View, Text, FlatList, Image, Pressable, Dimensions, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxDatingUserPhoto} from '@berx/api/types';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';

interface Props {
	api: BerxApiClient;
	userGuid: number;
	username: string;
	onBack?: () => void;
}

const TILE = Dimensions.get('window').width / 3 - spacing.md;

export default function DatingUserPhotosScreen({api, userGuid, username, onBack}: Props) {
	const [photos, setPhotos] = useState<BerxDatingUserPhoto[]>([]);
	const [authHeaders, setAuthHeaders] = useState<Record<string, string>>({});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [busyId, setBusyId] = useState<number | null>(null);
	const [requestedIds, setRequestedIds] = useState<Set<number>>(new Set());

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const [p, h] = await Promise.all([api.userDatingPhotos(userGuid), api.getAuthHeaders()]);
			setPhotos(p.photos);
			setAuthHeaders(h);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить фото');
		} finally {
			setLoading(false);
		}
	}, [api, userGuid]);

	useEffect(() => {
		load();
	}, [load]);

	async function requestAccess(photoId: number) {
		setBusyId(photoId);
		try {
			await api.requestDatingPhotoAccess(photoId);
			setRequestedIds((prev: Set<number>) => new Set(prev).add(photoId));
		} catch {
			// stays as "not requested yet" on failure — user can retry
		} finally {
			setBusyId(null);
		}
	}

	if (loading) return <BerxLoadingState />;
	if (error) return <BerxErrorState message={error} onRetry={load} />;

	return (
		<View style={styles.screen}>
			<BerxHeader title={`Фото · @${username}`} onBack={onBack} />
			{photos.length === 0 ? (
				<BerxEmptyState title="Фотографий пока нет" />
			) : (
				<FlatList
					data={photos}
					keyExtractor={(p: BerxDatingUserPhoto) => String(p.id)}
					numColumns={3}
					contentContainerStyle={styles.grid}
					renderItem={({item}: {item: BerxDatingUserPhoto}) =>
						item.can_view ? (
							<View style={styles.tileWrap}>
								<Image source={{uri: api.datingPhotoUrl(item.id), headers: authHeaders}} style={styles.tile} />
							</View>
						) : (
							<Pressable
								style={[styles.tileWrap, styles.locked]}
								onPress={() => requestAccess(item.id)}
								disabled={busyId === item.id || requestedIds.has(item.id)}>
								<Text style={styles.lockIcon}>🔒</Text>
								<Text style={styles.lockLabel}>
									{requestedIds.has(item.id) ? 'Запрошено' : busyId === item.id ? '…' : 'Запросить доступ'}
								</Text>
							</Pressable>
						)
					}
				/>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	grid: {padding: spacing.md, gap: spacing.sm},
	tileWrap: {width: TILE, height: TILE, margin: spacing.xs / 2},
	tile: {width: '100%', height: '100%', borderRadius: 8, backgroundColor: colors.graphite},
	locked: {backgroundColor: colors.surface, borderRadius: 8, alignItems: 'center', justifyContent: 'center', gap: 4, padding: spacing.xs},
	lockIcon: {fontSize: typography.sizeLg},
	lockLabel: {fontSize: typography.sizeXs, color: colors.accent, textAlign: 'center', fontWeight: typography.weightMedium},
});
