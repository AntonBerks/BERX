/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * Real data + real upload/delete: api.getAlbum()/uploadAlbumPhoto()/
 * deleteAlbumPhoto() (components/OssnApi/v1/albums.php — the upload
 * endpoint bridges OssnPhotos::AddPhoto()'s real resize/crop/CDN
 * logic into the API's stateless auth via a session bridge; see that
 * file's header comment for the full story). Same `pickImage`
 * injected-prop pattern as CreateStoryScreen — no image-picker
 * library is installable in this sandbox (npm blocked), so the
 * actual device picker is a separate piece that plugs into this
 * prop; this screen owns everything after a file is selected.
 *
 * MAX BUILD — real Delete Album (OssnAlbums::deleteAlbum(), zero
 * prior UI caller anywhere in this codebase — only single-photo
 * delete existed before this). Owner-only, confirmed before sending.
 */
import {useCallback, useEffect, useState} from 'react';
import {View, Text, FlatList, Image, Pressable, Alert, Dimensions, RefreshControl, StyleSheet} from 'react-native';
import type {BerxApiClient, BerxFilePart} from '@berx/api/client';
import type {BerxAlbumDetail, BerxAlbumPhoto} from '@berx/api/types';
import type {BerxAuthState} from '@berx/auth';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';

interface Props {
	api: BerxApiClient;
	guid: number;
	authState: BerxAuthState;
	pickImage: () => Promise<BerxFilePart | null>;
	onBack?: () => void;
	onDeleted?: () => void;
}

const TILE = Dimensions.get('window').width / 3;

export default function AlbumDetailScreen({api, guid, authState, pickImage, onBack, onDeleted}: Props) {
	const [album, setAlbum] = useState<BerxAlbumDetail | null>(null);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [uploading, setUploading] = useState(false);
	const [busyGuid, setBusyGuid] = useState<number | null>(null);
	const [deletingAlbum, setDeletingAlbum] = useState(false);

	const myGuid = authState.getSnapshot().user?.guid;
	const isOwn = !!album && !!myGuid && album.owner_guid === myGuid;

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await api.getAlbum(guid);
			setAlbum(res);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить альбом');
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, [api, guid]);

	useEffect(() => {
		load();
	}, [load]);

	async function handleAddPhoto() {
		const picked = await pickImage();
		if (!picked) return; // user cancelled, or no picker wired yet — not an error state
		setUploading(true);
		setError(null);
		try {
			await api.uploadAlbumPhoto(guid, picked);
			await load();
		} catch {
			setError('Не удалось загрузить фото. Проверьте формат (JPEG/PNG/WebP/GIF) и размер (до 8 МБ).');
		} finally {
			setUploading(false);
		}
	}

	async function handleDeletePhoto(photoGuid: number) {
		if (!album) return;
		setBusyGuid(photoGuid);
		try {
			await api.deleteAlbumPhoto(album.guid, photoGuid);
			setAlbum({...album, photos: album.photos.filter((p: BerxAlbumPhoto) => p.guid !== photoGuid)});
		} catch {
			// list stays as-is on failure — never optimistically removed before the server confirms
		} finally {
			setBusyGuid(null);
		}
	}

	function confirmDeleteAlbum() {
		if (!album) return;
		Alert.alert(
			'Удалить альбом?',
			'Все фотографии в этом альбоме будут удалены безвозвратно.',
			[
				{text: 'Отмена', style: 'cancel'},
				{
					text: 'Удалить',
					style: 'destructive',
					onPress: async () => {
						setDeletingAlbum(true);
						try {
							await api.deleteAlbum(album.guid);
							if (onDeleted) onDeleted();
							else if (onBack) onBack();
						} catch {
							setError('Не удалось удалить альбом');
						} finally {
							setDeletingAlbum(false);
						}
					},
				},
			]
		);
	}

	if (loading) return <BerxLoadingState />;
	if (error && !album) return <BerxErrorState message={error} onRetry={load} />;
	if (!album) return null;

	return (
		<View style={styles.screen}>
			<BerxHeader title={album.title} onBack={onBack} />
			{isOwn ? (
				<View style={styles.toolbar}>
					<BerxButton label="Добавить фото" variant="secondary" loading={uploading} onPress={handleAddPhoto} fullWidth />
					{error ? <Text style={styles.error}>{error}</Text> : null}
					<Pressable onPress={confirmDeleteAlbum} disabled={deletingAlbum} hitSlop={8}>
						<Text style={styles.deleteAlbumLink}>{deletingAlbum ? 'Удаление…' : 'Удалить альбом'}</Text>
					</Pressable>
				</View>
			) : null}
			{album.photos.length === 0 ? (
				<BerxEmptyState title="Фотографий пока нет" />
			) : (
				<BerxFadeIn style={styles.fadeFlex}>
					<FlatList
						data={album.photos}
						keyExtractor={(p: BerxAlbumPhoto) => String(p.guid)}
						numColumns={3}
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
						renderItem={({item}: {item: BerxAlbumPhoto}) => (
							<Pressable
								style={styles.tileWrap}
								onLongPress={isOwn ? () => handleDeletePhoto(item.guid) : undefined}
								disabled={busyGuid === item.guid}>
								<Image source={{uri: item.url}} style={styles.tile} />
							</Pressable>
						)}
					/>
				</BerxFadeIn>
			)}
			{isOwn && album.photos.length > 0 ? <Text style={styles.hint}>Удерживайте фото, чтобы удалить</Text> : null}
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	toolbar: {padding: spacing.md, gap: spacing.xs},
	fadeFlex: {flex: 1},
	tileWrap: {width: TILE, height: TILE},
	tile: {width: TILE, height: TILE, backgroundColor: colors.graphite},
	hint: {fontSize: typography.sizeXs, color: colors.textFaint, textAlign: 'center', padding: spacing.sm},
	error: {fontSize: typography.sizeSm, color: colors.danger},
	deleteAlbumLink: {fontSize: typography.sizeSm, color: colors.danger, textAlign: 'center', textDecorationLine: 'underline', marginTop: spacing.sm},
});
